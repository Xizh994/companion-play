export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone || "";
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export function maskEmail(email: string): string {
  if (!email) return "";
  const at = email.indexOf("@");
  if (at <= 1) return email;
  return `${email[0]}***${email.slice(at)}`;
}
