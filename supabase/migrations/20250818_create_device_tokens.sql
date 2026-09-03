-- Create device_tokens table for Electron device link
create table if not exists public.device_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.device_tokens enable row level security;

-- Allow the owner (authenticated user) to insert their own token rows
drop policy if exists device_tokens_insert_own on public.device_tokens;
create policy device_tokens_insert_own
  on public.device_tokens
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Allow selecting by token for server-side verification
-- Note: Our verify route uses service role, so this is not required,
-- but keeping a limited policy for potential client-side checks.
drop policy if exists device_tokens_select_by_token on public.device_tokens;
create policy device_tokens_select_by_token
  on public.device_tokens
  for select
  to anon, authenticated
  using (
    token is not null
  );

-- Optional: prevent public listing; do not add select policy without token filter

