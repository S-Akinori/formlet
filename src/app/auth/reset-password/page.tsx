import Link from "next/link";
import { resetPasswordAction } from "@/app/actions";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-[100dvh] place-items-center px-4 py-10">
      <div className="panel w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold tracking-tight">パスワード再設定</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">再設定用リンクをメールで送信します。</p>
        <div className="mt-6 grid gap-5">
          <Notice searchParams={params} />
          <form action={resetPasswordAction} className="grid gap-4">
            <label className="field">
              <span className="label">メールアドレス</span>
              <input className="input" name="email" type="email" autoComplete="email" required />
            </label>
            <SubmitButton>送信する</SubmitButton>
          </form>
          <Link className="text-sm text-accent hover:underline" href="/auth/login">
            ログインに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
