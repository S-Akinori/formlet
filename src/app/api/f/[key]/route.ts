import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSystemSmtpSetting, sendSmtpMail } from "@/lib/mail/smtp";
import { checkRateLimit, getClientIp, hasHoneypot, originAllowed } from "@/lib/spam/checks";
import { getMonthStart, isActiveSubscription, PLANS } from "@/lib/billing/plans";
import { getStripeMode } from "@/lib/stripe/mode";
import {
  DEFAULT_ADMIN_BODY,
  DEFAULT_ADMIN_SUBJECT,
  DEFAULT_REPLY_BODY,
  DEFAULT_REPLY_SUBJECT,
  renderTemplate,
} from "@/lib/templates";
import type { Database, Json } from "@/lib/supabase/types";

export async function POST(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const supabase = createAdminClient();

  const { data: form, error: formError } = await supabase
    .from("forms")
    .select("*")
    .eq("endpoint_key", key)
    .eq("is_active", true)
    .maybeSingle();

  if (formError) {
    return NextResponse.json({ error: "Failed to load form" }, { status: 500 });
  }

  if (!form) {
    return NextResponse.json({ error: "Invalid form" }, { status: 404 });
  }

  const rawFormData = await request.formData();
  const entries = Object.fromEntries(rawFormData.entries());

  const dashboardTest = request.headers.get("x-formlet-dashboard-test") === "1";

  if (hasHoneypot(entries)) {
    return redirectOrJson(form.redirect_url, { ok: true }, dashboardTest);
  }

  if (!originAllowed(form, request)) {
    return NextResponse.json({ error: "Origin is not allowed" }, { status: 403 });
  }

  const ipAddress = getClientIp(request);
  const rateAllowed = await checkRateLimit(supabase, key, ipAddress);
  if (!rateAllowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let data: Record<string, Json>;
  try {
    data = await normalizeFormData(rawFormData, supabase, form.id);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
  const { data: fields, error: fieldsError } = await supabase
    .from("form_fields")
    .select("field_name, label, input_type, is_required, min_length, max_length, pattern, options")
    .eq("form_id", form.id)
    .order("sort_order", { ascending: true });

  if (fieldsError) {
    return NextResponse.json({ error: "Failed to load validation rules" }, { status: 500 });
  }

  const validationErrors = validateSubmission(data, fields ?? []);
  if (validationErrors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: validationErrors }, { status: 422 });
  }

  const usageAllowed = await checkSubmissionLimit(supabase, form.user_id);
  if (!usageAllowed.allowed) {
    return NextResponse.json(
      {
        error: "Monthly submission limit reached",
        limit: usageAllowed.limit,
        plan: usageAllowed.plan,
      },
      { status: 402 },
    );
  }

  const senderEmail = readString(data.email);
  const senderName = readString(data.name);
  const createdAt = new Date().toISOString();

  const { error: submissionError } = await supabase.from("submissions").insert({
    form_id: form.id,
    data,
    sender_email: senderEmail,
    sender_name: senderName,
    ip_address: ipAddress,
    user_agent: request.headers.get("user-agent"),
    created_at: createdAt,
  });

  if (submissionError) {
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }

  await sendSubmissionMails({
    supabase,
    form,
    data,
    senderEmail,
    senderName,
    createdAt,
  });

  return redirectOrJson(form.redirect_url, { ok: true }, dashboardTest);
}

async function checkSubmissionLimit(supabase: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .eq("stripe_mode", getStripeMode())
    .maybeSingle();

  const plan = subscription?.plan === "pro" && isActiveSubscription(subscription.status) ? PLANS.pro : PLANS.free;
  const { data: forms } = await supabase.from("forms").select("id").eq("user_id", userId);
  const formIds = forms?.map((item) => item.id) ?? [];

  if (formIds.length === 0) {
    return { allowed: true, limit: plan.submissionLimit, plan: plan.id };
  }

  const { count } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .in("form_id", formIds)
    .gte("created_at", getMonthStart());

  return {
    allowed: (count ?? 0) < plan.submissionLimit,
    limit: plan.submissionLimit,
    plan: plan.id,
  };
}

async function normalizeFormData(formData: FormData, supabase: ReturnType<typeof createAdminClient>, formId: string) {
  const data: Record<string, Json> = {};

  for (const [key, value] of formData.entries()) {
    if (["company", "website_url", "_gotcha", "hp_field"].includes(key)) continue;
    if (value instanceof File) {
      if (!value.name && value.size === 0) continue;
      const uploaded = await uploadSubmittedFile(supabase, formId, value);
      appendFormValue(data, key, uploaded);
      continue;
    }

    appendFormValue(data, key, value);
  }

  return data;
}

async function uploadSubmittedFile(supabase: ReturnType<typeof createAdminClient>, formId: string, file: File): Promise<Json> {
  const maxBytes = Number(process.env.FORMLET_MAX_FILE_BYTES ?? 10 * 1024 * 1024);
  if (Number.isFinite(maxBytes) && maxBytes > 0 && file.size > maxBytes) {
    throw new UploadError("File is too large", 413);
  }

  const bucket = process.env.FORMLET_UPLOAD_BUCKET ?? "formlet-uploads";
  const safeName = sanitizeFileName(file.name);
  const path = `${formId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) throw new UploadError("Failed to upload file", 500);

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    bucket,
    path,
  };
}

function sanitizeFileName(value: string) {
  return value.replace(/[^\w.()-]+/g, "_").slice(0, 120) || "upload";
}

class UploadError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function appendFormValue(data: Record<string, Json>, key: string, value: Json) {
  if (data[key]) {
    const existing = data[key];
    data[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    return;
  }

  data[key] = value;
}

function readString(value: Json | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function validateSubmission(
  data: Record<string, Json>,
  fields: Array<{
    field_name: string;
    label: string;
    input_type: "text" | "textarea" | "email" | "url" | "tel" | "number" | "file" | "select" | "checkbox" | "radio";
    is_required: boolean;
    min_length: number | null;
    max_length: number | null;
    pattern: string | null;
    options: Json;
  }>,
) {
  const errors: Array<{ field: string; label: string; message: string }> = [];

  for (const field of fields) {
    const rawValue = data[field.field_name];
    const value = typeof rawValue === "string" ? rawValue.trim() : "";
    const values = normalizeSubmittedValues(rawValue);
    const options = normalizeOptions(field.options);

    if (field.is_required && values.length === 0) {
      errors.push({ field: field.field_name, label: field.label, message: "必須項目です。" });
      continue;
    }

    if (values.length === 0) continue;

    if (field.input_type === "file") {
      const hasFile = values.some((item) => typeof item === "object" && item !== null && !Array.isArray(item) && typeof item.name === "string");
      if (!hasFile) {
        errors.push({ field: field.field_name, label: field.label, message: "ファイルを選択してください。" });
      }
      continue;
    }

    if (field.input_type === "select" || field.input_type === "radio" || field.input_type === "checkbox") {
      const invalid = values.some((item) => typeof item !== "string" || !options.includes(item));
      if (invalid) {
        errors.push({ field: field.field_name, label: field.label, message: "選択肢から選んでください。" });
      }
      continue;
    }

    if (!value) continue;

    if (field.min_length !== null && value.length < field.min_length) {
      errors.push({ field: field.field_name, label: field.label, message: `${field.min_length}文字以上で入力してください。` });
    }

    if (field.max_length !== null && value.length > field.max_length) {
      errors.push({ field: field.field_name, label: field.label, message: `${field.max_length}文字以内で入力してください。` });
    }

    if (field.input_type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push({ field: field.field_name, label: field.label, message: "メールアドレス形式で入力してください。" });
    }

    if (field.input_type === "url" && !isValidUrl(value)) {
      errors.push({ field: field.field_name, label: field.label, message: "URL形式で入力してください。" });
    }

    if (field.input_type === "number" && Number.isNaN(Number(value))) {
      errors.push({ field: field.field_name, label: field.label, message: "数値で入力してください。" });
    }

    if (field.pattern && !matchesPattern(value, field.pattern)) {
      errors.push({ field: field.field_name, label: field.label, message: "指定された形式で入力してください。" });
    }
  }

  return errors;
}

function normalizeSubmittedValues(value: Json | undefined): Json[] {
  if (value === null || value === undefined) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.filter((item) => {
    if (typeof item === "string") return item.trim() !== "";
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      return typeof item.name !== "string" || item.name.trim() !== "";
    }
    return item !== null && item !== undefined;
  });
}

function normalizeOptions(value: Json) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function matchesPattern(value: string, pattern: string) {
  try {
    return new RegExp(pattern).test(value);
  } catch {
    return false;
  }
}

function redirectOrJson(redirectUrl: string | null, payload: Record<string, boolean>, forceJson = false) {
  if (redirectUrl && !forceJson) {
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  return NextResponse.json({ ...payload, redirected_to: redirectUrl });
}

async function sendSubmissionMails({
  supabase,
  form,
  data,
  senderEmail,
  senderName,
  createdAt,
}: {
  supabase: ReturnType<typeof createAdminClient>;
  form: Database["public"]["Tables"]["forms"]["Row"];
  data: Record<string, Json>;
  senderEmail: string | null;
  senderName: string | null;
  createdAt: string;
}) {
  const [{ data: userSetting }, { data: formSetting }, { data: templates }] = await Promise.all([
    supabase.from("email_settings").select("*").eq("user_id", form.user_id).maybeSingle(),
    supabase.from("form_email_settings").select("*").eq("form_id", form.id).maybeSingle(),
    supabase.from("email_templates").select("*").eq("form_id", form.id),
  ]);

  const setting = formSetting ?? userSetting ?? getSystemSmtpSetting();
  if (!setting) return;

  const templateVars = {
    name: senderName,
    email: senderEmail,
    message: readString(data.message),
    created_at: createdAt,
    form_name: form.name,
    data,
  };

  const adminTemplate = templates?.find((template) => template.type === "admin");
  const replyTemplate = templates?.find((template) => template.type === "reply");

  await sendSmtpMail(setting, {
    to: form.admin_email,
    replyTo: senderEmail,
    subject: renderTemplate(adminTemplate?.subject ?? DEFAULT_ADMIN_SUBJECT, templateVars),
    html: renderTemplate(adminTemplate?.body ?? DEFAULT_ADMIN_BODY, templateVars),
  });

  if (senderEmail) {
    await sendSmtpMail(setting, {
      to: senderEmail,
      subject: renderTemplate(replyTemplate?.subject ?? DEFAULT_REPLY_SUBJECT, templateVars),
      html: renderTemplate(replyTemplate?.body ?? DEFAULT_REPLY_BODY, templateVars),
    });
  }
}
