export type StripeMode = "test" | "live";

export function getStripeMode(): StripeMode {
  return process.env.STRIPE_MODE === "live" ? "live" : "test";
}
