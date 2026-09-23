import { z } from "zod";

export const ADMIN_ROLES = ["master","owner","service","finance","legal","procurador","auditor"] as const;
const claimSchema = z.object({
  sub: z.string().uuid(),
  aal: z.enum(["aal1","aal2"]),
  email: z.string().email().optional(),
  email_verified: z.boolean().optional(),
  app_metadata: z.object({ provider: z.string().optional(), providers: z.array(z.string()).optional() }).default({}),
});
export type AdminBootstrapClaims = z.infer<typeof claimSchema>;
export type BootstrapDecision = { allowed: true; canonicalEmail: string; userId: string } | { allowed: false; code: string };

/** Preflight only. The atomic role grant is exclusively the SQL SECURITY DEFINER transaction. */
export function evaluateAdminBootstrapClaims(input: unknown, preauthorizedEmail: string): BootstrapDecision {
  const parsed = claimSchema.safeParse(input);
  if (!parsed.success) return { allowed: false, code: "INVALID_AUTH_CLAIMS" };
  const claims = parsed.data;
  if (claims.aal !== "aal2") return { allowed: false, code: "MFA_AAL2_REQUIRED" };
  const provider = claims.app_metadata.provider;
  const providers = claims.app_metadata.providers ?? [];
  if (provider !== "google" && !providers.includes("google")) return { allowed: false, code: "GOOGLE_IDENTITY_REQUIRED" };
  if (claims.email_verified !== true || !claims.email) return { allowed: false, code: "VERIFIED_EMAIL_REQUIRED" };
  const canonicalEmail = claims.email.trim().toLowerCase();
  if (canonicalEmail !== preauthorizedEmail.trim().toLowerCase()) return { allowed: false, code: "EMAIL_NOT_PREAUTHORIZED" };
  return { allowed: true, canonicalEmail, userId: claims.sub };
}
