import { archiveQueueMessage, db, queueEncryptedReply, retryQueueMessage, type QueueMessage } from "./db.js";
import { calculateLegalDeadline } from "./deadline.js";
import { analyzeLegalCase } from "./legal.js";
import { sweepDeadlines } from "./reminders.js";

function mapCaseType(eventType: string) {
  if (eventType === "OPPOSITION") return "OPPOSITION";
  if (eventType === "FORMAL_REQUIREMENT") return "OFFICE_ACTION";
  if (eventType === "MERIT_REQUIREMENT") return "MERIT_REQUIREMENT";
  if (eventType === "REFUSAL") return "REFUSAL";
  return "OTHER";
}

function targetProcessStatus(eventType: string) {
  if (eventType === "OPPOSITION") return "opposition";
  if (eventType === "FORMAL_REQUIREMENT" || eventType === "MERIT_REQUIREMENT") return "office_action";
  if (eventType === "REFUSAL") return "refused";
  if (eventType === "GRANTED") return "granted";
  if (eventType === "ARCHIVED") return "archived";
  return null;
}

function feeServiceCode(eventType: string) {
  if (eventType === "FORMAL_REQUIREMENT") return "338";
  if (eventType === "MERIT_REQUIREMENT") return "340";
  if (eventType === "OPPOSITION") return "339";
  if (eventType === "REFUSAL") return "3000";
  return null;
}

async function openThread(workspaceId: string) {
  const { data, error } = await db.from("conversation_threads")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .eq("status", "open")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id as string | undefined;
}

async function transitionProcessIfApplicable(processId: string, eventType: string) {
  const target = targetProcessStatus(eventType);
  if (!target) return;

  const { data: process, error } = await db.from("processes")
    .select("id,status,version")
    .eq("id", processId)
    .single();

  if (error) throw error;
  if (process.status === target) return;

  const { error: transitionError } = await db.rpc("transition_process", {
    p_process_id: process.id,
    p_expected_version: process.version,
    p_to_status: target,
    p_actor_type: "integration",
    p_actor_ref: "RPI",
    p_reason: "rpi_event:" + eventType
  });

  if (transitionError) {
    // A publication can occasionally arrive in a state not anticipated by our state machine.
    // Do not force it. Put the process on a controlled hold so no critical act is performed blindly.
    const { error: holdError } = await db.from("processes").update({
      automation_hold: true,
      hold_reason: "RPI_EVENT_STATE_MISMATCH:" + eventType + ":" + process.status,
      next_action_at: new Date().toISOString()
    }).eq("id", process.id);

    if (holdError) throw holdError;

    await db.from("security_events").insert({
      process_id: process.id,
      severity: "HIGH",
      event_type: "RPI_STATE_TRANSITION_BLOCKED",
      source: "legal-worker",
      blocked: true,
      details_redacted: {
        event_type: eventType,
        current_status: process.status,
        target_status: target
      }
    });
  }
}

async function createLegalCaseForEvent(args: {
  workspaceId: string;
  processId: string;
  sourceExternalId: string;
}) {
  const { data: event, error: eventError } = await db.from("process_events")
    .select("id,event_type,payload,classification,requires_action,occurred_at")
    .eq("workspace_id", args.workspaceId)
    .eq("process_id", args.processId)
    .eq("source", "RPI")
    .eq("source_external_id", args.sourceExternalId)
    .single();

  if (eventError) throw eventError;

  if (!event.requires_action) {
    await transitionProcessIfApplicable(args.processId, event.event_type);
    return { actionable: false as const };
  }

  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const publicationDate =
    typeof payload.publication_date === "string"
      ? payload.publication_date
      : new Date(event.occurred_at).toISOString().slice(0, 10);

  let deadline;
  try {
    deadline = await calculateLegalDeadline(event.event_type, publicationDate);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_deadline_error";

    await db.from("security_events").insert({
      workspace_id: args.workspaceId,
      process_id: args.processId,
      severity: "CRITICAL",
      event_type: "LEGAL_DEADLINE_NOT_VERIFIED",
      source: "deadline-engine",
      blocked: true,
      details_redacted: {
        rpi_event: event.event_type,
        publication_date: publicationDate,
        reason: message
      }
    });

    await db.from("processes").update({
      automation_hold: true,
      hold_reason: "DEADLINE_NOT_VERIFIED:" + message
    }).eq("id", args.processId);

    throw error;
  }

  const { data: existingDeadline, error: deadlineLookupError } = await db.from("deadlines")
    .select("id")
    .eq("source_event_id", event.id)
    .maybeSingle();

  if (deadlineLookupError) throw deadlineLookupError;

  let deadlineId = existingDeadline?.id ?? null;

  if (!deadlineId) {
    const { data: insertedDeadline, error: deadlineInsertError } = await db.from("deadlines").insert({
      workspace_id: args.workspaceId,
      process_id: args.processId,
      source_event_id: event.id,
      kind: event.event_type,
      opened_at: new Date(publicationDate + "T00:00:00-03:00").toISOString(),
      due_at: deadline.dueAt,
      status: "open",
      customer_dependency: false,
      publication_date: publicationDate,
      legal_window_days: deadline.legalWindowDays,
      calendar_verified: deadline.calendarVerified,
      calculation_basis: deadline.calculationBasis
    }).select("id").single();

    if (deadlineInsertError) throw deadlineInsertError;
    deadlineId = insertedDeadline.id;
  }

  const caseType = mapCaseType(event.event_type);

  const { data: legalCase, error: legalCaseError } = await db.from("legal_cases").upsert({
    workspace_id: args.workspaceId,
    process_id: args.processId,
    case_type: caseType,
    source_event_id: event.id,
    deadline_id: deadlineId,
    status: "analysis",
    legal_basis: [],
    strategy_summary: null,
    customer_message_summary: null
  }, {
    onConflict: "source_event_id"
  }).select("id,status").single();

  if (legalCaseError) throw legalCaseError;

  await transitionProcessIfApplicable(args.processId, event.event_type);

  const serviceCode = feeServiceCode(event.event_type);

  const { error: taskError } = await db.from("workflow_tasks").insert({
    workspace_id: args.workspaceId,
    process_id: args.processId,
    legal_case_id: legalCase.id,
    task_type: "ANALYZE_LEGAL_CASE",
    owner_type: "SYSTEM",
    status: "pending",
    priority: 100,
    due_at: deadline.dueAt,
    payload_redacted: {
      event_type: event.event_type,
      publication_date: publicationDate,
      due_date: deadline.dueDate,
      fee_service_code: serviceCode
    },
    idempotency_key: "legal-analysis:" + legalCase.id
  });

  if (taskError && taskError.code !== "23505") throw taskError;

  const threadId = await openThread(args.workspaceId);

  if (threadId) {
    const label =
      event.event_type === "OPPOSITION" ? "uma oposição" :
      event.event_type === "REFUSAL" ? "um indeferimento" :
      event.event_type === "FORMAL_REQUIREMENT" ? "uma exigência formal" :
      "uma exigência do INPI";

    await queueEncryptedReply({
      workspaceId: args.workspaceId,
      threadId,
      body:
        "Saiu " + label + " no seu processo. Eu já identifiquei a publicação e o prazo, que vence em " +
        deadline.dueDate.split("-").reverse().join("/") +
        ".\n\nEstou analisando exatamente o que o INPI pediu. Se eu precisar de algum documento seu, vou pedir somente o que estiver faltando. O restante é comigo.",
      idempotencyKey: "legal-event-opened:" + event.id
    });
  }

  return {
    actionable: true as const,
    legalCaseId: legalCase.id,
    deadlineId,
    dueDate: deadline.dueDate,
    eventType: event.event_type
  };
}

export async function handleLegalJob(job: QueueMessage) {
  const jobType = String(job.message.job_type ?? "");

  if (jobType === "deadline_sweep") {
    await sweepDeadlines();
    await archiveQueueMessage("legal_jobs", job.msg_id);
    return;
  }

  if (jobType === "analyze_legal_case") {
    const legalCaseId = String(job.message.legal_case_id ?? "");
    const workflowTaskId = String(job.message.workflow_task_id ?? "");

    if (!legalCaseId || !workflowTaskId) {
      throw new Error("LEGAL_ANALYSIS_JOB_MALFORMED");
    }

    try {
      await analyzeLegalCase(legalCaseId);

      const { error: taskError } = await db.from("workflow_tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          last_error: null
        })
        .eq("id", workflowTaskId);

      if (taskError) throw taskError;
      await archiveQueueMessage("legal_jobs", job.msg_id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_error";

      const { data: task } = await db.from("workflow_tasks")
        .select("attempts")
        .eq("id", workflowTaskId)
        .maybeSingle();

      const attempts = (task?.attempts ?? 0) + 1;

      await db.from("workflow_tasks").update({
        status: attempts >= 5 ? "failed" : "waiting",
        attempts,
        last_error: message
      }).eq("id", workflowTaskId);

      if (attempts >= 5) {
        await retryQueueMessage("legal_jobs", job.msg_id, 3600);
        return;
      }

      await retryQueueMessage("legal_jobs", job.msg_id, Math.min(1800, 120 * attempts));
    }
    return;
  }

  if (jobType === "classify_legal_event") {
    const workspaceId = String(job.message.workspace_id ?? "");
    const processId = String(job.message.process_id ?? "");
    const sourceExternalId = String(job.message.source_external_id ?? "");

    if (!workspaceId || !processId || !sourceExternalId) {
      throw new Error("LEGAL_EVENT_JOB_MALFORMED");
    }

    try {
      await createLegalCaseForEvent({ workspaceId, processId, sourceExternalId });
      await archiveQueueMessage("legal_jobs", job.msg_id);
    } catch (error) {
      if (job.read_ct >= 8) {
        await retryQueueMessage("legal_jobs", job.msg_id, 3600);
        return;
      }
      await retryQueueMessage("legal_jobs", job.msg_id, Math.min(1800, 120 * Math.max(job.read_ct, 1)));
    }
    return;
  }

  // Keep unknown legal jobs visible rather than silently discarding critical work.
  await retryQueueMessage("legal_jobs", job.msg_id, 3600);
}
