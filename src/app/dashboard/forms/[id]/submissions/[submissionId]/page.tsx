import { notFound } from "next/navigation";
import { markSubmissionReadAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getCurrentPlan, getRetentionStart } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;
  const { supabase, user } = await requireUser();
  const plan = await getCurrentPlan(supabase, user.id);
  const retentionStart = getRetentionStart(plan);
  const { data: form } = await supabase.from("forms").select("id, name").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!form) notFound();

  let submissionQuery = supabase.from("submissions").select("*").eq("id", submissionId).eq("form_id", id);
  if (retentionStart) {
    submissionQuery = submissionQuery.gte("created_at", retentionStart);
  }

  const [{ data: submission }, { data: fields }] = await Promise.all([
    submissionQuery.maybeSingle(),
    supabase.from("form_fields").select("field_name, label").eq("form_id", id).order("sort_order", { ascending: true }),
  ]);
  if (!submission) notFound();

  const data = submission.data as Record<string, Json>;
  const labelMap = new Map((fields ?? []).map((field) => [field.field_name, field.label]));
  const fileUrls = await createFileUrlMap(data);
  const orderedEntries = [
    ...(fields ?? [])
      .filter((field) => Object.prototype.hasOwnProperty.call(data, field.field_name))
      .map((field) => [field.field_name, data[field.field_name]] as const),
    ...Object.entries(data).filter(([key]) => !labelMap.has(key)),
  ];

  return (
    <div className="grid gap-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Submission</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{submission.sender_name || submission.sender_email || "問い合わせ詳細"}</h1>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="panel overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-950">送信データ</h2>
          </div>
          <dl className="divide-y divide-line">
            {orderedEntries.map(([key, value]) => (
              <div key={key} className="grid gap-2 px-5 py-4 sm:grid-cols-[180px_1fr]">
                <dt>
                  <span className="block text-sm font-medium text-zinc-800">{labelMap.get(key) ?? key}</span>
                  <span className="mt-1 block font-mono text-xs text-zinc-500">{key}</span>
                </dt>
                <dd className="whitespace-pre-wrap text-sm leading-6 text-zinc-900">
                  <SubmissionValue value={value} fileUrls={fileUrls} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <aside className="panel p-5">
          <h2 className="text-sm font-semibold text-zinc-950">メタ情報</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            <Meta label="フォーム" value={form.name} />
            <Meta label="状態" value={submission.status} />
            <Meta label="送信日時" value={new Date(submission.created_at).toLocaleString("ja-JP")} />
            <Meta label="IP" value={submission.ip_address ?? "-"} />
            <Meta label="User-Agent" value={submission.user_agent ?? "-"} />
          </dl>
          {submission.status !== "read" ? (
            <form action={markSubmissionReadAction} className="mt-5">
              <input name="submission_id" type="hidden" value={submission.id} />
              <input name="form_id" type="hidden" value={form.id} />
              <button className="button w-full" type="submit">
                既読にする
              </button>
            </form>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

function SubmissionValue({ value, fileUrls }: { value: Json | undefined; fileUrls: Map<string, string> }) {
  const file = getFileValue(value);
  if (file?.path && file.name) {
    const href = fileUrls.get(file.path);
    return href ? (
      <a className="font-medium text-accent hover:underline" href={href} target="_blank" rel="noreferrer">
        {formatSubmissionValue(value)}
      </a>
    ) : (
      <span>{formatSubmissionValue(value)}</span>
    );
  }

  if (Array.isArray(value) && value.some(getFileValue)) {
    return (
      <span className="grid gap-1">
        {value.map((item, index) => {
          const itemFile = getFileValue(item);
          const href = itemFile?.path ? fileUrls.get(itemFile.path) : undefined;
          return href ? (
            <a key={index} className="font-medium text-accent hover:underline" href={href} target="_blank" rel="noreferrer">
              {formatSubmissionValue(item)}
            </a>
          ) : (
            <span key={index}>{formatSubmissionValue(item)}</span>
          );
        })}
      </span>
    );
  }

  return <span>{formatSubmissionValue(value)}</span>;
}

async function createFileUrlMap(data: Record<string, Json>) {
  const files = Object.values(data).flatMap(collectFiles);
  const admin = createAdminClient();
  const entries = await Promise.all(
    files.map(async (file) => {
      if (!file.bucket || !file.path) return null;
      const { data: signed } = await admin.storage.from(file.bucket).createSignedUrl(file.path, 60 * 60);
      return signed?.signedUrl ? ([file.path, signed.signedUrl] as const) : null;
    }),
  );

  return new Map(entries.filter((entry): entry is readonly [string, string] => Boolean(entry)));
}

function collectFiles(value: Json | undefined): Array<{ name?: string; bucket?: string; path?: string }> {
  if (Array.isArray(value)) return value.flatMap(collectFiles);
  const file = getFileValue(value);
  return file ? [file] : [];
}

function getFileValue(value: Json | undefined): { name?: string; bucket?: string; path?: string } | null {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  const file = value as { name?: Json; bucket?: Json; path?: Json };
  if (typeof file.name !== "string") return null;
  return {
    name: file.name,
    bucket: typeof file.bucket === "string" ? file.bucket : undefined,
    path: typeof file.path === "string" ? file.path : undefined,
  };
}

function formatSubmissionValue(value: Json | undefined): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(formatSubmissionValue).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const file = value as { name?: Json; size?: Json; type?: Json };
    if (typeof file.name === "string") {
      const size = typeof file.size === "number" ? ` / ${formatBytes(file.size)}` : "";
      const type = typeof file.type === "string" && file.type ? ` / ${file.type}` : "";
      return `${file.name}${size}${type}`;
    }
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-1 break-words text-zinc-900">{value}</dd>
    </div>
  );
}
