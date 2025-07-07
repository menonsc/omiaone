# 🧪 Testes Automatizados

Este documento descreve como configurar e executar os testes automatizados do sistema de Agentes de IA.

## 📋 Visão Geral

O sistema implementa dois tipos principais de testes:

- **Testes Unitários**: Usando Vitest para testar stores e serviços
- **Testes E2E**: Usando Playwright para testar fluxos críticos

## 🚀 Configuração Inicial

### 1. Instalar Dependências

```bash
# Instalar todas as dependências do projeto
npm install

# Instalar os navegadores do Playwright
npm run playwright:install
```

### 2. Verificar Configuração

Após a instalação, verifique se os arquivos de configuração estão presentes:

- `vitest.config.ts` - Configuração dos testes unitários
- `playwright.config.ts` - Configuração dos testes E2E
- `src/test/setup.ts` - Setup dos testes unitários

## 🧪 Testes Unitários (Vitest)

### Como Executar

```bash
# Executar todos os testes unitários
npm run test

# Executar em modo watch (re-executa quando arquivos mudam)
npm run test:watch

# Executar com cobertura de código
npm run test:coverage
```

### Estrutura dos Testes Unitários

```
src/
├── store/
│   └── __tests__/
│       ├── authStore.test.ts
│       ├── chatStore.test.ts
│       └── whatsappStore.test.ts
├── services/
│   └── __tests__/
│       ├── analytics.test.ts
│       ├── gemini.test.ts
│       └── evolutionAPI.test.ts
└── test/
    └── setup.ts
```

### Exemplos de Testes Unitários

#### Testando um Store (Zustand)

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../authStore'

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: false })
  })

  it('deve inicializar com estado vazio', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.loading).toBe(false)
  })
})
```

#### Testando um Serviço

```typescript
import { describe, it, expect, vi } from 'vitest'
import { useAnalytics } from '../analytics'

describe('Analytics Service', () => {
  it('deve rastrear eventos', () => {
    const analytics = useAnalytics()
    expect(analytics.trackPageView).toBeInstanceOf(Function)
  })
})
```

## 🎭 Testes E2E (Playwright)

### Como Executar

```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar com interface gráfica
npm run test:e2e:ui

# Executar com navegador visível
npm run test:e2e:headed

# Executar testes específicos
npx playwright test auth.spec.ts
```

### Estrutura dos Testes E2E

```
tests/
├── e2e/
│   ├── auth.spec.ts           # Testes de autenticação
│   ├── chat.spec.ts           # Testes do chat com IA
│   ├── whatsapp.spec.ts       # Testes do WhatsApp
│   └── dashboard.spec.ts      # Testes do dashboard
└── README.md
```

### Exemplos de Testes E2E

#### Teste de Autenticação

```typescript
import { test, expect } from '@playwright/test'

test('deve fazer login com sucesso', async ({ page }) => {
  await page.goto('/')
  await page.fill('input[type="email"]', 'usuario@teste.com')
  await page.fill('input[type="password"]', 'senha123')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/dashboard')
})
```

#### Teste de Chat

```typescript
test('deve enviar mensagem para IA', async ({ page }) => {
  await page.goto('/chat')
  await page.fill('[data-testid="message-input"]', 'Olá!')
  await page.click('[data-testid="send-button"]')
  
  await expect(page.locator('.message')).toBeVisible()
})
```

## 📊 Cobertura de Código

### Visualizar Cobertura

```bash
# Gerar relatório de cobertura
npm run test:coverage

# Abrir relatório HTML (gerado em coverage/index.html)
open coverage/index.html
```

### Metas de Cobertura

- **Stores**: Mínimo 80% de cobertura
- **Serviços**: Mínimo 70% de cobertura
- **Componentes críticos**: Mínimo 60% de cobertura

## 🔧 Configuração de CI/CD

### GitHub Actions

Adicione ao `.github/workflows/tests.yml`:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run playwright:install
      - run: npm run test:e2e
```

## 📝 Convenções de Testes

### Nomenclatura

- Testes unitários: `*.test.ts`
- Testes E2E: `*.spec.ts`
- Arquivos de mock: `*.mock.ts`

### Estrutura de Teste

```typescript
describe('Componente/Serviço', () => {
  beforeEach(() => {
    // Setup antes de cada teste
  })

  describe('funcionalidade específica', () => {
    it('deve fazer algo específico', () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

### Boas Práticas

1. **Arrange, Act, Assert**: Organize seus testes em três seções claras
2. **Testes isolados**: Cada teste deve ser independente
3. **Nomes descritivos**: Use nomes que descrevam claramente o que está sendo testado
4. **Mocks mínimos**: Use mocks apenas quando necessário
5. **Dados de teste**: Use dados realistas mas não sensíveis

## 🚨 Fluxos Críticos Testados

### Autenticação
- ✅ Login com credenciais válidas
- ✅ Validação de campos obrigatórios
- ✅ Tratamento de erros de login
- ✅ Logout e limpeza de sessão

### Chat com IA
- ✅ Carregamento da interface
- ✅ Seleção de agentes
- ✅ Envio de mensagens
- ✅ Recebimento de respostas

### WhatsApp
- ✅ Listagem de instâncias
- ✅ Criação de novas instâncias
- ✅ Carregamento de conversas
- ✅ Responsividade mobile

### Performance
- ✅ Tempo de carregamento das páginas
- ✅ Ausência de erros JavaScript críticos
- ✅ Responsividade em diferentes dispositivos

## 🛠️ Troubleshooting

### Problemas Comuns

#### Vitest não encontra módulos
```bash
# Verificar se as dependências estão instaladas
npm install

# Limpar cache
rm -rf node_modules/.vite
```

#### Playwright não encontra navegadores
```bash
# Reinstalar navegadores
npm run playwright:install
```

#### Testes E2E falham por timeout
```typescript
// Aumentar timeout nos testes
test('teste longo', async ({ page }) => {
  test.setTimeout(60000) // 60 segundos
  // ...
})
```

### Logs de Debug

```bash
# Executar testes com logs detalhados
DEBUG=pw:api npm run test:e2e

# Vitest com logs
npm run test -- --reporter=verbose
```

## 📈 Métricas e Monitoramento

### Métricas Coletadas

- **Cobertura de código**: Percentual de código testado
- **Tempo de execução**: Duração dos testes
- **Taxa de sucesso**: Percentual de testes que passam
- **Performance**: Tempo de carregamento das páginas

### Relatórios

- **Vitest**: Relatório de cobertura em HTML
- **Playwright**: Relatório HTML com screenshots e vídeos
- **CI/CD**: Badges de status nos PRs

## 🎯 Próximos Passos

### Melhorias Planejadas

1. **Testes de Integração**: Testes com banco de dados real
2. **Testes de Carga**: Performance com múltiplos usuários
3. **Testes Visuais**: Screenshots automatizados para detectar mudanças visuais
4. **Testes de Acessibilidade**: Verificação de conformidade WCAG

### Adição de Novos Testes

Para adicionar novos testes:

1. **Unitários**: Crie arquivos `*.test.ts` na pasta `__tests__` do módulo
2. **E2E**: Crie arquivos `*.spec.ts` na pasta `tests/e2e/`
3. **Mocks**: Adicione mocks específicos em `src/test/mocks/`

---

**🎉 Com essa configuração, você tem um sistema robusto de testes que garante a qualidade e confiabilidade do seu sistema de Agentes de IA!** 