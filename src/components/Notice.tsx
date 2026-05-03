type NoticeProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export function Notice({ searchParams }: NoticeProps) {
  const error = typeof searchParams?.error === "string" ? searchParams.error : "";
  const saved = searchParams?.saved;
  const message = typeof searchParams?.message === "string" ? searchParams.message : "";
  const checkout = typeof searchParams?.checkout === "string" ? searchParams.checkout : "";

  if (saved || checkout === "success") {
    return <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">保存しました。</p>;
  }

  if (message === "check-email") {
    return <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">確認メールを送信しました。</p>;
  }

  if (message === "reset-sent") {
    return <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">パスワード再設定メールを送信しました。</p>;
  }

  if (!error) return null;

  const label =
    error === "invalid"
      ? "入力内容を確認してください。"
      : error === "auth"
        ? "認証に失敗しました。"
        : error === "form-limit"
          ? "現在のプランで作成できるフォーム数の上限に達しています。"
          : error === "no-customer"
            ? "Stripe顧客情報がまだ作成されていません。"
            : error === "billing-db"
              ? "課金用テーブルが見つからないか、DB更新に失敗しました。schema.sqlを実行してください。"
              : error === "billing-config"
                ? "Stripeの環境変数が不足しています。"
                : error === "stripe"
                  ? "Stripeとの通信または設定でエラーが発生しました。"
                  : "処理に失敗しました。";

  return <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{label}</p>;
}
