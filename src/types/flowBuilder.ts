// Tipos para o Sistema de Flow Builder
export interface FlowNode {
  id: string
  type: FlowNodeType
  subtype?: string
  position: { x: number; y: number }
  config: Record<string, any>
  data?: Record<string, any>
  isActive?: boolean
  label?: string
  description?: string
}

export interface FlowConnection {
  id: string
  source: string
  sourceHandle?: string
  target: string
  targetHandle?: string
  condition?: Record<string, any>
  label?: string
}

export interface Flow {
  id: string
  name: string
  description?: string
  userId: string
  organizationId?: string
  isActive: boolean
  isTemplate: boolean
  category?: FlowCategory
  flowData: {
    nodes: FlowNode[]
    connections: FlowConnection[]
    variables?: Record<string, any>
    settings?: FlowSettings
  }
  variables: Record<string, any>
  settings: FlowSettings
  executionCount: number
  successCount: number
  errorCount: number
  lastExecutedAt?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface FlowExecution {
  id: string
  flowId: string
  triggerType: TriggerType
  triggerData: Record<string, any>
  status: ExecutionStatus
  inputData: Record<string, any>
  outputData: Record<string, any>
  contextVariables: Record<string, any>
  startedAt: string
  completedAt?: string
  durationMs?: number
  errorMessage?: string
  errorDetails?: Record<string, any>
  userId?: string
  sessionId?: string
  ipAddress?: string
  steps: FlowExecutionStep[]
}

export interface FlowExecutionStep {
  id: string
  executionId: string
  flowId: string
  nodeId: string
  stepOrder: number
  inputData: Record<string, any>
  outputData: Record<string, any>
  status: StepStatus
  startedAt?: string
  completedAt?: string
  durationMs?: number
  errorMessage?: string
  errorDetails?: Record<string, any>
  retryCount: number
  logs: LogEntry[]
}

export interface FlowTrigger {
  id: string
  flowId: string
  triggerType: TriggerType
  config: Record<string, any>
  webhookUrl?: string
  webhookSecret?: string
  cronExpression?: string
  timezone?: string
  nextRunAt?: string
  isActive: boolean
  triggerCount: number
  lastTriggeredAt?: string
  createdAt: string
  updatedAt: string
}

export interface FlowTemplate {
  id: string
  name: string
  description?: string
  category?: FlowCategory
  tags: string[]
  templateData: {
    nodes: FlowNode[]
    connections: FlowConnection[]
    variables?: Record<string, any>
    settings?: FlowSettings
  }
  isPublic: boolean
  isFeatured: boolean
  difficultyLevel: DifficultyLevel
  usageCount: number
  rating?: number
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface FlowVariable {
  id: string
  scope: VariableScope
  scopeId?: string
  variableName: string
  variableValue: any
  variableType: VariableType
  isSecret: boolean
  isReadonly: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
}

// ========================================
// NOVOS TIPOS PARA ENGINE DE EXECUÇÃO
// ========================================

export interface ExecutionContext {
  executionId: string
  flowId: string
  userId?: string
  variables: Map<string, any>
  inputData: Record<string, any>
  outputData: Record<string, any>
  logs: ExecutionLog[]
  startTime: number
  currentNode: FlowNode | null
  executionPath: ExecutionPathEntry[]
}

export interface ExecutionLog {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  nodeId?: string
  metadata?: Record<string, any>
}

export interface ExecutionPathEntry {
  nodeId: string
  nodeType: string
  timestamp: string
}

export interface NodeExecutionResult {
  success: boolean
  output: Record<string, any>
  error?: string
  duration?: number
  metadata?: Record<string, any>
}

export interface TriggerData {
  type: TriggerType
  data: Record<string, any>
  timestamp: string
  source?: string
}

export interface ScheduledTrigger {
  id: string
  flowId: string
  cronExpression: string
  timezone: string
  nextRunAt: string
  isActive: boolean
  lastRunAt?: string
  config: Record<string, any>
}

// Enums e tipos
export type FlowNodeType = 
  | 'trigger'
  | 'action' 
  | 'condition'
  | 'ai'
  | 'delay'
  | 'webhook'
  | 'integration'
  | 'data'
  | 'notification'
  | 'transform'

export type FlowCategory = 
  | 'customer_service'
  | 'marketing'
  | 'sales'
  | 'operations'
  | 'hr'
  | 'finance'
  | 'general'

export type TriggerType = 
  | 'webhook'
  | 'schedule'
  | 'manual'
  | 'message_received'
  | 'form_submitted'
  | 'api_call'
  | 'database_change'
  | 'file_upload'

export type ExecutionStatus = 
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'

export type StepStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'cancelled'

export type DifficultyLevel = 
  | 'beginner'
  | 'intermediate'
  | 'advanced'

export type VariableScope = 
  | 'global'
  | 'user'
  | 'flow'
  | 'execution'

export type VariableType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'date'

export interface FlowSettings {
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
  concurrency?: number
  errorHandling?: 'stop' | 'continue' | 'retry'
  logging?: 'none' | 'errors' | 'all'
  notifications?: {
    onSuccess?: boolean
    onFailure?: boolean
    channels?: string[]
  }
}

export interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  data?: Record<string, any>
}

// ========================================
// CONFIGURAÇÕES DE NÓS ESPECÍFICAS
// ========================================

export interface TriggerNodeConfig {
  triggerType: TriggerType
  conditions?: Record<string, any>
  schedule?: {
    cron?: string
    timezone?: string
    startDate?: string
    endDate?: string
  }
  webhook?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    authentication?: {
      type: 'none' | 'basic' | 'bearer' | 'api_key'
      credentials?: Record<string, string>
    }
  }
}

export interface ActionNodeConfig {
  actionType: string
  target: string
  parameters: Record<string, any>
  retry?: {
    attempts: number
    delay: number
    backoff?: 'linear' | 'exponential'
  }
  timeout?: number
}

export interface ConditionNodeConfig {
  conditions: Array<{
    field: string
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'regex'
    value: any
    logicalOperator?: 'AND' | 'OR'
  }>
  defaultPath?: 'true' | 'false'
}

export interface AINodeConfig {
  model?: string
  prompt: string
  maxTokens?: number
  temperature?: number
  contextVariables?: string[]
  outputFormat?: 'text' | 'json' | 'structured'
  fallback?: {
    enabled: boolean
    message?: string
    action?: 'continue' | 'stop' | 'retry'
  }
}

export interface DelayNodeConfig {
  delayType: 'fixed' | 'dynamic'
  duration?: number
  unit?: 'seconds' | 'minutes' | 'hours' | 'days'
  dynamicField?: string
  maxDelay?: number
}

export interface IntegrationNodeConfig {
  integrationType: 'whatsapp' | 'email' | 'yampi' | 'custom'
  action: string
  parameters: Record<string, any>
  mapping?: Record<string, string>
  authentication?: {
    type: string
    credentials: Record<string, string>
  }
}

// ========================================
// ESTADO DO EDITOR E MONITORAMENTO
// ========================================

export interface FlowEditorState {
  flow: Flow | null
  selectedNodes: string[]
  selectedConnections: string[]
  clipboard: {
    nodes: FlowNode[]
    connections: FlowConnection[]
  }
  viewport: {
    x: number
    y: number
    zoom: number
  }
  isDirty: boolean
  isExecuting: boolean
  executionProgress?: {
    currentStep: string
    totalSteps: number
    completedSteps: number
  }
}

export interface NodeTemplate {
  id: string
  type: FlowNodeType
  subtype?: string
  name: string
  description: string
  icon: string
  category: string
  defaultConfig: Record<string, any>
  inputs: Array<{
    id: string
    name: string
    type: string
    required: boolean
  }>
  outputs: Array<{
    id: string
    name: string
    type: string
  }>
  configSchema: Record<string, any> // JSON Schema para validação
}

export interface FlowValidationResult {
  isValid: boolean
  errors: Array<{
    nodeId?: string
    connectionId?: string
    type: 'error' | 'warning'
    message: string
    field?: string
  }>
  warnings: Array<{
    nodeId?: string
    connectionId?: string
    message: string
  }>
}

export interface FlowStats {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  avgDurationMs: number
  lastExecution?: string
  successRate: number
  executionsByDay: Array<{
    date: string
    count: number
    successCount: number
    failureCount: number
  }>
  popularNodes: Array<{
    nodeType: string
    count: number
  }>
  errorPatterns: Array<{
    errorType: string
    count: number
    nodes: string[]
  }>
}

export interface FlowExport {
  flow: Omit<Flow, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  version: string
  exportedAt: string
  exportedBy: string
  dependencies?: string[]
  metadata?: Record<string, any>
}

export interface FlowImportResult {
  success: boolean
  flowId?: string
  errors?: string[]
  warnings?: string[]
  skippedNodes?: string[]
  createdVariables?: string[]
}

export interface WebhookPayload {
  flowId: string
  triggerId: string
  timestamp: string
  data: Record<string, any>
  headers: Record<string, string>
  signature?: string
}

// ========================================
// TIPOS PARA SISTEMA DE TESTE E DEBUG
// ========================================

export interface FlowTestConfig {
  testData: Record<string, any>
  mockResponses?: Record<string, any>
  timeout?: number
  validateOutput?: boolean
  expectedOutput?: Record<string, any>
}

export interface FlowTestResult {
  success: boolean
  executionId: string
  duration: number
  steps: Array<{
    nodeId: string
    status: StepStatus
    input: Record<string, any>
    output: Record<string, any>
    error?: string
    duration: number
  }>
  logs: ExecutionLog[]
  errors: string[]
  warnings: string[]
}

export interface FlowDebugSession {
  id: string
  flowId: string
  userId: string
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  breakpoints: string[]
  currentStep?: string
  variables: Map<string, any>
  logs: ExecutionLog[]
  startedAt: string
  lastActivityAt: string
}

// ========================================
// TIPOS PARA BIBLIOTECA DE TEMPLATES
// ========================================

export interface FlowTemplateCategory {
  id: string
  name: string
  description: string
  icon: string
  templates: FlowTemplate[]
}

export interface TemplateUsage {
  templateId: string
  userId: string
  usedAt: string
  customizations?: Record<string, any>
}

// ========================================
// TIPOS PARA SISTEMA DE NOTIFICAÇÕES
// ========================================

export interface FlowNotification {
  id: string
  flowId: string
  executionId: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  data?: Record<string, any>
  createdAt: string
  readAt?: string
  userId: string
}

export interface NotificationChannel {
  id: string
  type: 'email' | 'webhook' | 'slack' | 'discord' | 'whatsapp'
  config: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
} 