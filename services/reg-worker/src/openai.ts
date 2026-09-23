import { config } from "./config.js";
import { REG_PROMPT_VERSION, REG_SYSTEM_PROMPT } from "./prompt.js";

export type ProposedAction =
  | "NONE"
  | "REQUEST_EINPI_CREDENTIAL"
  | "CREATE_CUSTOMER_TASK"
  | "CREATE_PROCESS_TASK"
  | "START_CONTRACT"
  | "CREATE_ASAAS_CHARGE"
  | "START_VIABILITY"
  | "REQUEST_DOCUMENT"
  | "REQUEST_INFORMATION"
  | "REQUEST_CONFIRMATION"
  | "CHECK_PAYMENT"
  | "CHECK_INPI"
  | "SEND_MESSAGE"
  | "BLOCK_AND_CLARIFY";

export type CapturedData = {
  holder_name: string | null;
  cpf_cnpj: string | null;
  email: string | null;
  cep: string | null;
  address_number: string | null;
  address_complement: string | null;
  activity: string | null;
  mark_name: string | null;
  plan_code: "PROTECAO" | "ILIMITADO" | null;
};

export type RegDecision = {
  reply: string;
  intent:
    | "greeting"
    | "onboarding"
    | "plan_question"
    | "new_trademark"
    | "process_status"
    | "document_received"
    | "payment"
    | "legal_event"
    | "clarification"
    | "out_of_scope"
    | "other";
  confidence: number;
  requires_customer: boolean;
  requested_items: Array<{
    type: "DOCUMENT" | "INFORMATION" | "PAYMENT" | "CONFIRMATION";
    label: string;
    reason: string;
  }>;
  captured_data: CapturedData;
  proposed_actions: Array<{
    type: ProposedAction;
    process_id: string | null;
    payload: Record<string, unknown>;
  }>;
  may_execute: boolean;
  blockers: string[];
};

const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] } as const;

const decisionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: { type: "string" },
    intent: {
      type: "string",
      enum: [
        "greeting","onboarding","plan_question","new_trademark","process_status",
        "document_received","payment","legal_event","clarification","out_of_scope","other"
      ]
    },
    confidence: { type: "number" },
    requires_customer: { type: "boolean" },
    requested_items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: { type: "string", enum: ["DOCUMENT","INFORMATION","PAYMENT","CONFIRMATION"] },
          label: { type: "string" },
          reason: { type: "string" }
        },
        required: ["type","label","reason"]
      }
    },
    captured_data: {
      type: "object",
      additionalProperties: false,
      properties: {
        holder_name: nullableString,
        cpf_cnpj: nullableString,
        email: nullableString,
        cep: nullableString,
        address_number: nullableString,
        address_complement: nullableString,
        activity: nullableString,
        mark_name: nullableString,
        plan_code: {
          anyOf: [
            { type: "string", enum: ["PROTECAO","ILIMITADO"] },
            { type: "null" }
          ]
        }
      },
      required: [
        "holder_name","cpf_cnpj","email","cep","address_number",
        "address_complement","activity","mark_name","plan_code"
      ]
    },
    proposed_actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: [
              "NONE","CREATE_CUSTOMER_TASK","CREATE_PROCESS_TASK","START_CONTRACT",
              "CREATE_ASAAS_CHARGE","START_VIABILITY","REQUEST_DOCUMENT","REQUEST_INFORMATION",
              "REQUEST_CONFIRMATION","CHECK_PAYMENT","CHECK_INPI","SEND_MESSAGE","BLOCK_AND_CLARIFY","REQUEST_EINPI_CREDENTIAL"
            ]
          },
          process_id: { anyOf: [{ type: "string" }, { type: "null" }] },
          payload: { type: "object", additionalProperties: true }
        },
        required: ["type","process_id","payload"]
      }
    },
    may_execute: { type: "boolean" },
    blockers: { type: "array", items: { type: "string" } }
  },
  required: [
    "reply","intent","confidence","requires_customer","requested_items",
    "captured_data","proposed_actions","may_execute","blockers"
  ]
} as const;

type GenerateInput = {
  workspaceId: string;
  currentMessage: string;
  context: Record<string, unknown>;
  legal?: boolean;
};

export async function generateRegDecision(input: GenerateInput): Promise<RegDecision> {
  if (!config.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY_NOT_CONFIGURED");

  const model = input.legal ? config.OPENAI_MODEL_LEGAL : config.OPENAI_MODEL_DEFAULT;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: "Bearer " + config.OPENAI_API_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      store: false,
      instructions: REG_SYSTEM_PROMPT,
      input: JSON.stringify({
        workspace_context: input.context,
        customer_message: input.currentMessage
      }),
      safety_identifier: "workspace:" + input.workspaceId,
      prompt_cache_key: "registreai:reg:v1",
      reasoning: { effort: input.legal ? "high" : "medium" },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "reg_decision",
          strict: true,
          schema: decisionSchema
        }
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error("OPENAI_HTTP_" + response.status + ":" + body.slice(0, 500));
  }

  const data = await response.json() as { output_text?: string };
  if (!data.output_text) throw new Error("OPENAI_EMPTY_OUTPUT");

  return JSON.parse(data.output_text) as RegDecision;
}

export { REG_PROMPT_VERSION };
