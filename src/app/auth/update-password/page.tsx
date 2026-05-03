import { updatePasswordAction } from "@/app/actions";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-[100dvh] place-items-center px-4 py-10">
      <div className="panel w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold tracking-tight">新しいパスワード</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">8文字以上の新しいパスワードを設定してください。</p>
        <div className="mt-6 grid gap-5">
          <Notice searchParams={params} />
          <form action={updatePasswordAction} className="grid gap-4">
            <label className="field">
              <span className="label">パスワード</span>
              <input className="input" name="password" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            <SubmitButton>更新する</SubmitButton>
          </form>
        </div>
      </div>
    </main>
  );
}
