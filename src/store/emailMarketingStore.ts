import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  EmailMarketingState, 
  EmailCampaign, 
  EmailTemplate, 
  EmailContact, 
  EmailSegment, 
  SalesRecoveryFlow,
  EmailCampaignStats 
} from '../types'

export const useEmailMarketingStore = create<EmailMarketingState>()(
  persist(
    (set, get) => ({
      campaigns: [],
      templates: [],
      contacts: [],
      segments: [],
      salesFlows: [],
      currentCampaign: null,
      isLoading: false,
      stats: {
        totalContacts: 0,
        activeCampaigns: 0,
        totalSent: 0,
        averageOpenRate: 0,
        revenueRecovered: 0
      },

      // Fetch Campaigns
      fetchCampaigns: async () => {
        set({ isLoading: true })
        try {
          // Simular carregamento
          await new Promise(resolve => setTimeout(resolve, 500))
          set({ isLoading: false })
        } catch (error) {
          console.error('Erro ao buscar campanhas:', error)
          set({ isLoading: false })
        }
      },

      // Create Campaign
      createCampaign: async (campaignData) => {
        try {
          const newCampaign: EmailCampaign = {
            id: Date.now().toString(),
            ...campaignData,
            stats: {
              sent: 0,
              delivered: 0,
              opened: 0,
              clicked: 0,
              bounced: 0,
              complained: 0,
              unsubscribed: 0,
              open_rate: 0,
              click_rate: 0,
              bounce_rate: 0
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          set(state => ({
            campaigns: [newCampaign, ...state.campaigns]
          }))

          return newCampaign
        } catch (error) {
          console.error('Erro ao criar campanha:', error)
          throw error
        }
      },

      // Fetch Templates
      fetchTemplates: async () => {
        try {
          // Dados mock para demonstração
          const mockTemplates: EmailTemplate[] = [
            {
              id: '1',
              name: 'Template de Recuperação de Vendas',
              subject: 'Não perca essa oportunidade! {{discount}}% de desconto',
              content: `
                <html>
                  <body style="font-family: Arial, sans-serif;">
                    <h2>Olá, {{customer_name}}!</h2>
                    <p>Notamos que você demonstrou interesse em nossos produtos.</p>
                    <div style="background: #f39c12; padding: 20px; text-align: center;">
                      <h3>{{discount}}% de desconto exclusivo!</h3>
                    </div>
                    <p>{{product_name}} está esperando por você!</p>
                    <a href="{{cta_url}}" style="background: #27ae60; color: white; padding: 15px 30px; text-decoration: none;">
                      Aproveitar Oferta
                    </a>
                  </body>
                </html>
              `,
              type: 'sales_recovery',
              variables: ['customer_name', 'discount', 'product_name', 'cta_url'],
              created_by: 'demo',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]
          set({ templates: mockTemplates })
        } catch (error) {
          console.error('Erro ao buscar templates:', error)
        }
      },

      // Fetch Contacts
      fetchContacts: async () => {
        try {
          // Dados mock para demonstração
          const mockContacts: EmailContact[] = [
            {
              id: '1',
              email: 'cliente@exemplo.com',
              first_name: 'João',
              last_name: 'Silva',
              phone: '+5511999999999',
              tags: ['prospect', 'interessado'],
              custom_fields: {},
              status: 'subscribed',
              source: 'manual',
              last_activity: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              email: 'maria@exemplo.com',
              first_name: 'Maria',
              last_name: 'Santos',
              phone: '+5511888888888',
              tags: ['cliente'],
              custom_fields: {},
              status: 'subscribed',
              source: 'whatsapp',
              last_activity: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]
          set({ contacts: mockContacts })
        } catch (error) {
          console.error('Erro ao buscar contatos:', error)
        }
      },

      // Fetch Segments
      fetchSegments: async () => {
        try {
          set({ segments: [] })
        } catch (error) {
          console.error('Erro ao buscar segmentos:', error)
        }
      },

      // Fetch Sales Flows
      fetchSalesFlows: async () => {
        try {
          set({ salesFlows: [] })
        } catch (error) {
          console.error('Erro ao buscar fluxos:', error)
        }
      },

      // Update Campaign
      updateCampaign: async (id, updates) => {
        try {
          set(state => ({
            campaigns: state.campaigns.map(campaign =>
              campaign.id === id ? { ...campaign, ...updates } : campaign
            )
          }))
        } catch (error) {
          console.error('Erro ao atualizar campanha:', error)
          throw error
        }
      },

      // Delete Campaign
      deleteCampaign: async (id) => {
        try {
          set(state => ({
            campaigns: state.campaigns.filter(campaign => campaign.id !== id)
          }))
        } catch (error) {
          console.error('Erro ao deletar campanha:', error)
          throw error
        }
      },

      // Send Campaign
      sendCampaign: async (id) => {
        try {
          console.log('Enviando campanha:', id)
          return []
        } catch (error) {
          console.error('Erro ao enviar campanha:', error)
          throw error
        }
      },

      // Template Methods
      createTemplate: async (templateData) => {
        const template: EmailTemplate = {
          id: Date.now().toString(),
          ...templateData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        set(state => ({ templates: [template, ...state.templates] }))
        return template
      },

      updateTemplate: async (id, updates) => {
        set(state => ({
          templates: state.templates.map(template =>
            template.id === id ? { ...template, ...updates } : template
          )
        }))
      },

      deleteTemplate: async (id) => {
        set(state => ({
          templates: state.templates.filter(template => template.id !== id)
        }))
      },

      // Contact Methods
      createContact: async (contactData) => {
        const contact: EmailContact = {
          id: Date.now().toString(),
          ...contactData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        set(state => ({ contacts: [contact, ...state.contacts] }))
        return contact
      },

      updateContact: async (id, updates) => {
        set(state => ({
          contacts: state.contacts.map(contact =>
            contact.id === id ? { ...contact, ...updates } : contact
          )
        }))
      },

      deleteContact: async (id) => {
        set(state => ({
          contacts: state.contacts.filter(contact => contact.id !== id)
        }))
      },

      importContacts: async (contactsData) => {
        const contacts = contactsData.map(data => ({
          id: Date.now().toString() + Math.random(),
          email: data.email || '',
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          phone: data.phone || null,
          tags: data.tags || [],
          custom_fields: data.custom_fields || {},
          status: 'subscribed' as const,
          source: 'import' as const,
          last_activity: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
        
        set(state => ({ contacts: [...contacts, ...state.contacts] }))
        return { imported: contacts.length, total: contactsData.length }
      },

      // Segment Methods
      createSegment: async (segmentData) => {
        const segment: EmailSegment = {
          id: Date.now().toString(),
          ...segmentData,
          contact_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        set(state => ({ segments: [segment, ...state.segments] }))
        return segment
      },

      updateSegment: async (id, updates) => {
        set(state => ({
          segments: state.segments.map(segment =>
            segment.id === id ? { ...segment, ...updates } : segment
          )
        }))
      },

      deleteSegment: async (id) => {
        set(state => ({
          segments: state.segments.filter(segment => segment.id !== id)
        }))
      },

      // Sales Flow Methods
      createSalesFlow: async (flowData) => {
        const flow: SalesRecoveryFlow = {
          id: Date.now().toString(),
          ...flowData,
          steps: [],
          stats: {
            triggered: 0,
            completed: 0,
            converted: 0,
            revenue_recovered: 0,
            conversion_rate: 0
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        set(state => ({ salesFlows: [flow, ...state.salesFlows] }))
        return flow
      },

      updateSalesFlow: async (id, updates) => {
        set(state => ({
          salesFlows: state.salesFlows.map(flow =>
            flow.id === id ? { ...flow, ...updates } : flow
          )
        }))
      },

      deleteSalesFlow: async (id) => {
        set(state => ({
          salesFlows: state.salesFlows.filter(flow => flow.id !== id)
        }))
      },

      // Get Campaign Stats
      getCampaignStats: async (id) => {
        return {
          sent: Math.floor(Math.random() * 1000),
          delivered: Math.floor(Math.random() * 950),
          opened: Math.floor(Math.random() * 400),
          clicked: Math.floor(Math.random() * 100),
          bounced: Math.floor(Math.random() * 50),
          complained: Math.floor(Math.random() * 10),
          unsubscribed: Math.floor(Math.random() * 20),
          open_rate: Math.random() * 50,
          click_rate: Math.random() * 15,
          bounce_rate: Math.random() * 5
        }
      },

      // Get Overall Stats
      getOverallStats: async () => {
        const { campaigns, contacts } = get()
        set({
          stats: {
            totalContacts: contacts.length,
            activeCampaigns: campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length,
            totalSent: Math.floor(Math.random() * 10000),
            averageOpenRate: Math.random() * 30 + 15, // 15-45%
            revenueRecovered: Math.random() * 50000
          }
        })
      }
    }),
    {
      name: 'email-marketing-store'
    }
  )
)

export default useEmailMarketingStore 