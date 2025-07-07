# 🚀 Implementação Fase 1: Fundação do Sistema de Monitoramento

## 📋 Visão Geral da Fase 1

Esta fase estabelece a fundação sólida para o sistema de monitoramento e observabilidade, implementando as ferramentas essenciais e integrando-as com o sistema existente.

## 🎯 Objetivos da Fase 1

1. **OpenTelemetry Setup**: Configurar tracing distribuído
2. **Sentry Integration**: Implementar error tracking e performance monitoring
3. **Métricas Customizadas**: Expandir o sistema de métricas existente
4. **Core Web Vitals**: Implementar métricas de UX críticas

## 🛠️ Implementação Técnica

### 1. OpenTelemetry Setup

#### 1.1 Instalação das Dependências

```bash
npm install @opentelemetry/api @opentelemetry/sdk-web @opentelemetry/instrumentation-document-load @opentelemetry/instrumentation-user-interaction @opentelemetry/instrumentation-fetch @opentelemetry/exporter-jaeger
```

#### 1.2 Configuração do OpenTelemetry

```typescript
// src/services/telemetry.ts
import { WebTracerProvider } from '@opentelemetry/sdk-web'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { JaegerExporter } from '@opentelemetry/exporter-jaeger'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { trace, metrics } from '@opentelemetry/api'

class TelemetryService {
  private provider: WebTracerProvider
  private tracer: any
  private meter: any

  constructor() {
    this.initializeTelemetry()
  }

  private initializeTelemetry() {
    // Configurar provider
    this.provider = new WebTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'cursor-platform',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      })
    })

    // Configurar exportador
    const exporter = new JaegerExporter({
      endpoint: process.env.VITE_OTEL_ENDPOINT || 'http://localhost:14268/api/traces'
    })

    // Configurar processador
    this.provider.addSpanProcessor(new BatchSpanProcessor(exporter))

    // Registrar instrumentações automáticas
    registerInstrumentations({
      instrumentations: [
        new DocumentLoadInstrumentation(),
        new UserInteractionInstrumentation(),
        new FetchInstrumentation({
          ignoreUrls: ['/health', '/metrics'],
          propagateTraceHeaderCorsUrls: [/.*/]
        })
      ]
    })

    // Registrar provider
    this.provider.register()

    // Configurar tracer e meter
    this.tracer = trace.getTracer('cursor-platform')
    this.meter = metrics.getMeter('cursor-platform')
  }

  // Métodos de conveniência
  startSpan(name: string, attributes?: Record<string, any>) {
    return this.tracer.startSpan(name, { attributes })
  }

  createCounter(name: string, description?: string) {
    return this.meter.createCounter(name, { description })
  }

  createHistogram(name: string, description?: string) {
    return this.meter.createHistogram(name, { description })
  }

  // Método para rastrear operações assíncronas
  async traceAsync<T>(
    name: string,
    operation: () => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    const span = this.startSpan(name, attributes)
    
    try {
      const result = await operation()
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      })
      span.recordException(error)
      throw error
    } finally {
      span.end()
    }
  }
}

export const telemetry = new TelemetryService()
```

### 2. Sentry Integration

#### 2.1 Instalação e Configuração

```bash
npm install @sentry/react @sentry/tracing
```

#### 2.2 Configuração do Sentry

```typescript
// src/services/sentry.ts
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router-dom'

class SentryService {
  initialize() {
    Sentry.init({
      dsn: process.env.VITE_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.VITE_APP_VERSION || '1.0.0',
      
      // Configurações de performance
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // Integrações
      integrations: [
        new BrowserTracing({
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes
          ),
          tracingOrigins: ['localhost', 'your-domain.com'],
        }),
        new Sentry.Replay({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      
      // Configurações de erro
      beforeSend(event, hint) {
        // Filtrar erros conhecidos
        if (hint.originalException?.message?.includes('ResizeObserver')) {
          return null
        }
        
        // Adicionar contexto adicional
        event.tags = {
          ...event.tags,
          component: 'frontend',
          version: process.env.VITE_APP_VERSION
        }
        
        return event
      },
      
      // Configurações de breadcrumbs
      beforeBreadcrumb(breadcrumb) {
        // Filtrar breadcrumbs sensíveis
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
          return null
        }
        
        return breadcrumb
      }
    })
  }

  // Métodos de conveniência
  captureException(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user
    })
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level)
  }

  setUser(user: { id: string; email: string; role?: string }) {
    Sentry.setUser(user)
  }

  setTag(key: string, value: string) {
    Sentry.setTag(key, value)
  }

  addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
    Sentry.addBreadcrumb(breadcrumb)
  }
}

export const sentry = new SentryService()
```

### 3. Métricas Customizadas Expandidas

#### 3.1 Core Web Vitals

```typescript
// src/services/webVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
import { telemetry } from './telemetry'

class WebVitalsService {
  private vitalsCounter: any
  private vitalsHistogram: any

  constructor() {
    this.vitalsCounter = telemetry.createCounter('web_vitals_total', 'Total de métricas Web Vitals')
    this.vitalsHistogram = telemetry.createHistogram('web_vitals_duration', 'Duração das métricas Web Vitals')
  }

  initialize() {
    // Largest Contentful Paint
    getLCP((metric) => {
      this.recordVital('lcp', metric.value, metric.rating)
    })

    // First Input Delay
    getFID((metric) => {
      this.recordVital('fid', metric.value, metric.rating)
    })

    // Cumulative Layout Shift
    getCLS((metric) => {
      this.recordVital('cls', metric.value, metric.rating)
    })

    // First Contentful Paint
    getFCP((metric) => {
      this.recordVital('fcp', metric.value, metric.rating)
    })

    // Time to First Byte
    getTTFB((metric) => {
      this.recordVital('ttfb', metric.value, metric.rating)
    })
  }

  private recordVital(name: string, value: number, rating: string) {
    const span = telemetry.startSpan(`web_vital.${name}`, {
      'web_vital.name': name,
      'web_vital.value': value,
      'web_vital.rating': rating
    })

    this.vitalsCounter.add(1, {
      name,
      rating,
      page: window.location.pathname
    })

    this.vitalsHistogram.record(value, {
      name,
      rating,
      page: window.location.pathname
    })

    span.end()
  }
}

export const webVitals = new WebVitalsService()
```

### 4. Configuração de Ambiente

#### 4.1 Environment Variables

```bash
# .env.local
# Sentry
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_SENTRY_ENVIRONMENT=development

# OpenTelemetry
VITE_OTEL_ENDPOINT=http://localhost:14268/api/traces
VITE_OTEL_SERVICE_NAME=cursor-platform

# Monitoring
VITE_MONITORING_ENABLED=true
VITE_PERFORMANCE_SAMPLING=1.0
VITE_ERROR_SAMPLING=1.0

# App Version
VITE_APP_VERSION=1.0.0
```

### 5. Testes para Fase 1

#### 5.1 Testes Unitários

```typescript
// src/services/__tests__/telemetry.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { telemetry } from '../telemetry'

describe('TelemetryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve criar spans corretamente', () => {
    const span = telemetry.startSpan('test_span', { test: 'value' })
    expect(span).toBeDefined()
  })

  it('deve rastrear operações assíncronas', async () => {
    const mockOperation = vi.fn().mockResolvedValue('success')
    
    const result = await telemetry.traceAsync(
      'test_operation',
      mockOperation,
      { test: 'value' }
    )
    
    expect(result).toBe('success')
    expect(mockOperation).toHaveBeenCalled()
  })
})
```

## 📊 Métricas de Sucesso da Fase 1

### Técnicas
- [ ] **Tracing Coverage**: 80% das operações críticas rastreadas
- [ ] **Error Capture Rate**: 95% dos erros capturados
- [ ] **Performance Metrics**: Core Web Vitals implementados
- [ ] **Zero Downtime**: Implementação sem impacto na performance

### Qualidade
- [ ] **Test Coverage**: 90% dos novos serviços testados
- [ ] **Documentation**: 100% dos novos recursos documentados
- [ ] **Error Handling**: Tratamento robusto de falhas
- [ ] **Performance Impact**: <5% de impacto na performance

## 🚀 Próximos Passos

1. **Implementar código**: Seguir as implementações acima
2. **Configurar ambiente**: Setup de Jaeger e Sentry
3. **Executar testes**: Validar funcionalidades
4. **Deploy gradual**: Implementar em ambiente de desenvolvimento
5. **Monitorar**: Verificar se tudo está funcionando
6. **Documentar**: Atualizar documentação
7. **Treinar equipe**: Capacitar desenvolvedores

---

**Status**: 🚧 Implementação em Andamento  
**Duração**: 2 semanas  
**Responsável**: Equipe de Desenvolvimento  
**Próxima Fase**: APM Avançado 