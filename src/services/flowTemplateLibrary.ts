import { supabase } from './supabase'
import { 
  FlowTemplate, 
  FlowTemplateCategory,
  FlowNode,
  FlowConnection,
  FlowCategory,
  DifficultyLevel
} from '../types/flowBuilder'

// ========================================
// BIBLIOTECA DE TEMPLATES PRÉ-CONSTRUÍDOS
// ========================================

class FlowTemplateLibrary {
  private templates: Map<string, FlowTemplate> = new Map()
  private categories: Map<string, FlowTemplateCategory> = new Map()

  constructor() {
    this.initializeTemplates()
  }

  // ========================================
  // INICIALIZAÇÃO DOS TEMPLATES
  // ========================================

  private initializeTemplates(): void {
    this.createCategories()
    this.createTemplates()
  }

  private createCategories(): void {
    const categories: FlowTemplateCategory[] = [
      {
        id: 'customer-service',
        name: 'Atendimento ao Cliente',
        description: 'Templates para automação de atendimento e suporte',
        icon: 'headphones',
        templates: []
      },
      {
        id: 'marketing',
        name: 'Marketing',
        description: 'Templates para campanhas e automação de marketing',
        icon: 'megaphone',
        templates: []
      },
      {
        id: 'sales',
        name: 'Vendas',
        description: 'Templates para qualificação e nutrição de leads',
        icon: 'trending-up',
        templates: []
      },
      {
        id: 'onboarding',
        name: 'Onboarding',
        description: 'Templates para integração e onboarding de usuários',
        icon: 'user-plus',
        templates: []
      },
      {
        id: 'notifications',
        name: 'Notificações',
        description: 'Templates para envio de notificações e alertas',
        icon: 'bell',
        templates: []
      }
    ]

    categories.forEach(category => {
      this.categories.set(category.id, category)
    })
  }

  private createTemplates(): void {
    // Template: Boas-vindas por WhatsApp
    const welcomeWhatsApp: FlowTemplate = {
      id: 'welcome-whatsapp',
      name: 'Boas-vindas WhatsApp',
      description: 'Envia mensagem de boas-vindas quando cliente inicia conversa',
      category: 'customer_service',
      tags: ['whatsapp', 'welcome', 'customer-service'],
      templateData: {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            subtype: 'message_received',
            position: { x: 100, y: 100 },
            config: {
              triggerType: 'message_received',
              conditions: {
                isFirstMessage: true
              }
            }
          },
          {
            id: 'condition-1',
            type: 'condition',
            subtype: 'field_check',
            position: { x: 300, y: 100 },
            config: {
              field: 'message.text',
              operator: 'contains',
              value: 'oi'
            }
          },
          {
            id: 'action-1',
            type: 'action',
            subtype: 'send_whatsapp',
            position: { x: 500, y: 50 },
            config: {
              message: 'Olá! Bem-vindo(a) à nossa empresa. Como posso ajudá-lo(a) hoje?',
              delay: 0
            }
          },
          {
            id: 'action-2',
            type: 'action',
            subtype: 'send_whatsapp',
            position: { x: 500, y: 150 },
            config: {
              message: 'Aguarde um momento, vou conectar você com um de nossos atendentes.',
              delay: 2000
            }
          }
        ],
        connections: [
          {
            id: 'conn-1',
            source: 'trigger-1',
            target: 'condition-1'
          },
          {
            id: 'conn-2',
            source: 'condition-1',
            target: 'action-1',
            condition: { result: true }
          },
          {
            id: 'conn-3',
            source: 'action-1',
            target: 'action-2'
          }
        ]
      },
      isPublic: true,
      isFeatured: true,
      difficultyLevel: 'beginner',
      usageCount: 0,
      rating: undefined,
      createdBy: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Template: Qualificação de Lead
    const leadQualification: FlowTemplate = {
      id: 'lead-qualification',
      name: 'Qualificação de Lead',
      description: 'Sistema automatizado para qualificar leads através de perguntas',
      category: 'sales',
      tags: ['lead', 'qualification', 'sales'],
      templateData: {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            subtype: 'webhook',
            position: { x: 100, y: 100 },
            config: {
              triggerType: 'webhook',
              webhookEvent: 'lead_created'
            }
          },
          {
            id: 'action-1',
            type: 'action',
            subtype: 'send_whatsapp',
            position: { x: 300, y: 100 },
            config: {
              message: 'Olá! Vi que você se interessou pelo nosso produto. Posso fazer algumas perguntas para entender melhor suas necessidades?',
              delay: 0
            }
          },
          {
            id: 'wait-1',
            type: 'action',
            subtype: 'wait',
            position: { x: 500, y: 100 },
            config: {
              delayType: 'fixed',
              duration: 300,
              unit: 'seconds'
            }
          },
          {
            id: 'action-2',
            type: 'action',
            subtype: 'send_whatsapp',
            position: { x: 700, y: 100 },
            config: {
              message: 'Qual é o tamanho da sua empresa? (1-10, 11-50, 51-200, 200+)',
              delay: 0
            }
          },
          {
            id: 'condition-1',
            type: 'condition',
            subtype: 'field_check',
            position: { x: 900, y: 100 },
            config: {
              field: 'response',
              operator: 'contains',
              value: '200+'
            }
          },
          {
            id: 'action-3',
            type: 'action',
            subtype: 'send_whatsapp',
            position: { x: 1100, y: 50 },
            config: {
              message: 'Perfeito! Você se encaixa no nosso plano Enterprise. Vou agendar uma demonstração.',
              delay: 0
            }
          },
          {
            id: 'action-4',
            type: 'action',
            subtype: 'send_whatsapp',
            position: { x: 1100, y: 150 },
            config: {
              message: 'Obrigado! Vou enviar informações sobre nossos planos adequados ao seu perfil.',
              delay: 0
            }
          }
        ],
        connections: [
          {
            id: 'conn-1',
            source: 'trigger-1',
            target: 'action-1'
          },
          {
            id: 'conn-2',
            source: 'action-1',
            target: 'wait-1'
          },
          {
            id: 'conn-3',
            source: 'wait-1',
            target: 'action-2'
          },
          {
            id: 'conn-4',
            source: 'action-2',
            target: 'condition-1'
          },
          {
            id: 'conn-5',
            source: 'condition-1',
            target: 'action-3',
            condition: { result: true }
          },
          {
            id: 'conn-6',
            source: 'condition-1',
            target: 'action-4',
            condition: { result: false }
          }
        ]
      },
      isPublic: true,
      isFeatured: true,
      difficultyLevel: 'intermediate',
      usageCount: 0,
      rating: undefined,
      createdBy: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Template: Campanha de Email Marketing
    const emailCampaign: FlowTemplate = {
      id: 'email-campaign',
      name: 'Campanha de Email Marketing',
      description: 'Sequência de emails para nutrir leads e converter vendas',
      category: 'marketing',
      tags: ['email', 'campaign', 'marketing'],
      templateData: {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            subtype: 'webhook',
            position: { x: 100, y: 100 },
            config: {
              triggerType: 'webhook',
              webhookEvent: 'lead_subscribed'
            }
          },
          {
            id: 'action-1',
            type: 'action',
            subtype: 'send_email',
            position: { x: 300, y: 100 },
            config: {
              template: 'welcome_email',
              subject: 'Bem-vindo! Aqui está seu presente',
              delay: 0
            }
          },
          {
            id: 'wait-1',
            type: 'action',
            subtype: 'wait',
            position: { x: 500, y: 100 },
            config: {
              delayType: 'fixed',
              duration: 24,
              unit: 'hours'
            }
          },
          {
            id: 'action-2',
            type: 'action',
            subtype: 'send_email',
            position: { x: 700, y: 100 },
            config: {
              template: 'educational_content',
              subject: 'Dica do dia: Como otimizar seus resultados',
              delay: 0
            }
          },
          {
            id: 'wait-2',
            type: 'action',
            subtype: 'wait',
            position: { x: 900, y: 100 },
            config: {
              delayType: 'fixed',
              duration: 48,
              unit: 'hours'
            }
          },
          {
            id: 'action-3',
            type: 'action',
            subtype: 'send_email',
            position: { x: 1100, y: 100 },
            config: {
              template: 'offer_email',
              subject: 'Oferta especial: 50% de desconto',
              delay: 0
            }
          }
        ],
        connections: [
          {
            id: 'conn-1',
            source: 'trigger-1',
            target: 'action-1'
          },
          {
            id: 'conn-2',
            source: 'action-1',
            target: 'wait-1'
          },
          {
            id: 'conn-3',
            source: 'wait-1',
            target: 'action-2'
          },
          {
            id: 'conn-4',
            source: 'action-2',
            target: 'wait-2'
          },
          {
            id: 'conn-5',
            source: 'wait-2',
            target: 'action-3'
          }
        ]
      },
      isPublic: true,
      isFeatured: true,
      difficultyLevel: 'intermediate',
      usageCount: 0,
      rating: undefined,
      createdBy: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Template: Onboarding de Usuário
    const userOnboarding: FlowTemplate = {
      id: 'user-onboarding',
      name: 'Onboarding de Usuário',
      description: 'Sequência de mensagens para integrar novos usuários',
      category: 'operations',
      tags: ['onboarding', 'user', 'welcome'],
      templateData: {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            subtype: 'webhook',
            position: { x: 100, y: 100 },
            config: {
              triggerType: 'webhook',
              webhookEvent: 'user_registered'
            }
          },
          {
            id: 'action-1',
            type: 'action',
            subtype: 'send_email',
            position: { x: 300, y: 100 },
            config: {
              template: 'welcome_email',
              subject: 'Bem-vindo! Vamos começar?',
              delay: 0
            }
          },
          {
            id: 'wait-1',
            type: 'action',
            subtype: 'wait',
            position: { x: 500, y: 100 },
            config: {
              delayType: 'fixed',
              duration: 2,
              unit: 'hours'
            }
          },
          {
            id: 'action-2',
            type: 'action',
            subtype: 'send_whatsapp',
            position: { x: 700, y: 100 },
            config: {
              message: 'Oi! Vi que você acabou de se cadastrar. Posso te ajudar com alguma dúvida?',
              delay: 0
            }
          },
          {
            id: 'wait-2',
            type: 'action',
            subtype: 'wait',
            position: { x: 900, y: 100 },
            config: {
              delayType: 'fixed',
              duration: 24,
              unit: 'hours'
            }
          },
          {
            id: 'action-3',
            type: 'action',
            subtype: 'send_email',
            position: { x: 1100, y: 100 },
            config: {
              template: 'tutorial_email',
              subject: 'Guia rápido: Primeiros passos',
              delay: 0
            }
          }
        ],
        connections: [
          {
            id: 'conn-1',
            source: 'trigger-1',
            target: 'action-1'
          },
          {
            id: 'conn-2',
            source: 'action-1',
            target: 'wait-1'
          },
          {
            id: 'conn-3',
            source: 'wait-1',
            target: 'action-2'
          },
          {
            id: 'conn-4',
            source: 'action-2',
            target: 'wait-2'
          },
          {
            id: 'conn-5',
            source: 'wait-2',
            target: 'action-3'
          }
        ]
      },
      isPublic: true,
      isFeatured: true,
      difficultyLevel: 'beginner',
      usageCount: 0,
      rating: undefined,
      createdBy: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Template: Notificação de Sistema
    const systemNotification: FlowTemplate = {
      id: 'system-notification',
      name: 'Notificação de Sistema',
      description: 'Envia notificações para diferentes canais baseado em eventos do sistema',
      category: 'operations',
      tags: ['notification', 'system', 'alert'],
      templateData: {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            subtype: 'webhook',
            position: { x: 100, y: 100 },
            config: {
              triggerType: 'webhook',
              webhookEvent: 'system_alert'
            }
          },
          {
            id: 'condition-1',
            type: 'condition',
            subtype: 'field_check',
            position: { x: 300, y: 100 },
            config: {
              field: 'alert.severity',
              operator: 'eq',
              value: 'critical'
            }
          },
          {
            id: 'action-1',
            type: 'action',
            subtype: 'send_whatsapp',
            position: { x: 500, y: 50 },
            config: {
              message: '🚨 ALERTA CRÍTICO: {{alert.message}} - Ação imediata necessária!',
              delay: 0
            }
          },
          {
            id: 'action-2',
            type: 'action',
            subtype: 'send_email',
            position: { x: 500, y: 150 },
            config: {
              template: 'system_alert',
              subject: 'Alerta do Sistema: {{alert.title}}',
              delay: 0
            }
          },
          {
            id: 'action-3',
            type: 'action',
            subtype: 'webhook',
            position: { x: 700, y: 100 },
            config: {
              url: '{{slack_webhook_url}}',
              method: 'POST',
              body: {
                text: 'Alerta do sistema: {{alert.message}}'
              }
            }
          }
        ],
        connections: [
          {
            id: 'conn-1',
            source: 'trigger-1',
            target: 'condition-1'
          },
          {
            id: 'conn-2',
            source: 'condition-1',
            target: 'action-1',
            condition: { result: true }
          },
          {
            id: 'conn-3',
            source: 'condition-1',
            target: 'action-2',
            condition: { result: false }
          },
          {
            id: 'conn-4',
            source: 'action-1',
            target: 'action-3'
          },
          {
            id: 'conn-5',
            source: 'action-2',
            target: 'action-3'
          }
        ]
      },
      isPublic: true,
      isFeatured: true,
      difficultyLevel: 'intermediate',
      usageCount: 0,
      rating: undefined,
      createdBy: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Adicionar templates ao mapa
    const allTemplates = [
      welcomeWhatsApp,
      leadQualification,
      emailCampaign,
      userOnboarding,
      systemNotification
    ]

    allTemplates.forEach(template => {
      this.templates.set(template.id, template)
    })

    // Atualizar categorias com templates
    this.updateCategoriesWithTemplates()
  }

  private updateCategoriesWithTemplates(): void {
    this.templates.forEach((template) => {
      if (template.category) {
        const category = this.categories.get(template.category)
        if (category) {
          category.templates.push(template)
        }
      }
    })
  }

  // ========================================
  // MÉTODOS PÚBLICOS
  // ========================================

  async getTemplates(filters: {
    category?: string
    difficulty?: DifficultyLevel
    isPublic?: boolean
    isFeatured?: boolean
    search?: string
    limit?: number
    offset?: number
  } = {}): Promise<FlowTemplate[]> {
    try {
      let query = supabase.from('flow_templates').select('*')

      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.difficulty) {
        query = query.eq('difficulty_level', filters.difficulty)
      }
      if (filters.isPublic !== undefined) {
        query = query.eq('is_public', filters.isPublic)
      }
      if (filters.isFeatured !== undefined) {
        query = query.eq('is_featured', filters.isFeatured)
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      query = query.order('usage_count', { ascending: false })

      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar templates:', error)
        return []
      }

      return data?.map(this.mapDatabaseToTemplate) || []
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
      return []
    }
  }

  async getTemplate(templateId: string): Promise<FlowTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('flow_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error) {
        console.error('Erro ao buscar template:', error)
        return null
      }

      return this.mapDatabaseToTemplate(data)
    } catch (error) {
      console.error('Erro ao buscar template:', error)
      return null
    }
  }

  async getCategories(): Promise<FlowTemplateCategory[]> {
    return Array.from(this.categories.values())
  }

  async getFeaturedTemplates(): Promise<FlowTemplate[]> {
    return this.getTemplates({ isFeatured: true, limit: 10 })
  }

  async getPopularTemplates(): Promise<FlowTemplate[]> {
    return this.getTemplates({ limit: 10 })
  }

  async createTemplate(template: Omit<FlowTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<FlowTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('flow_templates')
        .insert({
          name: template.name,
          description: template.description,
          category: template.category,
          tags: template.tags,
          template_data: template.templateData,
          is_public: template.isPublic,
          is_featured: template.isFeatured,
          difficulty_level: template.difficultyLevel,
          created_by: template.createdBy
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar template:', error)
        return null
      }

      return this.mapDatabaseToTemplate(data)
    } catch (error) {
      console.error('Erro ao criar template:', error)
      return null
    }
  }

  async updateTemplate(templateId: string, updates: Partial<FlowTemplate>): Promise<FlowTemplate | null> {
    try {
      const updateData: any = {}

      if (updates.name) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.category) updateData.category = updates.category
      if (updates.tags) updateData.tags = updates.tags
      if (updates.templateData) updateData.template_data = updates.templateData
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic
      if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured
      if (updates.difficultyLevel) updateData.difficulty_level = updates.difficultyLevel

      const { data, error } = await supabase
        .from('flow_templates')
        .update(updateData)
        .eq('id', templateId)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar template:', error)
        return null
      }

      return this.mapDatabaseToTemplate(data)
    } catch (error) {
      console.error('Erro ao atualizar template:', error)
      return null
    }
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('flow_templates')
        .delete()
        .eq('id', templateId)

      if (error) {
        console.error('Erro ao deletar template:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao deletar template:', error)
      return false
    }
  }

  async incrementUsageCount(templateId: string): Promise<void> {
    try {
      const { data: currentData } = await supabase
        .from('flow_templates')
        .select('usage_count')
        .eq('id', templateId)
        .single()

      if (currentData) {
        await supabase
          .from('flow_templates')
          .update({
            usage_count: (currentData.usage_count || 0) + 1
          })
          .eq('id', templateId)
      }
    } catch (error) {
      console.error('Erro ao incrementar contador de uso:', error)
    }
  }

  async rateTemplate(templateId: string, rating: number): Promise<boolean> {
    try {
      // Buscar rating atual
      const { data: currentData } = await supabase
        .from('flow_templates')
        .select('rating, usage_count')
        .eq('id', templateId)
        .single()

      if (!currentData) return false

      // Calcular novo rating médio
      const currentRating = currentData.rating || 0
      const usageCount = currentData.usage_count || 0
      const newRating = ((currentRating * usageCount) + rating) / (usageCount + 1)

      await supabase
        .from('flow_templates')
        .update({ rating: newRating })
        .eq('id', templateId)

      return true
    } catch (error) {
      console.error('Erro ao avaliar template:', error)
      return false
    }
  }

  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================

  private mapDatabaseToTemplate(data: any): FlowTemplate {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      tags: data.tags || [],
      templateData: data.template_data,
      isPublic: data.is_public,
      isFeatured: data.is_featured,
      difficultyLevel: data.difficulty_level,
      usageCount: data.usage_count || 0,
      rating: data.rating,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  // ========================================
  // MÉTODOS DE UTILIDADE
  // ========================================

  getTemplateById(templateId: string): FlowTemplate | undefined {
    return this.templates.get(templateId)
  }

  getTemplatesByCategory(category: string): FlowTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.category === category)
  }

  getTemplatesByDifficulty(difficulty: DifficultyLevel): FlowTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.difficultyLevel === difficulty)
  }

  searchTemplates(query: string): FlowTemplate[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.templates.values())
      .filter(template => 
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description?.toLowerCase().includes(lowerQuery) ||
        template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
  }
}

// ========================================
// EXPORTAÇÃO
// ========================================

export const flowTemplateLibrary = new FlowTemplateLibrary()
export default flowTemplateLibrary 