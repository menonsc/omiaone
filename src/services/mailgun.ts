import { EmailCampaign, EmailContact, EmailEvent } from '../types'

const MAILGUN_API_KEY = import.meta.env.VITE_MAILGUN_API_KEY || ''
const MAILGUN_DOMAIN = import.meta.env.VITE_MAILGUN_DOMAIN || ''
const MAILGUN_API_URL = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}`

export interface MailgunMessage {
  from: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
  'o:tracking': boolean
  'o:tracking-clicks': boolean
  'o:tracking-opens': boolean
  'o:tag'?: string[]
  'h:X-Mailgun-Variables'?: string
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  fromName?: string
  fromEmail?: string
  trackingData?: Record<string, any>
  tags?: string[]
}

export interface BulkEmailOptions {
  contacts: EmailContact[]
  subject: string
  html: string
  text?: string
  fromName?: string
  fromEmail?: string
  campaignId?: string
  tags?: string[]
}

class MailgunService {
  private defaultFromEmail = 'noreply@elevroi.com'
  private defaultFromName = 'ElevROI'

  /**
   * Envia um email individual
   */
  async sendEmail(options: SendEmailOptions): Promise<any> {
    try {
      const message: MailgunMessage = {
        from: `${options.fromName || this.defaultFromName} <${options.fromEmail || this.defaultFromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
        'o:tracking': true,
        'o:tracking-clicks': true,
        'o:tracking-opens': true
      }

      if (options.tags && options.tags.length > 0) {
        message['o:tag'] = options.tags
      }

      if (options.trackingData) {
        message['h:X-Mailgun-Variables'] = JSON.stringify(options.trackingData)
      }

             const formData = new FormData()
       formData.append('from', message.from)
       formData.append('to', message.to as string)
       formData.append('subject', message.subject)
       if (message.html) formData.append('html', message.html)
       if (message.text) formData.append('text', message.text)
       formData.append('o:tracking', 'true')
       formData.append('o:tracking-clicks', 'true')
       formData.append('o:tracking-opens', 'true')
       
       if (message['o:tag']) {
         message['o:tag'].forEach(tag => formData.append('o:tag', tag))
       }
       if (message['h:X-Mailgun-Variables']) {
         formData.append('h:X-Mailgun-Variables', message['h:X-Mailgun-Variables'])
       }

       const response = await fetch(`${MAILGUN_API_URL}/messages`, {
         method: 'POST',
         headers: {
           'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`
         },
         body: formData
       })

       if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`)
       }

       const result = await response.json()
       
       return {
         success: true,
         messageId: result.id,
         message: result.message
       }
     } catch (error: unknown) {
       const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
       console.error('Erro ao enviar email:', error)
       throw new Error(`Falha ao enviar email: ${errorMessage}`)
    }
  }

  /**
   * Envia emails em massa (campanhas)
   */
  async sendBulkEmail(options: BulkEmailOptions): Promise<any[]> {
    try {
      const results = []
      const batchSize = 1000 // Mailgun permite até 1000 destinatários por request

      // Divide os contatos em lotes
      for (let i = 0; i < options.contacts.length; i += batchSize) {
        const batch = options.contacts.slice(i, i + batchSize)
        const recipients = batch.map(contact => contact.email)

        const message: MailgunMessage = {
          from: `${options.fromName || this.defaultFromName} <${options.fromEmail || this.defaultFromEmail}>`,
          to: recipients,
          subject: options.subject,
          html: options.html,
          text: options.text || this.stripHtml(options.html),
          'o:tracking': true,
          'o:tracking-clicks': true,
          'o:tracking-opens': true
        }

        const tags = options.tags || []
        if (options.campaignId) {
          tags.push(`campaign_${options.campaignId}`)
        }
        tags.push('bulk_email')

        if (tags.length > 0) {
          message['o:tag'] = tags
        }

                 const formData = new FormData()
         formData.append('from', message.from)
         recipients.forEach(email => formData.append('to', email))
         formData.append('subject', message.subject)
         if (message.html) formData.append('html', message.html)
         if (message.text) formData.append('text', message.text)
         formData.append('o:tracking', 'true')
         formData.append('o:tracking-clicks', 'true')
         formData.append('o:tracking-opens', 'true')
         
         if (message['o:tag']) {
           message['o:tag'].forEach(tag => formData.append('o:tag', tag))
         }

         const response = await fetch(`${MAILGUN_API_URL}/messages`, {
           method: 'POST',
           headers: {
             'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`
           },
           body: formData
         })

         if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`)
         }

         const result = await response.json()
         results.push({
           batchIndex: Math.floor(i / batchSize),
           recipients: recipients.length,
           messageId: result.id,
           message: result.message
         })
       }

       return results
     } catch (error: unknown) {
       const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
       console.error('Erro ao enviar emails em massa:', error)
       throw new Error(`Falha ao enviar emails em massa: ${errorMessage}`)
    }
  }

  /**
   * Obtém estatísticas de uma campanha específica
   */
  async getCampaignStats(campaignId: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const tags = [`campaign_${campaignId}`]
      const params: any = {
        tag: tags.join(','),
        limit: 300
      }

      if (startDate) {
        params.begin = startDate.toISOString()
      }
      if (endDate) {
        params.end = endDate.toISOString()
      }

             const url = new URL(`${MAILGUN_API_URL}/stats/total`)
       Object.keys(params).forEach(key => {
         url.searchParams.append(key, params[key])
       })

       const response = await fetch(url.toString(), {
         method: 'GET',
         headers: {
           'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`
         }
       })

       if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`)
       }

       const stats = await response.json()
       
       return this.parseStats(stats.items || [])
     } catch (error: unknown) {
       const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
       console.error('Erro ao obter estatísticas:', error)
       throw new Error(`Falha ao obter estatísticas: ${errorMessage}`)
    }
  }

  /**
   * Obtém eventos de email (opens, clicks, bounces, etc.)
   */
  async getEmailEvents(campaignId?: string, limit = 300): Promise<any[]> {
    try {
      const params: any = { limit }
      
      if (campaignId) {
        params.tags = `campaign_${campaignId}`
      }

             const url = new URL(`${MAILGUN_API_URL}/events`)
       Object.keys(params).forEach(key => {
         url.searchParams.append(key, params[key])
       })

       const response = await fetch(url.toString(), {
         method: 'GET',
         headers: {
           'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`
         }
       })

       if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`)
       }

       const events = await response.json()
       return events.items || []
     } catch (error: unknown) {
       const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
       console.error('Erro ao obter eventos:', error)
       throw new Error(`Falha ao obter eventos: ${errorMessage}`)
    }
  }

  /**
   * Valida um endereço de email
   */
     async validateEmail(email: string): Promise<boolean> {
     try {
       const response = await fetch(`https://api.mailgun.net/v4/address/validate?address=${encodeURIComponent(email)}`, {
         method: 'GET',
         headers: {
           'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`
         }
       })

       if (!response.ok) {
         return false
       }

       const result = await response.json()
       return result.is_valid || false
     } catch (error: unknown) {
       console.error('Erro ao validar email:', error)
       return false
     }
   }

  /**
   * Cria um template de email personalizado
   */
  createEmailTemplate(templateContent: string, variables: Record<string, any>): string {
    let html = templateContent

    // Substitui variáveis no formato {{variavel}}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      html = html.replace(regex, variables[key] || '')
    })

    return html
  }

  /**
   * Template padrão para recuperação de vendas
   */
  createSalesRecoveryTemplate(data: {
    customerName: string
    productName?: string
    discountPercent?: number
    urgencyMessage?: string
    ctaUrl: string
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Não perca essa oportunidade!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; }
          .cta-button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .discount { background: #ffc107; color: #212529; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; font-size: 18px; font-weight: bold; }
          .urgency { background: #dc3545; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .footer { background: #343a40; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Olá, ${data.customerName}!</h1>
            <p>Notamos que você demonstrou interesse em nossos produtos</p>
          </div>
          
          <div class="content">
            <h2>Ainda está pensando? Temos uma oferta especial para você! 💝</h2>
            
            ${data.productName ? `<p>O produto <strong>${data.productName}</strong> que você visualizou ainda está disponível!</p>` : ''}
            
            ${data.discountPercent ? `
              <div class="discount">
                🔥 OFERTA ESPECIAL: ${data.discountPercent}% de desconto exclusivo para você!
              </div>
            ` : ''}
            
            <p>Não deixe essa oportunidade passar. Nossa equipe está pronta para ajudar você a alcançar seus objetivos!</p>
            
            ${data.urgencyMessage ? `
              <div class="urgency">
                ⏰ ${data.urgencyMessage}
              </div>
            ` : ''}
            
            <div style="text-align: center;">
              <a href="${data.ctaUrl}" class="cta-button">🚀 Aproveitar Oferta Agora</a>
            </div>
            
            <p>Tem alguma dúvida? Nossa equipe está sempre disponível para ajudar!</p>
            
            <p>Atenciosamente,<br><strong>Equipe ElevROI</strong></p>
          </div>
          
          <div class="footer">
            <p>ElevROI - Elevando seu retorno sobre investimento</p>
            <p>Se você não deseja mais receber esses emails, <a href="{{unsubscribe_url}}" style="color: #ffc107;">clique aqui</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Remove tags HTML de uma string
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  }

  /**
   * Processa estatísticas do Mailgun
   */
  private parseStats(items: any[]): any {
    const stats = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      complained: 0,
      unsubscribed: 0
    }

    items.forEach(item => {
      stats.sent += item.sent || 0
      stats.delivered += item.delivered || 0
      stats.opened += item.opened || 0
      stats.clicked += item.clicked || 0
      stats.bounced += item.bounced || 0
      stats.complained += item.complained || 0
      stats.unsubscribed += item.unsubscribed || 0
    })

    // Calcula taxas
    const deliveredCount = stats.delivered || 1 // Evita divisão por zero
    
    return {
      ...stats,
      open_rate: stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0,
      click_rate: stats.delivered > 0 ? (stats.clicked / stats.delivered) * 100 : 0,
      bounce_rate: stats.sent > 0 ? (stats.bounced / stats.sent) * 100 : 0
    }
  }
}

export const mailgunService = new MailgunService()
export default mailgunService 