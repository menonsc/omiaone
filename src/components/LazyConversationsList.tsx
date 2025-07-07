import React from 'react'
import { lazy, Suspense } from 'react'
import { ComponentLoading } from '../utils/lazyLoading'
import { WhatsAppChat } from '../store/whatsapp/messageStore'

// Lazy loading da lista de conversas
const ConversationsList = lazy(() => import('./ConversationsList'))

interface LazyConversationsListProps {
  chats: WhatsAppChat[]
  selectedConversation: string | null
  onSelectConversation: (chat: WhatsAppChat) => void
  isLoading: boolean
  currentInstance: any
  searchTerm: string
  filter: 'all' | 'unread' | 'groups'
}

export default function LazyConversationsList(props: LazyConversationsListProps) {
  return (
    <Suspense fallback={<ComponentLoading size="lg" />}>
      <ConversationsList {...props} />
    </Suspense>
  )
} 