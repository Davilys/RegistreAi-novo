import { config } from "./config.js";
import { decryptText, encryptText, hmacSha256 } from "./crypto.js";
import { db } from "./db.js";
import type { CapturedData } from "./openai.js";

type ProfilePII = {
  holder_name?: string;
  cpf_cnpj?: string;
  email?: string;
  cep?: string;
  address_number?: string;
  address_complement?: string;
  activity?: string;
  mark_name?: string;
  plan_code?: "PROTECAO" | "ILIMITADO";
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function repeatedDigits(value: string) {
  return /^(\d)\1+$/.test(value);
}

function validateCpf(value: string) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || repeatedDigits(cpf)) return false;

  const calc = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

function validateCnpj(value: string) {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || repeatedDigits(cnpj)) return false;

  const digit = (baseLength: number) => {
    const numbers = cnpj.slice(0, baseLength).split("").map(Number);
    const weights = baseLength === 12
      ? [5,4,3,2,9,8,7,6,5,4,3,2]
      : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    const sum = numbers.reduce((acc, n, i) => acc + n * (weights[i] ?? 0), 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  return digit(12) === Number(cnpj[12]) && digit(13) === Number(cnpj[13]);
}

function validateDocument(value: string) {
  const digits = onlyDigits(value);
  if (digits.length === 11) return validateCpf(digits);
  if (digits.length === 14) return validateCnpj(digits);
  return false;
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validateCep(value: string) {
  return onlyDigits(value).length === 8;
}

function maskDocument(value: string) {
  const digits = onlyDigits(value);
  if (digits.length === 11) return "***." + digits.slice(3, 6) + "." + digits.slice(6, 9) + "-**";
  if (digits.length === 14) return "**." + digits.slice(2, 5) + "." + digits.slice(5, 8) + "/****-**";
  return "***";
}

function maskEmail(value: string) {
  const [local, domain] = value.trim().split("@");
  if (!local || !domain) return "***";
  return (local.slice(0, 2) || "*") + "***@" + domain;
}

function maskName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "***";
  if (parts.length === 1) return parts[0];
  return parts[0] + " " + parts.slice(1).map((part) => part[0] + ".").join(" ");
}

async function loadExisting(workspaceId: string): Promise<ProfilePII> {
  const { data, error } = await db.rpc("get_onboarding_profile_secret", {
    p_workspace_id: workspaceId
  });

  if (error) throw error;
  const row = data?.[0];
  if (!row) return {};

  try {
    return JSON.parse(
      decryptText(row.ciphertext, row.nonce_b64, config.PII_ENCRYPTION_KEY_B64)
    ) as ProfilePII;
  } catch {
    throw new Error("ONBOARDING_PROFILE_DECRYPT_FAILED");
  }
}

export type ProfilePersistResult = {
  missingFields: string[];
  issues: string[];
  status: "collecting" | "ready_for_contract";
  accepted: ProfilePII;
};

export async function persistCapturedData(
  workspaceId: string,
  captured: CapturedData
): Promise<ProfilePersistResult> {
  const existing = await loadExisting(workspaceId);
  const merged: ProfilePII = { ...existing };
  const issues: string[] = [];

  if (captured.holder_name?.trim()) merged.holder_name = captured.holder_name.trim();

  if (captured.cpf_cnpj?.trim()) {
    if (validateDocument(captured.cpf_cnpj)) {
      merged.cpf_cnpj = onlyDigits(captured.cpf_cnpj);
    } else {
      issues.push("cpf_cnpj_invalid");
    }
  }

  if (captured.email?.trim()) {
    if (validateEmail(captured.email)) merged.email = captured.email.trim().toLowerCase();
    else issues.push("email_invalid");
  }

  if (captured.cep?.trim()) {
    if (validateCep(captured.cep)) merged.cep = onlyDigits(captured.cep);
    else issues.push("cep_invalid");
  }

  if (captured.address_number?.trim()) merged.address_number = captured.address_number.trim();
  if (captured.address_complement?.trim()) merged.address_complement = captured.address_complement.trim();
  if (captured.activity?.trim()) merged.activity = captured.activity.trim();
  if (captured.mark_name?.trim()) merged.mark_name = captured.mark_name.trim();
  if (captured.plan_code) merged.plan_code = captured.plan_code;

  const required: Array<keyof ProfilePII> = [
    "holder_name",
    "cpf_cnpj",
    "email",
    "cep",
    "address_number",
    "activity",
    "mark_name",
    "plan_code"
  ];

  const missingFields = required.filter((field) => !merged[field]).map(String);
  const status = missingFields.length === 0 && issues.length === 0
    ? "ready_for_contract"
    : "collecting";

  const encrypted = encryptText(JSON.stringify(merged), config.PII_ENCRYPTION_KEY_B64);
  const document = merged.cpf_cnpj ?? null;
  const email = merged.email ?? null;
  const holderType = document
    ? (document.length === 11 ? "CPF" : "CNPJ")
    : null;

  const { error } = await db.rpc("upsert_onboarding_profile", {
    p_workspace_id: workspaceId,
    p_holder_type: holderType,
    p_holder_document_hash: document ? hmacSha256(config.PII_HASH_KEY, document) : null,
    p_holder_document_masked: document ? maskDocument(document) : null,
    p_name_masked: merged.holder_name ? maskName(merged.holder_name) : null,
    p_email_hash: email ? hmacSha256(config.PII_HASH_KEY, email) : null,
    p_email_masked: email ? maskEmail(email) : null,
    p_plan_code: merged.plan_code ?? null,
    p_activity_description: merged.activity ?? null,
    p_onboarding_status: status,
    p_missing_fields: missingFields,
    p_ciphertext: encrypted.ciphertextB64,
    p_nonce_b64: encrypted.nonceB64,
    p_key_version: 1
  });

  if (error) throw error;

  return { missingFields, issues, status, accepted: merged };
}

export async function getOnboardingPII(workspaceId: string): Promise<ProfilePII> {
  return loadExisting(workspaceId);
}
