# ヘッドレス問い合わせフォームサービス 要件定義

## 概要

formタグの送信先URLを指定するだけで、

- 問い合わせの受信
- データ保存
- 管理者通知メール
- 自動返信メール

が行えるヘッドレス型フォームサービスを構築する。

初期は **個人利用** を前提とし、将来的に **SaaS化** を想定した設計とする。

---

## 技術スタック

### フロントエンド

- Next.js（App Router）
- TypeScript
- TailwindCSS

### バックエンド

- Next.js API Routes

### データベース / 認証

- Supabase（PostgreSQL + Auth）

### メール送信

- Xserver SMTP（将来は外部サービスへ移行可能設計）

---

## システム構成

```
[ 静的サイト ]
      ↓ form POST
[ Next.js API ]
      ↓
[ Supabase DB ]
      ↓
[ SMTP送信（Xserver） ]
```

---

## 機能要件

### 1. アカウント機能

- ユーザー登録
- ログイン / ログアウト
- パスワードリセット
- メール認証（Supabase）

### 2. フォーム管理

#### フォーム作成

- フォーム名
- endpoint_key（自動生成）
- 管理者通知メールアドレス
- リダイレクトURL
- 有効 / 無効

#### フォーム送信URL

```
POST /api/f/{endpoint_key}
```

HTML例：

```html
<form action="https://example.com/api/f/xxxx" method="POST">
```

---

### 3. 問い合わせ受信

#### 取得データ

- name
- email
- message
- 任意のカスタム項目（name属性ベース）
- 送信日時
- IPアドレス
- User-Agent

#### 保存形式

- JSON形式で保存（柔軟対応）

### 4. メール送信

#### 管理者通知メール

- 問い合わせ内容
- 送信者情報
- 送信日時

#### 自動返信メール

- ユーザーへ送信
- テンプレート編集可能

### 5. メールテンプレート

#### 種類

- 管理者通知用
- ユーザー返信用

#### 差し込み変数

```
{name}
{email}
{message}
{created_at}
{form_name}
```

---

### 6. SMTP設定（Xserver対応）

#### 設定項目

- SMTPホスト
- ポート（465 / 587）
- ユーザー名
- パスワード
- 送信元メールアドレス
- 送信者名
- SSL/TLS設定

### 7. スパム対策

最低限：

- ハニーポット
- rate limit
- origin / referer 制限

### 8. 管理画面

#### 必要画面

- ダッシュボード
- フォーム一覧
- フォーム作成
- 問い合わせ一覧
- 問い合わせ詳細
- メールテンプレ編集
- SMTP設定

## データベース設計

### users（Supabase Auth）

- Supabase標準

---

### forms

```sql
id uuid
user_id uuid
name text
endpoint_key text unique
admin_email text
redirect_url text
is_active boolean
created_at timestamp
```

---

### submissions

```sql
id uuid
form_id uuid
data jsonb
sender_email text
sender_name text
ip_address text
user_agent text
status text default 'unread'
created_at timestamp
```

---

### email_settings

```sql
id uuid
user_id uuid
smtp_host text
smtp_port int
smtp_user text
smtp_password text
from_email text
from_name text
secure boolean
created_at timestamp
```

---

### email_templates

```sql
id uuid
form_id uuid
type text
subject text
body text
```

---

## API設計

### フォーム送信

```
POST /api/f/{endpoint_key}
```

#### 処理フロー

1. フォーム取得
2. formData取得
3. スパムチェック
4. DB保存
5. メール送信
6. リダイレクト

---

## 実装例

### Nodemailer

```ts
import nodemailer from "nodemailer";

export async function sendMail(setting, to, subject, body) {
  const transporter = nodemailer.createTransport({
    host: setting.smtp_host,
    port: setting.smtp_port,
    secure: setting.secure,
    auth: {
      user: setting.smtp_user,
      pass: setting.smtp_password,
    },
  });

  await transporter.sendMail({
    from: `"${setting.from_name}" <${setting.from_email}>`,
    to,
    subject,
    html: body,
  });
}
```

---

### API Route

```ts
export async function POST(req, { params }) {
  const form = await getForm(params.key);

  if (!form || !form.is_active) {
    return new Response("Invalid form", { status: 404 });
  }

  const body = await req.formData();
  const data = Object.fromEntries(body);

  await saveSubmission(form.id, data);

  await sendAdminMail(form, data);
  await sendUserMail(form, data);

  return Response.redirect(form.redirect_url);
}
```

---

## MVPスコープ

### 実装対象

- アカウント管理
- フォーム作成
- フォーム送信
- DB保存
- 管理者通知メール
- 自動返信メール
- SMTP設定
- 管理画面

---

### 非対応（後回し）

- 添付ファイル
- CAPTCHA
- Webhook
- チーム機能
- 決済機能
- 外部連携

---

## 将来SaaS化のための設計

### 1. メール送信の抽象化

```ts
sendMail(provider, config, payload)
```

対応予定：

- SMTP
- Resend
- SendGrid
- Amazon SES

---

### 2. endpoint_key

- UUIDで生成
- 推測不可

---

### 3. rate limit

- 将来 Redis導入前提

---

### 4. 非同期処理

- 現在：同期処理
- 将来：Queue化

---

## 注意点（重要）

### Xserver SMTPの制限

- 送信数制限あり
- スパム判定されやすい
- スケールしない

👉 SaaS化時は外部メールサービスへ移行必須

---

## 今後の開発ステップ

1. DBスキーマ作成
2. Supabase構築
3. Next.jsプロジェクト作成
4. APIルート実装
5. SMTP送信実装
6. 管理画面作成
7. テンプレート機能実装
