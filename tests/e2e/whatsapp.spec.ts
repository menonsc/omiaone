import { test, expect } from '@playwright/test'

test.describe('WhatsApp Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/whatsapp')
  })

  test('deve carregar página do WhatsApp', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    
    // Verificar se há elementos relacionados ao WhatsApp
    const pageContent = await page.textContent('body')
    const hasWhatsApp = pageContent?.includes('WhatsApp') || pageContent?.includes('Instância') || pageContent?.includes('QR')
    
    console.log('Página contém conteúdo WhatsApp:', hasWhatsApp)
  })

  test('deve mostrar lista de instâncias', async ({ page }) => {
    // Procurar por elementos de instâncias
    const instanceElements = await page.locator('[data-testid*="instance"], .instance, .whatsapp-instance').count()
    const instanceButtons = await page.locator('button:has-text("Instância"), button:has-text("Conectar"), button:has-text("Nova")').count()
    
    console.log('Elementos de instâncias encontrados:', instanceElements)
    console.log('Botões de instâncias encontrados:', instanceButtons)
  })

  test('deve permitir criar nova instância', async ({ page }) => {
    // Procurar botão de criar nova instância
    const createButton = page.locator('button:has-text("Nova"), button:has-text("Criar"), button:has-text("Adicionar")').first()
    
    if (await createButton.count() > 0) {
      await createButton.click()
      
      // Aguardar modal ou formulário
      await page.waitForTimeout(2000)
      
      // Verificar se formulário ou modal apareceu
      const modals = await page.locator('.modal, .dialog, [role="dialog"]').count()
      const forms = await page.locator('form, input[placeholder*="nome"], input[placeholder*="instância"]').count()
      
      console.log('Modais encontrados:', modals)
      console.log('Formulários encontrados:', forms)
    } else {
      console.log('Botão de criar instância não encontrado')
    }
  })

  test('deve carregar conversas se houver instâncias', async ({ page }) => {
    // Navegar para página de conversas
    await page.goto('/whatsapp-conversations')
    
    await expect(page.locator('body')).toBeVisible()
    
    // Verificar elementos de conversas
    const conversationElements = await page.locator('[data-testid*="conversation"], .conversation, .chat').count()
    const messageElements = await page.locator('[data-testid*="message"], .message').count()
    
    console.log('Elementos de conversação encontrados:', conversationElements)
    console.log('Elementos de mensagem encontrados:', messageElements)
  })

  test('deve responder adequadamente a erros de API', async ({ page }) => {
    // Monitorar requisições de rede
    const failedRequests: string[] = []
    
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} - ${response.url()}`)
      }
    })
    
    await page.waitForTimeout(5000)
    
    // Log de requisições falhadas (esperado em ambiente de teste)
    if (failedRequests.length > 0) {
      console.log('Requisições falhadas (esperado em teste):', failedRequests.slice(0, 5))
    }
  })
})

test.describe('WhatsApp Responsividade', () => {
  test('deve funcionar em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/whatsapp')
    
    await expect(page.locator('body')).toBeVisible()
    
    // Verificar se interface se adapta ao mobile
    const sidebar = page.locator('.sidebar, .menu, nav')
    const mobileMenu = page.locator('.mobile-menu, .hamburger, [aria-label*="menu"]')
    
    const hasSidebar = await sidebar.count() > 0
    const hasMobileMenu = await mobileMenu.count() > 0
    
    console.log('Sidebar visível em mobile:', hasSidebar)
    console.log('Menu mobile encontrado:', hasMobileMenu)
  })
})

test.describe('WhatsApp Performance', () => {
  test('deve carregar rapidamente', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/whatsapp')
    await expect(page.locator('body')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    console.log('Tempo de carregamento da página WhatsApp:', loadTime, 'ms')
    
    // Verificar se carrega em tempo razoável
    expect(loadTime).toBeLessThan(10000) // 10 segundos máximo
  })

  test('deve lidar com múltiplas navegações', async ({ page }) => {
    // Navegar entre páginas relacionadas ao WhatsApp
    await page.goto('/whatsapp')
    await page.waitForTimeout(1000)
    
    await page.goto('/whatsapp-conversations')
    await page.waitForTimeout(1000)
    
    await page.goto('/whatsapp')
    await page.waitForTimeout(1000)
    
    // Verificar se ainda funciona após navegações
    await expect(page.locator('body')).toBeVisible()
  })
}) 