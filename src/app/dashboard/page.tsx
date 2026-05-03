import Link from "next/link";
import { ArrowRight, CreditCard, EnvelopeSimple, SquaresFour, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";
import { getCurrentPlan, getMonthStart } from "@/lib/billing/plans";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const plan = await getCurrentPlan(supabase, user.id);
  const [{ count: formCount }, { count: unreadCount }, { data: forms }, { data: allForms }, { data: smtp }] = await Promise.all([
    supabase.from("forms").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "unread"),
    supabase.from("forms").select("id, name, endpoint_key, is_active, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("forms").select("id").eq("user_id", user.id),
    supabase.from("email_settings").select("id").maybeSingle(),
  ]);
  const formIds = allForms?.map((form) => form.id) ?? [];
  const { count: monthlySubmissions } = formIds.length
    ? await supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .in("form_id", formIds)
        .gte("created_at", getMonthStart())
    : { count: 0 };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">運用状況</h1>
        </div>
        <Link className="button" href="/dashboard/forms/new">
          フォーム作成
          <ArrowRight className="h-4 w-4" weight="bold" />
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_1.4fr]">
        <Metric title="Forms" value={`${formCount ?? 0}/${plan.formLimit}`} icon={<SquaresFour className="h-5 w-5" weight="bold" />} />
        <Metric title="Monthly" value={`${monthlySubmissions ?? 0}/${plan.submissionLimit}`} icon={<CreditCard className="h-5 w-5" weight="bold" />} />
        <Metric title="Unread" value={String(unreadCount ?? 0)} icon={<EnvelopeSimple className="h-5 w-5" weight="bold" />} />
        <div className="panel p-5">
          <div className="flex items-start gap-3">
            <WarningCircle className={`mt-0.5 h-5 w-5 ${smtp ? "text-accent" : "text-amber-600"}`} weight="bold" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">SMTP設定</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                {smtp ? "メール送信設定が保存されています。" : "通知メールと自動返信を送るにはSMTP設定が必要です。"}
              </p>
              <Link className="mt-3 inline-flex text-sm font-medium text-accent hover:underline" href="/dashboard/settings/smtp">
                SMTPを設定
              </Link>
            </div>
          </div>
        </div>
      </section>

      {forms?.length ? (
        <section className="panel overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-950">最近のフォーム</h2>
          </div>
          <div className="divide-y divide-line">
            {forms.map((form) => (
              <Link key={form.id} href={`/dashboard/forms/${form.id}`} className="grid gap-2 px-5 py-4 transition hover:bg-paper sm:grid-cols-[1fr_auto]">
                <span>
                  <span className="block text-sm font-medium text-zinc-950">{form.name}</span>
                  <span className="mt-1 block font-mono text-xs text-zinc-500">/api/f/{form.endpoint_key}</span>
                </span>
                <span className={`text-sm ${form.is_active ? "text-accent" : "text-zinc-500"}`}>{form.is_active ? "Active" : "Inactive"}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState title="フォームがありません" body="最初のフォームを作成すると、静的サイトから問い合わせを受け取れるようになります。" href="/dashboard/forms/new" action="フォーム作成" />
      )}
    </div>
  );
}

function Metric({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">{title}</p>
        <span className="text-accent">{icon}</span>
      </div>
      <p className="mt-4 font-mono text-4xl font-semibold tracking-tight text-zinc-950">{value}</p>
    </div>
  );
}
