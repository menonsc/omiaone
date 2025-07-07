import React from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export default function SettingsPreferences() {
  const { darkMode, toggleDarkMode } = useUIStore();

  return (
    <div className="p-8 pt-10 pl-10 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2 text-neutral-900">Preferências</h1>
      <p className="text-neutral-600 mb-6">Configurações de preferências do usuário.</p>
      <div className="space-y-6">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
              Tema
            </h4>
            <p className="text-sm text-neutral-500 dark:text-gray-400">
              Escolha entre tema claro ou escuro
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="relative inline-flex items-center h-6 rounded-full w-11 bg-primary-600 transition-colors"
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
            {darkMode ? (
              <Moon className="absolute left-1 w-3 h-3 text-primary-600" />
            ) : (
              <Sun className="absolute right-1 w-3 h-3 text-primary-600" />
            )}
          </button>
        </div>
        {/* Notifications */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
            Notificações
          </h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-600"
              />
              <span className="ml-3 text-sm text-neutral-700 dark:text-gray-300">
                Notificações de novas mensagens
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-600"
              />
              <span className="ml-3 text-sm text-neutral-700 dark:text-gray-300">
                Notificações de documentos processados
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-600"
              />
              <span className="ml-3 text-sm text-neutral-700 dark:text-gray-300">
                Relatórios semanais por email
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
} 