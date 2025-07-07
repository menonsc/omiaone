// Forçar limpeza completa do cache e reload
console.log('🧹 Limpando cache completo...');
localStorage.clear();
sessionStorage.clear();
if ('caches' in window) {
  caches.keys().then(function(names) {
    for (let name of names) caches.delete(name);
  });
}
console.log('✅ Cache limpo! Recarregando página...');
setTimeout(() => window.location.reload(true), 1000);
