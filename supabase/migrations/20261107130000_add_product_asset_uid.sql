create extension if not exists pgcrypto;

alter table public.products
add column asset_uid uuid default gen_random_uuid();

update public.products
set asset_uid = gen_random_uuid()
where asset_uid is null;

alter table public.products
alter column asset_uid set not null;

alter table public.products
add constraint products_asset_uid_key unique (asset_uid);

comment on column public.products.asset_uid is
'Immutable public identifier used in QR codes and product lookup URLs.';

create or replace function public.prevent_product_asset_uid_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.asset_uid is distinct from old.asset_uid then
    raise exception 'products.asset_uid is immutable'
      using errcode = '23000';
  end if;

  return new;
end;
$$;

create trigger products_asset_uid_immutable
before update of asset_uid on public.products
for each row
execute function public.prevent_product_asset_uid_update();
