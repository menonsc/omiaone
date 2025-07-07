-- Script de diagnóstico para verificar o status das migrações

-- Verificar se as tabelas foram criadas
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_sessions', 'user_activities', 'user_notifications', 'user_preferences', 'user_exports', 'user_impersonations')
ORDER BY table_name;

-- Verificar se as funções foram criadas
SELECT 
  routine_name, 
  routine_type, 
  data_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('export_users', 'get_user_stats', 'search_users', 'create_user_session', 'log_user_activity', 'create_user_notification')
ORDER BY routine_name;

-- Verificar se o tipo user_role existe
SELECT 
  typname, 
  typtype 
FROM pg_type 
WHERE typname = 'user_role';

-- Verificar se há erros recentes no log (se possível)
-- SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Tentar criar a função export_users se ela não existir
DO $$
DECLARE
  function_exists BOOLEAN;
BEGIN
  -- Verificar se a função existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'export_users' 
    AND routine_schema = 'public'
  ) INTO function_exists;
  
  IF NOT function_exists THEN
    -- Criar a função
    EXECUTE '
    CREATE OR REPLACE FUNCTION export_users(
      p_user_id UUID,
      p_format VARCHAR DEFAULT ''csv'',
      p_filters JSONB DEFAULT ''{}'',
      p_search VARCHAR DEFAULT '''',
      p_include_history BOOLEAN DEFAULT false,
      p_include_stats BOOLEAN DEFAULT false
    )
    RETURNS JSON AS $func$
    BEGIN
      RETURN json_build_object(
        ''export_id'', gen_random_uuid(),
        ''status'', ''pending'',
        ''expires_at'', NOW() + INTERVAL ''24 hours''
      );
    END;
    $func$ LANGUAGE plpgsql;
    ';
    
    RAISE NOTICE 'Função export_users criada com sucesso';
  ELSE
    RAISE NOTICE 'Função export_users já existe';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao criar função export_users: %', SQLERRM;
END $$; 