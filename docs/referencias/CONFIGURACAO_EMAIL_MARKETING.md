# Configuração do Email Marketing

## Visão Geral

O sistema de Email Marketing integra o Mailgun para envio de emails em massa, recuperação de vendas e automações. Esta documentação detalha como configurar e usar todas as funcionalidades.

## Pré-requisitos

### 1. Conta no Mailgun
- Crie uma conta em [mailgun.com](https://mailgun.com)
- Configure seu domínio para envio de emails
- Obtenha sua API Key e Domain

### 2. Configuração do Domínio
1. Acesse o painel do Mailgun
2. Adicione seu domínio (ex: emails.seusite.com)
3. Configure os registros DNS conforme instruções
4. Verifique a validação do domínio

## Configuração das Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Mailgun Configuration
VITE_MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_MAILGUN_DOMAIN=emails.seusite.com
```

### Como obter essas informações:

1. **VITE_MAILGUN_API_KEY**: 
   - Entre no painel do Mailgun
   - Vá em "Settings" > "API Keys"
   - Copie a "Private API key"

2. **VITE_MAILGUN_DOMAIN**:
   - No painel do Mailgun, vá em "Domains"
   - Use o domínio que você configurou

## Configuração do Banco de Dados

Execute a migração do banco de dados:

```bash
# Se usando Supabase local
supabase db reset

# Ou aplicar apenas a migração de email marketing
supabase db push
```

As seguintes tabelas serão criadas:
- `email_campaigns` - Campanhas de email
- `email_templates` - Templates reutilizáveis
- `email_contacts` - Lista de contatos
- `email_segments` - Segmentação de público
- `sales_recovery_flows` - Fluxos de recuperação
- `email_events` - Tracking de eventos

## Funcionalidades Disponíveis

### 1. Campanhas de Email
- ✅ Criação de campanhas
- ✅ Envio em massa via Mailgun
- ✅ Tracking de abertura e cliques
- ✅ Segmentação de público
- ✅ Agendamento de envios

### 2. Gestão de Contatos
- ✅ Adição manual de contatos
- ✅ Importação em massa
- ✅ Validação de emails via Mailgun
- ✅ Gestão de status (inscrito, descadastrado, etc.)
- ✅ Tags e campos customizados

### 3. Templates de Email
- ✅ Templates reutilizáveis
- ✅ Sistema de variáveis
- ✅ Template padrão para recuperação de vendas
- ✅ Editor de conteúdo HTML

### 4. Recuperação de Vendas
- ✅ Fluxos automatizados
- ✅ Múltiplos triggers (carrinho abandonado, cliente inativo, etc.)
- ✅ Sequência de emails com delays
- ✅ Tracking de conversões

### 5. Analytics e Relatórios
- ✅ Métricas de campanhas
- ✅ Taxa de abertura e cliques
- ✅ Estatísticas de recuperação
- ✅ Integração com dados do Mailgun

## Como Usar

### 1. Acessar o Email Marketing
1. Entre no sistema
2. Clique em "Email Marketing" no menu lateral
3. Explore as abas: Campanhas, Contatos, Templates, Analytics

### 2. Criar sua Primeira Campanha
1. Clique em "Nova Campanha"
2. Preencha os dados básicos:
   - Nome da campanha
   - Assunto do email
   - De (nome e email)
   - Tipo (recuperação, promocional, etc.)
3. Escolha o público-alvo
4. Crie ou selecione um template
5. Revise e envie

### 3. Importar Contatos
1. Vá para a aba "Contatos"
2. Clique em "Importar"
3. Faça upload de um arquivo CSV com as colunas:
   - email (obrigatório)
   - first_name
   - last_name
   - phone
   - tags (separados por vírgula)

### 4. Criar Templates
1. Vá para a aba "Templates"
2. Clique em "Criar Template"
3. Use variáveis como `{{customer_name}}`, `{{discount}}`, etc.
4. Salve e ative o template

### 5. Configurar Recuperação de Vendas
1. Acesse "Fluxos de Recuperação"
2. Defina o trigger (ex: carrinho abandonado)
3. Configure a sequência de emails:
   - Email 1: Após 1 hora
   - Email 2: Após 24 horas
   - Email 3: Após 72 horas (com desconto)
4. Ative o fluxo

## Templates de Email Prontos

### Template de Recuperação de Vendas
O sistema inclui um template padrão com:
- Design responsivo
- Campos de personalização
- Call-to-action destacado
- Seção de desconto
- Unsubscribe automático

### Variáveis Disponíveis
- `{{customer_name}}` - Nome do cliente
- `{{product_name}}` - Nome do produto
- `{{discount}}` - Percentual de desconto
- `{{cta_url}}` - Link de ação
- `{{urgency_message}}` - Mensagem de urgência
- `{{unsubscribe_url}}` - Link de descadastro

## Webhooks e Tracking

### Configuração de Webhooks (Opcional)
Para tracking avançado, configure webhooks no Mailgun:

1. No painel do Mailgun, vá em "Webhooks"
2. Adicione os endpoints:
   - `https://seusite.com/api/webhooks/mailgun/delivered`
   - `https://seusite.com/api/webhooks/mailgun/opened`
   - `https://seusite.com/api/webhooks/mailgun/clicked`

### Eventos Rastreados
- ✅ Email enviado
- ✅ Email entregue
- ✅ Email aberto
- ✅ Link clicado
- ✅ Email rejeitado (bounce)
- ✅ Reclamação de spam
- ✅ Descadastro

## Melhores Práticas

### 1. Gestão de Lista
- Sempre validar emails antes de adicionar
- Remover emails com bounce permanente
- Respeitar pedidos de descadastro
- Manter listas segmentadas

### 2. Conteúdo dos Emails
- Usar assuntos atrativos mas não spam
- Personalizar com nome do destinatário
- Incluir sempre link de descadastro
- Testar em diferentes dispositivos

### 3. Frequência de Envio
- Não enviar emails diariamente para a mesma lista
- Respeitar fuso horário dos destinatários
- Evitar horários de pico (segunda de manhã)
- Testar diferentes horários

### 4. Compliance e Privacidade
- Seguir LGPD para dados brasileiros
- Implementar double opt-in quando possível
- Manter histórico de consentimentos
- Facilitar processo de descadastro

## Troubleshooting

### Problemas Comuns

1. **Emails não chegando**
   - Verificar configuração DNS do domínio
   - Confirmar API Key e domínio corretos
   - Verificar se domínio está validado no Mailgun

2. **Taxa de entrega baixa**
   - Limpar lista de emails inválidos
   - Melhorar reputação do domínio
   - Verificar se está marcado como spam

3. **Erro de autenticação**
   - Verificar se VITE_MAILGUN_API_KEY está correto
   - Confirmar se API Key tem permissões necessárias

### Logs e Debugging
- Verificar console do navegador para erros
- Conferir logs do Mailgun no painel
- Monitorar métricas de entrega

## Limitações e Quotas

### Mailgun Free Tier
- 5.000 emails gratuitos por mês
- Após isso, pricing por volume
- Verificar limites atuais no painel

### Recomendações de Upgrade
- Para mais de 10.000 contatos: considerar plano pago
- Para envios diários: configurar IP dedicado
- Para grandes volumes: usar Mailgun Pro

## Próximos Passos

### Funcionalidades Futuras
- [ ] Editor visual de templates (drag-and-drop)
- [ ] A/B testing de campanhas
- [ ] Automações mais complexas
- [ ] Integração com CRM
- [ ] Relatórios avançados com gráficos
- [ ] Segmentação por comportamento

### Integrações Possíveis
- [ ] WhatsApp Business (já integrado no sistema)
- [ ] Google Analytics para tracking
- [ ] Zapier para automações
- [ ] Stripe para dados de vendas

## Suporte

Para dúvidas ou problemas:
1. Consulte a documentação do Mailgun
2. Verifique os logs de erro no console
3. Entre em contato com o suporte técnico

---

**Nota**: Esta funcionalidade está totalmente implementada e pronta para uso. Configure as variáveis de ambiente e comece a usar! 