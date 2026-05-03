"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getCurrentPlan } from "@/lib/billing/plans";
import {
  DEFAULT_ADMIN_BODY,
  DEFAULT_ADMIN_SUBJECT,
  DEFAULT_REPLY_BODY,
  DEFAULT_REPLY_SUBJECT,
} from "@/lib/templates";
import { encryptSecret } from "@/lib/security/secrets";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signInAction(formData: FormData) {
  const { supabase } = await requireAnonymousClient();
  const parsed = authSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect("/auth/login?error=invalid");

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect("/auth/login?error=auth");

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  const { supabase } = await requireAnonymousClient();
  const parsed = authSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect("/auth/register?error=invalid");

  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) redirect("/auth/register?error=auth");

  redirect("/auth/login?message=check-email");
}

export async function signOutAction() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function resetPasswordAction(formData: FormData) {
  const { supabase } = await requireAnonymousClient();
  const email = String(formData.get("email") ?? "");
  const parsed = z.string().email().safeParse(email);

  if (!parsed.success) redirect("/auth/reset-password?error=invalid");

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${appUrl}/auth/callback?next=/auth/update-password`,
  });

  if (error) redirect("/auth/reset-password?error=auth");

  redirect("/auth/login?message=reset-sent");
}

export async function updatePasswordAction(formData: FormData) {
  const { supabase } = await requireAnonymousClient();
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) redirect("/auth/update-password?error=invalid");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/auth/update-password?error=auth");

  redirect("/dashboard");
}

export async function createFormAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const plan = await getCurrentPlan(supabase, user.id);
  const { count: formCount } = await supabase
    .from("forms")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((formCount ?? 0) >= plan.formLimit) {
    redirect("/dashboard/forms/new?error=form-limit");
  }

  const parsed = z
    .object({
      name: z.string().min(1),
      admin_email: z.string().email(),
      redirect_url: z.string().url().optional().or(z.literal("")),
      allowed_origins: z.string().optional(),
      is_active: z.union([z.literal("on"), z.null()]).optional(),
    })
    .safeParse({
      name: formData.get("name"),
      admin_email: formData.get("admin_email"),
      redirect_url: formData.get("redirect_url"),
      allowed_origins: formData.get("allowed_origins"),
      is_active: formData.get("is_active"),
    });

  if (!parsed.success) redirect("/dashboard/forms/new?error=invalid");

  const endpointKey = crypto.randomUUID();
  const allowedOrigins = parsed.data.allowed_origins
    ?.split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  const { data: form, error } = await supabase
    .from("forms")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      endpoint_key: endpointKey,
      admin_email: parsed.data.admin_email,
      redirect_url: parsed.data.redirect_url || null,
      allowed_origins: allowedOrigins?.length ? allowedOrigins : null,
      is_active: parsed.data.is_active === "on",
    })
    .select("id")
    .single();

  if (error || !form) redirect("/dashboard/forms/new?error=save");

  await supabase.from("email_templates").insert([
    {
      form_id: form.id,
      type: "admin",
      subject: DEFAULT_ADMIN_SUBJECT,
      body: DEFAULT_ADMIN_BODY,
    },
    {
      form_id: form.id,
      type: "reply",
      subject: DEFAULT_REPLY_SUBJECT,
      body: DEFAULT_REPLY_BODY,
    },
  ]);

  await supabase.from("form_fields").insert([
    { form_id: form.id, field_name: "name", label: "お名前", input_type: "text", is_required: true, sort_order: 0 },
    { form_id: form.id, field_name: "email", label: "メールアドレス", input_type: "email", is_required: true, sort_order: 1 },
    { form_id: form.id, field_name: "message", label: "お問い合わせ内容", input_type: "text", is_required: true, sort_order: 2 },
  ]);

  revalidatePath("/dashboard");
  redirect(`/dashboard/forms/${form.id}`);
}

export async function updateFormAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const allowedOrigins = String(formData.get("allowed_origins") ?? "")
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  const parsed = z
    .object({
      name: z.string().min(1),
      admin_email: z.string().email(),
      redirect_url: z.string().url().optional().or(z.literal("")),
      is_active: z.union([z.literal("on"), z.null()]).optional(),
    })
    .safeParse({
      name: formData.get("name"),
      admin_email: formData.get("admin_email"),
      redirect_url: formData.get("redirect_url"),
      is_active: formData.get("is_active"),
    });

  if (!id || !parsed.success) redirect(`/dashboard/forms/${id}?error=invalid`);

  const { error } = await supabase
    .from("forms")
    .update({
      name: parsed.data.name,
      admin_email: parsed.data.admin_email,
      redirect_url: parsed.data.redirect_url || null,
      allowed_origins: allowedOrigins.length ? allowedOrigins : null,
      is_active: parsed.data.is_active === "on",
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) redirect(`/dashboard/forms/${id}?error=save`);

  revalidatePath(`/dashboard/forms/${id}`);
  redirect(`/dashboard/forms/${id}?saved=1`);
}

export async function saveSmtpAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const rawPassword = String(formData.get("smtp_password") ?? "");
  const parsed = z
    .object({
      smtp_host: z.string().min(1),
      smtp_port: z.coerce.number().int().positive(),
      smtp_user: z.string().min(1),
      from_email: z.string().email(),
      from_name: z.string().min(1),
      secure: z.union([z.literal("on"), z.null()]).optional(),
    })
    .safeParse({
      smtp_host: formData.get("smtp_host"),
      smtp_port: formData.get("smtp_port"),
      smtp_user: formData.get("smtp_user"),
      from_email: formData.get("from_email"),
      from_name: formData.get("from_name"),
      secure: formData.get("secure"),
    });

  if (!parsed.success) redirect("/dashboard/settings/smtp?error=invalid");

  const { data: existing } = await supabase
    .from("email_settings")
    .select("id, smtp_password")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!rawPassword && !existing?.smtp_password) redirect("/dashboard/settings/smtp?error=invalid");

  let smtpPassword = existing?.smtp_password ?? "";
  if (rawPassword) {
    try {
      smtpPassword = encryptSecret(rawPassword);
    } catch {
      redirect("/dashboard/settings/smtp?error=crypto");
    }
  }

  const payload = {
    ...parsed.data,
    smtp_password: smtpPassword,
    secure: parsed.data.secure === "on",
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase.from("email_settings").update(payload).eq("id", existing.id)
    : await supabase.from("email_settings").insert(payload);

  if (error) redirect("/dashboard/settings/smtp?error=save");

  revalidatePath("/dashboard/settings/smtp");
  redirect("/dashboard/settings/smtp?saved=1");
}

export async function saveFormSmtpAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const formId = String(formData.get("form_id") ?? "");
  const useCustom = formData.get("use_custom_form_smtp") === "on";
  const rawPassword = String(formData.get("form_smtp_password") ?? "");

  const { data: form } = await supabase
    .from("forms")
    .select("id")
    .eq("id", formId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!form) redirect("/dashboard/forms");

  if (!useCustom) {
    await supabase.from("form_email_settings").delete().eq("form_id", formId);
    revalidatePath(`/dashboard/forms/${formId}`);
    redirect(`/dashboard/forms/${formId}?saved=1`);
  }

  const parsed = z
    .object({
      smtp_host: z.string().min(1),
      smtp_port: z.coerce.number().int().positive(),
      smtp_user: z.string().min(1),
      from_email: z.string().email(),
      from_name: z.string().min(1),
      secure: z.union([z.literal("on"), z.null()]).optional(),
    })
    .safeParse({
      smtp_host: formData.get("form_smtp_host"),
      smtp_port: formData.get("form_smtp_port"),
      smtp_user: formData.get("form_smtp_user"),
      from_email: formData.get("form_from_email"),
      from_name: formData.get("form_from_name"),
      secure: formData.get("form_secure"),
    });

  if (!parsed.success) redirect(`/dashboard/forms/${formId}?error=invalid`);

  const { data: existing } = await supabase
    .from("form_email_settings")
    .select("smtp_password")
    .eq("form_id", formId)
    .maybeSingle();

  if (!rawPassword && !existing?.smtp_password) redirect(`/dashboard/forms/${formId}?error=invalid`);

  let smtpPassword = existing?.smtp_password ?? "";
  if (rawPassword) {
    try {
      smtpPassword = encryptSecret(rawPassword);
    } catch {
      redirect(`/dashboard/forms/${formId}?error=crypto`);
    }
  }

  const payload = {
    ...parsed.data,
    smtp_password: smtpPassword,
    form_id: formId,
    secure: parsed.data.secure === "on",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("form_email_settings").upsert(payload, {
    onConflict: "form_id",
  });

  if (error) redirect(`/dashboard/forms/${formId}?error=save`);

  revalidatePath(`/dashboard/forms/${formId}`);
  redirect(`/dashboard/forms/${formId}?saved=1`);
}

export async function saveFormFieldsAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const formId = String(formData.get("form_id") ?? "");
  const fieldNames = formData.getAll("field_name").map((value) => String(value).trim());
  const labels = formData.getAll("field_label").map((value) => String(value).trim());
  const inputTypes = formData.getAll("input_type").map((value) => String(value));
  const requiredFlags = formData.getAll("is_required").map((value) => String(value));
  const minLengths = formData.getAll("min_length").map((value) => String(value).trim());
  const maxLengths = formData.getAll("max_length").map((value) => String(value).trim());
  const patterns = formData.getAll("pattern").map((value) => String(value).trim());

  const { data: form } = await supabase
    .from("forms")
    .select("id")
    .eq("id", formId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!form) redirect("/dashboard/forms");

  const seen = new Set<string>();
  const fields = fieldNames
    .map((fieldName, index) => ({
      form_id: formId,
      field_name: fieldName,
      label: labels[index] || fieldName,
      input_type: parseInputType(inputTypes[index]),
      is_required: requiredFlags[index] === "on",
      min_length: parseNullableInt(minLengths[index]),
      max_length: parseNullableInt(maxLengths[index]),
      pattern: patterns[index] || null,
      sort_order: index,
      updated_at: new Date().toISOString(),
    }))
    .filter((field) => {
      if (!field.field_name || !field.label || seen.has(field.field_name)) return false;
      seen.add(field.field_name);
      return /^[a-zA-Z][a-zA-Z0-9_.:-]*$/.test(field.field_name);
    });

  if (fields.length === 0) redirect(`/dashboard/forms/${formId}?error=invalid`);

  const { error: deleteError } = await supabase.from("form_fields").delete().eq("form_id", formId);
  if (deleteError) redirect(`/dashboard/forms/${formId}?error=save`);

  const { error } = await supabase.from("form_fields").insert(fields);
  if (error) redirect(`/dashboard/forms/${formId}?error=save`);

  revalidatePath(`/dashboard/forms/${formId}`);
  redirect(`/dashboard/forms/${formId}?saved=1`);
}

export async function saveTemplatesAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const formId = String(formData.get("form_id") ?? "");

  const { data: form } = await supabase
    .from("forms")
    .select("id")
    .eq("id", formId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!form) redirect("/dashboard/forms");

  for (const type of ["admin", "reply"] as const) {
    const subject = String(formData.get(`${type}_subject`) ?? "");
    const body = String(formData.get(`${type}_body`) ?? "");
    const id = String(formData.get(`${type}_id`) ?? "");
    const payload = { subject, body, updated_at: new Date().toISOString() };

    if (id) {
      await supabase.from("email_templates").update(payload).eq("id", id).eq("form_id", formId);
    } else {
      await supabase.from("email_templates").insert({ ...payload, form_id: formId, type });
    }
  }

  revalidatePath(`/dashboard/forms/${formId}/templates`);
  redirect(`/dashboard/forms/${formId}/templates?saved=1`);
}

export async function markSubmissionReadAction(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("submission_id") ?? "");
  const formId = String(formData.get("form_id") ?? "");

  await supabase.from("submissions").update({ status: "read" }).eq("id", id).eq("form_id", formId);
  revalidatePath(`/dashboard/forms/${formId}/submissions/${id}`);
}

async function requireAnonymousClient() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  return { supabase };
}

function parseInputType(value: string | undefined): "text" | "email" | "url" | "tel" | "number" {
  if (value === "email" || value === "url" || value === "tel" || value === "number") return value;
  return "text";
}

function parseNullableInt(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}
