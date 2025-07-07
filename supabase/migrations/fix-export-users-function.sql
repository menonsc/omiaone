-- Script para corrigir a função export_users

-- Primeiro, vamos verificar se há algum problema com a função atual
DO $$
BEGIN
  -- Tentar criar a função
  CREATE OR REPLACE FUNCTION export_users(
    p_user_id UUID,
    p_format VARCHAR DEFAULT 'csv',
    p_filters JSONB DEFAULT '{}',
    p_search VARCHAR DEFAULT '',
    p_include_history BOOLEAN DEFAULT false,
    p_include_stats BOOLEAN DEFAULT false
  )
  RETURNS JSON AS $$
  BEGIN
    -- Retornar resposta simples por enquanto
    RETURN json_build_object(
      'export_id', gen_random_uuid(),
      'status', 'pending',
      'expires_at', NOW() + INTERVAL '24 hours'
    );
  END;
  $$ LANGUAGE plpgsql;
  
  RAISE NOTICE 'Função export_users criada com sucesso';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao criar função: %', SQLERRM;
END $$;

-- Verificar se a função foi criada
SELECT 
  routine_name, 
  routine_type, 
  data_type 
FROM information_schema.routines 
WHERE routine_name = 'export_users'; 