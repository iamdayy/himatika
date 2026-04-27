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
  if (!/^[0-9a-fA-F]{64}$/.test(hexKey)) {
    throw new Error(
      "ENCRYPTION_KEY must contain only valid hexadecimal characters (0-9, a-f, A-F)."
    );
  }
  return Buffer.from(hexKey, "hex");
}

// Resolve and cache the key once at module load time.
// Note: if ENCRYPTION_KEY changes at runtime, the server must be restarted for the new key to take effect.
const cachedKey: Buffer = getEncryptionKey();

export function encrypt(text: string): {
  iv: string;
  encrypted: string;
} {
  const iv = Uint8Array.from(crypto.randomBytes(16));
  const cipher = crypto.createCipheriv(algorithm, cachedKey, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return {
    iv: Buffer.from(iv).toString("hex"),
    encrypted,
  };
}

export function decrypt(encryptedText: string, ivData: string): string {
  const ivBuffer = Buffer.from(ivData, "hex");
  const decipher = crypto.createDecipheriv(
    algorithm,
    cachedKey,
    new Uint8Array(ivBuffer)
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
