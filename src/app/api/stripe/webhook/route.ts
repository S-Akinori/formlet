import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 500 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook" },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    await syncCheckoutSession(event.data.object as Stripe.Checkout.Session);
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    await syncSubscription(event.data.object as Stripe.Subscription);
  }

  return NextResponse.json({ received: true });
}

async function syncCheckoutSession(session: Stripe.Checkout.Session) {
  if (!session.subscription) return;

  const subscription = await getStripe().subscriptions.retrieve(String(session.subscription));
  await syncSubscription(subscription, session.metadata?.user_id ?? undefined);
}

async function syncSubscription(subscription: Stripe.Subscription, fallbackUserId?: string) {
  const admin = createAdminClient();
  const customerId = String(subscription.customer);
  const userId = subscription.metadata.user_id ?? fallbackUserId;
  const isPro = subscription.status === "active" || subscription.status === "trialing";
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end
    ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
    : null;

  if (userId) {
    await admin.from("user_subscriptions").upsert(
      {
        user_id: userId,
        plan: isPro ? "pro" : "free",
        status: subscription.status,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    return;
  }

  await admin
    .from("user_subscriptions")
    .update({
      plan: isPro ? "pro" : "free",
      status: subscription.status,
      stripe_subscription_id: subscription.id,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);
}
