export type MetaMessage = {
  id: string;
  from: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
};

export type MetaStatus = {
  id: string;
  status: "sent" | "delivered" | "read" | "failed" | string;
  timestamp?: string;
  recipient_id?: string;
};

function values(payload: Record<string, unknown>): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  const entries = Array.isArray(payload.entry) ? payload.entry : [];

  for (const entryRaw of entries) {
    const entry = (entryRaw ?? {}) as Record<string, unknown>;
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    for (const changeRaw of changes) {
      const change = (changeRaw ?? {}) as Record<string, unknown>;
      result.push((change.value ?? {}) as Record<string, unknown>);
    }
  }

  return result;
}

export function extractMetaMessages(payload: Record<string, unknown>): MetaMessage[] {
  const result: MetaMessage[] = [];
  for (const value of values(payload)) {
    const messages = Array.isArray(value.messages) ? value.messages : [];
    for (const message of messages) result.push(message as MetaMessage);
  }
  return result;
}

export function extractMetaStatuses(payload: Record<string, unknown>): MetaStatus[] {
  const result: MetaStatus[] = [];
  for (const value of values(payload)) {
    const statuses = Array.isArray(value.statuses) ? value.statuses : [];
    for (const status of statuses) result.push(status as MetaStatus);
  }
  return result;
}

export function extractMessageText(message: MetaMessage): string | null {
  if (message.type === "text") return message.text?.body?.trim() || null;
  if (message.type === "button") return message.button?.text?.trim() || null;
  if (message.type === "interactive") {
    return message.interactive?.button_reply?.title?.trim()
      || message.interactive?.list_reply?.title?.trim()
      || null;
  }
  return null;
}
