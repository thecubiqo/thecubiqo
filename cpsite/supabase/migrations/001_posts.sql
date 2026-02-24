create table if not exists posts (
  id            uuid        default gen_random_uuid() primary key,
  slug          text        unique not null,
  title         text        not null,
  content       text        not null default '',
  cover_image   text,
  music_url     text,
  category      text        not null default 'writing',
  excerpt       text,
  location      text,
  published     boolean     not null default false,
  featured      boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table posts enable row level security;

create policy "Anyone can read published posts"
  on posts for select
  using (published = true);

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_updated_at
  before update on posts
  for each row execute procedure update_updated_at();
