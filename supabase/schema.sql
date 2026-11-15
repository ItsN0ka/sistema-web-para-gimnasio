-- Esquema inicial para el sistema de gestión de gimnasio.
-- Ejecutar en Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gym_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('owner', 'admin', 'receptionist', 'trainer', 'maintenance')),
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  member_number text unique not null,
  full_name text not null,
  email text not null,
  phone text,
  plan_name text not null default 'Plan Mensual',
  membership_status text not null default 'Vigente'
    check (membership_status in ('Vigente', 'Por vencer', 'Vencida')),
  starts_at date not null default current_date,
  expires_at date not null default (current_date + interval '1 month'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists members_full_name_idx on public.members (full_name);
create index if not exists members_status_idx on public.members (membership_status);
create index if not exists members_expires_at_idx on public.members (expires_at);

create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  price numeric(12, 2) not null default 0 check (price >= 0),
  duration_days integer not null default 30 check (duration_days > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  payment_method text not null default 'Efectivo',
  payment_status text not null default 'Pagado'
    check (payment_status in ('Pagado', 'Pendiente', 'Anulado')),
  paid_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists payments_member_id_idx on public.payments (member_id);
create index if not exists payments_paid_at_idx on public.payments (paid_at desc);

create table if not exists public.gym_classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trainer_name text not null,
  trainer_user_id uuid references public.gym_staff(user_id) on delete set null,
  starts_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  capacity integer not null default 20 check (capacity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.class_bookings (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.gym_classes(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  booking_status text not null default 'Reservada'
    check (booking_status in ('Reservada', 'Asistió', 'Cancelada')),
  created_at timestamptz not null default now(),
  unique (class_id, member_id)
);

create or replace function public.class_booking_counts(class_ids uuid[])
returns table (class_id uuid, booked integer)
language sql stable security definer set search_path = ''
as $$
  select booking.class_id, count(*)::integer
  from public.class_bookings as booking
  where booking.class_id = any(class_ids) and booking.booking_status = 'Reservada'
  group by booking.class_id
$$;
revoke all on function public.class_booking_counts(uuid[]) from public, anon;
grant execute on function public.class_booking_counts(uuid[]) to authenticated;

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  notes text
);

create table if not exists public.trainer_profiles (
  user_id uuid primary key references public.gym_staff(user_id) on delete cascade,
  display_name text not null default '',
  specialty text not null default 'Entrenamiento general',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trainer_profiles add column if not exists display_name text not null default '';

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  trainer_user_id uuid not null references public.gym_staff(user_id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  starts_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  status text not null default 'Programada' check (status in ('Programada', 'Completada', 'Cancelada')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  equipment_code text unique not null,
  name text not null,
  zone text not null default 'General',
  status text not null default 'Operativa' check (status in ('Operativa', 'Revisión', 'En reparación', 'Fuera de servicio')),
  last_maintenance_at date,
  next_maintenance_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid references public.equipment(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'Media' check (priority in ('Baja', 'Media', 'Alta', 'Urgente')),
  status text not null default 'Pendiente' check (status in ('Pendiente', 'En curso', 'Resuelta', 'Cancelada')),
  assigned_to uuid references public.gym_staff(user_id) on delete set null,
  reported_by uuid references auth.users(id) on delete set null,
  due_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operating_expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  category text not null,
  amount numeric(12, 2) not null check (amount > 0),
  paid_at date not null default current_date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.members add column if not exists user_id uuid unique references auth.users(id) on delete set null;
alter table public.gym_classes add column if not exists trainer_user_id uuid references public.gym_staff(user_id) on delete set null;
alter table public.gym_staff drop constraint if exists gym_staff_role_check;
alter table public.gym_staff add constraint gym_staff_role_check
  check (role in ('owner', 'admin', 'receptionist', 'trainer', 'maintenance'));

create index if not exists attendance_checked_in_at_idx on public.attendance (checked_in_at desc);
create index if not exists training_sessions_trainer_start_idx on public.training_sessions (trainer_user_id, starts_at);
create index if not exists maintenance_tickets_status_idx on public.maintenance_tickets (status, priority);
create index if not exists equipment_next_maintenance_idx on public.equipment (next_maintenance_at);

insert into public.profiles (id, email, full_name)
select id, email, coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
where email is not null
on conflict (id) do nothing;

-- Funciones de autorización en un esquema no expuesto por la Data API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.current_gym_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select staff.role from public.gym_staff as staff where staff.user_id = (select auth.uid()) limit 1),
    (select 'member'::text from public.members as member where member.user_id = (select auth.uid()) limit 1)
  )
$$;

create or replace function private.is_gym_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.gym_staff as staff
    where staff.user_id = (select auth.uid())
  )
$$;

create or replace function private.is_gym_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.current_gym_role()) in ('owner', 'admin')
$$;

create or replace function private.is_gym_maintenance()
returns boolean language sql stable security definer set search_path = ''
as $$ select (select private.current_gym_role()) = 'maintenance' $$;

create or replace function private.can_member_book_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.members as member
    join public.gym_classes as gym_class on gym_class.id = target_class_id
    where member.user_id = (select auth.uid())
      and member.membership_status = 'Vigente'
      and member.expires_at >= current_date
      and gym_class.is_active
      and gym_class.starts_at > now()
      and (select count(*) from public.class_bookings as booking
           where booking.class_id = target_class_id and booking.booking_status = 'Reservada') < gym_class.capacity
  )
$$;

create or replace function private.is_own_member(target_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members as member
    where member.id = target_member_id and member.user_id = (select auth.uid())
  )
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update set email = excluded.email;

  update public.members
  set user_id = new.id, updated_at = now()
  where lower(email) = lower(new.email) and user_id is null;

  return new;
end;
$$;

create or replace function private.link_existing_member_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is null then
    update public.members
    set user_id = (
      select profile.id from public.profiles as profile
      where lower(profile.email) = lower(new.email)
      limit 1
    )
    where id = new.id and exists (
      select 1 from public.profiles as profile where lower(profile.email) = lower(new.email)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists gym_auth_user_created on auth.users;
create trigger gym_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

drop trigger if exists gym_member_account_link on public.members;
create trigger gym_member_account_link after insert on public.members
  for each row execute function private.link_existing_member_account();

revoke all on function private.current_gym_role() from public, anon;
revoke all on function private.is_gym_staff() from public, anon;
revoke all on function private.is_gym_admin() from public, anon;
revoke all on function private.is_gym_maintenance() from public, anon;
revoke all on function private.can_member_book_class(uuid) from public, anon;
revoke all on function private.is_own_member(uuid) from public, anon;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.link_existing_member_account() from public, anon, authenticated;
grant execute on function private.current_gym_role() to authenticated;
grant execute on function private.is_gym_staff() to authenticated;
grant execute on function private.is_gym_admin() to authenticated;
grant execute on function private.is_gym_maintenance() to authenticated;
grant execute on function private.can_member_book_class(uuid) to authenticated;
grant execute on function private.is_own_member(uuid) to authenticated;

-- Row Level Security: cada cuenta debe tener un rol asignado en gym_staff.
alter table public.gym_staff enable row level security;
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.membership_plans enable row level security;
alter table public.payments enable row level security;
alter table public.gym_classes enable row level security;
alter table public.class_bookings enable row level security;
alter table public.attendance enable row level security;
alter table public.trainer_profiles enable row level security;
alter table public.training_sessions enable row level security;
alter table public.equipment enable row level security;
alter table public.maintenance_tickets enable row level security;
alter table public.operating_expenses enable row level security;

drop policy if exists "Users can read their profile" on public.profiles;
create policy "Users can read their profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_gym_admin()));
drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "Staff can read staff directory" on public.gym_staff;
create policy "Staff can read staff directory" on public.gym_staff for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_gym_admin()));
drop policy if exists "Admins can add staff" on public.gym_staff;
create policy "Admins can add staff" on public.gym_staff for insert to authenticated
  with check ((select private.is_gym_admin()));
drop policy if exists "Admins can update staff" on public.gym_staff;
create policy "Admins can update staff" on public.gym_staff for update to authenticated
  using ((select private.is_gym_admin())) with check ((select private.is_gym_admin()));
drop policy if exists "Staff can update their own name" on public.gym_staff;
create policy "Staff can update their own name" on public.gym_staff for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and role = (select private.current_gym_role()));
drop policy if exists "Admins can remove staff" on public.gym_staff;
create policy "Admins can remove staff" on public.gym_staff for delete to authenticated
  using ((select private.is_gym_admin()));

drop policy if exists "Staff can read members" on public.members;
create policy "Staff can read members" on public.members for select to authenticated
  using ((select private.is_gym_staff()) or user_id = (select auth.uid()));
drop policy if exists "Front desk can add members" on public.members;
create policy "Front desk can add members" on public.members for insert to authenticated
  with check ((select private.current_gym_role()) in ('owner', 'admin', 'receptionist'));
drop policy if exists "Front desk can update members" on public.members;
create policy "Front desk can update members" on public.members for update to authenticated
  using ((select private.current_gym_role()) in ('owner', 'admin', 'receptionist'))
  with check ((select private.current_gym_role()) in ('owner', 'admin', 'receptionist'));
drop policy if exists "Admins can delete members" on public.members;
create policy "Admins can delete members" on public.members for delete to authenticated
  using ((select private.is_gym_admin()));

drop policy if exists "Staff can read membership plans" on public.membership_plans;
create policy "Staff can read membership plans" on public.membership_plans for select to authenticated
  using ((select private.is_gym_staff()) or (select private.current_gym_role()) = 'member');
drop policy if exists "Admins can manage membership plans" on public.membership_plans;
create policy "Admins can manage membership plans" on public.membership_plans for all to authenticated
  using ((select private.is_gym_admin())) with check ((select private.is_gym_admin()));

do $$
declare existing_policy record;
begin
  for existing_policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'payments' and cmd in ('SELECT', 'ALL')
  loop
    execute format('drop policy if exists %I on public.payments', existing_policy.policyname);
  end loop;
end;
$$;
create policy "Staff can read payments" on public.payments for select to authenticated
  using ((select private.is_gym_staff()) or (select private.is_own_member(member_id)));
drop policy if exists "Front desk can create payments" on public.payments;
create policy "Front desk can create payments" on public.payments for insert to authenticated
  with check ((select private.current_gym_role()) in ('owner', 'admin', 'receptionist'));
drop policy if exists "Admins can update payments" on public.payments;
create policy "Admins can update payments" on public.payments for update to authenticated
  using ((select private.is_gym_admin())) with check ((select private.is_gym_admin()));
drop policy if exists "Admins can delete payments" on public.payments;
create policy "Admins can delete payments" on public.payments for delete to authenticated
  using ((select private.is_gym_admin()));

drop policy if exists "Staff can read classes" on public.gym_classes;
create policy "Staff can read classes" on public.gym_classes for select to authenticated
  using (
    (select private.is_gym_staff())
    or ((select private.current_gym_role()) = 'member' and is_active and starts_at > now())
  );
drop policy if exists "Trainers and admins can manage classes" on public.gym_classes;
create policy "Trainers and admins can manage classes" on public.gym_classes for insert to authenticated
  with check (
    (select private.current_gym_role()) in ('owner', 'admin')
    or ((select private.current_gym_role()) = 'trainer' and trainer_user_id = (select auth.uid()))
  );
drop policy if exists "Trainers and admins can update classes" on public.gym_classes;
create policy "Trainers and admins can update classes" on public.gym_classes for update to authenticated
  using (
    (select private.current_gym_role()) in ('owner', 'admin')
    or ((select private.current_gym_role()) = 'trainer' and trainer_user_id = (select auth.uid()))
  )
  with check (
    (select private.current_gym_role()) in ('owner', 'admin')
    or ((select private.current_gym_role()) = 'trainer' and trainer_user_id = (select auth.uid()))
  );
drop policy if exists "Admins can delete classes" on public.gym_classes;
create policy "Admins can delete classes" on public.gym_classes for delete to authenticated
  using ((select private.is_gym_admin()));

drop policy if exists "Staff can read class bookings" on public.class_bookings;
create policy "Staff can read class bookings" on public.class_bookings for select to authenticated
  using ((select private.is_gym_staff()) or (select private.is_own_member(member_id)));
drop policy if exists "Staff can create class bookings" on public.class_bookings;
create policy "Staff can create class bookings" on public.class_bookings for insert to authenticated
  with check (
    ((select private.current_gym_role()) in ('owner', 'admin', 'receptionist', 'trainer'))
    or (
      (select private.current_gym_role()) = 'member'
      and (select private.is_own_member(member_id))
      and (select private.can_member_book_class(class_id))
    )
  );
drop policy if exists "Staff can update class bookings" on public.class_bookings;
create policy "Staff can update class bookings" on public.class_bookings for update to authenticated
  using ((select private.current_gym_role()) in ('owner', 'admin', 'receptionist', 'trainer'))
  with check ((select private.current_gym_role()) in ('owner', 'admin', 'receptionist', 'trainer'));
drop policy if exists "Members can cancel their own bookings" on public.class_bookings;
create policy "Members can cancel their own bookings" on public.class_bookings for update to authenticated
  using ((select private.is_own_member(member_id)))
  with check ((select private.is_own_member(member_id)) and booking_status = 'Cancelada');
drop policy if exists "Members can remove cancelled bookings" on public.class_bookings;
create policy "Members can remove cancelled bookings" on public.class_bookings for delete to authenticated
  using ((select private.is_own_member(member_id)) and booking_status = 'Cancelada');
drop policy if exists "Admins and reception can cancel bookings" on public.class_bookings;
create policy "Admins and reception can cancel bookings" on public.class_bookings for delete to authenticated
  using ((select private.current_gym_role()) in ('owner', 'admin', 'receptionist'));

drop policy if exists "Staff can read attendance" on public.attendance;
create policy "Staff can read attendance" on public.attendance for select to authenticated
  using ((select private.is_gym_staff()) or (select private.is_own_member(member_id)));
drop policy if exists "Staff can register attendance" on public.attendance;
create policy "Staff can register attendance" on public.attendance for insert to authenticated
  with check ((select private.current_gym_role()) in ('owner', 'admin', 'receptionist', 'trainer'));
drop policy if exists "Admins can update attendance" on public.attendance;
create policy "Admins can update attendance" on public.attendance for update to authenticated
  using ((select private.is_gym_admin())) with check ((select private.is_gym_admin()));
drop policy if exists "Admins can delete attendance" on public.attendance;
create policy "Admins can delete attendance" on public.attendance for delete to authenticated
  using ((select private.is_gym_admin()));

drop policy if exists "Gym users can view trainers" on public.trainer_profiles;
create policy "Gym users can view trainers" on public.trainer_profiles for select to authenticated
  using ((select private.current_gym_role()) is not null);
drop policy if exists "Trainers can update their profile" on public.trainer_profiles;
create policy "Trainers can update their profile" on public.trainer_profiles for update to authenticated
  using (user_id = (select auth.uid()) and (select private.current_gym_role()) = 'trainer')
  with check (user_id = (select auth.uid()) and (select private.current_gym_role()) = 'trainer');
drop policy if exists "Admins can manage trainer profiles" on public.trainer_profiles;
create policy "Admins can manage trainer profiles" on public.trainer_profiles for all to authenticated
  using ((select private.is_gym_admin())) with check ((select private.is_gym_admin()));

drop policy if exists "Users can read relevant training sessions" on public.training_sessions;
create policy "Users can read relevant training sessions" on public.training_sessions for select to authenticated
  using (
    (select private.is_gym_admin())
    or (select private.current_gym_role()) = 'receptionist'
    or trainer_user_id = (select auth.uid())
    or (select private.is_own_member(member_id))
  );
drop policy if exists "Trainers and reception can create sessions" on public.training_sessions;
create policy "Trainers and reception can create sessions" on public.training_sessions for insert to authenticated
  with check (
    (select private.current_gym_role()) in ('owner', 'admin', 'receptionist')
    or ((select private.current_gym_role()) = 'trainer' and trainer_user_id = (select auth.uid()))
  );
drop policy if exists "Trainers can update their sessions" on public.training_sessions;
create policy "Trainers can update their sessions" on public.training_sessions for update to authenticated
  using ((select private.is_gym_admin()) or trainer_user_id = (select auth.uid()))
  with check ((select private.is_gym_admin()) or trainer_user_id = (select auth.uid()));
drop policy if exists "Admins can delete sessions" on public.training_sessions;
create policy "Admins can delete sessions" on public.training_sessions for delete to authenticated
  using ((select private.is_gym_admin()));

drop policy if exists "Maintenance staff can read equipment" on public.equipment;
create policy "Maintenance staff can read equipment" on public.equipment for select to authenticated
  using ((select private.current_gym_role()) in ('owner', 'admin', 'receptionist', 'maintenance'));
drop policy if exists "Maintenance staff can manage equipment" on public.equipment;
create policy "Maintenance staff can manage equipment" on public.equipment for all to authenticated
  using ((select private.is_gym_admin()) or (select private.is_gym_maintenance()))
  with check ((select private.is_gym_admin()) or (select private.is_gym_maintenance()));

drop policy if exists "Staff can report maintenance issues" on public.maintenance_tickets;
create policy "Staff can report maintenance issues" on public.maintenance_tickets for insert to authenticated
  with check ((select private.current_gym_role()) in ('owner', 'admin', 'receptionist', 'trainer', 'maintenance'));
drop policy if exists "Maintenance team can read tickets" on public.maintenance_tickets;
create policy "Maintenance team can read tickets" on public.maintenance_tickets for select to authenticated
  using ((select private.current_gym_role()) in ('owner', 'admin', 'receptionist', 'maintenance'));
drop policy if exists "Maintenance team can update tickets" on public.maintenance_tickets;
create policy "Maintenance team can update tickets" on public.maintenance_tickets for update to authenticated
  using ((select private.is_gym_admin()) or (select private.is_gym_maintenance()))
  with check ((select private.is_gym_admin()) or (select private.is_gym_maintenance()));
drop policy if exists "Admins can delete tickets" on public.maintenance_tickets;
create policy "Admins can delete tickets" on public.maintenance_tickets for delete to authenticated
  using ((select private.is_gym_admin()));

drop policy if exists "Admins can read expenses" on public.operating_expenses;
create policy "Admins can read expenses" on public.operating_expenses for select to authenticated
  using ((select private.is_gym_admin()));
drop policy if exists "Admins can create expenses" on public.operating_expenses;
create policy "Admins can create expenses" on public.operating_expenses for insert to authenticated
  with check ((select private.is_gym_admin()));
drop policy if exists "Admins can update expenses" on public.operating_expenses;
create policy "Admins can update expenses" on public.operating_expenses for update to authenticated
  using ((select private.is_gym_admin())) with check ((select private.is_gym_admin()));
drop policy if exists "Admins can delete expenses" on public.operating_expenses;
create policy "Admins can delete expenses" on public.operating_expenses for delete to authenticated
  using ((select private.is_gym_admin()));

-- Explicit API grants: authenticated staff can reach these tables; anonymous visitors cannot.
revoke all on public.profiles, public.gym_staff, public.members, public.membership_plans, public.payments,
  public.gym_classes, public.class_bookings, public.attendance, public.trainer_profiles,
  public.training_sessions, public.equipment, public.maintenance_tickets, public.operating_expenses from anon;
grant select, insert, update, delete on public.profiles, public.gym_staff, public.members,
  public.membership_plans, public.payments, public.gym_classes, public.class_bookings, public.attendance,
  public.trainer_profiles, public.training_sessions, public.equipment, public.maintenance_tickets,
  public.operating_expenses to authenticated;
