-- Run once in the SQL editor of the Supabase project already used by the website.
-- The PHP/MySQL schema in ../install/schema.sql is not used on Vercel.
create extension if not exists pgcrypto;

create table if not exists public.nobles_submissions (
  id uuid primary key default gen_random_uuid(),
  reference_no text not null unique,
  form_type text not null check (form_type in ('enquiry','contact','complaint','membership')),
  name text not null,
  email text,
  whatsapp text,
  phone text,
  subject text,
  category text,
  product text,
  issue text,
  payload jsonb not null,
  attachment_path text,
  status text not null default 'new' check (status in ('new','in_progress','resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists nobles_submissions_created_at_idx on public.nobles_submissions (created_at desc);
create index if not exists nobles_submissions_form_type_idx on public.nobles_submissions (form_type);
alter table public.nobles_submissions enable row level security;
revoke all on public.nobles_submissions from anon, authenticated;
grant select, insert, update on public.nobles_submissions to service_role;

create table if not exists public.nobles_notifications (
  id bigint generated always as identity primary key,
  submission_id uuid not null references public.nobles_submissions(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('admin','customer')),
  channel text not null check (channel in ('whatsapp','sms')),
  recipient text not null,
  status text not null,
  created_at timestamptz not null default now()
);
alter table public.nobles_notifications enable row level security;
revoke all on public.nobles_notifications from anon, authenticated;
grant select, insert on public.nobles_notifications to service_role;

create table if not exists public.nobles_rate_limits (
  rate_key text primary key,
  attempts integer not null,
  window_started timestamptz not null
);
alter table public.nobles_rate_limits enable row level security;
revoke all on public.nobles_rate_limits from anon, authenticated;
grant select, insert, update on public.nobles_rate_limits to service_role;

create or replace function public.nobles_check_rate_limit(
  p_key text, p_limit integer, p_window_seconds integer
) returns boolean language plpgsql as $$
declare current_attempts integer;
begin
  insert into public.nobles_rate_limits(rate_key, attempts, window_started)
  values (p_key, 1, now())
  on conflict (rate_key) do update set
    attempts = case
      when nobles_rate_limits.window_started < now() - make_interval(secs => p_window_seconds) then 1
      else nobles_rate_limits.attempts + 1
    end,
    window_started = case
      when nobles_rate_limits.window_started < now() - make_interval(secs => p_window_seconds) then now()
      else nobles_rate_limits.window_started
    end
  returning attempts into current_attempts;
  return current_attempts <= p_limit;
end;
$$;
revoke all on function public.nobles_check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.nobles_check_rate_limit(text, integer, integer) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nobles-attachments', 'nobles-attachments', false, 4194304,
  array['image/jpeg','image/png','image/gif','application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
on conflict (id) do update set public = false, file_size_limit = 4194304,
  allowed_mime_types = excluded.allowed_mime_types;
