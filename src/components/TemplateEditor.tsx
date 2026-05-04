"use client";

import { useRef, useState } from "react";
import { BracketsCurly, ClipboardText, PlusCircle } from "@phosphor-icons/react";
import { saveTemplatesAction } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

type TemplateValue = {
  id?: string;
  subject: string;
  body: string;
};

type TemplateVariable = {
  key: string;
  label: string;
  group: "system" | "field";
};

type TemplateEditorProps = {
  formId: string;
  admin: TemplateValue;
  reply: TemplateValue;
  variables: TemplateVariable[];
};

type EditableElement = HTMLInputElement | HTMLTextAreaElement;

export function TemplateEditor({ formId, admin, reply, variables }: TemplateEditorProps) {
  const refs = useRef<Record<string, EditableElement | null>>({});
  const [activeField, setActiveField] = useState("admin_body");

  function register(name: string) {
    return (element: EditableElement | null) => {
      refs.current[name] = element;
    };
  }

  function insertVariable(key: string) {
    const token = `{${key}}`;
    const target = refs.current[activeField] ?? refs.current.admin_body;

    if (!target) return;

    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    target.value = `${target.value.slice(0, start)}${token}${target.value.slice(end)}`;
    target.focus();
    target.setSelectionRange(start + token.length, start + token.length);
  }

  return (
    <form action={saveTemplatesAction} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <input name="form_id" type="hidden" value={formId} />
      <div className="grid gap-6">
        <TemplateBlock
          title="管理者通知"
          prefix="admin"
          id={admin.id}
          subject={admin.subject}
          body={admin.body}
          register={register}
          onFocus={setActiveField}
        />
        <TemplateBlock
          title="自動返信"
          prefix="reply"
          id={reply.id}
          subject={reply.subject}
          body={reply.body}
          register={register}
          onFocus={setActiveField}
        />
        <SubmitButton>保存する</SubmitButton>
      </div>

      <aside className="panel overflow-hidden lg:sticky lg:top-6">
        <div className="border-b border-line bg-paper/70 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-white">
              <BracketsCurly className="h-5 w-5 text-accent" weight="bold" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">利用可能な変数</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-500">クリックすると編集中の件名・本文に挿入します。</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-4">
          <VariableGroup title="基本情報" variables={variables.filter((item) => item.group === "system")} onInsert={insertVariable} />
          <VariableGroup title="フォーム項目" variables={variables.filter((item) => item.group === "field")} onInsert={insertVariable} />
        </div>
      </aside>
    </form>
  );
}

function TemplateBlock({
  title,
  prefix,
  id,
  subject,
  body,
  register,
  onFocus,
}: {
  title: string;
  prefix: "admin" | "reply";
  id?: string;
  subject: string;
  body: string;
  register: (name: string) => (element: EditableElement | null) => void;
  onFocus: (name: string) => void;
}) {
  return (
    <section className="panel grid gap-5 p-6">
      <input name={`${prefix}_id`} type="hidden" value={id ?? ""} />
      <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
      <label className="field">
        <span className="label">件名</span>
        <input
          ref={register(`${prefix}_subject`)}
          className="input"
          name={`${prefix}_subject`}
          defaultValue={subject}
          required
          onFocus={() => onFocus(`${prefix}_subject`)}
        />
      </label>
      <label className="field">
        <span className="label">本文HTML</span>
        <textarea
          ref={register(`${prefix}_body`)}
          className="input min-h-56 font-mono text-xs leading-6"
          name={`${prefix}_body`}
          defaultValue={body}
          required
          onFocus={() => onFocus(`${prefix}_body`)}
        />
      </label>
    </section>
  );
}

function VariableGroup({
  title,
  variables,
  onInsert,
}: {
  title: string;
  variables: TemplateVariable[];
  onInsert: (key: string) => void;
}) {
  return (
    <section className="grid gap-2">
      <h3 className="px-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{title}</h3>
      {variables.length ? (
        <div className="grid gap-2">
          {variables.map((variable) => (
            <button
              key={`${variable.group}-${variable.key}`}
              className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-line bg-white px-3 py-2 text-left transition hover:border-zinc-300 hover:bg-zinc-50 active:translate-y-[1px]"
              type="button"
              onClick={() => onInsert(variable.key)}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-zinc-900">{variable.label}</span>
                <code className="mt-1 block truncate font-mono text-xs text-zinc-500">{`{${variable.key}}`}</code>
              </span>
              <PlusCircle className="h-4 w-4 text-accent" weight="bold" />
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-line bg-paper px-3 py-3 text-sm text-zinc-500">フォーム項目がまだありません。</p>
      )}
      <div className="mt-1 flex items-start gap-2 rounded-md bg-paper px-3 py-2 text-xs leading-5 text-zinc-500">
        <ClipboardText className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" weight="bold" />
        <span>変数はHTMLとして安全にエスケープして差し込まれます。</span>
      </div>
    </section>
  );
}
