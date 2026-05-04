create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public, file_size_limit)
values ('formlet-uploads', 'formlet-uploads', false, 10485760)
on conflict (id) do nothing;

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  endpoint_key text not null unique,
  admin_email text not null,
  redirect_url text,
  allowed_origins text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_mode text not null default 'test' check (stripe_mode in ('test', 'live')),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_subscriptions add column if not exists stripe_mode text;
update public.user_subscriptions set stripe_mode = 'test' where stripe_mode is null;
alter table public.user_subscriptions alter column stripe_mode set default 'test';
alter table public.user_subscriptions alter column stripe_mode set not null;

alter table public.user_subscriptions
drop constraint if exists user_subscriptions_stripe_mode_check;

alter table public.user_subscriptions
add constraint user_subscriptions_stripe_mode_check
check (stripe_mode in ('test', 'live'));

alter table public.user_subscriptions
drop constraint if exists user_subscriptions_user_id_key;

alter table public.user_subscriptions
drop constraint if exists user_subscriptions_stripe_customer_id_key;

alter table public.user_subscriptions
drop constraint if exists user_subscriptions_stripe_subscription_id_key;

drop index if exists public.user_subscriptions_user_mode_key;
drop index if exists public.user_subscriptions_customer_mode_key;
drop index if exists public.user_subscriptions_subscription_mode_key;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  sender_email text,
  sender_name text,
  ip_address text,
  user_agent text,
  status text not null default 'unread',
  created_at timestamptz not null default now()
);

create table if not exists public.email_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  smtp_host text not null,
  smtp_port int not null,
  smtp_user text not null,
  smtp_password text not null,
  from_email text not null,
  from_name text not null,
  secure boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_email_settings (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade unique,
  smtp_host text not null,
  smtp_port int not null,
  smtp_user text not null,
  smtp_password text not null,
  from_email text not null,
  from_name text not null,
  secure boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  field_name text not null,
  label text not null,
  input_type text not null default 'text' check (input_type in ('text', 'textarea', 'email', 'url', 'tel', 'number', 'file', 'select', 'checkbox', 'radio')),
  is_required boolean not null default false,
  min_length int,
  max_length int,
  pattern text,
  options jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (form_id, field_name)
);

alter table public.form_fields add column if not exists input_type text not null default 'text';
alter table public.form_fields add column if not exists is_required boolean not null default false;
alter table public.form_fields add column if not exists min_length int;
alter table public.form_fields add column if not exists max_length int;
alter table public.form_fields add column if not exists pattern text;
alter table public.form_fields add column if not exists options jsonb not null default '[]'::jsonb;

alter table public.form_fields
drop constraint if exists form_fields_input_type_check;

alter table public.form_fields
add constraint form_fields_input_type_check
check (input_type in ('text', 'textarea', 'email', 'url', 'tel', 'number', 'file', 'select', 'checkbox', 'radio'));

update public.form_fields
set input_type = 'textarea'
where field_name = 'message'
and input_type = 'text';

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  type text not null check (type in ('admin', 'reply')),
  subject text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (form_id, type)
);

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  endpoint_key text not null,
  ip_address text not null,
  window_start timestamptz not null default now(),
  request_count int not null default 1
);

create index if not exists forms_user_id_idx on public.forms(user_id);
create index if not exists forms_endpoint_key_idx on public.forms(endpoint_key);
create index if not exists user_subscriptions_user_id_idx on public.user_subscriptions(user_id);
create index if not exists user_subscriptions_stripe_customer_id_idx on public.user_subscriptions(stripe_customer_id);
create unique index if not exists user_subscriptions_user_mode_key
on public.user_subscriptions(user_id, stripe_mode);
create unique index if not exists user_subscriptions_customer_mode_key
on public.user_subscriptions(stripe_mode, stripe_customer_id)
where stripe_customer_id is not null;
create unique index if not exists user_subscriptions_subscription_mode_key
on public.user_subscriptions(stripe_mode, stripe_subscription_id)
where stripe_subscription_id is not null;
create index if not exists submissions_form_id_created_at_idx on public.submissions(form_id, created_at desc);
create index if not exists form_email_settings_form_id_idx on public.form_email_settings(form_id);
create index if not exists form_fields_form_id_sort_order_idx on public.form_fields(form_id, sort_order);
create index if not exists email_templates_form_id_idx on public.email_templates(form_id);
create index if not exists rate_limits_lookup_idx on public.rate_limits(endpoint_key, ip_address, window_start desc);

alter table public.forms enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.submissions enable row level security;
alter table public.email_settings enable row level security;
alter table public.form_email_settings enable row level security;
alter table public.form_fields enable row level security;
alter table public.email_templates enable row level security;
alter table public.rate_limits enable row level security;

drop policy if exists "Users manage own forms" on public.forms;
create policy "Users manage own forms"
on public.forms
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users view own subscription" on public.user_subscriptions;
create policy "Users view own subscription"
on public.user_subscriptions
for select
using (auth.uid() = user_id);

drop policy if exists "Users view submissions for own forms" on public.submissions;
create policy "Users view submissions for own forms"
on public.submissions
for select
using (
  exists (
    select 1 from public.forms
    where forms.id = submissions.form_id
    and forms.user_id = auth.uid()
  )
);

drop policy if exists "Users update submissions for own forms" on public.submissions;
create policy "Users update submissions for own forms"
on public.submissions
for update
using (
  exists (
    select 1 from public.forms
    where forms.id = submissions.form_id
    and forms.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.forms
    where forms.id = submissions.form_id
    and forms.user_id = auth.uid()
  )
);

drop policy if exists "Users manage own SMTP settings" on public.email_settings;
create policy "Users manage own SMTP settings"
on public.email_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage per-form SMTP settings" on public.form_email_settings;
create policy "Users manage per-form SMTP settings"
on public.form_email_settings
for all
using (
  exists (
    select 1 from public.forms
    where forms.id = form_email_settings.form_id
    and forms.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.forms
    where forms.id = form_email_settings.form_id
    and forms.user_id = auth.uid()
  )
);

drop policy if exists "Users manage fields for own forms" on public.form_fields;
create policy "Users manage fields for own forms"
on public.form_fields
for all
using (
  exists (
    select 1 from public.forms
    where forms.id = form_fields.form_id
    and forms.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.forms
    where forms.id = form_fields.form_id
    and forms.user_id = auth.uid()
  )
);

drop policy if exists "Users manage templates for own forms" on public.email_templates;
create policy "Users manage templates for own forms"
on public.email_templates
for all
using (
  exists (
    select 1 from public.forms
    where forms.id = email_templates.form_id
    and forms.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.forms
    where forms.id = email_templates.form_id
    and forms.user_id = auth.uid()
  )
);

-- Public form submissions use SUPABASE_SERVICE_ROLE_KEY from the API route.
-- No anon policy is added for submissions or rate_limits.
