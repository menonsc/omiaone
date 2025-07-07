import React, { Suspense } from 'react'

// Componente de Loading para Páginas
export const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Carregando página...</p>
    </div>
  </div>
)

// Componente de Loading para Suspense (dentro do layout)
export const SuspenseFallback = () => (
  <div className="flex-1 flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Carregando...</p>
    </div>
  </div>
)

// Componente de Loading para Componentes Menores
export const ComponentLoading = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeClasses[size]}`}></div>
    </div>
  )
}

// Componente de Loading para Listas
export const ListLoading = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
)

// Componente de Loading para Cards
export const CardLoading = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
        </div>
      </div>
    ))}
  </div>
)

// HOC para Lazy Loading com Error Boundary
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  LoadingComponent: React.ComponentType = SuspenseFallback
) => {
  return (props: P) => (
    <Suspense fallback={<LoadingComponent />}>
      <Component {...props} />
    </Suspense>
  )
}

// Hook para Lazy Loading com retry
export const useLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3
) => {
  const [Component, setComponent] = React.useState<T | null>(null)
  const [error, setError] = React.useState<Error | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    let retryCount = 0

    const loadComponent = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const module = await importFn()
        
        if (mounted) {
          setComponent(() => module.default)
          setLoading(false)
        }
      } catch (err) {
        if (retryCount < retries) {
          retryCount++
          console.warn(`Retry ${retryCount}/${retries} for lazy component`)
          setTimeout(loadComponent, 1000 * retryCount)
        } else {
          if (mounted) {
            setError(err as Error)
            setLoading(false)
          }
        }
      }
    }

    loadComponent()

    return () => {
      mounted = false
    }
  }, [importFn, retries])

  return { Component, error, loading }
}

// Error Boundary para Lazy Loading
export class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || (() => (
        <div className="flex items-center justify-center p-4 text-center">
          <div>
            <div className="text-red-500 mb-2">⚠️ Erro ao carregar componente</div>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      ))
      
      return <FallbackComponent />
    }

    return this.props.children
  }
} 