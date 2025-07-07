-- Script de teste para verificar e criar a função export_users

-- Verificar se a função existe
SELECT 
  routine_name, 
  routine_type, 
  data_type 
FROM information_schema.routines 
WHERE routine_name = 'export_users';

-- Se a função não existir, criá-la
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

-- Testar a função
SELECT export_users(
  '00000000-0000-0000-0000-000000000000'::UUID,
  'csv',
  '{}'::jsonb,
  '',
  false,
  false
); 