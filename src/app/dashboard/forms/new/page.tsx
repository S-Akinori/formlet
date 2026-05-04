import { createFormAction } from "@/app/actions";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";

export default async function NewFormPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <div className="grid max-w-3xl gap-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">New form</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">フォーム作成</h1>
      </div>
      <Notice searchParams={params} />
      <form action={createFormAction} className="panel grid gap-5 p-6">
        <label className="field">
          <span className="label">フォーム名</span>
          <input className="input" name="name" required placeholder="Corporate contact" />
        </label>
        <label className="field">
          <span className="label">管理者通知メール</span>
          <input className="input" name="admin_email" type="email" required placeholder="admin@example.com" />
        </label>
        <label className="field">
          <span className="label">リダイレクトURL</span>
          <input className="input" name="redirect_url" type="url" placeholder="https://example.com/thanks" />
          <span className="helper">未入力の場合はFormlet標準の送信完了ページへ遷移します。</span>
        </label>
        <label className="field">
          <span className="label">埋め込みフォームのデザイン</span>
          <select className="input" name="embed_theme" defaultValue="simple">
            <option value="simple">シンプル</option>
            <option value="shop">店舗向け</option>
            <option value="compact">LP向けコンパクト</option>
          </select>
          <span className="helper">iframeで埋め込むフォームの見た目を選択します。</span>
        </label>
        <label className="field">
          <span className="label">許可Origin / Referer</span>
          <textarea className="input min-h-28" name="allowed_origins" placeholder="https://example.com" />
          <span className="helper">1行に1つのoriginを入力します。空欄の場合は制限しません。</span>
        </label>
        <label className="flex items-center gap-3 text-sm font-medium text-zinc-800">
          <input className="h-4 w-4 rounded border-line text-accent" name="is_active" type="checkbox" defaultChecked />
          有効にする
        </label>
        <SubmitButton>作成する</SubmitButton>
      </form>
    </div>
  );
}
