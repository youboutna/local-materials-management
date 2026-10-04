-- =============================================================================
-- PARTIE 6 : POLICIES TASK_ASSIGNMENTS (avec détection dynamique du type)
-- =============================================================================

DO $$
DECLARE
  v_assigned_to_type TEXT;
  v_is_array BOOLEAN;
BEGIN
  -- Détecter le type de la colonne assigned_to
  SELECT c.data_type INTO v_assigned_to_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'btp'
    AND c.table_name = 'task_assignments'
    AND c.column_name = 'assigned_to';

  v_is_array := (v_assigned_to_type = 'ARRAY');

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  CRÉATION DES POLICIES task_assignments';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  Type de assigned_to : %', v_assigned_to_type;
  RAISE NOTICE '  Mode : %', CASE WHEN v_is_array THEN 'UUID[] (ANY)' ELSE 'UUID (égalité)' END;

  -- 6.1 : Admins : gestion complète (indépendant du type)
  EXECUTE $p$
    CREATE POLICY "Admins can manage all assignments"
    ON btp.task_assignments
    FOR ALL
    TO authenticated
    USING (btp.is_current_user_admin())
    WITH CHECK (btp.is_current_user_admin())
  $p$;
  RAISE NOTICE '  ✅ Admins can manage all assignments';

  -- 6.2 : SELECT
  IF v_is_array THEN
    EXECUTE $p$
      CREATE POLICY "Users can view their own assignments"
      ON btp.task_assignments
      FOR SELECT
      TO authenticated
      USING (
        auth.uid() = ANY(btp.task_assignments.assigned_to)
        OR btp.task_assignments.assigned_by = auth.uid()
        OR btp.task_assignments.project_id IN (
          SELECT p.id FROM btp.projects p
          WHERE p.created_by = auth.uid()
        )
      )
    $p$;
  ELSE
    EXECUTE $p$
      CREATE POLICY "Users can view their own assignments"
      ON btp.task_assignments
      FOR SELECT
      TO authenticated
      USING (
        btp.task_assignments.assigned_to = auth.uid()
        OR btp.task_assignments.assigned_by = auth.uid()
        OR btp.task_assignments.project_id IN (
          SELECT p.id FROM btp.projects p
          WHERE p.created_by = auth.uid()
        )
      )
    $p$;
  END IF;
  RAISE NOTICE '  ✅ Users can view their own assignments';

  -- 6.3 : UPDATE
  IF v_is_array THEN
    EXECUTE $p$
      CREATE POLICY "Users can update their own assignments"
      ON btp.task_assignments
      FOR UPDATE
      TO authenticated
      USING (
        auth.uid() = ANY(btp.task_assignments.assigned_to)
        OR btp.task_assignments.assigned_by = auth.uid()
        OR btp.task_assignments.project_id IN (
          SELECT p.id FROM btp.projects p
          WHERE p.created_by = auth.uid()
        )
      )
      WITH CHECK (
        auth.uid() = ANY(btp.task_assignments.assigned_to)
        OR btp.task_assignments.assigned_by = auth.uid()
        OR btp.task_assignments.project_id IN (
          SELECT p.id FROM btp.projects p
          WHERE p.created_by = auth.uid()
        )
      )
    $p$;
  ELSE
    EXECUTE $p$
      CREATE POLICY "Users can update their own assignments"
      ON btp.task_assignments
      FOR UPDATE
      TO authenticated
      USING (
        btp.task_assignments.assigned_to = auth.uid()
        OR btp.task_assignments.assigned_by = auth.uid()
        OR btp.task_assignments.project_id IN (
          SELECT p.id FROM btp.projects p
          WHERE p.created_by = auth.uid()
        )
      )
      WITH CHECK (
        btp.task_assignments.assigned_to = auth.uid()
        OR btp.task_assignments.assigned_by = auth.uid()
        OR btp.task_assignments.project_id IN (
          SELECT p.id FROM btp.projects p
          WHERE p.created_by = auth.uid()
        )
      )
    $p$;
  END IF;
  RAISE NOTICE '  ✅ Users can update their own assignments';

  -- 6.4 : INSERT (indépendant du type)
  EXECUTE $p$
    CREATE POLICY "Authenticated can insert assignments"
    ON btp.task_assignments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL)
  $p$;
  RAISE NOTICE '  ✅ Authenticated can insert assignments';

  -- 6.5 : DELETE (admin uniquement)
  EXECUTE $p$
    CREATE POLICY "Admins can delete assignments"
    ON btp.task_assignments
    FOR DELETE
    TO authenticated
    USING (btp.is_current_user_admin())
  $p$;
  RAISE NOTICE '  ✅ Admins can delete assignments';

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;