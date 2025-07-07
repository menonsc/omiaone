-- Migration 009: Correção da função export_users
-- Garante que a função export_users seja criada corretamente

-- Função para exportar usuários
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

-- Comentário da função
COMMENT ON FUNCTION export_users(UUID, VARCHAR, JSONB, VARCHAR, BOOLEAN, BOOLEAN) IS 'Inicia processo de exportação de usuários'; 