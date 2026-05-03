# Supabase Auth Email Templates

Supabase Dashboardの `Authentication > Email Templates` に貼り付けるHTMLテンプレートです。

## 件名

| Template | Subject |
|---|---|
| Confirm sign up | `Formlet: メールアドレスを確認してください` |
| Reset password | `Formlet: パスワード再設定のご案内` |
| Magic link | `Formlet: ログインリンクを送信しました` |
| Invite user | `Formlet: 招待が届いています` |
| Change email address | `Formlet: メールアドレス変更の確認` |
| Reauthentication | `Formlet: 本人確認コード` |

## ファイル対応

| Supabase template | File |
|---|---|
| Confirm sign up | `confirmation.html` |
| Reset password | `recovery.html` |
| Magic link | `magic_link.html` |
| Invite user | `invite.html` |
| Change email address | `email_change.html` |
| Reauthentication | `reauthentication.html` |

## 使用しているSupabase変数

- `{{ .ConfirmationURL }}`
- `{{ .Token }}`
- `{{ .NewEmail }}`

Hosted SupabaseではDashboard上で設定します。Self-hostedの場合は、HTMLテンプレートをHTTPで配信し、`GOTRUE_MAILER_TEMPLATES_*` と `GOTRUE_MAILER_SUBJECTS_*` を設定してください。
