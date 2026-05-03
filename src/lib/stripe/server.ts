import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  stripe ??= new Stripe(secretKey, {
    apiVersion: "2026-04-22.dahlia",
  });

  return stripe;
}

export function getProPriceId() {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  if (!priceId) {
    throw new Error("STRIPE_PRO_PRICE_ID is not configured.");
  }

  return priceId;
}
