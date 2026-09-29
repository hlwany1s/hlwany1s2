-- دعم عربة تسوق فيها أكتر من كارت وأكتر من فئة في نفس الأوردر.
-- order_items أصلاً بيدعم quantity، بس مفيش عمود لتخزين الأكواد
-- (ممكن يبقى أكتر من كود لو quantity أكبر من 1)، فبنضيفه هنا.

alter table public.order_items
  add column if not exists codes text[] not null default '{}';
