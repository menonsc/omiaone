import { supabase } from './supabase'

// Tipos para Analytics
export interface AnalyticsEvent {
  eventType: 'user_login' | 'user_logout' | 'page_view' | 'feature_usage' | 'api_call' | 'error_occurred' | 'integration_sync' | 'message_sent' | 'document_upload' | 'campaign_sent' | 'agent_interaction' | 'system_alert'
  eventName: string
  eventCategory?: string
  eventLabel?: string
  eventValue?: number
  eventData?: Record<string, any>
  userId?: string
  sessionId?: string
  pageLoadTime?: number
  apiResponseTime?: number
}

export interface SystemLog {
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  severity: 'low' | 'medium' | 'high' | 'critical'
  component: string
  action: string
  message: string
  details?: Record<string, any>
  stackTrace?: string
  userId?: string
  sessionId?: string
  requestId?: string
}

export interface PerformanceMetric {
  metricName: string
  metricType: 'counter' | 'gauge' | 'histogram' | 'timer'
  value: number
  unit?: string
  component?: string
  tags?: Record<string, any>
}

export interface SystemAlert {
  alertType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description?: string
  component?: string
  affectedUsers?: number
  alertData?: Record<string, any>
}

export interface DashboardMetrics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  totalSessions: number
  totalPageViews: number
  whatsappMessages: number
  aiInteractions: number
  documentsUploaded: number
  campaignsSent: number
  totalApiCalls: number
  apiErrors: number
  systemErrors: number
  avgPageLoadTime: number
  avgApiResponseTime: number
}

class AnalyticsService {
  private sessionId: string
  private userId: string | null = null
  private deviceInfo: Record<string, string> = {}
  private performanceObserver: PerformanceObserver | null = null

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeDeviceInfo()
    this.initializePerformanceTracking()
    this.initializePageTracking()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeDeviceInfo() {
    if (typeof window !== 'undefined') {
      this.deviceInfo = {
        userAgent: navigator.userAgent,
        deviceType: this.getDeviceType(),
        browser: this.getBrowserName(),
        os: this.getOSName(),
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    }
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet'
    if (/mobile|iphone|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return 'mobile'
    return 'desktop'
  }

  private getBrowserName(): string {
    const ua = navigator.userAgent
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  private getOSName(): string {
    const ua = navigator.userAgent
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac')) return 'macOS'
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  private initializePerformanceTracking() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Track navigation timing
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
                          if (entry.entryType === 'navigation') {
                const navEntry = entry as PerformanceNavigationTiming
                this.trackPerformanceMetric({
                  metricName: 'page_load_time',
                  metricType: 'timer',
                  value: navEntry.loadEventEnd - navEntry.fetchStart,
                  unit: 'ms',
                  component: 'frontend'
                })
              }
          }
        })
        
        this.performanceObserver.observe({ entryTypes: ['navigation'] })
      } catch (error) {
        console.warn('Performance tracking not available:', error)
      }
    }
  }

  private initializePageTracking() {
    if (typeof window !== 'undefined') {
      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.trackEvent({
            eventType: 'page_view',
            eventName: 'page_focus',
            eventCategory: 'engagement'
          })
        }
      })

      // Track page unload
      window.addEventListener('beforeunload', () => {
        this.trackEvent({
          eventType: 'page_view',
          eventName: 'page_unload',
          eventCategory: 'engagement'
        })
      })
    }
  }

  setUserId(userId: string | null) {
    this.userId = userId
  }

  // Rastrear eventos de analytics
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const eventData = {
        user_id: event.userId || this.userId,
        event_type: event.eventType,
        event_name: event.eventName,
        event_category: event.eventCategory,
        event_label: event.eventLabel,
        event_value: event.eventValue,
        event_data: event.eventData || {},
        session_id: event.sessionId || this.sessionId,
        user_agent: this.deviceInfo.userAgent,
        device_type: this.deviceInfo.deviceType,
        browser: this.deviceInfo.browser,
        os: this.deviceInfo.os,
        page_load_time: event.pageLoadTime,
        api_response_time: event.apiResponseTime,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('analytics_events')
        .insert([eventData])

      if (error) {
        console.error('Error tracking event:', error)
      }
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  // Rastrear logs do sistema
  async logSystem(log: SystemLog): Promise<void> {
    try {
      const logData = {
        log_level: log.logLevel,
        severity: log.severity,
        component: log.component,
        action: log.action,
        message: log.message,
        details: log.details || {},
        stack_trace: log.stackTrace,
        user_id: log.userId || this.userId,
        session_id: log.sessionId || this.sessionId,
        request_id: log.requestId,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.VITE_APP_VERSION || '1.0.0'
      }

      const { error } = await supabase
        .from('system_logs')
        .insert([logData])

      if (error) {
        console.error('Error logging system event:', error)
      }
    } catch (error) {
      console.error('Failed to log system event:', error)
    }
  }

  // Rastrear métricas de performance
  async trackPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const metricData = {
        metric_name: metric.metricName,
        metric_type: metric.metricType,
        value: metric.value,
        unit: metric.unit,
        component: metric.component,
        tags: metric.tags || {},
        timestamp: new Date().toISOString()
      }

      const { error } = await supabase
        .from('performance_metrics')
        .insert([metricData])

      if (error) {
        console.error('Error tracking performance metric:', error)
      }
    } catch (error) {
      console.error('Failed to track performance metric:', error)
    }
  }

  // Criar alerta do sistema
  async createSystemAlert(alert: SystemAlert): Promise<void> {
    try {
      const alertData = {
        alert_type: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        component: alert.component,
        affected_users: alert.affectedUsers || 0,
        alert_data: alert.alertData || {}
      }

      const { error } = await supabase
        .from('system_alerts')
        .insert([alertData])

      if (error) {
        console.error('Error creating system alert:', error)
      }
    } catch (error) {
      console.error('Failed to create system alert:', error)
    }
  }

  // Buscar métricas do dashboard
  async getDashboardMetrics(days: number = 30): Promise<DashboardMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('analytics_daily_metrics')
        .select('*')
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching dashboard metrics:', error)
        return null
      }

      // Agregar métricas
      const metrics = data.reduce((acc, day) => ({
        totalUsers: acc.totalUsers + (day.total_users || 0),
        activeUsers: Math.max(acc.activeUsers, day.active_users || 0),
        newUsers: acc.newUsers + (day.new_users || 0),
        totalSessions: acc.totalSessions + (day.total_sessions || 0),
        totalPageViews: acc.totalPageViews + (day.total_page_views || 0),
        whatsappMessages: acc.whatsappMessages + (day.whatsapp_messages || 0),
        aiInteractions: acc.aiInteractions + (day.ai_interactions || 0),
        documentsUploaded: acc.documentsUploaded + (day.documents_uploaded || 0),
        campaignsSent: acc.campaignsSent + (day.campaigns_sent || 0),
        totalApiCalls: acc.totalApiCalls + (day.total_api_calls || 0),
        apiErrors: acc.apiErrors + (day.api_errors || 0),
        systemErrors: acc.systemErrors + (day.system_errors || 0),
        avgPageLoadTime: (acc.avgPageLoadTime + (day.avg_page_load_time || 0)) / 2,
        avgApiResponseTime: (acc.avgApiResponseTime + (day.avg_api_response_time || 0)) / 2
      }), {
        totalUsers: 0,
        activeUsers: 0,
        newUsers: 0,
        totalSessions: 0,
        totalPageViews: 0,
        whatsappMessages: 0,
        aiInteractions: 0,
        documentsUploaded: 0,
        campaignsSent: 0,
        totalApiCalls: 0,
        apiErrors: 0,
        systemErrors: 0,
        avgPageLoadTime: 0,
        avgApiResponseTime: 0
      })

      return metrics
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error)
      return null
    }
  }

  // Buscar logs do sistema
  async getSystemLogs(filters: {
    search?: string
    logLevel?: string
    component?: string
    dateFrom?: Date
    dateTo?: Date
    limit?: number
  } = {}): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('search_system_logs', {
          search_query: filters.search || '',
          log_level_filter: filters.logLevel || '',
          component_filter: filters.component || '',
          date_from: filters.dateFrom?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          date_to: filters.dateTo?.toISOString() || new Date().toISOString(),
          limit_count: filters.limit || 100
        })

      if (error) {
        console.error('Error fetching system logs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch system logs:', error)
      return []
    }
  }

  // Buscar alertas do sistema
  async getSystemAlerts(filters: {
    status?: string
    severity?: string
    component?: string
    limit?: number
  } = {}): Promise<any[]> {
    try {
      let query = supabase
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity)
      }

      if (filters.component) {
        query = query.eq('component', filters.component)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching system alerts:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch system alerts:', error)
      return []
    }
  }

  // Buscar métricas de performance
  async getPerformanceMetrics(filters: {
    metricName?: string
    component?: string
    dateFrom?: Date
    dateTo?: Date
    limit?: number
  } = {}): Promise<any[]> {
    try {
      let query = supabase
        .from('performance_metrics')
        .select('*')
        .order('timestamp', { ascending: false })

      if (filters.metricName) {
        query = query.eq('metric_name', filters.metricName)
      }

      if (filters.component) {
        query = query.eq('component', filters.component)
      }

      if (filters.dateFrom) {
        query = query.gte('timestamp', filters.dateFrom.toISOString())
      }

      if (filters.dateTo) {
        query = query.lte('timestamp', filters.dateTo.toISOString())
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching performance metrics:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error)
      return []
    }
  }

  // Reconhecer alerta
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_by: userId,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) {
        console.error('Error acknowledging alert:', error)
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
    }
  }

  // Resolver alerta
  async resolveAlert(alertId: string, userId: string, resolutionNotes?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({
          status: 'resolved',
          resolved_by: userId,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes
        })
        .eq('id', alertId)

      if (error) {
        console.error('Error resolving alert:', error)
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    }
  }

  // Métodos de conveniência para rastreamento comum
  trackPageView(pageName: string, additionalData?: Record<string, any>) {
    this.trackEvent({
      eventType: 'page_view',
      eventName: pageName,
      eventCategory: 'navigation',
      eventData: additionalData
    })
  }

  trackUserLogin(userId: string, method: string = 'email') {
    this.setUserId(userId)
    this.trackEvent({
      eventType: 'user_login',
      eventName: 'login_success',
      eventCategory: 'authentication',
      eventLabel: method
    })
  }

  trackUserLogout() {
    this.trackEvent({
      eventType: 'user_logout',
      eventName: 'logout',
      eventCategory: 'authentication'
    })
    this.setUserId(null)
  }

  trackFeatureUsage(featureName: string, action: string, value?: number) {
    this.trackEvent({
      eventType: 'feature_usage',
      eventName: featureName,
      eventCategory: 'features',
      eventLabel: action,
      eventValue: value
    })
  }

  trackApiCall(endpoint: string, method: string, responseTime: number, success: boolean) {
    this.trackEvent({
      eventType: success ? 'api_call' : 'error_occurred',
      eventName: `${method} ${endpoint}`,
      eventCategory: 'api',
      eventLabel: success ? 'success' : 'error',
      apiResponseTime: responseTime
    })
  }

  trackError(error: Error, component: string, action: string, additionalData?: Record<string, any>) {
    this.trackEvent({
      eventType: 'error_occurred',
      eventName: error.name,
      eventCategory: 'errors',
      eventLabel: component,
      eventData: {
        message: error.message,
        stack: error.stack,
        action,
        ...additionalData
      }
    })

    this.logSystem({
      logLevel: 'error',
      severity: 'medium',
      component,
      action,
      message: error.message,
      details: additionalData,
      stackTrace: error.stack
    })
  }
}

// Instância singleton
export const analytics = new AnalyticsService()

// Hooks para React
export const useAnalytics = () => {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackUserLogin: analytics.trackUserLogin.bind(analytics),
    trackUserLogout: analytics.trackUserLogout.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackApiCall: analytics.trackApiCall.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    logSystem: analytics.logSystem.bind(analytics)
  }
}

export default analytics 