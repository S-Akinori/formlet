import nodemailer from "nodemailer";
import { toPlainText } from "@/lib/templates";
import { decryptSecret } from "@/lib/security/secrets";

export type SmtpSetting = {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  secure: boolean;
};

export type MailPayload = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string | null;
};

export function getSystemSmtpSetting(): SmtpSetting | null {
  const host = process.env.SYSTEM_SMTP_HOST;
  const port = Number(process.env.SYSTEM_SMTP_PORT ?? 465);
  const user = process.env.SYSTEM_SMTP_USER;
  const password = process.env.SYSTEM_SMTP_PASSWORD;
  const fromEmail = process.env.SYSTEM_FROM_EMAIL;
  const fromName = process.env.SYSTEM_FROM_NAME ?? "Formlet";

  if (!host || !Number.isFinite(port) || !user || !password || !fromEmail) {
    return null;
  }

  return {
    smtp_host: host,
    smtp_port: port,
    smtp_user: user,
    smtp_password: password,
    from_email: fromEmail,
    from_name: fromName,
    secure: process.env.SYSTEM_SMTP_SECURE !== "false",
  };
}

export async function sendSmtpMail(setting: SmtpSetting, payload: MailPayload) {
  const password = decryptSecret(setting.smtp_password);
  const transporter = nodemailer.createTransport({
    host: setting.smtp_host,
    port: setting.smtp_port,
    secure: setting.secure,
    auth: {
      user: setting.smtp_user,
      pass: password,
    },
  });

  await transporter.sendMail({
    from: `"${setting.from_name}" <${setting.from_email}>`,
    to: payload.to,
    replyTo: payload.replyTo ?? undefined,
    subject: payload.subject,
    html: payload.html,
    text: toPlainText(payload.html),
  });
}
