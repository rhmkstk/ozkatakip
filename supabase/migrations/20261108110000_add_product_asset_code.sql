create or replace function public.generate_product_asset_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  random_bytes bytea := uuid_send(gen_random_uuid());
  raw_code text := '';
  character_position integer;
  checksum integer := 0;
  character_index integer;
begin
  for character_index in 0..9 loop
    character_position := (get_byte(random_bytes, character_index) % length(alphabet)) + 1;
    raw_code := raw_code || substr(alphabet, character_position, 1);
    checksum := (checksum + ((character_index + 1) * character_position)) % length(alphabet);
  end loop;

  return substr(raw_code, 1, 5)
    || '-'
    || substr(raw_code, 6, 5)
    || '-'
    || substr(alphabet, checksum + 1, 1);
end;
$$;

alter table public.products
add column asset_code text;

do $$
declare
  product_row record;
  candidate text;
begin
  for product_row in select id from public.products where asset_code is null loop
    loop
      candidate := public.generate_product_asset_code();
      exit when not exists (
        select 1
        from public.products
        where asset_code = candidate
      );
    end loop;

    update public.products
    set asset_code = candidate
    where id = product_row.id;
  end loop;
end;
$$;

alter table public.products
alter column asset_code set default public.generate_product_asset_code(),
alter column asset_code set not null;

alter table public.products
add constraint products_asset_code_format_check
check (asset_code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]$'),
add constraint products_asset_code_key unique (asset_code);

comment on column public.products.asset_code is
'Immutable, human-friendly product code used for manual lookup.';

drop trigger if exists products_asset_uid_immutable on public.products;
drop function if exists public.prevent_product_asset_uid_update();

create function public.prevent_product_identity_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.asset_uid is distinct from old.asset_uid then
    raise exception 'products.asset_uid is immutable'
      using errcode = '23000';
  end if;

  if new.asset_code is distinct from old.asset_code then
    raise exception 'products.asset_code is immutable'
      using errcode = '23000';
  end if;

  return new;
end;
$$;

create trigger products_identity_immutable
before update of asset_uid, asset_code on public.products
for each row
execute function public.prevent_product_identity_update();
