"use client";

import { useState } from "react";
import { Code, EnvelopeSimple, GearSix, ListBullets } from "@phosphor-icons/react";

type TabKey = "settings" | "fields" | "mail" | "install";

type FormDetailTabsProps = {
  settings: React.ReactNode;
  fields: React.ReactNode;
  mail: React.ReactNode;
  install: React.ReactNode;
};

const tabs: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ className?: string; weight?: "bold" }> }> = [
  { key: "settings", label: "基本設定", icon: GearSix },
  { key: "fields", label: "項目・テスト", icon: ListBullets },
  { key: "mail", label: "メール", icon: EnvelopeSimple },
  { key: "install", label: "設置・問い合わせ", icon: Code },
];

export function FormDetailTabs({ settings, fields, mail, install }: FormDetailTabsProps) {
  const [active, setActive] = useState<TabKey>("settings");
  const content = { settings, fields, mail, install };

  return (
    <div className="grid gap-6">
      <div className="overflow-x-auto rounded-lg border border-line bg-white p-1 shadow-soft">
        <div className="grid min-w-max grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = active === tab.key;
            return (
              <button
                key={tab.key}
                className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition active:translate-y-[1px] ${
                  selected ? "bg-ink text-white" : "text-zinc-700 hover:bg-paper hover:text-zinc-950"
                }`}
                type="button"
                onClick={() => setActive(tab.key)}
                aria-pressed={selected}
              >
                <Icon className="h-4 w-4" weight="bold" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>{content[active]}</div>
    </div>
  );
}
