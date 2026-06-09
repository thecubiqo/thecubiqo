-- Phase A commerce foundation.
-- Included now: Tier 1 direct partners, Tier 2 Skimlinks fallback, tracking,
-- saved recommendations, quality gate fields.
-- Later by design: Tier 4 networks, browser-extension attribution, Amazon PA API.

create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null unique,
  display_name text not null,
  affiliate_url text not null,
  trigger_keywords text[] not null,
  trigger_domains text[],
  commission_type text check (commission_type in ('cpa','revenue_share','flat')),
  commission_rate numeric,
  commission_currency text default 'GBP',
  tier int default 1 check (tier in (1,2,3)),
  logo_url text,
  tagline text,
  recommendation_blurb text,
  promo_code text,
  postback_supported boolean default false,
  active boolean default true,
  priority int default 0,
  created_at timestamptz default now()
);

create index if not exists affiliate_links_active_idx
  on public.affiliate_links(tier, active, priority desc);

alter table public.affiliate_links enable row level security;

drop policy if exists "Public read affiliate links" on public.affiliate_links;
create policy "Public read affiliate links"
  on public.affiliate_links
  for select
  using (active = true);

create table if not exists public.recommendation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  signal_id uuid,
  recommendation_type text check (recommendation_type in ('tool','product','service','course','book')),
  recommended_entity text not null,
  recommendation_context text,
  affiliate_tier int check (affiliate_tier in (1,2,3)),
  affiliate_link_id uuid references public.affiliate_links(id),
  tracked_url text,
  merchant_url text,
  quality_score numeric,
  intent_strength numeric,
  reason_for_recommendation text,
  rejected_reason text,
  user_has_this boolean default false,
  created_at timestamptz default now()
);

create index if not exists recommendation_events_user_idx
  on public.recommendation_events(user_id, created_at desc);

alter table public.recommendation_events enable row level security;

drop policy if exists "Users read own recommendations" on public.recommendation_events;
create policy "Users read own recommendations"
  on public.recommendation_events
  for select
  using (auth.uid() = user_id);

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  recommendation_event_id uuid references public.recommendation_events(id) on delete cascade,
  affiliate_link_id uuid references public.affiliate_links(id),
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  cookie_id text,
  clicked_at timestamptz default now(),
  converted boolean default false,
  conversion_value numeric,
  conversion_currency text default 'GBP',
  conversion_at timestamptz,
  conversion_source text check (conversion_source in ('user_reported','network_postback','estimated')),
  external_order_id text,
  metadata jsonb default '{}'
);

create index if not exists affiliate_clicks_rec_idx
  on public.affiliate_clicks(recommendation_event_id, clicked_at desc);

alter table public.affiliate_clicks enable row level security;

create table if not exists public.saved_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recommendation_event_id uuid references public.recommendation_events(id),
  entity_name text,
  tracked_url text,
  saved_at timestamptz default now(),
  actioned boolean default false
);

create index if not exists saved_recommendations_user_idx
  on public.saved_recommendations(user_id, saved_at desc);

alter table public.saved_recommendations enable row level security;

drop policy if exists "Users manage own saved recs" on public.saved_recommendations;
create policy "Users manage own saved recs"
  on public.saved_recommendations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into public.affiliate_links
  (platform, display_name, affiliate_url, trigger_keywords, trigger_domains,
   commission_type, commission_rate, tier, logo_url, tagline, recommendation_blurb, promo_code, priority)
values
  ('shopify','Shopify','https://www.shopify.com/','{shopify,store,ecommerce,sell online,online store}','{ecommerce,startup,marketing}','cpa',150,1,null,'Fastest path to launch an online store','Use when the user is ready to sell online soon.',null,100),
  ('printify','Printify','https://printify.com/','{printify,print on demand,pod,tshirt,t-shirt,merch}','{ecommerce,startup}','cpa',0,1,null,'Print-on-demand fulfilment for product launches','Useful for POD testing without holding inventory.',null,95),
  ('fiverr','Fiverr','https://www.fiverr.com/','{fiverr,freelancer,logo designer,designer,hire}','{startup,marketing,ecommerce}','cpa',150,1,null,'Quick access to freelancers for specific tasks','Useful when a skilled helper is faster than DIY.',null,90),
  ('hubspot','HubSpot','https://www.hubspot.com/','{hubspot,crm,sales pipeline,marketing automation}','{sales,marketing,business}','revenue_share',30,1,null,'CRM and marketing automation','Useful when leads and follow-up need structure.',null,85),
  ('canva','Canva','https://www.canva.com/','{canva,design,brand kit,social graphics,presentation}','{marketing,startup,learning}','revenue_share',0,1,null,'Fast design assets without a design team','Useful for quick brand and content production.',null,80),
  ('notion','Notion','https://www.notion.so/','{notion,wiki,workspace,organize,project tracker}','{productivity,startup,learning}','revenue_share',0,1,null,'Workspace for notes, projects, and operating systems','Useful when the user needs a lightweight command center.',null,75),
  ('coursera','Coursera','https://www.coursera.org/','{coursera,course,certificate,learn,training}','{learning,career}','revenue_share',0,1,null,'Structured courses and certificates','Useful when the user needs guided learning.',null,70),
  ('udemy','Udemy','https://www.udemy.com/','{udemy,course,learn,tutorial,training}','{learning,career}','revenue_share',0,1,null,'Affordable tactical courses','Useful for quick practical skill acquisition.',null,68),
  ('squarespace','Squarespace','https://www.squarespace.com/','{squarespace,website,portfolio,site builder}','{startup,marketing,portfolio}','cpa',0,1,null,'Simple website builder','Useful when the user needs a polished site quickly.',null,66),
  ('calendly','Calendly','https://calendly.com/','{calendly,scheduling,book calls,appointments}','{sales,productivity,business}','revenue_share',0,1,null,'Scheduling without back-and-forth','Useful when calls or bookings are slowing the user down.',null,64),
  ('mailchimp','Mailchimp','https://mailchimp.com/','{mailchimp,email marketing,newsletter,email list}','{marketing,ecommerce}','revenue_share',0,1,null,'Email marketing and newsletters','Useful when an audience needs nurturing.',null,62),
  ('linkedin-learning','LinkedIn Learning','https://www.linkedin.com/learning/','{linkedin learning,course,skill,professional learning}','{learning,career}','revenue_share',0,1,null,'Professional skill courses','Useful for career-focused learning.',null,60),
  ('typeform','Typeform','https://www.typeform.com/','{typeform,form,survey,quiz,lead form}','{marketing,startup,research}','revenue_share',0,1,null,'Better forms and surveys','Useful for collecting leads or customer feedback.',null,58),
  ('zapier','Zapier','https://zapier.com/','{zapier,automation,workflow,integration,zaps}','{productivity,business,startup}','revenue_share',0,1,null,'No-code workflow automation','Useful when repeated tasks need connecting.',null,56),
  ('webflow','Webflow','https://webflow.com/','{webflow,website,landing page,cms,no code site}','{startup,marketing,portfolio}','revenue_share',0,1,null,'Design-led website builder','Useful when a site needs more control than templates.',null,54)
on conflict (platform) do update set
  display_name = excluded.display_name,
  trigger_keywords = excluded.trigger_keywords,
  trigger_domains = excluded.trigger_domains,
  tagline = excluded.tagline,
  recommendation_blurb = excluded.recommendation_blurb,
  priority = excluded.priority,
  active = true;
