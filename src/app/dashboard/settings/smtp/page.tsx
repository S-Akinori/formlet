import { saveSmtpAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";

export default async function SmtpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const { supabase } = await requireUser();
  const { data: setting } = await supabase.from("email_settings").select("*").maybeSingle();

  return (
    <div className="grid max-w-3xl gap-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">ユーザー毎共通SMTP設定</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          このユーザーが作成したフォーム全体に適用されます。フォーム個別SMTPがある場合はそちらが優先され、未設定の場合はシステム共通SMTPを使います。
        </p>
      </div>
      <Notice searchParams={query} />
      <form action={saveSmtpAction} className="panel grid gap-5 p-6">
        <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
          <label className="field">
            <span className="label">SMTPホスト</span>
            <input className="input" name="smtp_host" required defaultValue={setting?.smtp_host ?? ""} placeholder="sv0000.xserver.jp" />
          </label>
          <label className="field">
            <span className="label">ポート</span>
            <input className="input" name="smtp_port" type="number" required defaultValue={setting?.smtp_port ?? 465} />
          </label>
        </div>
        <label className="field">
          <span className="label">SMTPユーザー名</span>
          <input className="input" name="smtp_user" required defaultValue={setting?.smtp_user ?? ""} />
        </label>
        <label className="field">
          <span className="label">SMTPパスワード</span>
          <input className="input" name="smtp_password" type="password" required={!setting} placeholder={setting ? "変更する場合のみ入力" : ""} />
          {setting ? <span className="helper">保存済みのパスワードは表示しません。空欄のまま保存すると現在のパスワードを維持します。</span> : null}
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="field">
            <span className="label">送信元メール</span>
            <input className="input" name="from_email" type="email" required defaultValue={setting?.from_email ?? ""} />
          </label>
          <label className="field">
            <span className="label">送信者名</span>
            <input className="input" name="from_name" required defaultValue={setting?.from_name ?? "Formlet"} />
          </label>
        </div>
        <label className="flex items-center gap-3 text-sm font-medium text-zinc-800">
          <input className="h-4 w-4 rounded border-line text-accent" name="secure" type="checkbox" defaultChecked={setting?.secure ?? true} />
          SSL/TLSを使う
        </label>
        <SubmitButton>保存する</SubmitButton>
      </form>
    </div>
  );
}
