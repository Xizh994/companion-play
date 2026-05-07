import CryptoJS from "crypto-js";

const AES_KEY = process.env.AES_ENCRYPT_KEY || "dazistar-aes-256-key-2026!!";

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, AES_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, AES_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
