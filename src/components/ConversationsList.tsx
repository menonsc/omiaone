import React from 'react'
import { motion } from 'framer-motion'
import { User, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { WhatsAppChat } from '../store/whatsapp/messageStore'
import { ListSkeleton, StatusBadge } from './ui/feedback'

interface ConversationsListProps {
  chats: WhatsAppChat[]
  selectedConversation: string | null
  onSelectConversation: (chat: WhatsAppChat) => void
  isLoading: boolean
  currentInstance: any
  searchTerm: string
  filter: 'all' | 'unread' | 'groups'
}

export default function ConversationsList({
  chats,
  selectedConversation,
  onSelectConversation,
  isLoading,
  currentInstance,
  searchTerm,
  filter
}: ConversationsListProps) {
  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return ''
    
    try {
      const date = new Date(timestamp)
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: ptBR 
      })
    } catch {
      return ''
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <ListSkeleton items={5} showAvatar={true} />
      </div>
    )
  }

  if (!currentInstance) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Selecione uma instância para ver as conversas
        </p>
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="p-4 text-center">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
        </p>
        {!searchTerm && (
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="font-medium mb-1">🔄 Sistema Inteligente Ativo:</p>
            <ul className="text-left space-y-1">
              <li>• Buscando conversas automaticamente</li>
              <li>• Carregando contatos como conversas</li>
              <li>• Você pode enviar mensagens normalmente</li>
            </ul>
            <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
              💬 Inicie uma conversa enviando uma mensagem para qualquer contato!
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {chats.map((chat) => (
        <motion.div
          key={chat.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
          onClick={() => onSelectConversation(chat)}
          className={`p-4 cursor-pointer border-l-4 ${
            selectedConversation === chat.id
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {chat.name}
                </h3>
                {chat.unreadCount && chat.unreadCount > 0 && (
                  <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center flex-shrink-0">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                {chat.lastMessage && chat.lastMessage !== 'Conversa iniciada' 
                  ? chat.lastMessage 
                  : 'Envie uma mensagem para começar'
                }
              </p>
              
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-500 truncate">
                  {chat.phone}
                </span>
                {chat.lastMessageTime && (
                  <span className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0 ml-2">
                    {formatLastMessageTime(chat.lastMessageTime)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
} 