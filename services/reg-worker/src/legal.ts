import { config } from "./config.js";
import { db, queueEncryptedReply, recordAgentRun } from "./db.js";

type LegalPlan = {
  summary: string;
  what_inpi_requires: string;
  legal_basis: Array<{
    reference: string;
    explanation: string;
  }>;
  required_documents: Array<{
    label: string;
    reason: string;
    explicitly_requested_by_inpi: boolean;
  }>;
  required_information: Array<{
    label: string;
    reason: string;
  }>;
  strategy: string;
  can_prepare_without_customer: boolean;
};

type LegalAudit = {
  approved: boolean;
  issues: string[];
  unsupported_claims: string[];
  corrected_customer_message: string;
};

const legalPlanSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    what_inpi_requires: { type: "string" },
    legal_basis: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          reference: { type: "string" },
          explanation: { type: "string" }
        },
        required: ["reference","explanation"]
      }
    },
    required_documents: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          reason: { type: "string" },
          explicitly_requested_by_inpi: { type: "boolean" }
        },
        required: ["label","reason","explicitly_requested_by_inpi"]
      }
    },
    required_information: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          reason: { type: "string" }
        },
        required: ["label","reason"]
      }
    },
    strategy: { type: "string" },
    can_prepare_without_customer: { type: "boolean" }
  },
  required: [
    "summary","what_inpi_requires","legal_basis","required_documents",
    "required_information","strategy","can_prepare_without_customer"
  ]
} as const;

const auditSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    approved: { type: "boolean" },
    issues: { type: "array", items: { type: "string" } },
    unsupported_claims: { type: "array", items: { type: "string" } },
    corrected_customer_message: { type: "string" }
  },
  required: ["approved","issues","unsupported_claims","corrected_customer_message"]
} as const;

async function responseJson<T>(args: {
  instructions: string;
  input: unknown;
  schemaName: string;
  schema: object;
  safetyIdentifier: string;
}) {
  if (!config.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY_NOT_CONFIGURED");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: "Bearer " + config.OPENAI_API_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: config.OPENAI_MODEL_LEGAL,
      store: false,
      instructions: args.instructions,
      input: JSON.stringify(args.input),
      safety_identifier: args.safetyIdentifier,
      prompt_cache_key: "registreai:legal:v1",
      reasoning: { effort: "high" },
      text: {
        verbosity: "medium",
        format: {
          type: "json_schema",
          name: args.schemaName,
          strict: true,
          schema: args.schema
        }
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error("OPENAI_LEGAL_HTTP_" + response.status + ":" + body.slice(0, 600));
  }

  const data = await response.json() as { output_text?: string };
  if (!data.output_text) throw new Error("OPENAI_LEGAL_EMPTY_OUTPUT");
  return JSON.parse(data.output_text) as T;
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

export async function analyzeLegalCase(legalCaseId: string) {
  const { data: legalCase, error: caseError } = await db.from("legal_cases")
    .select("id,workspace_id,process_id,case_type,source_event_id,deadline_id,status")
    .eq("id", legalCaseId)
    .single();

  if (caseError) throw caseError;

  const [
    processResult,
    eventResult,
    deadlineResult,
    documentsResult,
    classesResult,
    trademarkResult
  ] = await Promise.all([
    db.from("processes")
      .select("id,status,inpi_process_number,holder_id,trademark_id")
      .eq("id", legalCase.process_id)
      .single(),
    db.from("process_events")
      .select("id,event_type,payload,occurred_at")
      .eq("id", legalCase.source_event_id)
      .single(),
    legalCase.deadline_id
      ? db.from("deadlines")
          .select("id,kind,publication_date,due_at,legal_window_days,calendar_verified,calculation_basis")
          .eq("id", legalCase.deadline_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    db.from("documents")
      .select("id,classification,verification_status,original_filename,metadata")
      .eq("process_id", legalCase.process_id)
      .eq("verification_status", "verified"),
    db.from("process_classes")
      .select("nice_class,specification,is_primary")
      .eq("process_id", legalCase.process_id),
    db.from("trademarks")
      .select("name,presentation_type,activity_description")
      .eq("id", (
        await db.from("processes").select("trademark_id").eq("id", legalCase.process_id).single()
      ).data?.trademark_id ?? "")
      .maybeSingle()
  ]);

  if (processResult.error) throw processResult.error;
  if (eventResult.error) throw eventResult.error;
  if (deadlineResult.error) throw deadlineResult.error;
  if (documentsResult.error) throw documentsResult.error;
  if (classesResult.error) throw classesResult.error;
  if (trademarkResult.error) throw trademarkResult.error;

  const eventPayload = (eventResult.data.payload ?? {}) as Record<string, unknown>;
  const dispatchText =
    typeof eventPayload.dispatch_text === "string" ? eventPayload.dispatch_text : "";
  const dispatchCode =
    typeof eventPayload.dispatch_code === "string" ? eventPayload.dispatch_code : "";

  const evidence = {
    event_type: eventResult.data.event_type,
    dispatch_code: dispatchCode,
    dispatch_text: dispatchText,
    rpi_number: eventPayload.rpi_number ?? null,
    publication_date: eventPayload.publication_date ?? null,
    due_at: deadlineResult.data?.due_at ?? null,
    deadline_calculation_basis: deadlineResult.data?.calculation_basis ?? null,
    process_number: processResult.data.inpi_process_number,
    process_status: processResult.data.status,
    trademark: trademarkResult.data,
    nice_classes: classesResult.data ?? [],
    existing_verified_documents: (documentsResult.data ?? []).map((document) => ({
      classification: document.classification,
      filename: document.original_filename,
      metadata: document.metadata
    }))
  };

  const analyzerInstructions = [
    "Você é o analisador jurídico especializado da RegistreAi.",
    "Analise SOMENTE as evidências fornecidas deste processo de marca no INPI.",
    "Não invente fatos, documentos exigidos, artigos, jurisprudência, prazos, taxa ou conteúdo ausente.",
    "Se o despacho não indicar documento específico, required_documents pode ser vazio.",
    "Diferencie documento expressamente solicitado pelo INPI de prova estratégica apenas útil.",
    "Use linguagem técnica internamente, mas não conclua que algo foi protocolado ou pago.",
    "A estratégia deve ser administrativa e limitada ao processo de marca.",
    "Não cite um fundamento legal se ele não estiver no despacho/evidência ou não for uma regra geral indispensável claramente identificável."
  ].join("\n");

  const plan = await responseJson<LegalPlan>({
    instructions: analyzerInstructions,
    input: evidence,
    schemaName: "registreai_legal_plan",
    schema: legalPlanSchema,
    safetyIdentifier: "legal-case:" + legalCase.id
  });

  await recordAgentRun({
    workspaceId: legalCase.workspace_id,
    agentRole: "LEGAL_ANALYZER",
    promptVersion: "legal-analyzer-v1",
    model: config.OPENAI_MODEL_LEGAL,
    status: "succeeded",
    input: {
      legal_case_id: legalCase.id,
      event_type: eventResult.data.event_type,
      dispatch_code: dispatchCode
    },
    output: {
      required_documents: plan.required_documents.map((item) => item.label),
      required_information: plan.required_information.map((item) => item.label),
      can_prepare_without_customer: plan.can_prepare_without_customer
    }
  });

  const auditInstructions = [
    "Você é o auditor jurídico da RegistreAi e deve tentar encontrar erro no plano do primeiro analisador.",
    "Compare estritamente o plano com as evidências originais.",
    "Marque approved=false se houver documento inventado como obrigatório, fundamento não suportado, divergência de processo, prazo inconsistente ou afirmação de pagamento/protocolo inexistente.",
    "A mensagem ao cliente deve ser curta, simples e pedir somente o que realmente depende dele.",
    "Se nenhum documento for realmente necessário, diga claramente que a Reg não precisa de nada do cliente agora."
  ].join("\n");

  const audit = await responseJson<LegalAudit>({
    instructions: auditInstructions,
    input: { evidence, proposed_plan: plan },
    schemaName: "registreai_legal_audit",
    schema: auditSchema,
    safetyIdentifier: "legal-audit:" + legalCase.id
  });

  await recordAgentRun({
    workspaceId: legalCase.workspace_id,
    agentRole: "LEGAL_AUDITOR",
    promptVersion: "legal-auditor-v1",
    model: config.OPENAI_MODEL_LEGAL,
    status: audit.approved ? "succeeded" : "blocked",
    input: {
      legal_case_id: legalCase.id,
      event_type: eventResult.data.event_type
    },
    output: {
      approved: audit.approved,
      issue_count: audit.issues.length,
      unsupported_claim_count: audit.unsupported_claims.length
    }
  });

  if (!audit.approved) {
    await db.from("legal_cases").update({
      status: "error_hold",
      strategy_summary: plan.strategy,
      customer_message_summary: null
    }).eq("id", legalCase.id);

    await db.from("processes").update({
      automation_hold: true,
      hold_reason: "LEGAL_AUDIT_BLOCKED"
    }).eq("id", legalCase.process_id);

    await db.from("security_events").insert({
      workspace_id: legalCase.workspace_id,
      process_id: legalCase.process_id,
      severity: "HIGH",
      event_type: "LEGAL_PLAN_AUDIT_BLOCKED",
      source: "legal-auditor",
      blocked: true,
      details_redacted: {
        legal_case_id: legalCase.id,
        issues: audit.issues,
        unsupported_claims: audit.unsupported_claims
      }
    });

    throw new Error("LEGAL_AUDIT_BLOCKED");
  }

  const legalBasis = plan.legal_basis.map((item) => ({
    reference: item.reference,
    explanation: item.explanation
  }));

  const requirements = [
    ...plan.required_documents.map((item) => ({
      legal_case_id: legalCase.id,
      requirement_type: "DOCUMENT",
      label: item.label,
      instructions: item.reason,
      required: item.explicitly_requested_by_inpi,
      status: "pending"
    })),
    ...plan.required_information.map((item) => ({
      legal_case_id: legalCase.id,
      requirement_type: "INFORMATION",
      label: item.label,
      instructions: item.reason,
      required: true,
      status: "pending"
    }))
  ];

  if (requirements.length) {
    for (const requirement of requirements) {
      const { data: existing, error: lookupError } = await db.from("legal_requirements")
        .select("id")
        .eq("legal_case_id", legalCase.id)
        .eq("requirement_type", requirement.requirement_type)
        .eq("label", requirement.label)
        .maybeSingle();

      if (lookupError) throw lookupError;
      if (!existing) {
        const { error: insertError } = await db.from("legal_requirements").insert(requirement);
        if (insertError) throw insertError;
      }
    }
  }

  const pendingRequired = requirements.filter((item) => item.required);

  const nextStatus = pendingRequired.length ? "awaiting_customer" : "awaiting_fee";

  const { error: caseUpdateError } = await db.from("legal_cases").update({
    status: nextStatus,
    legal_basis: legalBasis,
    strategy_summary: plan.strategy,
    customer_message_summary: audit.corrected_customer_message
  }).eq("id", legalCase.id);

  if (caseUpdateError) throw caseUpdateError;

  if (pendingRequired.length) {
    const { error: deadlineDependencyError } = await db.from("deadlines")
      .update({ customer_dependency: true })
      .eq("id", legalCase.deadline_id);

    if (deadlineDependencyError) throw deadlineDependencyError;

    for (const requirement of pendingRequired) {
      const { error: taskError } = await db.from("workflow_tasks").insert({
        workspace_id: legalCase.workspace_id,
        process_id: legalCase.process_id,
        legal_case_id: legalCase.id,
        task_type:
          requirement.requirement_type === "DOCUMENT"
            ? "CUSTOMER_LEGAL_DOCUMENT"
            : "CUSTOMER_LEGAL_INFORMATION",
        owner_type: "CUSTOMER",
        status: "waiting",
        priority: 100,
        due_at: deadlineResult.data?.due_at ?? null,
        payload_redacted: {
          label: requirement.label,
          instructions: requirement.instructions
        },
        idempotency_key:
          "legal-requirement:" +
          legalCase.id + ":" +
          requirement.requirement_type + ":" +
          requirement.label
      });

      if (taskError && taskError.code !== "23505") throw taskError;
    }
  } else {
    const serviceCode = feeServiceCode(eventResult.data.event_type);

    if (serviceCode) {
      const { error: taskError } = await db.from("workflow_tasks").insert({
        workspace_id: legalCase.workspace_id,
        process_id: legalCase.process_id,
        legal_case_id: legalCase.id,
        task_type: "GENERATE_LEGAL_FEE",
        owner_type: "SYSTEM",
        status: "pending",
        priority: 100,
        due_at: deadlineResult.data?.due_at ?? null,
        payload_redacted: {
          service_code: serviceCode,
          event_type: eventResult.data.event_type
        },
        idempotency_key: "legal-fee:" + legalCase.id
      });

      if (taskError && taskError.code !== "23505") throw taskError;
    } else {
      const { error: draftTaskError } = await db.from("workflow_tasks").insert({
        workspace_id: legalCase.workspace_id,
        process_id: legalCase.process_id,
        legal_case_id: legalCase.id,
        task_type: "DRAFT_LEGAL_RESPONSE",
        owner_type: "SYSTEM",
        status: "pending",
        priority: 100,
        due_at: deadlineResult.data?.due_at ?? null,
        payload_redacted: {
          event_type: eventResult.data.event_type
        },
        idempotency_key: "legal-draft:" + legalCase.id
      });

      if (draftTaskError && draftTaskError.code !== "23505") throw draftTaskError;
    }
  }

  const threadId = await openThread(legalCase.workspace_id);

  if (threadId) {
    await queueEncryptedReply({
      workspaceId: legalCase.workspace_id,
      threadId,
      body: audit.corrected_customer_message,
      idempotencyKey: "legal-analysis-result:" + legalCase.id
    });
  }

  return {
    legalCaseId: legalCase.id,
    status: nextStatus,
    requiredItems: pendingRequired.length,
    feeServiceCode: feeServiceCode(eventResult.data.event_type)
  };
}
