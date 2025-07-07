// Script para limpar dados corrompidos do WhatsApp
console.log('🧹 Limpando dados do WhatsApp...')

// Limpar localStorage
localStorage.removeItem('whatsapp_instances')
localStorage.removeItem('whatsapp_store')
localStorage.removeItem('whatsapp_config')

// Limpar sessionStorage também
sessionStorage.removeItem('whatsapp_instances')
sessionStorage.removeItem('whatsapp_store')

// Se houver timers ou intervalos rodando, eles serão limpos no próximo reload
console.log('✅ Dados do WhatsApp limpos! Recarregue a página.')
console.log('ℹ️ Se ainda houver erros 404, reinicie o servidor também.')

// Mostrar instruções
console.log(`
📋 INSTRUÇÕES:
1. Dados localStorage limpos ✅
2. Recarregue a página (F5 ou Ctrl+R)
3. Se ainda houver erros, reinicie o servidor
4. Vá para a aba WhatsApp e atualize a lista de instâncias
`)
