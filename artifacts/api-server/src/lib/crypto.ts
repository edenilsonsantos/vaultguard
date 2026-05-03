import crypto from "crypto";
import forge from "node-forge";

const ENCRYPTION_KEY = process.env.SESSION_SECRET
  ? crypto.createHash("sha256").update(process.env.SESSION_SECRET).digest()
  : crypto.randomBytes(32);

export function encryptValue(value: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decryptValue(encrypted: string): string {
  const [ivHex, encryptedHex] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedBuffer = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return decrypted.toString("utf8");
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const rawKey = "vgk_" + crypto.randomBytes(32).toString("base64url");
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.substring(0, 12);
  return { rawKey, keyHash, keyPrefix };
}

export interface GeneratedCertificate {
  publicKey: string;
  privateKey: string;
  fingerprint: string;
  pemBundle: string;
  expiresAt: Date;
}

export function generateClientCertificate(
  commonName: string,
  validityDays: number
): GeneratedCertificate {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = forge.util.bytesToHex(forge.random.getBytesSync(20));
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setDate(cert.validity.notAfter.getDate() + validityDays);

  const attrs = [
    { name: "commonName", value: commonName },
    { name: "organizationName", value: "VaultGuard" },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    { name: "basicConstraints", cA: false },
    { name: "keyUsage", digitalSignature: true, keyEncipherment: true },
    { name: "extKeyUsage", clientAuth: true },
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  const publicKey = forge.pki.certificateToPem(cert);
  const privateKey = forge.pki.privateKeyToPem(keys.privateKey);
  const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert));
  const fingerprint = forge.md.sha256
    .create()
    .update(certDer.getBytes())
    .digest()
    .toHex()
    .match(/.{2}/g)!
    .join(":");

  const pemBundle = publicKey + "\n" + privateKey;
  const expiresAt = cert.validity.notAfter;

  return { publicKey, privateKey, fingerprint, pemBundle, expiresAt };
}
