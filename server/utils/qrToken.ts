import crypto from "crypto";

/**
 * Signed ticket-QR payloads ("v2").
 *
 * Format: `<24-hex id>.<base64url HMAC-SHA256(id)[0..16]>`
 *
 * Screen-generated tickets ({a,p,t} JSON) cannot be signed — they are built
 * client-side from public data — so verification accepts legacy formats too.
 * The signature protects the server-generated PDF-ticket path: leaked
 * ObjectIds alone are no longer enough to forge a scannable ticket.
 */

const signature = (id: string) => {
  const secret = useRuntimeConfig().jwtSecret || "insecure-dev-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(id)
    .digest("base64url")
    .slice(0, 22);
};

export function signTicketQR(id: string): string {
  const hex = String(id);
  if (!/^[0-9a-fA-F]{24}$/.test(hex)) {
    throw new Error(`signTicketQR expects a 24-hex id, got: ${id}`);
  }
  return `${hex}.${signature(hex)}`;
}

/**
 * True when the value carries a v2 signature AND that signature is valid.
 * Malformed v2 values (an id-looking prefix with a broken signature) are
 * rejected outright instead of falling back to legacy acceptance.
 */
export function isTicketQRValidV2(value: string): boolean | null {
  const m = /^([0-9a-fA-F]{24})\.([A-Za-z0-9_-]+)$/.exec(value);
  if (!m) return null; // not a v2 payload at all
  return m[2] === signature(m[1]);
}
