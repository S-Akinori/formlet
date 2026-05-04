import Link from "next/link";
import {
  ArrowRight,
  BellRinging,
  Check,
  Database,
  EnvelopeSimple,
  FileArrowUp,
  FlowArrow,
  ListChecks,
  LockKey,
  PaperPlaneTilt,
  PlugsConnected,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

const steps = [
  {
    title: "フォームを作成",
    body: "管理画面でフォーム名、通知先、項目、バリデーションを設定します。",
  },
  {
    title: "actionを差し替え",
    body: "静的HTMLやLPのform actionに、Formletの送信URLを設定します。",
  },
  {
    title: "問い合わせを受信",
    body: "送信内容を保存し、管理者通知と自動返信をSMTPから送信します。",
  },
];

const features = [
  {
    title: "フォーム項目を自由に設定",
    body: "一行テキスト、複数行、選択肢、ファイルアップロード、バリデーションに対応。",
    icon: ListChecks,
  },
  {
    title: "問い合わせを保存",
    body: "送信内容、送信日時、IP、User-Agentを管理画面で確認できます。",
    icon: Database,
  },
  {
    title: "通知と自動返信",
    body: "管理者通知と自動返信をテンプレート変数つきで編集できます。",
    icon: EnvelopeSimple,
  },
  {
    title: "スパム対策",
    body: "ハニーポット、rate limit、Origin / Referer制限を標準で備えています。",
    icon: ShieldCheck,
  },
  {
    title: "ファイル添付",
    body: "アップロードされたファイルはStorageへ保存し、問い合わせ詳細から確認できます。",
    icon: FileArrowUp,
  },
  {
    title: "SMTPパスワード暗号化",
    body: "ユーザーSMTP、フォーム個別SMTPのパスワードを暗号化して保存します。",
    icon: LockKey,
  },
];

const smtpLayers = [
  { title: "システム共通SMTP", body: "SMTP未設定ユーザー向けの共通送信元。" },
  { title: "ユーザー共通SMTP", body: "そのユーザーが作成したフォーム全体に適用。" },
  { title: "フォーム個別SMTP", body: "特定フォームだけ独自SMTPと送信元で送信。" },
];

const plans = [
  {
    name: "Free",
    price: "¥0",
    body: "小さく始める個人サイト向け。",
    cta: "無料ではじめる",
    href: "/auth/register",
    items: ["2フォーム", "ブランド表示なし", "保存期間90日", "月300件まで"],
  },
  {
    name: "Pro",
    price: "¥880/月",
    body: "複数サイトや継続運用向け。",
    cta: "Proではじめる",
    href: "/auth/register",
    items: ["30フォーム", "保存期間無制限", "月3000件まで", "CSVエクスポート"],
    featured: true,
  },
];

const faqs = [
  {
    question: "静的HTMLサイトでも使えますか？",
    answer: "使えます。formタグのactionにFormletの送信URLを設定するだけで送信できます。",
  },
  {
    question: "SMTP設定は必須ですか？",
    answer: "必須ではありません。未設定の場合はシステム共通SMTPから送信されます。",
  },
  {
    question: "自動返信メールは編集できますか？",
    answer: "管理者通知と自動返信の件名・本文をフォームごとに編集できます。",
  },
  {
    question: "ファイルアップロードできますか？",
    answer: "できます。ファイルはStorageへ保存し、問い合わせ詳細から確認できます。",
  },
];

const codeSample = `<form action="https://formlet.app/api/f/xxxx" method="POST">
  <input name="name" required>
  <input name="email" type="email" required>
  <textarea name="message" required></textarea>
  <button type="submit">送信</button>
</form>`;

export default function HomePage() {
  return (
    <main className="min-h-[100dvh] overflow-hidden">
      <header className="border-b border-line/80 bg-paper/80">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2 text-sm font-semibold text-zinc-950" href="/">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-white">
              <PaperPlaneTilt className="h-4 w-4" weight="bold" />
            </span>
            Formlet
          </Link>
          <div className="flex items-center gap-2">
            <Link className="button-secondary hidden sm:inline-flex" href="/auth/login">
              ログイン
            </Link>
            <Link className="button" href="/auth/register">
              無料ではじめる
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-accent">Headless form backend</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-zinc-950 md:text-6xl">
            Formletで、HTMLフォームに保存・通知・自動返信を追加する。
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-600">
            静的サイトやLPのform actionを差し替えるだけで、問い合わせの保存、メール通知、自動返信、スパム対策まで使えるフォームバックエンドです。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="button" href="/auth/register">
              無料ではじめる
              <ArrowRight className="h-4 w-4" weight="bold" />
            </Link>
            <a className="button-secondary" href="#pricing">
              料金を見る
            </a>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-zinc-600 sm:grid-cols-3">
            {["2フォーム無料", "SMTP未設定でも送信", "ブランド表示なし"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" weight="bold" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <HeroPreview />
      </section>

      <section className="border-y border-line bg-white/55">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Problem</p>
            <h2 className="mt-3 text-2xl font-semibold leading-snug tracking-normal text-zinc-950 md:text-3xl">
              フォームのためだけに、毎回バックエンドを作るのは重い。
            </h2>
          </div>
          <div className="grid gap-3 text-sm leading-6 text-zinc-600 sm:grid-cols-2">
            {["API実装とDB保存が必要", "SMTP通知と自動返信が面倒", "スパム対策まで考える必要がある", "静的サイトだけでは問い合わせを受けられない"].map((item) => (
              <div key={item} className="rounded-md border border-line bg-paper px-4 py-3">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionIntro eyebrow="Setup" title="3ステップで導入" body="コードを大きく変えず、今あるHTMLフォームの送信先だけをFormletに向けます。" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-paper font-mono text-sm font-semibold text-accent">
                {index + 1}
              </span>
              <h3 className="mt-5 text-base font-semibold text-zinc-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white/55">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionIntro eyebrow="Features" title="主要機能" body="フォーム作成からメール送信、保存、スパム対策まで、問い合わせ運用に必要な機能をまとめています。" />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ title, body, icon: Icon }) => (
              <div key={title} className="grid grid-cols-[44px_1fr] gap-4 rounded-lg border border-line bg-white p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-paper">
                  <Icon className="h-5 w-5 text-accent" weight="bold" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div>
          <SectionIntro
            eyebrow="SMTP"
            title="SMTPの柔軟性"
            body="専用メールサーバーを持っていないユーザーにも、独自SMTPを使いたいフォームにも対応できます。"
          />
          <p className="mt-5 text-sm leading-6 text-zinc-600">
            未設定の場合は上位のSMTP設定へフォールバックします。共通SMTPで始めて、必要なフォームだけ個別SMTPに切り替えられます。
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white shadow-soft">
          {smtpLayers.map((layer, index) => (
            <div key={layer.title} className="grid grid-cols-[44px_1fr] gap-4 border-b border-line px-5 py-5 last:border-b-0">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-paper">
                {index === 0 ? (
                  <PlugsConnected className="h-5 w-5 text-accent" weight="bold" />
                ) : index === 1 ? (
                  <FlowArrow className="h-5 w-5 text-accent" weight="bold" />
                ) : (
                  <BellRinging className="h-5 w-5 text-accent" weight="bold" />
                )}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-zinc-950">{layer.title}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{layer.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-y border-line bg-white/55">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionIntro eyebrow="Pricing" title="料金" body="無料ではじめて、フォーム数や保存期間が必要になったらProへ移行できます。" />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-lg border bg-white p-6 shadow-soft ${plan.featured ? "border-accent" : "border-line"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-950">{plan.name}</h3>
                    <p className="mt-2 text-sm text-zinc-600">{plan.body}</p>
                  </div>
                  {plan.featured ? (
                    <span className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white">おすすめ</span>
                  ) : null}
                </div>
                <p className="mt-6 text-3xl font-semibold tracking-normal text-zinc-950">
                  {plan.price}
                  {plan.name === "Pro" ? <span className="ml-1 text-sm font-medium text-zinc-500">税込</span> : null}
                </p>
                <ul className="mt-6 grid gap-3">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-zinc-700">
                      <Check className="h-4 w-4 text-accent" weight="bold" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link className={plan.featured ? "button mt-6 w-full" : "button-secondary mt-6 w-full"} href={plan.href}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionIntro eyebrow="FAQ" title="よくある質問" body="登録前に気になりやすい点をまとめました。" />
        <div className="mt-8 divide-y divide-line rounded-lg border border-line bg-white shadow-soft">
          {faqs.map((faq) => (
            <div key={faq.question} className="px-5 py-5">
              <h3 className="text-sm font-semibold text-zinc-950">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-ink px-6 py-10 text-white shadow-soft md:px-10">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/60">Start</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="text-3xl font-semibold leading-tight tracking-normal md:text-4xl">
                フォームのためだけにバックエンドを作るのをやめる。
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">
                まずは無料で2フォームまで。静的サイトやLPの問い合わせ受付を、今日から管理画面で運用できます。
              </p>
            </div>
            <Link className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-zinc-100 active:translate-y-[1px]" href="/auth/register">
              無料ではじめる
              <ArrowRight className="h-4 w-4" weight="bold" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroPreview() {
  return (
    <div className="rounded-lg border border-line bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">POST /api/f/:key</p>
          <p className="mt-1 text-sm font-semibold text-zinc-950">問い合わせフォーム</p>
        </div>
        <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Active</span>
      </div>
      <div className="grid gap-0 divide-y divide-line">
        <div className="p-5">
          <div className="overflow-hidden rounded-md bg-zinc-950">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-zinc-100">{codeSample}</pre>
          </div>
        </div>
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-950">最近の問い合わせ</h2>
            <span className="text-xs text-zinc-500">3件未読</span>
          </div>
          <div className="grid gap-2">
            {[
              ["資料請求", "info@kisaragi-studio.jp", "1分前"],
              ["見積もり相談", "hello@minato-cafe.jp", "12分前"],
              ["採用ページから", "contact@shiro-layout.jp", "28分前"],
            ].map(([title, email, time]) => (
              <div key={email} className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-line bg-paper px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-950">{title}</p>
                  <p className="mt-1 truncate text-xs text-zinc-500">{email}</p>
                </div>
                <span className="text-xs text-zinc-500">{time}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          {[
            ["保存", "JSON"],
            ["通知", "SMTP"],
            ["保護", "Origin"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md bg-paper px-3 py-3">
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="mt-1 text-sm font-semibold text-zinc-950">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold leading-snug tracking-normal text-zinc-950 md:text-3xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">{body}</p>
    </div>
  );
}
