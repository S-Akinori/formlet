import type { Database } from "@/lib/supabase/types";

type SupabaseAdmin = ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>;
type FormRow = Database["public"]["Tables"]["forms"]["Row"];

export const HONEYPOT_KEYS = ["_formlet_hp", "_formlet_website", "_gotcha", "hp_field"];

export function hasHoneypot(data: Record<string, FormDataEntryValue>, configuredFieldNames: string[] = []) {
  const configured = new Set(configuredFieldNames);
  const trapKeys = HONEYPOT_KEYS.filter((key) => !configured.has(key));
  return trapKeys.some((key) => {
    const value = data[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function originAllowed(form: FormRow, request: Request, allowAppOrigin = false) {
  const allowed = form.allowed_origins?.map((origin) => origin.trim()).filter(Boolean) ?? [];
  if (allowed.length === 0) return true;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const candidates = [origin, referer].filter(Boolean) as string[];
  const appOrigin = getAppOrigin(request);

  return candidates.some((candidate) => {
    try {
      const parsed = new URL(candidate);
      if (allowAppOrigin && parsed.origin === appOrigin) return true;
      return allowed.includes(parsed.origin);
    } catch {
      return false;
    }
  });
}

function getAppOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Fall through to the request URL.
    }
  }

  return new URL(request.url).origin;
}

export async function checkRateLimit(
  supabase: SupabaseAdmin,
  endpointKey: string,
  ipAddress: string,
  limit = 8,
  windowMinutes = 10,
) {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("rate_limits")
    .select("id, request_count, window_start")
    .eq("endpoint_key", endpointKey)
    .eq("ip_address", ipAddress)
    .gte("window_start", windowStart)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    await supabase.from("rate_limits").insert({ endpoint_key: endpointKey, ip_address: ipAddress });
    return true;
  }

  if (data.request_count >= limit) {
    return false;
  }

  await supabase
    .from("rate_limits")
    .update({ request_count: data.request_count + 1 })
    .eq("id", data.id);

  return true;
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
