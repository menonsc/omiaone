-- Script simples para criar a função export_users

-- Verificar se a função existe
SELECT 
  routine_name, 
  routine_type, 
  data_type 
FROM information_schema.routines 
WHERE routine_name = 'export_users' 
AND routine_schema = 'public';

-- Criar a função export_users
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
  RETURN json_build_object(
    'export_id', gen_random_uuid(),
    'status', 'pending',
    'expires_at', NOW() + INTERVAL '24 hours'
  );
END;
$$ LANGUAGE plpgsql;

-- Verificar se foi criada
SELECT 
  routine_name, 
  routine_type, 
  data_type 
FROM information_schema.routines 
WHERE routine_name = 'export_users' 
AND routine_schema = 'public';

-- Testar a função
SELECT export_users(
  '00000000-0000-0000-0000-000000000000'::UUID,
  'csv',
  '{}'::jsonb,
  '',
  false,
  false
); 