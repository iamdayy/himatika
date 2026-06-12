import * as crypto from "crypto";

const algorithm = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const keyEnv = process.env.ENCRYPTION_KEY;
  if (!keyEnv) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. Generate one with: openssl rand -hex 32 or openssl rand -base64 32",
    );
  }

  let keyBuffer: Buffer;

  // try hex first
  if (/^[0-9a-fA-F]{64}$/.test(keyEnv)) {
    keyBuffer = Buffer.from(keyEnv, "hex");
  } else {
    // try base64
    try {
      keyBuffer = Buffer.from(keyEnv, "base64");
    } catch (e) {
      throw new Error(
        "ENCRYPTION_KEY must be a 32-byte key encoded as 64-char hex or base64. See: openssl rand -hex 32 or openssl rand -base64 32",
      );
    }
  }

  if (keyBuffer.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must decode to 32 bytes (got ${keyBuffer.length}). Use a 256-bit key.`,
    );
  }

  return keyBuffer;
}

// The key is cached at module load time. If ENCRYPTION_KEY changes, the server must be restarted for the new key to take effect.
const cachedKey: Buffer = getEncryptionKey();

export function encrypt(text: string): {
  iv: string;
  encrypted: string;
  tag: string;
} {
  // AES-GCM standard nonce size is 12 bytes
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, cachedKey, iv);
  const encryptedBuf = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("hex"),
    encrypted: encryptedBuf.toString("hex"),
    tag: tag.toString("hex"),
  };
}

export function decrypt(
  encryptedText: string,
  ivData: string,
  tagHex: string,
): string {
  if (!ivData || typeof ivData !== "string") {
    throw new Error("Invalid ivData provided to decrypt");
  }
  if (!tagHex || typeof tagHex !== "string") {
    throw new Error(`Invalid tagHex provided to decrypt: ${tagHex}`);
  }

  const iv = Buffer.from(ivData, "hex");
  const tag = Buffer.from(tagHex, "hex");

  if (tag.length !== 16) {
    throw new Error(`Invalid authentication tag length: ${tag.length} bytes (from hex string '${tagHex}'). AES-256-GCM requires a 16-byte tag.`);
  }

  const decipher = crypto.createDecipheriv(algorithm, cachedKey, iv);
  decipher.setAuthTag(tag);
  const decryptedBuf = Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "hex")),
    decipher.final(),
  ]);
  return decryptedBuf.toString("utf8");
}
