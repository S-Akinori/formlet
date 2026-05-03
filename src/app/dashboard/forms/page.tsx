import Link from "next/link";
import { ArrowRight, Plus } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";

export default async function FormsPage() {
  const { supabase } = await requireUser();
  const { data: forms } = await supabase
    .from("forms")
    .select("id, name, endpoint_key, admin_email, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Forms</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">フォーム一覧</h1>
        </div>
        <Link className="button" href="/dashboard/forms/new">
          <Plus className="h-4 w-4" weight="bold" />
          作成
        </Link>
      </div>

      {forms?.length ? (
        <div className="panel overflow-hidden">
          <div className="divide-y divide-line">
            {forms.map((form) => (
              <Link key={form.id} href={`/dashboard/forms/${form.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-paper lg:grid-cols-[1fr_1.2fr_160px_24px] lg:items-center">
                <div>
                  <p className="text-sm font-semibold text-zinc-950">{form.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{form.admin_email}</p>
                </div>
                <code className="rounded bg-paper px-2 py-1 font-mono text-xs text-zinc-700">/api/f/{form.endpoint_key}</code>
                <span className={`text-sm ${form.is_active ? "text-accent" : "text-zinc-500"}`}>{form.is_active ? "Active" : "Inactive"}</span>
                <ArrowRight className="hidden h-4 w-4 text-zinc-400 lg:block" weight="bold" />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="フォームがありません" body="問い合わせを受け付けるエンドポイントを作成してください。" href="/dashboard/forms/new" action="フォーム作成" />
      )}
    </div>
  );
}
