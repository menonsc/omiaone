import React from 'react'
import { useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'
import Sidebar from './Sidebar'
import Header from './Header'
import { Toaster } from '../ui/toaster'
import DebugRouter from '../DebugRouter'

export default function Layout() {
  const { sidebarOpen, darkMode } = useUIStore()

  // Apply dark mode to document - otimizado para evitar re-renders
  const applyDarkMode = useCallback(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    applyDarkMode()
  }, [applyDarkMode])

  return (
    <div className="h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster />
      
      {/* Debug Router */}
      <DebugRouter />
    </div>
  )
} 