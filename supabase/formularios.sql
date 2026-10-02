-- Entrada de los formularios de la web sin claves secretas.
-- El Worker de la web llama a esta función con la clave publishable (pública).
-- La función valida, limita abusos e inserta saltándose RLS (security definer),
-- así que no hace falta guardar la clave service_role en Cloudflare.
-- Se puede ejecutar varias veces sin romper nada.

create index if not exists contactos_creado_en_idx on public.contactos (creado_en desc);

create or replace function public.registrar_contacto(datos jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nombre text := left(trim(coalesce(datos ->> 'nombre', '')), 120);
  v_email text := lower(left(trim(coalesce(datos ->> 'email', '')), 180));
  v_id bigint;
begin
  if v_nombre = '' or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Revisa los campos obligatorios';
  end if;
  if coalesce(datos ->> 'consentimiento', '') = '' then
    raise exception 'Falta el consentimiento';
  end if;

  -- Antiabuso: 5 envíos por email y hora, 60 en total por hora
  if (select count(*) from public.contactos
        where email = v_email and creado_en > now() - interval '1 hour') >= 5
     or (select count(*) from public.contactos
        where creado_en > now() - interval '1 hour' and tipo is distinct from 'Alta manual') >= 60 then
    raise exception 'Demasiados envíos, inténtalo más tarde';
  end if;

  insert into public.contactos
    (tipo, nombre, email, telefono, empresa, crm, objetivo, plataforma, fecha, hora, pagina, origen)
  values (
    nullif(left(trim(datos ->> 'tipo'), 100), ''),
    v_nombre,
    v_email,
    nullif(left(trim(datos ->> 'telefono'), 50), ''),
    nullif(left(trim(datos ->> 'empresa'), 150), ''),
    nullif(left(trim(datos ->> 'crm'), 100), ''),
    nullif(left(trim(datos ->> 'objetivo'), 2500), ''),
    nullif(left(trim(datos ->> 'plataforma'), 80), ''),
    nullif(left(trim(datos ->> 'fecha'), 30), ''),
    nullif(left(trim(datos ->> 'hora'), 20), ''),
    nullif(left(trim(datos ->> 'pagina'), 200), ''),
    'Web'
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.registrar_contacto(jsonb) from public;
grant execute on function public.registrar_contacto(jsonb) to anon, authenticated;
