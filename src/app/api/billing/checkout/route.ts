import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProPriceId, getStripe } from "@/lib/stripe/server";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/auth/login`, { status: 303 });
  }

  const admin = createAdminClient();
  const { data: subscription } = await admin
    .from("user_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const stripe = getStripe();
  const customerId =
    subscription?.stripe_customer_id ??
    (
      await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          user_id: user.id,
        },
      })
    ).id;

  if (!subscription?.stripe_customer_id) {
    await admin.from("user_subscriptions").upsert(
      {
        user_id: user.id,
        plan: "free",
        status: "free",
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: getProPriceId(),
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=cancel`,
    metadata: {
      user_id: user.id,
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
      },
    },
  });

  return NextResponse.redirect(session.url ?? `${appUrl}/dashboard/billing`, { status: 303 });
}
