import React from 'react'
import { useLocation } from 'react-router-dom'

export default function DebugRouter() {
  const location = useLocation()

  // Componente simplificado sem logs ou efeitos
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs z-50 opacity-75">
      <div>Rota: {location.pathname}</div>
    </div>
  )
} 