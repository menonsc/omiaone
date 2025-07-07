import React from 'react'
import { lazy, Suspense } from 'react'
import { ComponentLoading } from '../utils/lazyLoading'

// Lazy loading da visualização de conversa
const ConversationView = lazy(() => import('./ConversationView'))

interface LazyConversationViewProps {
  onBack: () => void
}

export default function LazyConversationView(props: LazyConversationViewProps) {
  return (
    <Suspense fallback={<ComponentLoading size="lg" />}>
      <ConversationView {...props} />
    </Suspense>
  )
} 