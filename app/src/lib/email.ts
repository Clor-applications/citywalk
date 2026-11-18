export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export async function sendMail(message: MailMessage) {
  const transport = process.env.MAIL_TRANSPORT ?? "console";

  if (transport === "resend") {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM;
    if (!key || !from) {
      throw new Error("MAIL_TRANSPORT=resend requires RESEND_API_KEY and MAIL_FROM");
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: message.to, subject: message.subject, text: message.text }),
    });
    if (!res.ok) throw new Error(`Resend rejected the message: ${res.status} ${await res.text()}`);
    return;
  }

  console.log(
    `\n┌─ CityWalk dev mail ─────────────────────────────\n│ to:      ${message.to}\n│ subject: ${message.subject}\n│ ${message.text.split("\n").join("\n│ ")}\n└─────────────────────────────────────────────────\n`,
  );
}
