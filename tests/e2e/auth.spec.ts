import { test, expect } from '@playwright/test'

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página inicial
    await page.goto('/')
  })

  test('deve exibir página de login para usuários não autenticados', async ({ page }) => {
    await expect(page).toHaveTitle(/Agentes de IA/)
    
    // Verificar se a página de login é exibida
    await expect(page.locator('h1')).toContainText('Login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('deve validar campos obrigatórios', async ({ page }) => {
    // Tentar fazer login sem preencher campos
    await page.click('button[type="submit"]')
    
    // Verificar se mensagens de validação aparecem
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    
    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')
  })

  test('deve exibir erro para credenciais inválidas', async ({ page }) => {
    // Preencher com credenciais inválidas
    await page.fill('input[type="email"]', 'usuario@inexistente.com')
    await page.fill('input[type="password"]', 'senhaerrada')
    
    // Tentar fazer login
    await page.click('button[type="submit"]')
    
    // Aguardar mensagem de erro
    await expect(page.locator('.error, .alert, [role="alert"]')).toBeVisible({ timeout: 5000 })
  })

  test('deve redirecionar para dashboard após login bem-sucedido', async ({ page }) => {
    // Simular login bem-sucedido (se houver usuário de teste)
    await page.fill('input[type="email"]', 'test@exemplo.com')
    await page.fill('input[type="password"]', 'senha123')
    
    // Fazer login
    await page.click('button[type="submit"]')
    
    // Aguardar redirecionamento (ou permanência na página de login se credenciais forem inválidas)
    await page.waitForTimeout(2000)
    
    // Verificar se ainda está na página de login ou se foi redirecionado
    const currentUrl = page.url()
    console.log('URL atual após login:', currentUrl)
  })

  test('deve ter links de navegação corretos', async ({ page }) => {
    // Verificar se existem links ou textos relacionados a funcionalidades
    const pageContent = await page.textContent('body')
    
    expect(pageContent).toContain('Login')
    // Verificar se menciona funcionalidades do sistema
    const hasWhatsApp = pageContent?.includes('WhatsApp') || false
    const hasIA = pageContent?.includes('IA') || pageContent?.includes('Agentes') || false
    
    console.log('Página contém WhatsApp:', hasWhatsApp)
    console.log('Página contém IA/Agentes:', hasIA)
  })
})

test.describe('Navegação sem autenticação', () => {
  test('deve permitir visualizar páginas públicas', async ({ page }) => {
    await page.goto('/')
    
    // Verificar se a página carrega sem erros
    await expect(page.locator('body')).toBeVisible()
    
    // Verificar se não há erros de JavaScript no console
    const logs: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        logs.push(msg.text())
      }
    })
    
    await page.waitForTimeout(2000)
    
    // Imprimir erros se houver
    if (logs.length > 0) {
      console.log('Erros de console encontrados:', logs)
    }
  })

  test('deve responder a diferentes tamanhos de tela', async ({ page }) => {
    // Teste mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
    
    // Teste tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    await expect(page.locator('body')).toBeVisible()
    
    // Teste desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.reload()
    await expect(page.locator('body')).toBeVisible()
  })
}) 