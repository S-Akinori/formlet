import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
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
    const { data: subscription, error } = await admin
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .eq("stripe_mode", stripeMode)
      .maybeSingle();

    if (error) {
      return NextResponse.redirect(`${appUrl}/dashboard/billing?error=billing-db`, { status: 303 });
    }

    if (!subscription?.stripe_customer_id) {
      return NextResponse.redirect(`${appUrl}/dashboard/billing?error=no-customer`, { status: 303 });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl}/dashboard/billing`,
    });

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    const reason = error instanceof Error && error.message.includes("STRIPE_") ? "billing-config" : "stripe";
    return NextResponse.redirect(`${appUrl}/dashboard/billing?error=${reason}`, { status: 303 });
  }
}
