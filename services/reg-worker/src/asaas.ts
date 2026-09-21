import { config } from "./config.js";

type AsaasCustomerInput = {
  name: string;
  cpfCnpj: string;
  email?: string;
  mobilePhone?: string;
  externalReference: string;
};

type AsaasChargeInput = {
  customer: string;
  value: number;
  dueDate: string;
  description: string;
  externalReference: string;
};

type AsaasSubscriptionInput = {
  customer: string;
  value: number;
  nextDueDate: string;
  description: string;
  externalReference: string;
};

type AsaasList<T> = {
  object?: string;
  hasMore?: boolean;
  totalCount?: number;
  limit?: number;
  offset?: number;
  data?: T[];
};

function baseUrl() {
  return config.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!config.ASAAS_API_KEY) throw new Error("ASAAS_API_KEY_NOT_CONFIGURED");

  const response = await fetch(baseUrl() + path, {
    ...init,
    headers: {
      "content-type": "application/json",
      "user-agent": config.ASAAS_USER_AGENT,
      "access_token": config.ASAAS_API_KEY,
      ...(init.headers ?? {})
    }
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error("ASAAS_HTTP_" + response.status + ":" + JSON.stringify(payload).slice(0, 800));
  }

  return payload as T;
}

export async function findAsaasCustomer(cpfCnpj: string, externalReference?: string) {
  const params = new URLSearchParams({
    cpfCnpj,
    limit: "10",
    offset: "0"
  });
  if (externalReference) params.set("externalReference", externalReference);

  const result = await request<AsaasList<{ id: string; cpfCnpj?: string; externalReference?: string }>>(
    "/customers?" + params.toString(),
    { method: "GET" }
  );

  return result.data?.[0] ?? null;
}

export async function createAsaasCustomer(input: AsaasCustomerInput) {
  return request<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      cpfCnpj: input.cpfCnpj,
      email: input.email,
      mobilePhone: input.mobilePhone,
      externalReference: input.externalReference,
      notificationDisabled: true
    })
  });
}

export async function findOrCreateAsaasCustomer(input: AsaasCustomerInput) {
  const existing = await findAsaasCustomer(input.cpfCnpj);
  if (existing) return existing;
  return createAsaasCustomer(input);
}

export async function findPaymentByExternalReference(externalReference: string) {
  const params = new URLSearchParams({
    externalReference,
    limit: "10",
    offset: "0"
  });

  const result = await request<AsaasList<{
    id: string;
    status?: string;
    value?: number;
    dueDate?: string;
    customer?: string;
    externalReference?: string;
  }>>("/payments?" + params.toString(), { method: "GET" });

  return result.data?.[0] ?? null;
}

export async function createPixCharge(input: AsaasChargeInput) {
  return request<{
    id: string;
    status?: string;
    invoiceUrl?: string;
    value?: number;
    dueDate?: string;
    externalReference?: string;
  }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customer,
      billingType: "PIX",
      value: input.value,
      dueDate: input.dueDate,
      description: input.description,
      externalReference: input.externalReference
    })
  });
}

export async function findOrCreatePixCharge(input: AsaasChargeInput) {
  const existing = await findPaymentByExternalReference(input.externalReference);
  if (existing) return existing;
  return createPixCharge(input);
}

export async function getPixQrCode(paymentId: string) {
  return request<{ encodedImage?: string; payload?: string; expirationDate?: string }>(
    "/payments/" + paymentId + "/pixQrCode",
    { method: "GET" }
  );
}

export async function getAsaasPayment(paymentId: string) {
  return request<{
    id: string;
    status: string;
    value?: number;
    dueDate?: string;
    externalReference?: string;
    subscription?: string;
  }>("/payments/" + paymentId, { method: "GET" });
}

export async function findSubscriptionByExternalReference(externalReference: string) {
  const params = new URLSearchParams({
    externalReference,
    limit: "10",
    offset: "0"
  });

  const result = await request<AsaasList<{
    id: string;
    status?: string;
    customer?: string;
    value?: number;
    nextDueDate?: string;
    externalReference?: string;
  }>>("/subscriptions?" + params.toString(), { method: "GET" });

  return result.data?.[0] ?? null;
}

export async function createMonthlyPixSubscription(input: AsaasSubscriptionInput) {
  return request<{ id: string; status?: string; externalReference?: string }>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customer,
      billingType: "PIX",
      value: input.value,
      nextDueDate: input.nextDueDate,
      cycle: "MONTHLY",
      description: input.description,
      externalReference: input.externalReference
    })
  });
}

export async function findOrCreateMonthlyPixSubscription(input: AsaasSubscriptionInput) {
  const existing = await findSubscriptionByExternalReference(input.externalReference);
  if (existing) return existing;
  return createMonthlyPixSubscription(input);
}
