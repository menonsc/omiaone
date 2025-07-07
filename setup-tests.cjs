#!/usr/bin/env node

/**
 * Script para configurar testes automatizados
 * Execute: node setup-tests.cjs
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🧪 Configurando Testes Automatizados...\n')

function runCommand(command, description) {
  try {
    console.log(`⏳ ${description}...`)
    execSync(command, { stdio: 'inherit' })
    console.log(`✅ ${description} - Concluído\n`)
  } catch (error) {
    console.log(`❌ Erro em: ${description}`)
    console.log(`Comando: ${command}`)
    console.log(`Erro: ${error.message}\n`)
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath)
}

// 1. Instalar dependências de teste
console.log('📦 Instalando dependências de teste...')
runCommand(
  'npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event playwright @playwright/test coverage-v8',
  'Instalação das dependências de teste'
)

// 2. Instalar Playwright browsers
console.log('🌐 Instalando browsers do Playwright...')
runCommand('npx playwright install', 'Instalação dos browsers')

// 3. Verificar se os arquivos de configuração existem
const configFiles = [
  'vitest.config.ts',
  'playwright.config.ts',
  'src/test/setup.ts'
]

console.log('📁 Verificando arquivos de configuração...')
configFiles.forEach(file => {
  if (fileExists(file)) {
    console.log(`✅ ${file} - Existe`)
  } else {
    console.log(`❌ ${file} - Não encontrado`)
  }
})

// 4. Verificar estrutura de pastas
const testDirs = [
  'tests/e2e',
  'src/test',
  'src/services/__tests__',
  'src/store/__tests__'
]

console.log('\n📂 Verificando estrutura de pastas de teste...')
testDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir} - Existe`)
  } else {
    console.log(`❌ ${dir} - Criando...`)
    fs.mkdirSync(dir, { recursive: true })
    console.log(`✅ ${dir} - Criado`)
  }
})

console.log('\n🎉 Configuração de testes concluída!')
console.log('\n📋 Scripts disponíveis:')
console.log('• npm run test - Testes unitários')
console.log('• npm run test:watch - Testes unitários em watch mode')
console.log('• npm run test:coverage - Testes com cobertura')
console.log('• npm run test:e2e - Testes end-to-end')
console.log('• npm run test:e2e:ui - Testes E2E com interface')
console.log('• npm run test:all - Todos os testes')
console.log('\n✨ Agora você pode executar os testes!') 