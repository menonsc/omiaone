import React, { useState, useEffect } from 'react';
import { Search, Plus, Settings as SettingsIcon, Check, X, Loader2, Puzzle } from 'lucide-react';
import { useIntegrationsStore } from '../../store/integrationsStore';
import { useUIStore } from '../../store/uiStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsIntegrations() {
  const {
    integrations,
    fetchIntegrations,
    configureYampi,
    yampiConnectionStatus,
    yampiError,
    testIntegrationConnection,
    getIntegration
  } = useIntegrationsStore();
  const { addNotification } = useUIStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showYampiModal, setShowYampiModal] = useState(false);
  const [yampiConfig, setYampiConfig] = useState({
    merchantAlias: '',
    token: '',
    secretKey: '',
    apiKey: ''
  });
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const availableIntegrations = [
    {
      id: 'yampi',
      name: 'Yampi',
      description: 'Conecte sua loja Yampi para sincronizar produtos e pedidos',
      icon: '🛒',
      category: 'E-commerce',
      status: 'available'
    },
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      description: 'Sincronize dados com planilhas do Google',
      icon: '📊',
      category: 'Produtividade',
      status: 'available'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Receba notificações e relatórios no Slack',
      icon: '💬',
      category: 'Comunicação',
      status: 'available'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Conecte com milhares de aplicações via Zapier',
      icon: '⚡',
      category: 'Automação',
      status: 'available'
    },
    {
      id: 'hubspot',
      name: 'HubSpot CRM',
      description: 'Sincronize leads e contatos com HubSpot',
      icon: '🎯',
      category: 'CRM',
      status: 'coming-soon'
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Integração completa com Salesforce CRM',
      icon: '☁️',
      category: 'CRM',
      status: 'coming-soon'
    }
  ];

  const filteredIntegrations = availableIntegrations.filter(integration =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleIntegrationAction = (integrationId: string) => {
    if (integrationId === 'yampi') {
      const yampiIntegration = getIntegration('yampi');
      if (yampiIntegration) {
        setYampiConfig({
          merchantAlias: yampiIntegration.credentials.merchantAlias || '',
          token: yampiIntegration.credentials.token || '',
          secretKey: yampiIntegration.credentials.secretKey || '',
          apiKey: yampiIntegration.credentials.apiKey || ''
        });
      }
      setShowYampiModal(true);
    } else {
      addNotification({
        type: 'info',
        title: 'Em desenvolvimento',
        message: 'Esta integração estará disponível em breve!'
      });
    }
  };

  const handleYampiConnect = async () => {
    if (!yampiConfig.merchantAlias || !yampiConfig.token || !yampiConfig.secretKey) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Por favor, preencha o alias da loja, token e chave secreta'
      });
      return;
    }
    setIsConnecting(true);
    try {
      await configureYampi(yampiConfig);
      addNotification({
        type: 'success',
        title: 'Sucesso!',
        message: 'Integração com Yampi configurada com sucesso'
      });
      setShowYampiModal(false);
      setYampiConfig({ merchantAlias: '', token: '', secretKey: '', apiKey: '' });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro na conexão',
        message: error instanceof Error ? error.message : 'Falha ao conectar com Yampi'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestConnection = async (integrationId: string) => {
    try {
      const success = await testIntegrationConnection(integrationId);
      addNotification({
        type: success ? 'success' : 'error',
        title: success ? 'Conexão OK' : 'Falha na conexão',
        message: success ? 'Integração funcionando corretamente' : 'Verifique suas credenciais'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao testar conexão'
      });
    }
  };

  return (
    <div className="p-8 pt-10 pl-10 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2 text-neutral-900">Integrações</h1>
      <p className="text-neutral-600 mb-6">Gerencie suas integrações aqui.</p>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Integrações
            </h3>
            <p className="text-sm text-neutral-600 dark:text-gray-400 mt-1">
              Conecte com suas ferramentas favoritas
            </p>
          </div>
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Pesquisar integrações..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>
      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIntegrations.map((integration, index) => {
          const configuredIntegration = getIntegration(integration.id);
          const isConfigured = configuredIntegration !== null;
          const integrationStatus = configuredIntegration?.status || integration.status;
          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-neutral-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
                    {integration.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {integration.name}
                      </h4>
                      {integrationStatus === 'coming-soon' && (
                        <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
                          Em breve
                        </span>
                      )}
                      {integrationStatus === 'active' && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full flex items-center">
                          <Check className="w-3 h-3 mr-1" />
                          Conectado
                        </span>
                      )}
                      {integrationStatus === 'error' && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full flex items-center">
                          <X className="w-3 h-3 mr-1" />
                          Erro
                        </span>
                      )}
                      {integrationStatus === 'testing' && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full flex items-center">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Testando
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-gray-400 mb-2">
                      {integration.description}
                    </p>
                    <span className="text-xs text-neutral-500 dark:text-gray-500 bg-neutral-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {integration.category}
                    </span>
                    {configuredIntegration?.error_message && (
                      <p className="text-xs text-red-500 mt-1">
                        {configuredIntegration.error_message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                {isConfigured && integrationStatus === 'active' && (
                  <button
                    onClick={() => handleTestConnection(configuredIntegration.id)}
                    className="px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    Testar
                  </button>
                )}
                <button
                  onClick={() => handleIntegrationAction(integration.id)}
                  disabled={integration.status === 'coming-soon'}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${
                    integration.status === 'available'
                      ? 'bg-primary-600 text-white hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2'
                      : 'bg-neutral-200 text-neutral-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {isConfigured ? (
                    <>
                      <SettingsIcon className="w-4 h-4 mr-1" />
                      Configurar
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      {integration.status === 'available' ? 'Conectar' : 'Em breve'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
      {filteredIntegrations.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-neutral-200 dark:border-gray-700 text-center mt-6">
          <Puzzle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            Nenhuma integração encontrada
          </h3>
          <p className="text-neutral-600 dark:text-gray-400">
            Tente ajustar os termos da sua pesquisa.
          </p>
        </div>
      )}
      {/* Modal de Configuração Yampi */}
      <AnimatePresence>
        {showYampiModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    🛒
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                      Configurar Yampi
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-gray-400">
                      Configure sua integração com a Yampi
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowYampiModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                    Alias da Loja *
                  </label>
                  <input
                    type="text"
                    value={yampiConfig.merchantAlias}
                    onChange={e => setYampiConfig(prev => ({ ...prev, merchantAlias: e.target.value }))}
                    placeholder="Ex: minha-loja"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-neutral-500 dark:text-gray-400 mt-1">
                    O alias único da sua loja na Yampi
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                    Token de Acesso *
                  </label>
                  <input
                    type="password"
                    value={yampiConfig.token}
                    onChange={e => setYampiConfig(prev => ({ ...prev, token: e.target.value }))}
                    placeholder="Seu token de acesso da API"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-neutral-500 dark:text-gray-400 mt-1">
                    Token disponível no painel da Yampi
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                    Chave Secreta *
                  </label>
                  <input
                    type="password"
                    value={yampiConfig.secretKey}
                    onChange={e => setYampiConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                    placeholder="Sua chave secreta da API"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-neutral-500 dark:text-gray-400 mt-1">
                    Chave secreta disponível no painel da Yampi
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                    Chave da API (Opcional)
                  </label>
                  <input
                    type="password"
                    value={yampiConfig.apiKey}
                    onChange={e => setYampiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Chave adicional da API se necessário"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                {yampiError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {yampiError}
                    </p>
                    {yampiError.includes('403') && (
                      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-400">
                        <strong>Erro 403:</strong> Sua conta não tem permissões para acessar a API. 
                        Entre em contato com o suporte Yampi para habilitar o acesso.
                      </div>
                    )}
                  </div>
                )}
                <div className="text-xs text-neutral-500 dark:text-gray-400 bg-neutral-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="font-medium mb-1">💡 Como obter suas credenciais:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Acesse o painel da sua loja Yampi</li>
                    <li>Vá em Configurações → Integrações → API</li>
                    <li>Copie o <strong>Token de Acesso</strong> gerado</li>
                    <li>Copie a <strong>Chave Secreta</strong> (User-Secret-Key)</li>
                    <li>O alias da loja está na URL da sua loja</li>
                  </ol>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowYampiModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-gray-400 hover:text-neutral-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleYampiConnect}
                  disabled={isConnecting || !yampiConfig.merchantAlias || !yampiConfig.token || !yampiConfig.secretKey}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Conectar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
} 