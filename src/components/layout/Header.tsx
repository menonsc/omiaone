import React from 'react'
import { Search, Bell, Sun, Moon, User, X } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { useState, useRef, useEffect } from 'react'

export default function Header() {
  const { darkMode, toggleDarkMode, notifications, removeNotification } = useUIStore()
  const { profile } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  const unreadNotifications = notifications.length

  // Close notifications panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-neutral-200 dark:border-gray-700 px-6">
      <div className="flex items-center justify-between h-full">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar documentos, conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors"
          >
            {!darkMode ? (
              <Moon className="w-5 h-5 text-neutral-700 dark:text-gray-300" />
            ) : (
              <Sun className="w-5 h-5 text-neutral-700 dark:text-gray-300" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-5 h-5 text-neutral-700 dark:text-gray-300" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* Notifications Panel */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-neutral-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-neutral-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">Notificações</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 hover:bg-neutral-100 dark:hover:bg-gray-700 rounded"
                    >
                      <X className="w-4 h-4 text-neutral-500" />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-neutral-500 dark:text-gray-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-gray-700/50 border-b border-neutral-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    notification.type === 'success'
                                      ? 'bg-green-500'
                                      : notification.type === 'error'
                                      ? 'bg-red-500'
                                      : notification.type === 'warning'
                                      ? 'bg-yellow-500'
                                      : 'bg-blue-500'
                                  }`}
                                />
                                <h4 className="font-medium text-sm text-neutral-900 dark:text-white">
                                  {notification.title}
                                </h4>
                              </div>
                              <p className="text-xs text-neutral-600 dark:text-gray-400">
                                {notification.message}
                              </p>
                            </div>
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="ml-2 p-1 hover:bg-neutral-200 dark:hover:bg-gray-600 rounded"
                            >
                              <X className="w-3 h-3 text-neutral-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-neutral-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        notifications.forEach(n => removeNotification(n.id))
                        setShowNotifications(false)
                      }}
                      className="w-full text-sm text-neutral-600 dark:text-gray-400 hover:text-neutral-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Limpar todas
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                {profile?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-gray-400">
                {profile?.role || 'user'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 