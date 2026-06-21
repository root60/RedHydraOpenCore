import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const SECRET_FILE = path.join(DATA_DIR, ".opencore-gateway-secret");

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getSecretMaterial() {
  const fromEnv = process.env.OPENCORE_GATEWAY_SECRET || process.env.LLM_GATEWAY_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;

  ensureDataDir();
  if (fs.existsSync(SECRET_FILE)) {
    return fs.readFileSync(SECRET_FILE, "utf8").trim();
  }
  const generated = crypto.randomBytes(32).toString("base64url");
  fs.writeFileSync(SECRET_FILE, generated, { mode: 0o600 });
  return generated;
}

function getKey() {
  return crypto.createHash("sha256").update(getSecretMaterial()).digest();
}

export function encryptSecret(value: string) {
  if (!value) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(payload: string) {
  if (!payload) return "";
  const [version, ivB64, tagB64, encryptedB64] = payload.split(".");
  if (version !== "v1" || !ivB64 || !tagB64 || !encryptedB64) {
    throw new Error("invalid encrypted secret payload");
  }
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function maskSecret(value: string) {
  if (!value) return "no key";
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
