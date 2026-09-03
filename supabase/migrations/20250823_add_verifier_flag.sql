-- Add a simple verifier flag to enforce single-device login
-- On login: if verifier=false -> set true and allow; if true -> deny
-- On signout: set verifier=false

-- 1) Column on users table
alter table public.users
  add column if not exists verifier boolean not null default false;

create index if not exists users_verifier_idx on public.users (verifier);

-- 2) Atomic RPCs to claim/release the flag
-- These run with table owner's privileges and should be called from a trusted server (service role)

create or replace function public.claim_verifier(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_count int := 0;
begin
  update public.users
     set verifier = true, updated_at = timezone('utc', now())
   where id = p_user_id
     and verifier = false
  returning 1 into v_count;

  if v_count = 1 then
    return jsonb_build_object('ok', true);
  else
    return jsonb_build_object('ok', false, 'message', 'Account is active on another device');
  end if;
end;
$$;

create or replace function public.release_verifier(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_count int := 0;
begin
  update public.users
     set verifier = false, updated_at = timezone('utc', now())
   where id = p_user_id
  returning 1 into v_count;

  return jsonb_build_object('ok', true, 'updated', coalesce(v_count, 0));
end;
$$;

-- 3) RLS considerations: ensure only server can flip the flag via RPCs
alter table public.users enable row level security;
-- Optional: block direct writes except via RPCs (security definer bypasses policies)
-- Adjust to your existing policies if any
drop policy if exists users_write_none on public.users;
create policy users_write_none on public.users
  for all using (false) with check (false);
