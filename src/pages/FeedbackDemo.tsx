import React, { useState } from 'react'
import { 
  LoadingButton, 
  StatusBadge, 
  Spinner, 
  Skeleton, 
  CardSkeleton, 
  ListSkeleton,
  ProgressBar,
  LoadingOverlay,
  FeedbackToast
} from '../components/ui/feedback'
import { Download, Save, Send, RefreshCw } from 'lucide-react'

export default function FeedbackDemo() {
  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)
  const [overlayLoading, setOverlayLoading] = useState(false)
  const [progress, setProgress] = useState(45)
  const [showToast, setShowToast] = useState(false)
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success')

  const handleAction1 = async () => {
    setLoading1(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading1(false)
  }

  const handleAction2 = async () => {
    setLoading2(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading2(false)
  }

  const handleOverlayAction = async () => {
    setOverlayLoading(true)
    await new Promise(resolve => setTimeout(resolve, 3000))
    setOverlayLoading(false)
  }

  const handleToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    setToastType(type)
    setShowToast(true)
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Demonstração de Feedback Visual
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Exemplos de todos os componentes de feedback implementados no sistema
        </p>
      </div>

      {/* Loading Buttons */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">LoadingButton</h2>
        <div className="flex flex-wrap gap-4">
          <LoadingButton
            loading={loading1}
            onClick={handleAction1}
            variant="primary"
            loadingText="Salvando..."
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </LoadingButton>

          <LoadingButton
            loading={loading2}
            onClick={handleAction2}
            variant="secondary"
            loadingText="Baixando..."
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </LoadingButton>

          <LoadingButton
            loading={false}
            onClick={() => {}}
            variant="outline"
            disabled
          >
            <Send className="w-4 h-4 mr-2" />
            Desabilitado
          </LoadingButton>
        </div>
      </section>

      {/* Status Badges */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">Status Badges</h2>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status="success" text="Conectado" />
          <StatusBadge status="error" text="Erro de conexão" />
          <StatusBadge status="warning" text="Atenção necessária" />
          <StatusBadge status="info" text="Informação" />
          <StatusBadge status="loading" text="Carregando..." />
          <StatusBadge status="offline" text="Offline" />
        </div>
        
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Tamanhos diferentes:</h3>
          <div className="flex flex-wrap gap-3">
            <StatusBadge status="success" text="Pequeno" size="sm" />
            <StatusBadge status="warning" text="Médio" size="md" />
            <StatusBadge status="info" text="Grande" size="lg" />
          </div>
        </div>
      </section>

      {/* Spinners */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">Spinners</h2>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <Spinner size="sm" />
            <p className="text-xs mt-2">Pequeno</p>
          </div>
          <div className="text-center">
            <Spinner size="md" />
            <p className="text-xs mt-2">Médio</p>
          </div>
          <div className="text-center">
            <Spinner size="lg" />
            <p className="text-xs mt-2">Grande</p>
          </div>
          <div className="text-center">
            <Spinner size="xl" color="success" />
            <p className="text-xs mt-2">Extra Grande</p>
          </div>
        </div>
      </section>

      {/* Skeletons */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">Skeletons</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Skeleton básico:</h3>
            <div className="space-y-2">
              <Skeleton variant="text" width="100%" height={16} />
              <Skeleton variant="text" width="80%" height={16} />
              <Skeleton variant="text" width="60%" height={16} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Card Skeleton:</h3>
            <CardSkeleton />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">List Skeleton:</h3>
            <ListSkeleton items={3} />
          </div>
        </div>
      </section>

      {/* Progress Bar */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">Progress Bar</h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Upload do arquivo</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <ProgressBar progress={progress} color="primary" />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setProgress(Math.max(0, progress - 10))}
              className="px-3 py-1 bg-gray-200 rounded text-sm"
            >
              -10%
            </button>
            <button
              onClick={() => setProgress(Math.min(100, progress + 10))}
              className="px-3 py-1 bg-gray-200 rounded text-sm"
            >
              +10%
            </button>
          </div>

          <div className="space-y-2">
            <ProgressBar progress={75} color="success" size="sm" showPercentage={false} />
            <ProgressBar progress={45} color="warning" size="md" />
            <ProgressBar progress={25} color="error" size="lg" />
          </div>
        </div>
      </section>

      {/* Loading Overlay */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">Loading Overlay</h2>
        
        <LoadingOverlay 
          isLoading={overlayLoading} 
          message="Processando dados..."
        >
          <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Conteúdo da aplicação</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Este conteúdo ficará sobreposto quando o loading overlay estiver ativo.
            </p>
            <button
              onClick={handleOverlayAction}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Ativar Loading Overlay
            </button>
          </div>
        </LoadingOverlay>
      </section>

      {/* Toast Messages */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">Toast Messages</h2>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleToast('success')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Toast Sucesso
          </button>
          <button
            onClick={() => handleToast('error')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Toast Erro
          </button>
          <button
            onClick={() => handleToast('warning')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Toast Aviso
          </button>
          <button
            onClick={() => handleToast('info')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Toast Info
          </button>
        </div>
      </section>

      {/* Toast Component */}
      <FeedbackToast
        type={toastType}
        message={`Esta é uma mensagem de ${toastType}!`}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={3000}
      />
    </div>
  )
} 