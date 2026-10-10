-- HabitCore · Verificar y asegurar las reglas de acceso (RLS)
-- Pegalo en Supabase → SQL Editor → Run. Es seguro correrlo más de una vez.

-- 1) DIAGNÓSTICO: ¿qué tablas tienen RLS activado? (rowsecurity = true es lo correcto)
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- 2) DIAGNÓSTICO: reglas existentes por tabla
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3) ASEGURAR: activar RLS y dejar que cada persona vea y modifique SOLO sus filas.
--    (Las misiones se guardan dentro de `habits`, así que quedan protegidas acá.)
alter table public.habits            enable row level security;
alter table public.custom_categories enable row level security;

drop policy if exists "habitcore_own_rows" on public.habits;
create policy "habitcore_own_rows" on public.habits
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "habitcore_own_rows" on public.custom_categories;
create policy "habitcore_own_rows" on public.custom_categories
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4) REVISAR a mano el resultado del paso 2: si alguna regla vieja dice
--    "true" en qual (acceso para todos), borrala con:
--    drop policy "<nombre de la regla>" on public.<tabla>;
