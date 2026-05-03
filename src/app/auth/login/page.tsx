import Link from "next/link";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import { signInAction } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <AuthFrame title="ログイン" helper="登録済みのメールアドレスで管理画面に入ります。">
      <Notice searchParams={params} />
      <form action={signInAction} className="grid gap-4">
        <Field label="メールアドレス" name="email" type="email" autoComplete="email" />
        <Field label="パスワード" name="password" type="password" autoComplete="current-password" />
        <SubmitButton>ログイン</SubmitButton>
      </form>
      <div className="flex justify-between text-sm">
        <Link className="text-accent hover:underline" href="/auth/register">
          アカウント作成
        </Link>
        <Link className="text-zinc-600 hover:text-zinc-950" href="/auth/reset-password">
          パスワード再設定
        </Link>
      </div>
    </AuthFrame>
  );
}

function AuthFrame({ title, helper, children }: { title: string; helper: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-sm font-semibold tracking-tight text-zinc-950">
          Formlet
        </Link>
        <div className="panel p-6">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{helper}</p>
          <div className="mt-6 grid gap-5">{children}</div>
        </div>
      </div>
    </main>
  );
}

function Field(props: { label: string; name: string; type: string; autoComplete?: string }) {
  return (
    <label className="field">
      <span className="label">{props.label}</span>
      <input className="input" required {...props} />
    </label>
  );
}
