# 🔐 Solução do Erro 403 - API Yampi

## 🚨 **Problema: "User does not have the right permissions"**

O erro 403 indica que suas **credenciais estão corretas**, mas sua conta **não tem permissões** para acessar os recursos da API Yampi.

```json
{
  "message": "User does not have the right permissions.",
  "status_code": 403
}
```

## ✅ **Progresso das Correções**

- ✅ **Erro 401 resolvido**: Headers User-Token e User-Secret-Key implementados
- 🔄 **Erro 403 atual**: Problema de permissões da conta

## 🔍 **Análise do Problema**

### **O que o erro 403 significa:**
- ✅ **Credenciais corretas**: Token e chave secreta estão válidos
- ❌ **Permissões insuficientes**: Conta não tem acesso liberado à API
- 🔒 **Restrição de plano**: Pode precisar de plano específico

### **Teste Progressivo Implementado:**
Agora o sistema testa múltiplos endpoints em ordem crescente de permissões:

1. 🟢 **`/merchants/me`** - Informações básicas da loja
2. 🟡 **`/catalog/products`** - Catálogo de produtos  
3. 🟡 **`/customers`** - Lista de clientes
4. 🔴 **`/orders`** - Lista de pedidos

## 🛠️ **Soluções Recomendadas**

### **1. Verificar Plano Yampi**
```
📋 Ação: Verificar se seu plano inclui acesso à API
🔗 Onde: Painel Yampi → Configurações → Plano
✅ Resultado: Confirmar se API está incluída
```

### **2. Contatar Suporte Yampi**
```
📞 Ação: Solicitar habilitação de acesso à API
📧 Como: Ticket de suporte ou chat do painel
📝 Solicitar: "Habilitação de acesso à API REST"
```

### **3. Regenerar Credenciais**
```
🔄 Ação: Gerar novas credenciais no painel
📍 Onde: Configurações → Integrações → API
🔑 Gerar: Novo User-Token e User-Secret-Key
```

### **4. Verificar Permissões Específicas**
```
⚙️ Ação: Confirmar permissões no painel da API
📋 Verificar: Quais recursos estão liberados
🎯 Solicitar: Permissões específicas se necessário
```

## 🧪 **Como Testar**

### **Opção 1: Teste Automático**
```bash
# Execute o projeto
npm run dev

# Acesse a página de teste
http://localhost:3000/yampi-test
```

### **Opção 2: Teste Manual com cURL**
```bash
# Testar endpoint básico
curl -X GET "https://api.dooki.com.br/v2/SEU_ALIAS/merchants/me" \
  -H "User-Token: SEU_TOKEN" \
  -H "User-Secret-Key: SUA_CHAVE_SECRETA"
```

## 📊 **Interpretação dos Resultados**

### **✅ Sucesso (Status 200)**
```
Endpoint funcionou! 
→ Sua conta tem permissão para este recurso
→ API está configurada corretamente
```

### **❌ Erro 403**
```
Endpoint bloqueado por permissões
→ Conta não tem acesso a este recurso específico
→ Contate o suporte Yampi
```

### **❌ Erro 401**
```
Credenciais inválidas
→ Verifique Token e Chave Secreta
→ Regenere as credenciais
```

## 🎯 **Testes Específicos**

Com o novo sistema de teste progressivo, você verá qual endpoint funciona:

```
🧪 Testando: Informações da Loja (Endpoint mais básico)
✅ Conectado com sucesso via Informações da Loja

ou

❌ Informações da Loja: Erro 403 - User does not have permissions
❌ Produtos: Erro 403 - User does not have permissions  
❌ Clientes: Erro 403 - User does not have permissions
❌ Pedidos: Erro 403 - User does not have permissions
```

## 📋 **Checklist de Verificação**

### **Antes de Contatar o Suporte:**
- [ ] Verificou se o plano inclui API
- [ ] Regenerou as credenciais
- [ ] Testou com `/yampi-test`
- [ ] Confirmou que erro mudou de 401 para 403
- [ ] Copiou corretamente o alias da loja

### **Informações para o Suporte Yampi:**
- [ ] Alias da sua loja
- [ ] Plano atual
- [ ] Erro específico (status 403)
- [ ] Que precisa de acesso à API REST
- [ ] Endpoints que precisa acessar

## 🚀 **Próximos Passos**

### **1. Teste Imediatamente**
```bash
# Rode o teste agora
npm run dev
# Acesse: http://localhost:3000/yampi-test
```

### **2. Se der 403:**
- 📞 **Contate o suporte Yampi**
- 📝 **Solicite habilitação da API**
- ⏱️ **Aguarde liberação (1-2 dias úteis)**

### **3. Se der sucesso:**
- ✅ **API funcionando!**
- 🔄 **Configure no sistema principal**
- 📊 **Explore seus dados**

## 📞 **Contatos Yampi**

- **Suporte**: Via painel da loja → Ajuda
- **Documentação**: https://docs.yampi.com.br
- **Chat**: Disponível no painel administrativo

## 💡 **Dica Final**

O erro 403 é **comum** e **esperado** para contas que ainda não têm acesso à API habilitado. 

**Não é um problema com nossa implementação** - é uma questão de permissões que precisa ser resolvida com a Yampi.

---

**Status**: Aguardando liberação de permissões da API Yampi ⏳ 