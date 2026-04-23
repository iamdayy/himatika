import * as crypto from "crypto";

const algorithm = "aes-256-cbc";

function getEncryptionKey(): Buffer {
  const hexKey = process.env.ENCRYPTION_KEY;
  if (!hexKey) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. Generate one with: openssl rand -hex 32"
    );
  }
  if (hexKey.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate one with: openssl rand -hex 32"
    );
  }
  return Buffer.from(hexKey, "hex");
}

// Cache the key at module level to avoid re-parsing on every call
let cachedKey: Buffer | null = null;
function resolveKey(): Buffer {
  if (!cachedKey) {
    cachedKey = getEncryptionKey();
  }
  return cachedKey;
}

export function encrypt(text: string): {
  iv: string;
  encrypted: string;
} {
  const key = resolveKey();
  const iv = Uint8Array.from(crypto.randomBytes(16));
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return {
    iv: Buffer.from(iv).toString("hex"),
    encrypted,
  };
}

export function decrypt(encryptedText: string, ivData: string): string {
  const key = resolveKey();
  const ivBuffer = Buffer.from(ivData, "hex");
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    new Uint8Array(ivBuffer)
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
