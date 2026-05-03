"use client";

import { useMemo, useState } from "react";
import { ListBullets, Plus, Trash } from "@phosphor-icons/react";
import { saveFormFieldsAction } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export type FormFieldConfig = {
  field_name: string;
  label: string;
  input_type?: "text" | "email" | "url" | "tel" | "number";
  is_required?: boolean;
  min_length?: number | null;
  max_length?: number | null;
  pattern?: string | null;
};

type FormFieldsEditorProps = {
  formId: string;
  fields: FormFieldConfig[];
};

const defaultFields: FormFieldConfig[] = [
  { field_name: "name", label: "お名前", input_type: "text", is_required: true },
  { field_name: "email", label: "メールアドレス", input_type: "email", is_required: true },
  { field_name: "message", label: "お問い合わせ内容", input_type: "text", is_required: true },
];

export function FormFieldsEditor({ formId, fields }: FormFieldsEditorProps) {
  const [rows, setRows] = useState<FormFieldConfig[]>(fields.length ? fields : defaultFields);
  const hasDuplicate = useMemo(() => {
    const names = rows.map((row) => row.field_name.trim()).filter(Boolean);
    return new Set(names).size !== names.length;
  }, [rows]);

  function updateRow(index: number, key: keyof FormFieldConfig, value: FormFieldConfig[keyof FormFieldConfig]) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  }

  function addRow() {
    setRows((current) => [...current, { field_name: "", label: "", input_type: "text", is_required: false }]);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  return (
    <form action={saveFormFieldsAction} className="panel overflow-hidden">
      <div className="border-b border-line bg-paper/70 px-6 py-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-white">
            <ListBullets className="h-5 w-5 text-accent" weight="bold" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">フォーム項目名</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              HTMLのname属性と管理画面で表示する日本語名を設定します。
            </p>
          </div>
        </div>
      </div>
      <input name="form_id" type="hidden" value={formId} />
      <div className="grid gap-4 p-6">
        <div className="hidden grid-cols-[1fr_1fr_120px_86px_88px_88px_1fr_40px] gap-3 px-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 xl:grid">
          <span>name属性</span>
          <span>表示名</span>
          <span>型</span>
          <span>必須</span>
          <span>最小</span>
          <span>最大</span>
          <span>正規表現</span>
          <span />
        </div>
        {rows.map((row, index) => (
          <div key={index} className="grid gap-3 rounded-md border border-line bg-white p-3 xl:grid-cols-[1fr_1fr_120px_86px_88px_88px_1fr_40px] xl:items-start">
            <label className="field">
              <span className="label xl:hidden">name属性</span>
              <input
                className="input font-mono"
                name="field_name"
                pattern="[A-Za-z][A-Za-z0-9_.:-]*"
                required
                value={row.field_name}
                onChange={(event) => updateRow(index, "field_name", event.target.value)}
                placeholder="company"
              />
            </label>
            <label className="field">
              <span className="label xl:hidden">表示名</span>
              <input
                className="input"
                name="field_label"
                required
                value={row.label}
                onChange={(event) => updateRow(index, "label", event.target.value)}
                placeholder="会社名"
              />
            </label>
            <label className="field">
              <span className="label xl:hidden">型</span>
              <select
                className="input"
                name="input_type"
                value={row.input_type ?? "text"}
                onChange={(event) => updateRow(index, "input_type", event.target.value)}
              >
                <option value="text">text</option>
                <option value="email">email</option>
                <option value="url">url</option>
                <option value="tel">tel</option>
                <option value="number">number</option>
              </select>
            </label>
            <label className="flex items-center gap-3 pt-1 text-sm font-medium text-zinc-800 xl:pt-3">
              <input name="is_required" type="hidden" value={row.is_required ? "on" : "off"} />
              <input
                className="h-4 w-4 rounded border-line text-accent"
                type="checkbox"
                checked={Boolean(row.is_required)}
                onChange={(event) => updateRow(index, "is_required", event.target.checked)}
              />
              必須
            </label>
            <label className="field">
              <span className="label xl:hidden">最小文字数</span>
              <input
                className="input"
                name="min_length"
                type="number"
                min={0}
                value={row.min_length ?? ""}
                onChange={(event) => updateRow(index, "min_length", event.target.value ? Number(event.target.value) : null)}
              />
            </label>
            <label className="field">
              <span className="label xl:hidden">最大文字数</span>
              <input
                className="input"
                name="max_length"
                type="number"
                min={0}
                value={row.max_length ?? ""}
                onChange={(event) => updateRow(index, "max_length", event.target.value ? Number(event.target.value) : null)}
              />
            </label>
            <label className="field">
              <span className="label xl:hidden">正規表現</span>
              <input
                className="input font-mono"
                name="pattern"
                value={row.pattern ?? ""}
                onChange={(event) => updateRow(index, "pattern", event.target.value)}
                placeholder="^[A-Z0-9]+$"
              />
            </label>
            <button
              className="button-secondary h-10 px-0"
              type="button"
              onClick={() => removeRow(index)}
              disabled={rows.length <= 1}
              aria-label="項目を削除"
              title="項目を削除"
            >
              <Trash className="h-4 w-4" weight="bold" />
            </button>
          </div>
        ))}
        {hasDuplicate ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">name属性が重複しています。</p>
        ) : null}
        <div className="flex flex-col justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
          <button className="button-secondary" type="button" onClick={addRow}>
            <Plus className="h-4 w-4" weight="bold" />
            項目を追加
          </button>
          <SubmitButton>項目名を保存</SubmitButton>
        </div>
      </div>
    </form>
  );
}
