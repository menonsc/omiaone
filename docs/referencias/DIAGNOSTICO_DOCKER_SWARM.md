# 🔍 Diagnóstico: Erro de Agendamento Docker Swarm

## ❌ **Erro atual:**
```
Error grabbing logs: rpc error: code = Unknown desc = warning: incomplete log stream. 
some logs could not be retrieved for the following reasons: 
task r8dr35r53uogr6yqfz6av2mcd has not been scheduled
task tah2r38buv2cd8c0m95ih9zrv has not been scheduled
```

## 🔍 **Possíveis causas:**

### 1. **Recursos insuficientes**
- CPU ou RAM limitados
- Espaço em disco insuficiente
- Limites de containers

### 2. **Problema do nó Swarm**
- Nó manager com problemas
- Conectividade entre nós
- Estado do cluster

### 3. **Conflito de portas**
- Portas já em uso
- Conflito com outros serviços

## 🚀 **TESTE BÁSICO** (FAÇA PRIMEIRO)

### Arquivo: `portainer-stack-swarm-basico-teste.yml`

**Stack de teste com apenas 3 serviços básicos:**
- Frontend nginx (sem comandos)
- PostgreSQL básico
- Grafana básico

### 🔄 **Como testar:**
1. **No Portainer**: Stacks → Sua stack → Editor
2. **Substitua** pelo conteúdo de `portainer-stack-swarm-basico-teste.yml`
3. **Update stack**
4. **Verifique** se os 3 serviços sobem com **1/1**

## 📊 **Resultados possíveis:**

### ✅ **Se funcionar (3/3 serviços online):**
- Problema era complexidade do stack anterior
- Use `portainer-stack-swarm-minimal-absoluto.yml`
- Adicione serviços gradualmente

### ❌ **Se não funcionar (erro persiste):**
- Problema no Docker Swarm ou VPS
- Siga "DIAGNÓSTICO AVANÇADO" abaixo

## 🔧 **DIAGNÓSTICO AVANÇADO**

### 1. **Verificar estado do Swarm:**
```bash
docker node ls
docker service ls
docker system df
```

### 2. **Verificar recursos:**
```bash
free -h
df -h
docker system prune -f
```

### 3. **Verificar portas em conflito:**
```bash
netstat -tlnp | grep ':80\|:5433\|:4000'
```

### 4. **Logs do Docker:**
```bash
journalctl -u docker -f
```

## 🎯 **SOLUÇÕES RÁPIDAS:**

### **Opção 1: Limpar e reiniciar**
```bash
docker system prune -f
docker service rm $(docker service ls -q) 2>/dev/null || true
```

### **Opção 2: Remover stack e recriar**
No Portainer:
1. Deletar stack atual
2. Criar nova stack com arquivo de teste
3. Verificar funcionamento

### **Opção 3: Usar modo standalone**
Se Swarm está com problema, pode usar Docker Compose normal:
```bash
docker swarm leave --force
```

## 📋 **CHECKLIST DE VERIFICAÇÃO:**

- [ ] VPS tem recursos suficientes (RAM > 2GB)
- [ ] Espaço em disco > 10GB livre
- [ ] Portas 80, 4000, 5433 livres
- [ ] Docker Swarm ativo: `docker node ls`
- [ ] Rede "network_public" existe
- [ ] Stack de teste funciona

## 🆘 **SE NADA FUNCIONAR:**

### **Última alternativa - Reset completo:**
```bash
# Parar tudo
docker stack rm sua-stack
docker swarm leave --force

# Reiniciar Docker
sudo systemctl restart docker

# Recriar Swarm
docker swarm init

# Recriar rede
docker network create --driver overlay network_public

# Testar stack básica
```

## 📞 **PRÓXIMOS PASSOS:**

1. **PRIMEIRO**: Teste o stack básico (`portainer-stack-swarm-basico-teste.yml`)
2. **Se funcionar**: Use versão mínima completa
3. **Se não funcionar**: Execute diagnóstico avançado
4. **Informe**: Resultado dos testes para próxima solução 