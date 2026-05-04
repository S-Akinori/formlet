import Link from "next/link";
import {
  CheckCircle,
  Code,
  EnvelopeSimple,
  GearSix,
  GlobeHemisphereWest,
  PaperPlaneTilt,
  PlugsConnected,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import { saveFormSmtpAction, updateFormAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import { FormSubmissionTester } from "@/components/FormSubmissionTester";
import { FormFieldsEditor } from "@/components/FormFieldsEditor";
import { FormDetailTabs } from "@/components/FormDetailTabs";
import { notFound } from "next/navigation";
import type { Json } from "@/lib/supabase/types";

export default async function FormDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase, user } = await requireUser();
  const [{ data: form }, { data: submissions }, { data: formSmtp }, { data: formFields }] = await Promise.all([
    supabase.from("forms").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("submissions").select("id, sender_email, sender_name, status, created_at").eq("form_id", id).order("created_at", { ascending: false }).limit(8),
    supabase.from("form_email_settings").select("*").eq("form_id", id).maybeSingle(),
    supabase
      .from("form_fields")
      .select("field_name, label, input_type, is_required, min_length, max_length, pattern, options")
      .eq("form_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (!form) notFound();

  const endpoint = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/f/${form.endpoint_key}`;
  const statusLabel = form.is_active ? "有効" : "無効";
  const fields = (formFields ?? []).map((field) => ({
    ...field,
    options: normalizeOptions(field.options),
  }));
  const sampleHtml = buildSampleHtml(endpoint, fields);

  return (
    <div className="grid max-w-5xl gap-6">
      <div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Form</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{form.name}</h1>
        </div>
      </div>
      <Notice searchParams={query} />

      <section className="grid gap-4 rounded-lg border border-line bg-white px-4 py-4 shadow-soft">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Endpoint</p>
          <code className="mt-2 block truncate rounded-md bg-paper px-3 py-2 font-mono text-xs text-zinc-800">{endpoint}</code>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-fit items-center gap-2 rounded-md bg-paper px-3 py-2 text-sm font-medium text-zinc-800">
            {form.is_active ? (
              <CheckCircle className="h-4 w-4 text-accent" weight="bold" />
            ) : (
              <XCircle className="h-4 w-4 text-zinc-500" weight="bold" />
            )}
            {statusLabel}
          </div>
          <Link className="button-secondary w-fit" href={`/dashboard/forms/${id}/templates`}>
            <EnvelopeSimple className="h-4 w-4" weight="bold" />
            テンプレート
          </Link>
        </div>
      </section>

      <FormDetailTabs
        settings={
          <form action={updateFormAction} className="panel overflow-hidden">
            <SectionHeader
              icon={<GearSix className="h-5 w-5 text-accent" weight="bold" />}
              title="基本設定"
              body="フォーム名、通知先、送信後の遷移、受け付け元を管理します。"
            />
            <div className="grid gap-5 p-6">
              <input name="id" type="hidden" value={form.id} />
              <label className="field">
                <span className="label">フォーム名</span>
                <input className="input" name="name" required defaultValue={form.name} />
              </label>
              <div className="grid gap-5 lg:grid-cols-2">
                <label className="field">
                  <span className="label">管理者通知メール</span>
                  <input className="input" name="admin_email" type="email" required defaultValue={form.admin_email} />
                </label>
                <label className="field">
                  <span className="label">リダイレクトURL</span>
                  <input className="input" name="redirect_url" type="url" defaultValue={form.redirect_url ?? ""} />
                  <span className="helper">空欄の場合はFormlet標準の送信完了ページへ遷移します。Ajax送信ではJSONレスポンスを返せます。</span>
                </label>
              </div>
              <label className="field">
                <span className="label">許可Origin / Referer</span>
                <textarea className="input min-h-28" name="allowed_origins" defaultValue={(form.allowed_origins ?? []).join("\n")} />
                <span className="helper">1行に1つ入力します。空欄の場合は制限しません。</span>
              </label>
              <div className="flex flex-col justify-between gap-4 border-t border-line pt-5 sm:flex-row sm:items-center">
                <label className="flex items-center gap-3 text-sm font-medium text-zinc-800">
                  <input className="h-4 w-4 rounded border-line text-accent" name="is_active" type="checkbox" defaultChecked={form.is_active} />
                  有効にする
                </label>
                <SubmitButton>基本設定を保存</SubmitButton>
              </div>
            </div>
          </form>
        }
        fields={
          <div className="grid gap-6">
            <FormFieldsEditor formId={form.id} fields={fields} />
            <FormSubmissionTester endpoint={endpoint} fields={fields} />
          </div>
        }
        mail={
          <div className="grid gap-6">
            <div className="panel overflow-hidden">
              <SectionHeader
                icon={<EnvelopeSimple className="h-5 w-5 text-accent" weight="bold" />}
                title="メールテンプレート"
                body="管理者通知と自動返信の件名・本文を編集します。"
              />
              <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-zinc-600">フォーム項目の変数を使って、問い合わせ内容に合わせたメールを作成できます。</p>
                <Link className="button-secondary w-fit" href={`/dashboard/forms/${id}/templates`}>
                  <EnvelopeSimple className="h-4 w-4" weight="bold" />
                  テンプレートを編集
                </Link>
              </div>
            </div>
            <form action={saveFormSmtpAction} className="panel overflow-hidden">
              <SectionHeader
                icon={<PlugsConnected className="h-5 w-5 text-accent" weight="bold" />}
                title="フォーム個別SMTP"
                body="このフォームの管理者通知と自動返信に専用SMTPを使います。未設定ならユーザー毎共通、さらに未設定ならシステム共通SMTPを使います。"
              />
              <div className="grid gap-6 p-6">
                <input name="form_id" type="hidden" value={form.id} />
                <div className="flex flex-col justify-between gap-4 rounded-md border border-line bg-paper px-4 py-3 sm:flex-row sm:items-center">
                  <label className="flex items-center gap-3 text-sm font-medium text-zinc-800">
                    <input className="h-4 w-4 rounded border-line text-accent" name="use_custom_form_smtp" type="checkbox" defaultChecked={Boolean(formSmtp)} />
                    このフォーム専用のSMTPを使う
                  </label>
                  <span className="text-xs text-zinc-500">{formSmtp ? "フォーム個別設定を使用中" : "フォールバック設定を使用中"}</span>
                </div>
                <div className="grid gap-5 lg:grid-cols-[1fr_140px_1fr]">
                  <label className="field lg:col-span-2">
                    <span className="label">SMTPホスト</span>
                    <input className="input" name="form_smtp_host" defaultValue={formSmtp?.smtp_host ?? ""} placeholder="sv0000.xserver.jp" />
                  </label>
                  <label className="field">
                    <span className="label">ポート</span>
                    <input className="input" name="form_smtp_port" type="number" defaultValue={formSmtp?.smtp_port ?? 465} />
                  </label>
                  <label className="field">
                    <span className="label">SMTPユーザー名</span>
                    <input className="input" name="form_smtp_user" defaultValue={formSmtp?.smtp_user ?? ""} />
                  </label>
                  <label className="field">
                    <span className="label">SMTPパスワード</span>
                    <input className="input" name="form_smtp_password" type="password" placeholder={formSmtp ? "変更する場合のみ入力" : ""} />
                    {formSmtp ? <span className="helper">保存済みのパスワードは表示しません。空欄のまま保存すると現在のパスワードを維持します。</span> : null}
                  </label>
                  <label className="field">
                    <span className="label">送信元メール</span>
                    <input className="input" name="form_from_email" type="email" defaultValue={formSmtp?.from_email ?? ""} />
                  </label>
                  <label className="field">
                    <span className="label">送信者名</span>
                    <input className="input" name="form_from_name" defaultValue={formSmtp?.from_name ?? form.name} />
                  </label>
                </div>
                <div className="flex flex-col justify-between gap-4 border-t border-line pt-5 sm:flex-row sm:items-center">
                  <label className="flex items-center gap-3 text-sm font-medium text-zinc-800">
                    <input className="h-4 w-4 rounded border-line text-accent" name="form_secure" type="checkbox" defaultChecked={formSmtp?.secure ?? true} />
                    SSL/TLSを使う
                  </label>
                  <SubmitButton>フォーム個別SMTPを保存</SubmitButton>
                </div>
              </div>
            </form>
          </div>
        }
        install={
          <div className="grid gap-6">
            <div className="panel overflow-hidden">
              <SectionHeader
                icon={<Code className="h-5 w-5 text-accent" weight="bold" />}
                title="設置コード"
                body="静的サイトのform actionに指定します。"
              />
              <div className="grid gap-4 p-5">
                <code className="block overflow-x-auto rounded-md bg-zinc-950 p-4 font-mono text-xs text-zinc-100">{endpoint}</code>
                <pre className="overflow-x-auto rounded-md border border-line bg-paper p-4 text-xs leading-6 text-zinc-700">{sampleHtml}</pre>
              </div>
            </div>

            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div className="flex items-center gap-3">
                  <PaperPlaneTilt className="h-5 w-5 text-accent" weight="bold" />
                  <h2 className="text-sm font-semibold text-zinc-950">最近の問い合わせ</h2>
                </div>
                <Link className="text-sm font-medium text-accent hover:underline" href={`/dashboard/forms/${id}/submissions`}>
                  すべて見る
                </Link>
              </div>
              {submissions?.length ? (
                <div className="divide-y divide-line">
                  {submissions.map((submission) => (
                    <Link key={submission.id} href={`/dashboard/forms/${id}/submissions/${submission.id}`} className="grid gap-1 px-5 py-4 transition hover:bg-paper">
                      <span className="truncate text-sm font-medium text-zinc-950">{submission.sender_name || submission.sender_email || "Unknown sender"}</span>
                      <span className="text-xs text-zinc-500">{new Date(submission.created_at).toLocaleString("ja-JP")}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-10 text-sm text-zinc-500">まだ問い合わせはありません。</p>
              )}
            </div>
          </div>
        }
      />

      <section className="grid gap-4 rounded-lg border border-line bg-white p-5 shadow-soft md:grid-cols-3">
        <InfoBlock icon={<GlobeHemisphereWest className="h-5 w-5 text-accent" weight="bold" />} title="受付元制限" value={(form.allowed_origins ?? []).length ? `${form.allowed_origins?.length}件` : "制限なし"} />
        <InfoBlock icon={<EnvelopeSimple className="h-5 w-5 text-accent" weight="bold" />} title="通知先" value={form.admin_email} />
        <InfoBlock icon={<PlugsConnected className="h-5 w-5 text-accent" weight="bold" />} title="SMTP優先度" value={formSmtp ? "フォーム個別" : "共通設定"} />
      </section>
    </div>
  );
}

function buildSampleHtml(endpoint: string, fields: Array<{
  field_name: string;
  label: string;
  input_type?: string;
  is_required?: boolean;
  min_length?: number | null;
  max_length?: number | null;
  pattern?: string | null;
  options?: string[] | null;
}>) {
  const sampleFields = fields.length
    ? fields
    : [
        { field_name: "name", label: "お名前", input_type: "text", is_required: true },
        { field_name: "email", label: "メールアドレス", input_type: "email", is_required: true },
        { field_name: "message", label: "お問い合わせ内容", input_type: "textarea", is_required: true },
      ];
  const hasFile = sampleFields.some((field) => field.input_type === "file");
  const htmlFields = sampleFields
    .map((field) => {
      const attrs = [
        field.is_required ? " required" : "",
        field.min_length !== null && field.min_length !== undefined ? ` minlength="${field.min_length}"` : "",
        field.max_length !== null && field.max_length !== undefined ? ` maxlength="${field.max_length}"` : "",
        field.pattern ? ` pattern="${field.pattern}"` : "",
      ].join("");

      if (field.input_type === "textarea") {
        return `  <label>${field.label}<textarea name="${field.field_name}"${attrs}></textarea></label>`;
      }

      if (field.input_type === "select") {
        const options = (field.options ?? []).map((option) => `    <option value="${escapeAttribute(option)}">${escapeHtml(option)}</option>`).join("\n");
        return `  <label>${field.label}<select name="${field.field_name}"${attrs}>
${options}
  </select></label>`;
      }

      if (field.input_type === "checkbox" || field.input_type === "radio") {
        const type = field.input_type;
        const choiceAttrs = type === "radio" ? attrs : attrs.replace(" required", "");
        return `  <fieldset>
    <legend>${field.label}</legend>
${(field.options ?? [])
  .map((option) => `    <label><input name="${field.field_name}" type="${type}" value="${escapeAttribute(option)}"${choiceAttrs}> ${escapeHtml(option)}</label>`)
  .join("\n")}
  </fieldset>`;
      }

      const type = field.input_type && field.input_type !== "text" ? ` type="${field.input_type}"` : "";
      return `  <label>${field.label}<input name="${field.field_name}"${type}${attrs}></label>`;
    })
    .join("\n");

  return `<form action="${endpoint}" method="POST"${hasFile ? ' enctype="multipart/form-data"' : ""}>
${htmlFields}
  <input name="company" hidden>
  <button type="submit">Send</button>
</form>`;
}

function normalizeOptions(value: Json | undefined) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function SectionHeader({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="border-b border-line bg-paper/70 px-6 py-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-white">{icon}</span>
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">{body}</p>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[36px_1fr] gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-paper">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{title}</p>
        <p className="mt-1 truncate text-sm font-medium text-zinc-950">{value}</p>
      </div>
    </div>
  );
}
