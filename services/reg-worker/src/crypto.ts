import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

function decodeKey(value: string): Buffer {
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("encryption key must decode to exactly 32 bytes");
  return key;
}

export function hmacSha256(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

export function encryptText(value: string, keyB64: string) {
  const key = decodeKey(keyB64);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertextB64: Buffer.concat([encrypted, authTag]).toString("base64"),
    nonceB64: iv.toString("base64")
  };
}

export function decryptText(ciphertextB64: string, nonceB64: string, keyB64: string): string {
  const key = decodeKey(keyB64);
  const packed = Buffer.from(ciphertextB64, "base64");
  const iv = Buffer.from(nonceB64, "base64");

  if (packed.length < 17) throw new Error("invalid encrypted payload");

  const authTag = packed.subarray(packed.length - 16);
  const encrypted = packed.subarray(0, packed.length - 16);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function toPgByteaFromBase64(value: string): string {
  return "\\x" + Buffer.from(value, "base64").toString("hex");
}

export function maskWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 6) return "***";
  return "+" + digits.slice(0, 2) + " •••••• " + digits.slice(-4);
}
