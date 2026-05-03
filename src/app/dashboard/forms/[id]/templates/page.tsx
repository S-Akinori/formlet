import { notFound } from "next/navigation";
import { saveTemplatesAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import {
  DEFAULT_ADMIN_BODY,
  DEFAULT_ADMIN_SUBJECT,
  DEFAULT_REPLY_BODY,
  DEFAULT_REPLY_SUBJECT,
} from "@/lib/templates";

export default async function TemplatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase, user } = await requireUser();
  const [{ data: form }, { data: templates }] = await Promise.all([
    supabase.from("forms").select("id, name").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("email_templates").select("*").eq("form_id", id),
  ]);

  if (!form) notFound();

  const admin = templates?.find((item) => item.type === "admin");
  const reply = templates?.find((item) => item.type === "reply");

  return (
    <div className="grid max-w-4xl gap-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Templates</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{form.name}</h1>
        <p className="mt-2 text-sm text-zinc-600">利用可能な変数: {"{name} {email} {message} {created_at} {form_name}"}</p>
      </div>
      <Notice searchParams={query} />
      <form action={saveTemplatesAction} className="grid gap-6">
        <input name="form_id" type="hidden" value={form.id} />
        <TemplateBlock title="管理者通知" prefix="admin" id={admin?.id} subject={admin?.subject ?? DEFAULT_ADMIN_SUBJECT} body={admin?.body ?? DEFAULT_ADMIN_BODY} />
        <TemplateBlock title="自動返信" prefix="reply" id={reply?.id} subject={reply?.subject ?? DEFAULT_REPLY_SUBJECT} body={reply?.body ?? DEFAULT_REPLY_BODY} />
        <SubmitButton>保存する</SubmitButton>
      </form>
    </div>
  );
}

function TemplateBlock({
  title,
  prefix,
  id,
  subject,
  body,
}: {
  title: string;
  prefix: "admin" | "reply";
  id?: string;
  subject: string;
  body: string;
}) {
  return (
    <section className="panel grid gap-5 p-6">
      <input name={`${prefix}_id`} type="hidden" value={id ?? ""} />
      <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
      <label className="field">
        <span className="label">件名</span>
        <input className="input" name={`${prefix}_subject`} defaultValue={subject} required />
      </label>
      <label className="field">
        <span className="label">本文HTML</span>
        <textarea className="input min-h-56 font-mono text-xs leading-6" name={`${prefix}_body`} defaultValue={body} required />
      </label>
    </section>
  );
}
