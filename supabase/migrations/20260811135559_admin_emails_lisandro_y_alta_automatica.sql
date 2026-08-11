-- El equipo narraglobal entra siempre al back office.
--
-- Faltaba lisandro@narraglobal.com en admin_emails: la cuenta se logueaba bien,
-- pero al no tener rol caía en /entrar buscando una suscripción que no existe
-- ("No encontramos tu suscripción") y en /admin veía "Esta cuenta no tiene
-- permisos". El login nunca estuvo roto; lo que faltaba era el rol.

insert into public.admin_emails (email) values
  ('nicolassespindola@gmail.com'),
  ('lisandrobregant@gmail.com'),
  ('lisandro@narraglobal.com')
on conflict (email) do nothing;

-- Hasta acá el rol solo se otorgaba en el INSERT de auth.users: si el email se
-- sumaba a admin_emails después de que la persona ya tenía cuenta, el rol no
-- llegaba nunca. Dos redes para que "sumar el email y listo" sea cierto:

-- 1) Al sumar un email a admin_emails, los usuarios que ya existen reciben el rol.
create or replace function public.grant_admin_on_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role)
  select u.id, 'admin'::public.app_role
  from auth.users u
  where lower(u.email) = lower(new.email)
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;

drop trigger if exists on_admin_email_added on public.admin_emails;
create trigger on_admin_email_added
after insert on public.admin_emails
for each row execute function public.grant_admin_on_listing();

-- 2) En cada login (auth.users.last_sign_in_at cambia) se revalida el rol, así
--    una cuenta del equipo no puede quedar sin permisos por un rol perdido.
create or replace function public.grant_admin_on_login()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at
     and exists (
       select 1 from public.admin_emails a where lower(a.email) = lower(new.email)
     ) then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_login_grant_admin on auth.users;
create trigger on_auth_user_login_grant_admin
after update on auth.users
for each row execute function public.grant_admin_on_login();

-- Cuentas que ya existían con email de admin reciben el rol ahora.
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
join public.admin_emails a on lower(a.email) = lower(u.email)
on conflict (user_id, role) do nothing;
