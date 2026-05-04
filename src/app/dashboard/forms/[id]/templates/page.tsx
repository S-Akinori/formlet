import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Notice } from "@/components/Notice";
import { TemplateEditor } from "@/components/TemplateEditor";
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
  const [{ data: form }, { data: templates }, { data: fields }] = await Promise.all([
    supabase.from("forms").select("id, name").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("email_templates").select("*").eq("form_id", id),
    supabase
      .from("form_fields")
      .select("field_name, label")
      .eq("form_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (!form) notFound();

  const admin = templates?.find((item) => item.type === "admin");
  const reply = templates?.find((item) => item.type === "reply");
  const variables = [
    { key: "name", label: "送信者名", group: "system" as const },
    { key: "email", label: "送信者メール", group: "system" as const },
    { key: "message", label: "本文", group: "system" as const },
    { key: "created_at", label: "送信日時", group: "system" as const },
    { key: "form_name", label: "フォーム名", group: "system" as const },
    ...(fields ?? []).map((field) => ({
      key: field.field_name,
      label: field.label,
      group: "field" as const,
    })),
  ];

  return (
    <div className="grid gap-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Templates</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{form.name}</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          フォーム項目で設定したname属性を、メール本文や件名の変数として利用できます。
        </p>
      </div>
      <Notice searchParams={query} />
      <TemplateEditor
        formId={form.id}
        admin={{ id: admin?.id, subject: admin?.subject ?? DEFAULT_ADMIN_SUBJECT, body: admin?.body ?? DEFAULT_ADMIN_BODY }}
        reply={{ id: reply?.id, subject: reply?.subject ?? DEFAULT_REPLY_SUBJECT, body: reply?.body ?? DEFAULT_REPLY_BODY }}
        variables={variables}
      />
    </div>
  );
}
