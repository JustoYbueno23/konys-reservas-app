-- ============================================================
-- Konys Pizza - Seguridad de la base de datos (RLS)
-- Ejecutar DESPUÉS de llenar-descripciones.sql
-- Idempotente: se puede correr varias veces sin error.
-- ============================================================

-- ===== 1. Índice para evitar reservas duplicadas =====
-- Misma mesa, fecha y hora de inicio = no se aceptan dos reservas
CREATE UNIQUE INDEX IF NOT EXISTS reservas_unica
  ON public.reservas (mesa_id, fecha, hora_inicio);

-- ===== 2. Activar RLS en las 5 tablas =====
ALTER TABLE public.mesas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- ===== 3. Función auxiliar: ¿el usuario actual es personal? =====
CREATE OR REPLACE FUNCTION public.es_personal(roles_permitidos text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
      AND activo = true
      AND rol = ANY (roles_permitidos)
  );
$$;

-- ===== 4. MESAS =====
-- El cliente solo ve las mesas activas (carta de reservas)
DROP POLICY IF EXISTS mesas_cliente_select ON public.mesas;
CREATE POLICY mesas_cliente_select ON public.mesas
  FOR SELECT TO anon, authenticated
  USING (activa = true);

-- El personal ve todas (incluidas las inactivas, para poder reactivarlas)
DROP POLICY IF EXISTS mesas_personal_select ON public.mesas;
CREATE POLICY mesas_personal_select ON public.mesas
  FOR SELECT TO authenticated
  USING (public.es_personal(ARRAY['admin', 'mesero']));

-- Solo el admin crea, edita o borra mesas
DROP POLICY IF EXISTS mesas_admin_insert ON public.mesas;
CREATE POLICY mesas_admin_insert ON public.mesas
  FOR INSERT TO authenticated
  WITH CHECK (public.es_personal(ARRAY['admin']));

DROP POLICY IF EXISTS mesas_admin_update ON public.mesas;
CREATE POLICY mesas_admin_update ON public.mesas
  FOR UPDATE TO authenticated
  USING (public.es_personal(ARRAY['admin']))
  WITH CHECK (public.es_personal(ARRAY['admin']));

DROP POLICY IF EXISTS mesas_admin_delete ON public.mesas;
CREATE POLICY mesas_admin_delete ON public.mesas
  FOR DELETE TO authenticated
  USING (public.es_personal(ARRAY['admin']));

-- ===== 5. HORARIOS =====
-- El cliente ve solo los horarios activos (franjas de reserva)
DROP POLICY IF EXISTS horarios_cliente_select ON public.horarios;
CREATE POLICY horarios_cliente_select ON public.horarios
  FOR SELECT TO anon, authenticated
  USING (activo = true);

-- El personal ve todos (para poder editarlos)
DROP POLICY IF EXISTS horarios_personal_select ON public.horarios;
CREATE POLICY horarios_personal_select ON public.horarios
  FOR SELECT TO authenticated
  USING (public.es_personal(ARRAY['admin', 'mesero']));

DROP POLICY IF EXISTS horarios_admin_insert ON public.horarios;
CREATE POLICY horarios_admin_insert ON public.horarios
  FOR INSERT TO authenticated
  WITH CHECK (public.es_personal(ARRAY['admin']));

DROP POLICY IF EXISTS horarios_admin_update ON public.horarios;
CREATE POLICY horarios_admin_update ON public.horarios
  FOR UPDATE TO authenticated
  USING (public.es_personal(ARRAY['admin']))
  WITH CHECK (public.es_personal(ARRAY['admin']));

DROP POLICY IF EXISTS horarios_admin_delete ON public.horarios;
CREATE POLICY horarios_admin_delete ON public.horarios
  FOR DELETE TO authenticated
  USING (public.es_personal(ARRAY['admin']));

-- ===== 6. RESERVAS =====
-- El cliente crea reservas en estado confirmada, pero no las puede leer de vuelta
DROP POLICY IF EXISTS reservas_cliente_insert ON public.reservas;
CREATE POLICY reservas_cliente_insert ON public.reservas
  FOR INSERT TO anon, authenticated
  WITH CHECK (estado = 'confirmada');

-- El personal ve y actualiza reservas (completar / cancelar)
DROP POLICY IF EXISTS reservas_personal_select ON public.reservas;
CREATE POLICY reservas_personal_select ON public.reservas
  FOR SELECT TO authenticated
  USING (public.es_personal(ARRAY['admin', 'mesero']));

DROP POLICY IF EXISTS reservas_personal_update ON public.reservas;
CREATE POLICY reservas_personal_update ON public.reservas
  FOR UPDATE TO authenticated
  USING (public.es_personal(ARRAY['admin', 'mesero']))
  WITH CHECK (public.es_personal(ARRAY['admin', 'mesero']));

-- Solo el admin puede borrar reservas
DROP POLICY IF EXISTS reservas_admin_delete ON public.reservas;
CREATE POLICY reservas_admin_delete ON public.reservas
  FOR DELETE TO authenticated
  USING (public.es_personal(ARRAY['admin']));

-- ===== 7. PLATOS =====
-- Todos ven los platos (es un menú público)
DROP POLICY IF EXISTS platos_publico_select ON public.platos;
CREATE POLICY platos_publico_select ON public.platos
  FOR SELECT TO anon, authenticated
  USING (true);

-- Solo el admin crea, edita o borra platos
DROP POLICY IF EXISTS platos_admin_insert ON public.platos;
CREATE POLICY platos_admin_insert ON public.platos
  FOR INSERT TO authenticated
  WITH CHECK (public.es_personal(ARRAY['admin']));

DROP POLICY IF EXISTS platos_admin_update ON public.platos;
CREATE POLICY platos_admin_update ON public.platos
  FOR UPDATE TO authenticated
  USING (public.es_personal(ARRAY['admin']))
  WITH CHECK (public.es_personal(ARRAY['admin']));

DROP POLICY IF EXISTS platos_admin_delete ON public.platos;
CREATE POLICY platos_admin_delete ON public.platos
  FOR DELETE TO authenticated
  USING (public.es_personal(ARRAY['admin']));

-- ===== 8. PERFILES =====
-- Cada cuenta autenticada ve solo su propio perfil (para saber su rol al entrar)
DROP POLICY IF EXISTS perfiles_propio_select ON public.perfiles;
CREATE POLICY perfiles_propio_select ON public.perfiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- El admin ve todos los perfiles
DROP POLICY IF EXISTS perfiles_admin_select ON public.perfiles;
CREATE POLICY perfiles_admin_select ON public.perfiles
  FOR SELECT TO authenticated
  USING (public.es_personal(ARRAY['admin']));

-- Nadie inserta/edita/borra perfiles desde la app
-- (los perfiles se gestionan desde el panel de Supabase o SQL)
