import Link from "next/link";
import { ArrowRight, Database, EnvelopeSimple, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

const features = [
  { title: "Receive", body: "name / email / message / custom fields", icon: Database },
  { title: "Notify", body: "SMTP notification to administrator", icon: EnvelopeSimple },
  { title: "Protect", body: "honeypot / rate limit / origin check", icon: ShieldCheck },
];

export default function HomePage() {
  return (
    <main className="min-h-[100dvh]">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.24em] text-accent">Headless form backend</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-zinc-950 md:text-6xl">
            静的サイトのフォームを、保存・通知・返信まで受け止める。
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-600">
            Formletは、HTMLフォームの送信先URLを差し替えるだけで問い合わせを受信する個人運用向けのヘッドレスフォームサービスです。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="button" href="/auth/register">
              はじめる
              <ArrowRight className="h-4 w-4" weight="bold" />
            </Link>
            <Link className="button-secondary" href="/auth/login">
              ログイン
            </Link>
          </div>
        </div>
        <div className="panel overflow-hidden">
          <div className="border-b border-line px-6 py-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">POST /api/f/:key</p>
          </div>
          <div className="grid gap-0 divide-y divide-line">
            {features.map(({ title, body, icon: Icon }) => (
              <div key={title} className="grid grid-cols-[44px_1fr] gap-4 px-6 py-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-paper">
                  <Icon className="h-5 w-5 text-accent" weight="bold" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-zinc-950">{title}</span>
                  <span className="mt-1 block text-sm text-zinc-600">{body}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
