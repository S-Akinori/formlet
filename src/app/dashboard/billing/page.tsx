import { CheckCircle, CreditCard, Crown, Gauge } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { getCurrentPlan, getMonthStart } from "@/lib/billing/plans";
import { getStripeMode } from "@/lib/stripe/mode";
import { Notice } from "@/components/Notice";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const { supabase, user } = await requireUser();
  const plan = await getCurrentPlan(supabase, user.id);
  const stripeMode = getStripeMode();
  const [{ count: formCount }, { data: forms }, { data: subscription }] = await Promise.all([
    supabase.from("forms").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("forms").select("id").eq("user_id", user.id),
    supabase
      .from("user_subscriptions")
      .select("status, current_period_end, stripe_customer_id")
      .eq("user_id", user.id)
      .eq("stripe_mode", stripeMode)
      .maybeSingle(),
  ]);

  const formIds = forms?.map((form) => form.id) ?? [];
  const { count: submissionCount } = formIds.length
    ? await supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .in("form_id", formIds)
        .gte("created_at", getMonthStart())
    : { count: 0 };

  return (
    <div className="grid gap-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Billing</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">プランと支払い</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Freeは2フォーム、Proは月額880円税込で30フォーム・3,000件/月・保存期間無制限です。現在のStripe環境: {stripeMode}
        </p>
      </div>

      <Notice searchParams={query} />

      <section className="grid gap-4 md:grid-cols-3">
        <UsageCard title="現在のプラン" value={plan.name} icon={<Crown className="h-5 w-5" weight="bold" />} />
        <UsageCard title="フォーム数" value={`${formCount ?? 0} / ${plan.formLimit}`} icon={<Gauge className="h-5 w-5" weight="bold" />} />
        <UsageCard title="今月の送信数" value={`${submissionCount ?? 0} / ${plan.submissionLimit}`} icon={<CreditCard className="h-5 w-5" weight="bold" />} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <PlanCard
          name="Free"
          price="¥0"
          active={plan.id === "free"}
          features={[
            "2フォーム",
            "300件/月",
            "90日保存",
            "ブランド表示なし",
            "フォーム個別SMTP・バリデーション利用可",
          ]}
        />
        <PlanCard
          name="Pro"
          price="¥880/月 税込"
          active={plan.id === "pro"}
          featured
          features={[
            "30フォーム",
            "3,000件/月",
            "保存期間無制限",
            "CSVエクスポート対応",
            "フォーム個別SMTP・バリデーション利用可",
          ]}
        >
          {plan.id === "pro" ? (
            <form action="/api/billing/portal" method="POST">
              <button className="button-secondary w-full" type="submit" disabled={!subscription?.stripe_customer_id}>
                Stripeで管理
              </button>
            </form>
          ) : (
            <form action="/api/billing/checkout" method="POST">
              <button className="button w-full" type="submit">
                Proにアップグレード
              </button>
            </form>
          )}
        </PlanCard>
      </section>

      {subscription?.current_period_end ? (
        <p className="text-sm text-zinc-500">
          現在の請求期間終了日: {new Date(subscription.current_period_end).toLocaleDateString("ja-JP")}
        </p>
      ) : null}
    </div>
  );
}

function UsageCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">{title}</p>
        <span className="text-accent">{icon}</span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">{value}</p>
    </div>
  );
}

function PlanCard({
  name,
  price,
  features,
  active,
  featured = false,
  children,
}: {
  name: string;
  price: string;
  features: string[];
  active: boolean;
  featured?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`panel grid gap-5 p-6 ${featured ? "border-accent/40" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950">{name}</h2>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{price}</p>
        </div>
        {active ? <span className="rounded-md bg-paper px-3 py-1 text-xs font-medium text-accent">利用中</span> : null}
      </div>
      <ul className="grid gap-3 text-sm text-zinc-700">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" weight="bold" />
            {feature}
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
