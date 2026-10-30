-- Schema for the Hopeless Labs site: admin users + blog posts.
-- Applied with `npm run db:push` (see README, "Database (Supabase)").
--
-- Access model:
--   anon          → may read published posts only
--   authenticated → same, plus a user can read/rename their own profile
--   admin         → full read/write on posts and profiles
--   postgres / service_role → everything (used for bootstrap and scripts)

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user. `role` is what the admin panel gates on.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  display_name text,
  role         text not null default 'editor' check (role in ('admin', 'editor')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'Site staff. Mirrors auth.users; role decides who can publish.';
comment on column public.profiles.role is 'admin = full access to posts/profiles, editor = reserved.';

-- Every new auth user gets a profile row, so RLS can read it immediately.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin check, callable from policies. SECURITY DEFINER so a policy on
-- `profiles` does not recurse into itself.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- posts — mirrors the frontmatter used by content/blog/*.md, so the admin
-- panel can publish without a code change.
-- ---------------------------------------------------------------------------
create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        text not null check (length(trim(title)) > 0),
  summary      text not null default '',
  body         text not null default '',          -- Markdown, rendered by marked
  author       text not null default 'Hopeless Labs',
  tags         text[] not null default '{}',
  cover_image  text,                              -- public URL or Storage object path
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.posts is 'Blog posts authored from the admin panel.';

create index posts_published_idx on public.posts (published_at desc) where status = 'published';
create index posts_tags_idx on public.posts using gin (tags);

-- A published post without an explicit date goes live now.
create function public.stamp_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger posts_stamp_published_at
  before insert or update on public.posts
  for each row execute function public.stamp_published_at();

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Grants (migrations run as postgres, so they must grant explicitly).
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.posts to anon;
grant select, insert, update, delete on public.posts to authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.posts enable row level security;
alter table public.profiles enable row level security;

-- Posts: the public only ever sees published rows.
create policy "posts: anyone reads published"
  on public.posts for select
  to anon, authenticated
  using (status = 'published');

create policy "posts: admins read all"
  on public.posts for select
  to authenticated
  using (public.is_admin());

create policy "posts: admins insert"
  on public.posts for insert
  to authenticated
  with check (public.is_admin());

create policy "posts: admins update"
  on public.posts for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "posts: admins delete"
  on public.posts for delete
  to authenticated
  using (public.is_admin());

-- Profiles: self-service rename, admins see/manage everyone.
create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own display name"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles: admins read all"
  on public.profiles for select
  to authenticated
  using (public.is_admin());
