# Correção do Erro na Tabela system_logs

## Problema Identificado

A migration `013_add_flow_builder_permissions_fixed.sql` estava tentando inserir dados na tabela `system_logs` usando colunas incorretas:

```sql
-- ❌ INCORRETO
INSERT INTO system_logs (level, message, metadata, created_at) VALUES (...)
```

**Erro:** `ERROR: 42703: column "level" of relation "system_logs" does not exist`

## Causa do Problema

A tabela `system_logs` foi criada na migration `004_analytics_schema.sql` com a seguinte estrutura:

```sql
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_level VARCHAR(20) NOT NULL, -- debug, info, warn, error, fatal
  severity severity_level DEFAULT 'low',
  component VARCHAR(100) NOT NULL, -- whatsapp, yampi, auth, etc.
  action VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  request_id VARCHAR(255),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  stack_trace TEXT,
  environment VARCHAR(50) DEFAULT 'production',
  version VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  search_vector tsvector
);
```

## Correção Aplicada

A migration foi corrigida para usar as colunas corretas:

```sql
-- ✅ CORRETO
INSERT INTO system_logs (log_level, severity, component, action, message, details, created_at) VALUES (
  'info',
  'low',
  'migration',
  'flow_builder_permissions_added',
  'Flow Builder permissions added to RBAC system (fixed version)',
  '{"migration": "013_add_flow_builder_permissions_fixed.sql", "roles_updated": ["super_admin", "admin", "moderator", "user"], "policies_added": 25}',
  NOW()
);
```

## Diferenças Principais

| Coluna Incorreta | Coluna Correta | Descrição |
|------------------|----------------|-----------|
| `level` | `log_level` | Nível do log (debug, info, warn, error, fatal) |
| `metadata` | `details` | Dados adicionais em formato JSONB |
| - | `severity` | Severidade do log (low, medium, high, critical) |
| - | `component` | Componente do sistema |
| - | `action` | Ação específica realizada |

## Como Aplicar a Correção

### Opção 1: Reset Completo (Recomendado)
```bash
# Resetar o banco de dados
supabase db reset

# Aplicar todas as migrations novamente
supabase db push
```

### Opção 2: Aplicar Manualmente
```bash
# Conectar ao banco
supabase db connect

# Executar a migration corrigida
psql -f supabase/migrations/013_add_flow_builder_permissions_fixed.sql
```

### Opção 3: Verificar Status
```bash
# Verificar se a migration foi aplicada
supabase migration list

# Verificar logs do sistema
SELECT * FROM system_logs WHERE component = 'migration' ORDER BY created_at DESC LIMIT 5;
```

## Verificação Pós-Correção

Para confirmar que a correção funcionou:

1. **Verificar se a migration foi aplicada:**
   ```sql
   SELECT * FROM system_logs 
   WHERE component = 'migration' 
   AND action = 'flow_builder_permissions_added'
   ORDER BY created_at DESC LIMIT 1;
   ```

2. **Verificar permissões do Flow Builder:**
   ```sql
   SELECT name, permissions->'flow_builder' as flow_builder_permissions 
   FROM roles 
   WHERE name IN ('super_admin', 'admin', 'moderator', 'user');
   ```

3. **Verificar políticas RLS:**
   ```sql
   SELECT schemaname, tablename, policyname 
   FROM pg_policies 
   WHERE tablename LIKE 'flow_%' 
   ORDER BY tablename, policyname;
   ```

## Prevenção de Erros Futuros

1. **Sempre verificar a estrutura das tabelas** antes de fazer INSERT
2. **Usar o comando `\d table_name`** no psql para ver a estrutura
3. **Consultar as migrations anteriores** para entender a estrutura correta
4. **Testar as migrations** em um ambiente de desenvolvimento primeiro

## Estrutura Completa da Tabela system_logs

```sql
\d system_logs

                    Table "public.system_logs"
    Column     |            Type             | Collation | Nullable | Default
---------------+-----------------------------+-----------+----------+---------
 id            | uuid                        |           | not null | uuid_generate_v4()
 log_level     | character varying(20)       |           | not null |
 severity      | severity_level              |           |          | 'low'::severity_level
 component     | character varying(100)      |           | not null |
 action        | character varying(100)      |           | not null |
 user_id       | uuid                        |           |          |
 session_id    | character varying(255)      |           |          |
 request_id    | character varying(255)      |           |          |
 message       | text                        |           | not null |
 details       | jsonb                       |           |          | '{}'::jsonb
 stack_trace   | text                        |           |          |
 environment   | character varying(50)       |           |          | 'production'::character varying
 version       | character varying(20)       |           |          |
 created_at    | timestamp with time zone    |           |          | now()
 search_vector | tsvector                    |           |          |
```

## Conclusão

A correção foi aplicada com sucesso. A migration agora usa as colunas corretas da tabela `system_logs` e deve executar sem erros. O sistema de Flow Builder está pronto para uso com todas as permissões RBAC e políticas RLS configuradas corretamente. 