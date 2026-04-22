import * as crypto from "crypto";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import type { TokenPair } from "./oauth.js";

export interface TokenStore {
  get(userId: string): Promise<TokenPair | null>;
  set(userId: string, tokens: TokenPair): Promise<void>;
  delete(userId: string): Promise<void>;
}

const ALGORITHM = "aes-256-gcm" as const;
const KEY_LEN = 32;
// Stable salt — scrypt cost is the security, not salt secrecy
const SALT = Buffer.from("workday-mcp-token-store-v1", "utf-8");

interface EncryptedPayload {
  iv: string;
  authTag: string;
  ciphertext: string;
}

function getMachineSecret(): string {
  return os.hostname() + os.userInfo().username;
}

function deriveKey(): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(getMachineSecret(), SALT, KEY_LEN, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

function hashUserId(userId: string): string {
  return crypto.createHash("sha256").update(userId).digest("hex").slice(0, 40);
}

function storageDir(): string {
  return path.join(os.homedir(), ".workday-mcp", "tokens");
}

function tokenPath(userId: string): string {
  return path.join(storageDir(), `${hashUserId(userId)}.json`);
}

async function encrypt(key: Buffer, plaintext: string): Promise<string> {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const payload: EncryptedPayload = {
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: encrypted.toString("base64"),
  };
  return JSON.stringify(payload);
}

async function decrypt(key: Buffer, raw: string): Promise<string> {
  const { iv, authTag, ciphertext } = JSON.parse(raw) as EncryptedPayload;
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf-8");
}

export class FileTokenStore implements TokenStore {
  async get(userId: string): Promise<TokenPair | null> {
    try {
      const raw = await fs.readFile(tokenPath(userId), "utf-8");
      const key = await deriveKey();
      const plaintext = await decrypt(key, raw);
      return JSON.parse(plaintext) as TokenPair;
    } catch {
      return null;
    }
  }

  async set(userId: string, tokens: TokenPair): Promise<void> {
    await fs.mkdir(storageDir(), { recursive: true });
    const key = await deriveKey();
    const payload = await encrypt(key, JSON.stringify(tokens));
    await fs.writeFile(tokenPath(userId), payload, {
      encoding: "utf-8",
      mode: 0o600,
    });
  }

  async delete(userId: string): Promise<void> {
    try {
      await fs.unlink(tokenPath(userId));
    } catch {
      // File didn't exist — no-op
    }
  }
}
