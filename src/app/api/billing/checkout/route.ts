import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProPriceId, getStripe } from "@/lib/stripe/server";
import { getStripeMode } from "@/lib/stripe/mode";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${appUrl}/auth/login`, { status: 303 });
    }

    const stripeMode = getStripeMode();
    const admin = createAdminClient();
    const { data: subscription, error: subscriptionError } = await admin
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .eq("stripe_mode", stripeMode)
      .maybeSingle();

    if (subscriptionError) {
      return NextResponse.redirect(`${appUrl}/dashboard/billing?error=billing-db`, { status: 303 });
    }

    const stripe = getStripe();
    const customerId =
      subscription?.stripe_customer_id ??
      (
        await stripe.customers.create({
          email: user.email ?? undefined,
        metadata: {
          user_id: user.id,
          stripe_mode: stripeMode,
        },
      })
      ).id;

    if (!subscription?.stripe_customer_id) {
      const { error: upsertError } = await admin.from("user_subscriptions").upsert(
        {
          user_id: user.id,
          stripe_mode: stripeMode,
          plan: "free",
          status: "free",
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,stripe_mode" },
      );

      if (upsertError) {
        return NextResponse.redirect(`${appUrl}/dashboard/billing?error=billing-db`, { status: 303 });
      }
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
        stripe_mode: stripeMode,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          stripe_mode: stripeMode,
        },
      },
    });

    return NextResponse.redirect(session.url ?? `${appUrl}/dashboard/billing`, { status: 303 });
  } catch (error) {
    const reason = error instanceof Error && error.message.includes("STRIPE_") ? "billing-config" : "stripe";
    return NextResponse.redirect(`${appUrl}/dashboard/billing?error=${reason}`, { status: 303 });
  }
}
