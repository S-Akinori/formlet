"use client";

import { useState } from "react";
import { PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormFieldConfig } from "@/components/FormFieldsEditor";

type TestState =
  | { status: "idle" }
  | { status: "success"; message: string; redirectedTo?: string | null }
  | { status: "error"; message: string };

type FormSubmissionTesterProps = {
  endpoint: string;
  fields: FormFieldConfig[];
};

const fallbackFields: FormFieldConfig[] = [
  { field_name: "name", label: "お名前", input_type: "text", is_required: true },
  { field_name: "email", label: "メールアドレス", input_type: "email", is_required: true },
  { field_name: "message", label: "お問い合わせ内容", input_type: "textarea", is_required: true },
];

export function FormSubmissionTester({ endpoint, fields }: FormSubmissionTesterProps) {
  const [state, setState] = useState<TestState>({ status: "idle" });
  const testFields = fields.length ? fields : fallbackFields;

  async function submitTest(formData: FormData) {
    setState({ status: "idle" });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: {
          "x-formlet-dashboard-test": "1",
        },
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; redirected_to?: string | null; details?: Array<{ label: string; message: string }> }
        | null;

      if (!response.ok || !payload?.ok) {
        setState({
          status: "error",
          message: payload?.details?.length
            ? payload.details.map((detail) => `${detail.label}: ${detail.message}`).join(" / ")
            : payload?.error ?? `送信に失敗しました。HTTP ${response.status}`,
        });
        return;
      }

      setState({
        status: "success",
        message: "テスト送信が完了しました。問い合わせ一覧に保存されています。",
        redirectedTo: payload.redirected_to,
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "送信に失敗しました。",
      });
    }
  }

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-line bg-paper/70 px-6 py-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-white">
            <PaperPlaneTilt className="h-5 w-5 text-accent" weight="bold" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">送信テスト</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              このフォームのエンドポイントへ実際に送信します。保存とメール送信の確認に使えます。
            </p>
          </div>
        </div>
      </div>
      <form action={submitTest} className="grid gap-4 p-5">
        {testFields.map((field) => (
          <TestField key={field.field_name} field={field} />
        ))}
        <input name="company" type="text" className="hidden" tabIndex={-1} autoComplete="off" />
        <SubmitButton>テスト送信</SubmitButton>
      </form>
      {state.status !== "idle" ? (
        <div className="border-t border-line px-5 py-4">
          <div
            className={`flex items-start gap-3 rounded-md border px-3 py-3 text-sm ${
              state.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <WarningCircle className="mt-0.5 h-4 w-4 shrink-0" weight="bold" />
            <div>
              <p>{state.message}</p>
              {state.status === "success" && state.redirectedTo ? (
                <p className="mt-1 text-xs opacity-80">リダイレクト先: {state.redirectedTo}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TestField({ field }: { field: FormFieldConfig }) {
  const options = field.options ?? [];

  if (field.input_type === "textarea") {
    return (
      <label className="field">
        <span className="label">{field.label}</span>
        <textarea
          className="input min-h-24"
          name={field.field_name}
          defaultValue="This is a dashboard test submission."
          required={field.is_required}
          minLength={field.min_length ?? undefined}
          maxLength={field.max_length ?? undefined}
        />
      </label>
    );
  }

  if (field.input_type === "select") {
    return (
      <label className="field">
        <span className="label">{field.label}</span>
        <select className="input" name={field.field_name} required={field.is_required} defaultValue={options[0] ?? ""}>
          {!field.is_required ? <option value="">未選択</option> : null}
          {options.map((option) => (
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
      <fieldset className="field">
        <legend className="label">{field.label}</legend>
        <div className="grid gap-2 rounded-md border border-line bg-white px-3 py-2.5">
          {options.map((option, index) => (
            <label key={option} className="flex items-center gap-3 text-sm text-zinc-800">
              <input
                className="h-4 w-4 rounded border-line text-accent"
                name={field.field_name}
                type={field.input_type}
                value={option}
                defaultChecked={index === 0 && Boolean(field.is_required)}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <label className="field">
      <span className="label">{field.label}</span>
      <input
        className="input"
        name={field.field_name}
        type={field.input_type === "file" ? "file" : field.input_type ?? (field.field_name === "email" ? "email" : "text")}
        defaultValue={field.input_type === "file" ? undefined : getDefaultValue(field.field_name)}
        required={field.is_required}
        minLength={field.min_length ?? undefined}
        maxLength={field.max_length ?? undefined}
        pattern={field.pattern ?? undefined}
      />
    </label>
  );
}

function getDefaultValue(fieldName: string) {
  if (fieldName === "name") return "Test Sender";
  if (fieldName === "email") return "test@example.com";
  return "";
}
