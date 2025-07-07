import React from 'react';
import { Shield } from 'lucide-react';

export default function SettingsSecurity() {
  return (
    <div className="p-8 pt-10 pl-10 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2 text-neutral-900">Segurança</h1>
      <p className="text-neutral-600 mb-6">Configurações de segurança da conta.</p>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
          Segurança
        </h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
              Última atividade
            </h4>
            <p className="text-sm text-neutral-600 dark:text-gray-400">
              Seu último login foi em {new Date().toLocaleDateString('pt-BR')} às{' '}
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
              Sessões ativas
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    Sessão atual
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-gray-400">
                    Navegador atual • {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className="text-xs text-success-500 font-medium">Ativa</span>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-neutral-200 dark:border-gray-700">
            <button className="text-sm text-danger-500 hover:text-danger-600 font-medium">
              Encerrar todas as outras sessões
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 