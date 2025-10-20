import forge from "node-forge";

// Function to generate a key pair
export function generateKeyPair() {
  const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair(512);
  return {
    privateKey: forge.pki.privateKeyToPem(privateKey),
    publicKey: forge.pki.publicKeyToPem(publicKey),
  };
}

// Function to sign data
export function signData(privateKey: string, data: string): string {
  const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);
  const md = forge.md.sha256.create();
  md.update(data, "utf8");
  const signature = privateKeyObj.sign(md);
  return forge.util.encode64(signature);
}

// Function to verify signature
export function verifyDocSignature(
  publicKey: string,
  data: string,
  signature: string
): boolean {
  const publicKeyObj = forge.pki.publicKeyFromPem(publicKey);
  const md = forge.md.sha256.create();
  md.update(data, "utf8");
  const decodedSignature = forge.util.decode64(signature);
  return publicKeyObj.verify(md.digest().bytes(), decodedSignature);
}

// Function to encrypt data
