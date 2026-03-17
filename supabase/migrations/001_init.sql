-- profiles: 1-to-1 with auth.users, stores Stripe subscription state
create table profiles (
  id uuid references auth.users primary key,
  stripe_customer_id text,
  subscription_status text not null default 'free',  -- 'free' | 'pro'
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "own profile" on profiles
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- auto-create profile row when a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- projects: cloud storage for authenticated users
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null default 'Untitled',
  grid_w integer not null default 16,
  grid_h integer not null default 16,
  pixels jsonb not null default '[]',
  thumbnail text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table projects enable row level security;
create policy "own projects" on projects
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
