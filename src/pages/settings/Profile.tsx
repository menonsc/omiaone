import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

export default function SettingsProfile() {
  const { profile, updateProfile } = useAuthStore();
  const { addNotification } = useUIStore();
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    department: profile?.department || '',
    preferences: profile?.preferences || {}
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile(formData);
      addNotification({
        type: 'success',
        title: 'Sucesso',
        message: 'Perfil atualizado com sucesso!'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao atualizar perfil'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-8 pt-10 pl-10 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2 text-neutral-900">Perfil</h1>
      <p className="text-neutral-600 mb-6">Configurações de perfil do usuário.</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={e => handleInputChange('full_name', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Seu nome completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
              Departamento
            </label>
            <select
              value={formData.department}
              onChange={e => handleInputChange('department', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecione um departamento</option>
              <option value="TI">Tecnologia da Informação</option>
              <option value="RH">Recursos Humanos</option>
              <option value="Financeiro">Financeiro</option>
              <option value="Marketing">Marketing</option>
              <option value="Vendas">Vendas</option>
              <option value="Operações">Operações</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={profile?.id || ''}
            disabled
            className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg bg-neutral-50 dark:bg-gray-600 text-neutral-500 dark:text-gray-400"
            placeholder="Seu email"
          />
          <p className="text-xs text-neutral-500 dark:text-gray-400 mt-1">
            O email não pode ser alterado
          </p>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
} 