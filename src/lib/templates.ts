import type { Json } from "@/lib/supabase/types";

type TemplateVars = {
  name?: string | null;
  email?: string | null;
  message?: string | null;
  created_at: string;
  form_name: string;
  data: Record<string, Json | undefined>;
};

export const DEFAULT_ADMIN_SUBJECT = "[{form_name}] New inquiry from {name}";
export const DEFAULT_REPLY_SUBJECT = "Thank you for contacting {form_name}";

export const DEFAULT_ADMIN_BODY = `<p>A new inquiry was received.</p>
<dl>
  <dt>Name</dt><dd>{name}</dd>
  <dt>Email</dt><dd>{email}</dd>
  <dt>Message</dt><dd>{message}</dd>
  <dt>Submitted at</dt><dd>{created_at}</dd>
</dl>`;

export const DEFAULT_REPLY_BODY = `<p>{name} 様</p>
<p>お問い合わせありがとうございます。以下の内容で受け付けました。</p>
<blockquote>{message}</blockquote>
<p>内容を確認し、必要に応じてご連絡いたします。</p>`;

export function renderTemplate(template: string, vars: TemplateVars) {
  return template.replace(/\{([a-zA-Z0-9_.:-]+)\}/g, (_, rawKey: string) => {
    const key = rawKey as keyof TemplateVars;
    const value = vars[key] ?? vars.data[rawKey] ?? "";
    return escapeHtml(formatTemplateValue(value));
  });
}

export function toPlainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTemplateValue(value: Json | undefined): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(formatTemplateValue).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const file = value as { name?: Json; size?: Json; type?: Json };
    if (typeof file.name === "string") return file.name;
    return JSON.stringify(value);
  }

  return String(value);
}
