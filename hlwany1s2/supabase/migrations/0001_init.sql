-- ==========================================================
-- 7lwany Store — storefront schema (منفصل عن جداول الأدمن القديمة)
-- الجداول دي جديدة بالكامل، مفيش أي تعديل على itunes_stock / operations
-- / admins الموجودين أصلاً — بنقرا من itunes_stock بس وقت التسليم.
-- ==========================================================

create extension if not exists "pgcrypto";

-- فئات بطاقات آيتونز (150 ج.م، 300 ج.م، ...). السعر مخزّن صراحة،
-- مش محسوب لحظيًا، عشان يفضل السعر اللي دفعه العميل ثابت تاريخيًا.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_face_value numeric not null,      -- القيمة الاسمية للكارت (150، 300...)
  price numeric not null,                     -- السعر الفعلي للعميل بالجنيه
  currency text not null default 'EGP',
  active boolean not null default true,
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  telegram text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,          -- HLW-YYYYMMDD-XXXX
  access_token text not null default encode(gen_random_bytes(24), 'hex'), -- لتصفح الطلب من غير تخمين رقمه
  customer_id uuid references public.customers(id),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  subtotal numeric not null,
  discount numeric not null default 0,
  total numeric not null,
  currency text not null default 'EGP',
  payment_provider text,
  payment_transaction_id text,
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','refunded','cancelled')),
  order_status text not null default 'pending'
    check (order_status in ('pending','paid','completed','cancelled')),
  itunes_code text,                            -- الكود اللي اتسحب من itunes_stock بعد الدفع
  customer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_order_number on public.orders(order_number);
create index if not exists idx_orders_payment_status on public.orders(payment_status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name_snapshot text not null,
  unit_price numeric not null,
  quantity int not null default 1,
  total numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_reference text,                     -- transaction id عند بايموب
  amount numeric not null,
  currency text not null default 'EGP',
  status text not null default 'pending'
    check (status in ('pending','paid','failed','refunded')),
  raw_response jsonb,
  created_at timestamptz not null default now()
);

-- منع معالجة نفس عملية بايموب مرتين (idempotency للـ webhook)
create unique index if not exists idx_payments_provider_ref
  on public.payments(provider, provider_reference)
  where provider_reference is not null;

create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value) values
  ('whatsapp_number', ''),
  ('telegram_username', ''),
  ('store_status', 'open')
on conflict (key) do nothing;

-- ==========================================================
-- RLS: العميل يقرأ المنتجات النشطة بس، مفيش كتابة من المتصفح خالص.
-- كل الكتابة (إنشاء أوردر، تحديث حالة الدفع) بتتم من السيرفر
-- باستخدام service role key، اللي بيتخطى RLS أصلاً.
-- ==========================================================

alter table public.products enable row level security;
create policy "public read active products"
  on public.products for select
  using (active = true);

alter table public.orders enable row level security;
-- مفيش policy قراءة عامة على orders — القراءة بتتم عن طريق
-- API route سيرفر-سايد بيتحقق من access_token الأول.

alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.customers enable row level security;
-- الجداول دي كلها مقفولة تمامًا من المتصفح، السيرفر بس اللي بيوصلها.
