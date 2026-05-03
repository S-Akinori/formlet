import Link from "next/link";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import { signUpAction } from "@/app/actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-[100dvh] place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-sm font-semibold tracking-tight text-zinc-950">
          Formlet
        </Link>
        <div className="panel p-6">
          <h1 className="text-2xl font-semibold tracking-tight">アカウント作成</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Supabase Authでメール認証付きのアカウントを作成します。</p>
          <div className="mt-6 grid gap-5">
            <Notice searchParams={params} />
            <form action={signUpAction} className="grid gap-4">
              <label className="field">
                <span className="label">メールアドレス</span>
                <input className="input" name="email" type="email" autoComplete="email" required />
              </label>
              <label className="field">
                <span className="label">パスワード</span>
                <input className="input" name="password" type="password" autoComplete="new-password" minLength={8} required />
                <span className="helper">8文字以上で入力してください。</span>
              </label>
              <SubmitButton>作成する</SubmitButton>
            </form>
            <Link className="text-sm text-accent hover:underline" href="/auth/login">
              ログインに戻る
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
