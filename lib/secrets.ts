import "server-only";

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/*
 * Encryption for API keys saved in Admin → Settings: AES-256-GCM with a
 * fresh random IV per value, and the key's name as associated data so a
 * stored value can't be moved onto another key.
 *
 * The encryption key is SETTINGS_ENCRYPTION_KEY if set, otherwise derived
 * from AUTH_SECRET, so a deployment needs no extra variable. Changing either
 * makes saved keys unreadable: the admin page then asks for them again.
 */

const VERSION = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function encryptionKey() {
  const source = process.env.SETTINGS_ENCRYPTION_KEY || process.env.AUTH_SECRET;

  if (!source) {
    throw new Error("Set AUTH_SECRET (or SETTINGS_ENCRYPTION_KEY) before saving API keys");
  }

  return Buffer.from(hkdfSync("sha256", source, "store-secrets", "aes-256-gcm v1", 32));
}

export function encryptSecret(name: string, plaintext: string) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(name));

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  return `${VERSION}.${Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url")}`;
}

// null when the value can't be read (wrong key, or tampered with)
export function decryptSecret(name: string, stored: string) {
  try {
    const [version, payload] = stored.split(".");
    if (version !== VERSION || !payload) return null;

    const bytes = Buffer.from(payload, "base64url");
    const iv = bytes.subarray(0, IV_BYTES);
    const tag = bytes.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const ciphertext = bytes.subarray(IV_BYTES + TAG_BYTES);

    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAAD(Buffer.from(name));
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

// Last 4 characters, the only part ever shown back
export const secretHint = (value: string) => value.slice(-4);
