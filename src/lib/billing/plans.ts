import type { createClient } from "@/lib/supabase/server";

export type PlanId = "free" | "pro";

export type PlanLimits = {
  id: PlanId;
  name: string;
  priceLabel: string;
  formLimit: number;
  submissionLimit: number;
  retentionDays: number | null;
  csvExport: boolean;
};

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    id: "free",
    name: "Free",
    priceLabel: "¥0",
    formLimit: 2,
    submissionLimit: 300,
    retentionDays: 90,
    csvExport: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceLabel: "¥880/月 税込",
    formLimit: 30,
    submissionLimit: 3000,
    retentionDays: null,
    csvExport: true,
  },
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function getCurrentPlan(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("user_subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.plan === "pro" && isActiveSubscription(data.status)) {
    return PLANS.pro;
  }

  return PLANS.free;
}

export function isActiveSubscription(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export function getMonthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export function getRetentionStart(plan: PlanLimits) {
  if (!plan.retentionDays) return null;
  return new Date(Date.now() - plan.retentionDays * 24 * 60 * 60 * 1000).toISOString();
}
