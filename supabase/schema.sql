-- LUCIDA ROOM · Etapa 1
-- Cole tudo no Supabase → SQL Editor → New query → Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  credits int not null default 0,
  trial_left int not null default 3,
  termo_aceito_em timestamptz,
  termo_versao text,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  project_id uuid references public.projects on delete cascade,
  original_path text not null,
  width int, height int,
  analysis jsonb,
  answers jsonb,
  service text,
  status text default 'novo',          -- novo | gerando | pronto | aprovado | erro
  is_trial boolean default false,
  adjustments_used int default 0,
  approved_version int,
  final_path text,
  created_at timestamptz default now()
);

create table if not exists public.versions (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos on delete cascade,
  n int not null,
  path text not null,
  view_path text,
  prompt text,
  check_result jsonb,
  adjustment text,
  created_at timestamptz default now()
);

-- colunas acrescentadas depois da Etapa 1 (rodar em quem já tem o banco criado):
-- raw_path = saída da IA antes do prumo/recorte, usada para reenquadrar e gerar o 4K
-- geo      = prumo e recorte aplicados nesta versão
alter table public.versions add column if not exists raw_path text;
alter table public.versions add column if not exists geo jsonb;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.photos enable row level security;
alter table public.versions enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "own projects" on public.projects;
create policy "own projects" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own photos" on public.photos;
create policy "own photos" on public.photos for select using (auth.uid() = user_id);
drop policy if exists "own versions" on public.versions;
create policy "own versions" on public.versions for select using (exists (select 1 from public.photos p where p.id = photo_id and p.user_id = auth.uid()));

-- cria o perfil automaticamente no cadastro
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- armazenamento das fotos (privado)
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', false) on conflict do nothing;
