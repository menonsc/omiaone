import { create } from 'zustand'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

interface UIState {
  sidebarOpen: boolean
  notifications: Notification[]
  darkMode: boolean
  
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  toggleDarkMode: () => void
}

// Get initial dark mode from localStorage or system preference
const getInitialDarkMode = () => {
  if (typeof window === 'undefined') return false
  
  const stored = localStorage.getItem('darkMode')
  if (stored !== null) {
    return JSON.parse(stored)
  }
  
  // Check system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  notifications: [],
  darkMode: getInitialDarkMode(),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  
  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newNotification = { ...notification, id }
    
    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }))
    
    // Auto remove after duration
    setTimeout(() => {
      get().removeNotification(id)
    }, notification.duration || 5000)
  },
  
  removeNotification: (id: string) => 
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    })),
  
  toggleDarkMode: () => {
    const newDarkMode = !get().darkMode
    set({ darkMode: newDarkMode })
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(newDarkMode))
    }
  }
})) 