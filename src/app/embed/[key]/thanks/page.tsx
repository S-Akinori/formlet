import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

export default async function EmbedThanksPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;

  return (
    <main className="min-h-[100dvh] bg-white text-zinc-950">
      <section className="mx-auto grid min-h-[100dvh] max-w-2xl place-items-center px-5 py-10">
        <div className="w-full rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-[0_18px_45px_-30px_rgba(24,24,27,0.45)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-emerald-50">
            <CheckCircle className="h-6 w-6 text-emerald-700" weight="bold" />
          </div>
          <p className="mt-5 font-mono text-xs uppercase tracking-[0.2em] text-emerald-700">Submitted</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal">送信が完了しました。</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
            お問い合わせありがとうございます。内容を受け付けました。
          </p>
          <Link className="mt-6 inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 active:translate-y-[1px]" href={`/embed/${key}`}>
            もう一度送信する
          </Link>
        </div>
      </section>
    </main>
  );
}
