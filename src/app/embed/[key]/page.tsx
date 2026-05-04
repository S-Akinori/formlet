import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

type EmbedTheme = "simple" | "shop" | "compact";

type EmbedField = {
  field_name: string;
  label: string;
  input_type: "text" | "textarea" | "email" | "url" | "tel" | "number" | "file" | "select" | "checkbox" | "radio";
  is_required: boolean;
  min_length: number | null;
  max_length: number | null;
  pattern: string | null;
  options: string[];
};

const fallbackFields: EmbedField[] = [
  { field_name: "name", label: "お名前", input_type: "text", is_required: true, min_length: null, max_length: null, pattern: null, options: [] },
  { field_name: "email", label: "メールアドレス", input_type: "email", is_required: true, min_length: null, max_length: null, pattern: null, options: [] },
  { field_name: "message", label: "お問い合わせ内容", input_type: "textarea", is_required: true, min_length: null, max_length: null, pattern: null, options: [] },
];

const themes: Record<EmbedTheme, {
  shell: string;
  header: string;
  eyebrow: string;
  title: string;
  description: string;
  input: string;
  button: string;
  choice: string;
}> = {
  simple: {
    shell: "bg-white text-zinc-950",
    header: "border-b border-zinc-200 bg-zinc-50 px-5 py-4",
    eyebrow: "font-mono text-xs uppercase tracking-[0.18em] text-emerald-700",
    title: "mt-1 text-lg font-semibold tracking-normal",
    description: "mt-1 text-sm leading-6 text-zinc-600",
    input: "w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10",
    button: "inline-flex w-full items-center justify-center rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 active:translate-y-[1px]",
    choice: "rounded-md border border-zinc-200 bg-white px-3 py-2.5",
  },
  shop: {
    shell: "bg-[#fffaf2] text-zinc-950",
    header: "border-b border-[#eadfcb] bg-[#f6eddf] px-5 py-4",
    eyebrow: "font-mono text-xs uppercase tracking-[0.18em] text-[#8a5a2b]",
    title: "mt-1 text-lg font-semibold tracking-normal",
    description: "mt-1 text-sm leading-6 text-zinc-700",
    input: "w-full rounded-md border border-[#d8c9b3] bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-[#8a5a2b] focus:ring-4 focus:ring-[#8a5a2b]/10",
    button: "inline-flex w-full items-center justify-center rounded-md bg-[#8a5a2b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#744922] active:translate-y-[1px]",
    choice: "rounded-md border border-[#eadfcb] bg-white px-3 py-2.5",
  },
  compact: {
    shell: "bg-zinc-950 text-white",
    header: "border-b border-white/10 bg-zinc-900 px-5 py-4",
    eyebrow: "font-mono text-xs uppercase tracking-[0.18em] text-emerald-300",
    title: "mt-1 text-lg font-semibold tracking-normal",
    description: "mt-1 text-sm leading-6 text-zinc-300",
    input: "w-full rounded-md border border-white/15 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/15",
    button: "inline-flex w-full items-center justify-center rounded-md bg-emerald-400 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-emerald-300 active:translate-y-[1px]",
    choice: "rounded-md border border-white/15 bg-white/5 px-3 py-2.5",
  },
};

export default async function EmbedFormPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const supabase = createAdminClient();
  const { data: form } = await supabase
    .from("forms")
    .select("id, name, endpoint_key, embed_theme, is_active")
    .eq("endpoint_key", key)
    .eq("is_active", true)
    .maybeSingle();

  if (!form) notFound();

  const { data: fields } = await supabase
    .from("form_fields")
    .select("field_name, label, input_type, is_required, min_length, max_length, pattern, options")
    .eq("form_id", form.id)
    .order("sort_order", { ascending: true });

  const theme = themes[form.embed_theme as EmbedTheme] ?? themes.simple;
  const formFields = (fields?.length ? fields : fallbackFields).map((field) => ({
    field_name: field.field_name,
    label: field.label,
    input_type: field.input_type,
    is_required: field.is_required,
    min_length: field.min_length,
    max_length: field.max_length,
    pattern: field.pattern,
    options: normalizeOptions(field.options),
  })) as EmbedField[];
  const hasFile = formFields.some((field) => field.input_type === "file");

  return (
    <main className={`min-h-[100dvh] ${theme.shell}`}>
      <section className="mx-auto max-w-2xl">
        <div className={theme.header}>
          <p className={theme.eyebrow}>Contact</p>
          <h1 className={theme.title}>{form.name}</h1>
          <p className={theme.description}>必要事項を入力して送信してください。</p>
        </div>
        <form action={`/api/f/${form.endpoint_key}`} method="POST" encType={hasFile ? "multipart/form-data" : undefined} className="grid gap-4 px-5 py-5">
          <input name="_formlet_embed" type="hidden" value="1" />
          <input name="_formlet_hp" type="text" className="hidden" tabIndex={-1} autoComplete="off" />
          {formFields.map((field) => (
            <EmbedFieldControl key={field.field_name} field={field} theme={theme} />
          ))}
          <button className={theme.button} type="submit">
            送信する
          </button>
        </form>
      </section>
    </main>
  );
}

function EmbedFieldControl({ field, theme }: { field: EmbedField; theme: typeof themes.simple }) {
  const required = field.is_required ? <span className="ml-1 text-xs text-red-500">必須</span> : null;

  if (field.input_type === "textarea") {
    return (
      <label className="grid gap-2">
        <span className="text-sm font-medium">
          {field.label}
          {required}
        </span>
        <textarea className={`${theme.input} min-h-28`} name={field.field_name} required={field.is_required} minLength={field.min_length ?? undefined} maxLength={field.max_length ?? undefined} />
      </label>
    );
  }

  if (field.input_type === "select") {
    return (
      <label className="grid gap-2">
        <span className="text-sm font-medium">
          {field.label}
          {required}
        </span>
        <select className={theme.input} name={field.field_name} required={field.is_required} defaultValue="">
          <option value="" disabled={field.is_required}>
            選択してください
          </option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.input_type === "checkbox" || field.input_type === "radio") {
    return (
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">
          {field.label}
          {required}
        </legend>
        <div className={`grid gap-2 ${theme.choice}`}>
          {field.options.map((option, index) => (
            <label key={option} className="flex items-center gap-3 text-sm">
              <input
                className="h-4 w-4 rounded border-zinc-300 text-emerald-700"
                name={field.field_name}
                type={field.input_type}
                value={option}
                required={field.input_type === "radio" && field.is_required && index === 0}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">
        {field.label}
        {required}
      </span>
      <input
        className={theme.input}
        name={field.field_name}
        type={field.input_type}
        required={field.is_required}
        minLength={field.min_length ?? undefined}
        maxLength={field.max_length ?? undefined}
        pattern={field.pattern ?? undefined}
      />
    </label>
  );
}

function normalizeOptions(value: Json | undefined) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
