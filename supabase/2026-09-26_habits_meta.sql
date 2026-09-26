-- HabitCore · sistema de activación
-- Agrega la columna `meta` (jsonb) a la tabla habits.
-- Guarda: objetivo normal, versión mínima, momento del día, ancla, duración,
-- "Mis 3 de hoy", pausas, respuestas de "¿qué lo hizo difícil?", postergaciones
-- y el estado EN CURSO.
--
-- La app funciona sin esta columna (guarda esos datos dentro de
-- completions.__meta), pero con ella quedan en un campo propio y ordenado.
-- Al crearla, la app migra sola los datos en el próximo guardado de cada hábito.

alter table public.habits
  add column if not exists meta jsonb not null default '{}'::jsonb;
