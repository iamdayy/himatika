import * as crypto from "crypto";

const algorithm = "aes-256-cbc";
const key = Uint8Array.from(crypto.randomBytes(32)); // Generate a strong, random key

export function encrypt(text: string): {
  iv: string;
  encrypted: string;
  key: string;
} {
  const iv = Uint8Array.from(crypto.randomBytes(16));
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return {
    iv: Buffer.from(iv).toString("hex"),
    key: Buffer.from(key).toString("hex"),
    encrypted,
  };
}

export function decrypt(
  encryptedText: string,
  ivData: string,
  key: string
): string {
  const ivBuffer = Buffer.from(ivData, "hex");
  const keyBuffer = Buffer.from(key, "hex");
  const decipher = crypto.createDecipheriv(
    algorithm,
    new Uint8Array(keyBuffer),
    new Uint8Array(ivBuffer)
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
