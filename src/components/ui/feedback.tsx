import React from 'react'
import { Loader2, CheckCircle, AlertCircle, XCircle, Clock, WifiOff } from 'lucide-react'
import { cn } from '../../utils/helpers'

// Spinner Component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
}

export const Spinner = ({ size = 'md', className, color = 'primary' }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  }

  return (
    <Loader2 
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )} 
    />
  )
}

// Loading Button Component
interface LoadingButtonProps {
  loading?: boolean
  children: React.ReactNode
  loadingText?: string
  disabled?: boolean
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const LoadingButton = ({ 
  loading = false, 
  children, 
  loadingText,
  disabled,
  onClick,
  variant = 'primary',
  size = 'md',
  className 
}: LoadingButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700'
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading && <Spinner size="sm" color="secondary" className="mr-2" />}
      {loading ? (loadingText || 'Carregando...') : children}
    </button>
  )
}

// Status Badge Component
interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'offline'
  text: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export const StatusBadge = ({ 
  status, 
  text, 
  size = 'md', 
  showIcon = true,
  className 
}: StatusBadgeProps) => {
  const statusConfig = {
    success: {
      classes: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle
    },
    error: {
      classes: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle
    },
    warning: {
      classes: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: AlertCircle
    },
    info: {
      classes: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: AlertCircle
    },
    loading: {
      classes: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Clock
    },
    offline: {
      classes: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: WifiOff
    }
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const config = statusConfig[status] || { classes: '', icon: null }
  const Icon = config.icon

  return (
    <span className={cn(
      'inline-flex items-center gap-1 font-medium rounded-full border',
      config.classes,
      sizeClasses[size],
      className
    )}>
      {showIcon && status === 'loading' ? (
        <Spinner size="sm" className={iconSizes[size]} />
      ) : showIcon && Icon ? (
        <Icon className={iconSizes[size]} />
      ) : null}
      {text}
    </span>
  )
}

// Skeleton Components
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  lines?: number
}

export const Skeleton = ({ 
  className, 
  variant = 'rectangular',
  width,
  height,
  lines = 1
}: SkeletonProps) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700'
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded'
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses[variant],
              'h-4',
              index === lines - 1 ? 'w-3/4' : 'w-full',
              className
            )}
            style={{ width, height }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
    />
  )
}

// Card Skeleton
export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('p-4 border rounded-lg space-y-4', className)}>
    <div className="flex items-center space-x-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" height={16} />
        <Skeleton variant="text" width="40%" height={14} className="mt-2" />
      </div>
    </div>
    <Skeleton variant="text" lines={3} />
  </div>
)

// List Skeleton
export const ListSkeleton = ({ 
  items = 3, 
  showAvatar = true,
  className 
}: { 
  items?: number
  showAvatar?: boolean
  className?: string 
}) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3 p-3">
        {showAvatar && <Skeleton variant="circular" width={32} height={32} />}
        <div className="flex-1">
          <Skeleton variant="text" width="70%" height={16} />
          <Skeleton variant="text" width="50%" height={14} className="mt-1" />
        </div>
        <Skeleton variant="rectangular" width={80} height={20} />
      </div>
    ))}
  </div>
)

// Progress Bar
interface ProgressBarProps {
  progress: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'error'
  showPercentage?: boolean
  className?: string
}

export const ProgressBar = ({ 
  progress, 
  size = 'md', 
  color = 'primary',
  showPercentage = true,
  className 
}: ProgressBarProps) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const colorClasses = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  }

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn('transition-all duration-300 ease-out', colorClasses[color], sizeClasses[size])}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-sm text-gray-600 mt-1 text-right">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  )
}

// Loading Overlay
interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  children: React.ReactNode
  className?: string
}

export const LoadingOverlay = ({ 
  isLoading, 
  message = 'Carregando...', 
  children,
  className 
}: LoadingOverlayProps) => (
  <div className={cn('relative', className)}>
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50 rounded-lg">
        <div className="flex flex-col items-center space-y-2">
          <Spinner size="lg" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      </div>
    )}
  </div>
)

// Toast-like feedback
interface FeedbackToastProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  isVisible: boolean
  onClose?: () => void
  duration?: number
}

export const FeedbackToast = ({ 
  type, 
  message, 
  isVisible, 
  onClose,
  duration = 3000 
}: FeedbackToastProps) => {
  const typeConfig = {
    success: {
      classes: 'bg-green-600 text-white',
      icon: CheckCircle
    },
    error: {
      classes: 'bg-red-600 text-white',
      icon: XCircle
    },
    warning: {
      classes: 'bg-yellow-600 text-white',
      icon: AlertCircle
    },
    info: {
      classes: 'bg-blue-600 text-white',
      icon: AlertCircle
    }
  }

  const config = typeConfig[type]
  const Icon = config.icon

  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-right-full duration-300',
      config.classes
    )}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-white/80 hover:text-white transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  )
} 