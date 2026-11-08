do $migration$
declare
  product_row record;
  candidate text;
begin
  execute 'create extension if not exists pgcrypto';

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'asset_uid'
  ) then
    alter table public.products
    add column asset_uid uuid default gen_random_uuid();

    update public.products
    set asset_uid = gen_random_uuid()
    where asset_uid is null;

    alter table public.products
    alter column asset_uid set not null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_asset_uid_key'
  ) then
    alter table public.products
    add constraint products_asset_uid_key unique (asset_uid);
  end if;

  execute $function$
    create or replace function public.generate_product_asset_code()
    returns text
    language plpgsql
    volatile
    set search_path = ''
    as $body$
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
    $body$
  $function$;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'asset_code'
  ) then
    alter table public.products
    add column asset_code text;
  end if;

  for product_row in
    select id from public.products where asset_code is null
  loop
    loop
      execute 'select public.generate_product_asset_code()' into candidate;
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

  alter table public.products
  alter column asset_code set default public.generate_product_asset_code(),
  alter column asset_code set not null;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_asset_code_format_check'
  ) then
    alter table public.products
    add constraint products_asset_code_format_check
    check (asset_code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_asset_code_key'
  ) then
    alter table public.products
    add constraint products_asset_code_key unique (asset_code);
  end if;

  execute $function$
    create or replace function public.prevent_product_identity_update()
    returns trigger
    language plpgsql
    set search_path = ''
    as $body$
    begin
      if new.asset_uid is distinct from old.asset_uid then
        raise exception 'products.asset_uid is immutable' using errcode = '23000';
      end if;

      if new.asset_code is distinct from old.asset_code then
        raise exception 'products.asset_code is immutable' using errcode = '23000';
      end if;

      return new;
    end;
    $body$
  $function$;

  drop trigger if exists products_asset_uid_immutable on public.products;
  drop trigger if exists products_identity_immutable on public.products;

  create trigger products_identity_immutable
  before update of asset_uid, asset_code on public.products
  for each row
  execute function public.prevent_product_identity_update();

  comment on column public.products.asset_uid is
  'Immutable public identifier used in QR codes and product lookup URLs.';

  comment on column public.products.asset_code is
  'Immutable, human-friendly product code used for manual lookup.';
end
$migration$;
