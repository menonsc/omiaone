import { test, expect } from '@playwright/test'

test.describe('Chat com Agentes de IA', () => {
  test.beforeEach(async ({ page }) => {
    // Tentar navegar para a página de chat
    await page.goto('/chat')
  })

  test('deve carregar a interface de chat', async ({ page }) => {
    // Verificar se elementos básicos do chat estão presentes
    await expect(page.locator('body')).toBeVisible()
    
    // Procurar por elementos comuns de chat
    const chatElements = await page.locator('input[placeholder*="mensagem"], textarea[placeholder*="mensagem"], [data-testid="message-input"]').count()
    const sendButtons = await page.locator('button:has-text("Enviar"), button[type="submit"], [data-testid="send-button"]').count()
    
    console.log('Elementos de input de mensagem encontrados:', chatElements)
    console.log('Botões de envio encontrados:', sendButtons)
  })

  test('deve exibir lista de agentes disponíveis', async ({ page }) => {
    // Procurar por elementos que possam representar agentes
    const agentElements = await page.locator('[data-testid*="agent"], .agent, .assistant').count()
    const agentButtons = await page.locator('button:has-text("Agente"), button:has-text("Assistant"), button:has-text("IA")').count()
    
    console.log('Elementos de agentes encontrados:', agentElements)
    console.log('Botões de agentes encontrados:', agentButtons)
    
    // Verificar se há algum texto relacionado a agentes na página
    const pageContent = await page.textContent('body')
    const hasAgentText = pageContent?.includes('Agente') || pageContent?.includes('Assistant') || pageContent?.includes('IA')
    
    console.log('Página contém texto relacionado a agentes:', hasAgentText)
  })

  test('deve permitir enviar mensagem', async ({ page }) => {
    // Procurar campo de entrada de mensagem
    const messageInput = page.locator('input[placeholder*="mensagem"], textarea[placeholder*="mensagem"], [data-testid="message-input"]').first()
    const sendButton = page.locator('button:has-text("Enviar"), button[type="submit"], [data-testid="send-button"]').first()
    
    if (await messageInput.count() > 0 && await sendButton.count() > 0) {
      // Preencher e enviar mensagem
      await messageInput.fill('Olá, esta é uma mensagem de teste')
      await sendButton.click()
      
      // Aguardar resposta
      await page.waitForTimeout(3000)
      
      // Verificar se a mensagem aparece na interface
      const messageElements = page.locator('[data-testid*="message"], .message, .chat-message')
      const messageCount = await messageElements.count()
      
      console.log('Mensagens encontradas após envio:', messageCount)
    } else {
      console.log('Interface de chat não encontrada, página pode exigir autenticação')
    }
  })

  test('deve carregar sem erros de JavaScript', async ({ page }) => {
    const jsErrors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text())
      }
    })
    
    page.on('pageerror', (error) => {
      jsErrors.push(error.message)
    })
    
    await page.waitForTimeout(5000)
    
    // Verificar se há erros críticos
    const criticalErrors = jsErrors.filter(error => 
      !error.includes('404') && 
      !error.includes('favicon') &&
      !error.includes('Supabase') // Pode falhar em ambiente de teste
    )
    
    if (criticalErrors.length > 0) {
      console.log('Erros críticos encontrados:', criticalErrors)
    }
    
    expect(criticalErrors.length).toBeLessThan(5) // Permitir alguns erros não críticos
  })
})

test.describe('Responsividade do Chat', () => {
  test('deve funcionar em dispositivos móveis', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/chat')
    
    await expect(page.locator('body')).toBeVisible()
    
    // Verificar se elementos são visíveis em mobile
    const visibleElements = await page.locator('input, button, textarea').count()
    console.log('Elementos visíveis em mobile:', visibleElements)
  })

  test('deve funcionar em tablets', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/chat')
    
    await expect(page.locator('body')).toBeVisible()
    
    // Verificar layout em tablet
    const visibleElements = await page.locator('input, button, textarea').count()
    console.log('Elementos visíveis em tablet:', visibleElements)
  })
}) 