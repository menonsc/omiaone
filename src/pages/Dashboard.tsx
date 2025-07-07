import React from 'react'
import { useEffect, useState } from 'react'
import { 
  MessageSquare, 
  Clock, 
  FileText, 
  TrendingUp,
  Bot,
  Activity
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import type { DashboardMetrics } from '../types'
import DashboardChart from '../components/DashboardChart'
import { Skeleton, CardSkeleton, StatusBadge } from '../components/ui/feedback'

// Mock data - replace with real API calls
const mockMetrics: DashboardMetrics = {
  totalInteractions: 247,
  timeSaved: 18.5,
  documentsProcessed: 12,
  favoriteAgents: [
    {
      id: '1',
      name: 'Knowledge Assistant',
      description: 'Base de conhecimento',
      type: 'knowledge',
      system_prompt: '',
      temperature: 0.3,
      max_tokens: 2048,
      is_public: true,
      created_by: '',
      config: {},
      created_at: ''
    },
    {
      id: '2', 
      name: 'Buddy',
      description: 'Onboarding assistant',
      type: 'onboarding',
      system_prompt: '',
      temperature: 0.7,
      max_tokens: 2048,
      is_public: true,
      created_by: '',
      config: {},
      created_at: ''
    }
  ],
  recentActivity: [
    {
      id: '1',
      user_id: '',
      action: 'Enviou mensagem',
      resource_type: 'chat',
      resource_id: null,
      details: { agent: 'Knowledge Assistant' },
      ip_address: null,
      created_at: '2024-01-10T14:30:00Z'
    },
    {
      id: '2',
      user_id: '',
      action: 'Upload de documento',
      resource_type: 'document',
      resource_id: null,
      details: { filename: 'manual_usuario.pdf' },
      ip_address: null,
      created_at: '2024-01-10T13:15:00Z'
    }
  ],
  usageData: [
    { date: '06/01', interactions: 12 },
    { date: '07/01', interactions: 19 },
    { date: '08/01', interactions: 28 },
    { date: '09/01', interactions: 35 },
    { date: '10/01', interactions: 42 },
    { date: '11/01', interactions: 38 },
    { date: '12/01', interactions: 47 }
  ]
}

const MetricCard = ({ title, value, icon: Icon, trend, color }: {
  title: string
  value: string | number
  icon: any
  trend?: string
  color: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-neutral-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
          {value}
        </p>
        {trend && (
          <p className="text-sm text-success-500 mt-1 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
)

export default function Dashboard() {
  const { profile } = useAuthStore()
  const [metrics] = useState<DashboardMetrics>(mockMetrics)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simular carregamento de dados
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Bom dia, {profile?.full_name?.split(' ')[0] || 'Colaborador'}! 👋
        </h1>
        <p className="text-neutral-600 dark:text-gray-400 mt-1">
          Aqui está o resumo da sua atividade hoje
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Interações Hoje"
              value={metrics.totalInteractions}
              icon={MessageSquare}
              trend="+12% vs ontem"
              color="bg-primary-600"
            />
            <MetricCard
              title="Tempo Economizado"
              value={`${metrics.timeSaved}h`}
              icon={Clock}
              trend="+2.3h vs ontem"
              color="bg-success-500"
            />
            <MetricCard
              title="Documentos Processados"
              value={metrics.documentsProcessed}
              icon={FileText}
              trend="+3 vs ontem"
              color="bg-blue-500"
            />
            <MetricCard
              title="Produtividade"
              value="94%"
              icon={TrendingUp}
              trend="+8% vs semana"
              color="bg-purple-500"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Uso dos Últimos 7 Dias
          </h3>
          <DashboardChart data={metrics.usageData} />
        </motion.div>

        {/* Favorite Agents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Agentes Mais Usados
          </h3>
          <div className="space-y-4">
            {metrics.favoriteAgents.map((agent, index) => (
              <div key={agent.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-600/20 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {agent.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-gray-400">
                    {agent.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {index === 0 ? '87%' : index === 1 ? '64%' : '43%'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-gray-400">
                    uso
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Atividade Recente
        </h3>
        <div className="space-y-4">
          {metrics.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-neutral-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-neutral-600 dark:text-gray-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-900 dark:text-white">
                  {activity.action}
                  {activity.details?.agent && (
                    <span className="text-primary-600"> para {activity.details.agent}</span>
                  )}
                  {activity.details?.filename && (
                    <span className="text-primary-600"> {activity.details.filename}</span>
                  )}
                </p>
                <p className="text-xs text-neutral-500 dark:text-gray-400">
                  {new Date(activity.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
} 