import React from 'react'
import { useState } from 'react'
import { Plus, Bot, Edit3, Trash2, Settings, Save, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../store/chatStore'
import { useUIStore } from '../store/uiStore'
import type { Agent } from '../types'

interface AgentFormData {
  name: string
  description: string
  type: string
  system_prompt: string
  temperature: number
  max_tokens: number
  is_public: boolean
  config: Record<string, any>
}

const defaultFormData: AgentFormData = {
  name: '',
  description: '',
  type: 'general',
  system_prompt: '',
  temperature: 0.7,
  max_tokens: 2048,
  is_public: true,
  config: {}
}

export default function Agents() {
  const { agents, createAgent, updateAgent, deleteAgent, fetchAgents } = useChatStore()
  const { addNotification } = useUIStore()
  
  const [showForm, setShowForm] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState<AgentFormData>(defaultFormData)
  const [isLoading, setIsLoading] = useState(false)

  const handleOpenForm = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent)
      setFormData({
        name: agent.name,
        description: agent.description || '',
        type: agent.type,
        system_prompt: agent.system_prompt || '',
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        is_public: agent.is_public,
        config: agent.config || {}
      })
    } else {
      setEditingAgent(null)
      setFormData(defaultFormData)
    }
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingAgent(null)
    setFormData(defaultFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingAgent) {
        await updateAgent(editingAgent.id, formData)
        addNotification({
          type: 'success',
          title: 'Agente Atualizado',
          message: `${formData.name} foi atualizado com sucesso!`
        })
      } else {
        await createAgent(formData)
        addNotification({
          type: 'success',
          title: 'Agente Criado',
          message: `${formData.name} foi criado com sucesso!`
        })
      }
      handleCloseForm()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao salvar agente. Tente novamente.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (agent: Agent) => {
    if (!confirm(`Tem certeza que deseja excluir o agente "${agent.name}"?`)) {
      return
    }

    try {
      await deleteAgent(agent.id)
      addNotification({
        type: 'success',
        title: 'Agente Removido',
        message: `${agent.name} foi removido com sucesso!`
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao remover agente. Tente novamente.'
      })
    }
  }

  const getAgentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      knowledge: 'Base de Conhecimento',
      onboarding: 'Onboarding',
      support: 'Suporte',
      general: 'Geral',
      sales: 'Vendas',
      hr: 'Recursos Humanos',
      finance: 'Financeiro',
      marketing: 'Marketing'
    }
    return types[type] || type
  }

  const getAgentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      knowledge: 'bg-blue-100 text-blue-800',
      onboarding: 'bg-green-100 text-green-800',
      support: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800',
      sales: 'bg-purple-100 text-purple-800',
      hr: 'bg-pink-100 text-pink-800',
      finance: 'bg-yellow-100 text-yellow-800',
      marketing: 'bg-indigo-100 text-indigo-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Agentes de IA
          </h1>
          <p className="text-neutral-600 dark:text-gray-400 mt-1">
            Crie e gerencie seus assistentes de IA personalizados
          </p>
        </div>
        
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Agente</span>
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            {/* Agent Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-600/20 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {agent.name}
                  </h3>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getAgentTypeColor(agent.type)}`}>
                    {getAgentTypeLabel(agent.type)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleOpenForm(agent)}
                  className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(agent)}
                  className="p-2 text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Agent Description */}
            <p className="text-neutral-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {agent.description || 'Sem descrição'}
            </p>

            {/* Agent Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-500 dark:text-gray-400">Temperatura:</span>
                <span className="ml-2 font-medium text-neutral-900 dark:text-white">
                  {agent.temperature}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 dark:text-gray-400">Max Tokens:</span>
                <span className="ml-2 font-medium text-neutral-900 dark:text-white">
                  {agent.max_tokens}
                </span>
              </div>
            </div>

            {/* Public/Private Badge */}
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-gray-700">
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                agent.is_public 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {agent.is_public ? 'Público' : 'Privado'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                {/* Form Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                    {editingAgent ? 'Editar Agente' : 'Criar Novo Agente'}
                  </h2>
                  <button
                    onClick={handleCloseForm}
                    className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                        Nome do Agente *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Ex: Assistente de Vendas"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                        Tipo
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="general">Geral</option>
                        <option value="knowledge">Base de Conhecimento</option>
                        <option value="onboarding">Onboarding</option>
                        <option value="support">Suporte</option>
                        <option value="sales">Vendas</option>
                        <option value="hr">Recursos Humanos</option>
                        <option value="finance">Financeiro</option>
                        <option value="marketing">Marketing</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                      Descrição
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Descreva o que este agente faz..."
                    />
                  </div>

                  {/* System Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                      Prompt do Sistema *
                    </label>
                    <textarea
                      rows={6}
                      required
                      value={formData.system_prompt}
                      onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Você é um assistente especializado em... Seu objetivo é ajudar os usuários a..."
                    />
                    <p className="text-xs text-neutral-500 dark:text-gray-400 mt-1">
                      Define como o agente se comporta e responde às perguntas
                    </p>
                  </div>

                  {/* Advanced Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                        Temperatura: {formData.temperature}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.temperature}
                        onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-neutral-500 dark:text-gray-400 mt-1">
                        <span>Focado</span>
                        <span>Criativo</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                        Max Tokens
                      </label>
                      <select
                        value={formData.max_tokens}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value={1024}>1,024 tokens</option>
                        <option value={2048}>2,048 tokens</option>
                        <option value={4096}>4,096 tokens</option>
                        <option value={8192}>8,192 tokens</option>
                      </select>
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={formData.is_public}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-600"
                    />
                    <label htmlFor="is_public" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
                      Agente público (visível para todos os usuários)
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="px-4 py-2 text-neutral-600 hover:text-neutral-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isLoading ? 'Salvando...' : (editingAgent ? 'Atualizar' : 'Criar Agente')}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 