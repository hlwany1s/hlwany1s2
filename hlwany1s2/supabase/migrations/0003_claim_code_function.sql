-- سحب كود آيتونز متاح بأمان حتى لو جالك أكتر من webhook في نفس اللحظة
-- (FOR UPDATE SKIP LOCKED بيمنع اتنين يسحبوا نفس الكود مرتين).
-- بيسجل السحب في itunes_ops الموجود أصلاً عشان يفضل ظاهر في تقاريرك اليومية.

create or replace function public.claim_itunes_code(
  p_category text,
  p_order_number text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_code text;
begin
  select id, code into v_id, v_code
  from itunes_stock
  where category = p_category and available = true
  order by id
  for update skip locked
  limit 1;

  if v_id is null then
    return null; -- المخزون خلص للفئة دي — لازم تتلاحظ فورًا
  end if;

  update itunes_stock set available = false where id = v_id;

  insert into itunes_ops (admin, category, code, biz_date)
  values ('ONLINE STORE', p_category, v_code, current_date);

  return v_code;
end;
$$;
