import Link from "next/link";
import { ArrowLeft, CheckCircle, EnvelopeSimple, PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";

export default function ThanksPage() {
  return (
    <main className="min-h-[100dvh] bg-paper">
      <section className="mx-auto grid min-h-[100dvh] max-w-4xl place-items-center px-4 py-16 sm:px-6">
        <div className="w-full rounded-lg border border-line bg-white p-6 text-center shadow-soft sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-emerald-50">
            <CheckCircle className="h-7 w-7 text-accent" weight="bold" />
          </div>
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.22em] text-accent">Submitted</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-4xl">
            送信が完了しました。
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-600">
            お問い合わせありがとうございます。入力内容を受け付けました。必要に応じて担当者よりご連絡します。
          </p>
        </div>
      </section>
    </main>
  );
}
