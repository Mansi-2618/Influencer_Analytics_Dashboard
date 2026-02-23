
import crypto from "crypto";

const secret = process.env.TOKEN_ENCRYPTION_KEY;
if (!secret) {
  throw new Error("TOKEN_ENCRYPTION_KEY is not defined in environment variables");
}
const ENCRYPTION_KEY = crypto.createHash("sha256").update(secret).digest();

// Encrypt
export const encryptToken = (text) => {
  if (!text) return null;

  const iv = crypto.randomBytes(16); 

  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    ENCRYPTION_KEY,
    iv
  );

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  return iv.toString("base64") + ":" + encrypted;
};

// Decrypt 
export const decryptToken = (encryptedText) => {
  if (!encryptedText) return null;

  const [ivBase64, encrypted] = encryptedText.split(":");

  const iv = Buffer.from(ivBase64, "base64");

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    ENCRYPTION_KEY,
    iv
  );

  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};
