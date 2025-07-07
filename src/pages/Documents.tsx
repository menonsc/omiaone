import React from 'react'
import { useState, useCallback } from 'react'
import { Upload, Search, FileText, Trash2, Download, Eye } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { useUIStore } from '../store/uiStore'
import { formatFileSize, validateFile } from '../utils/helpers'

// Mock data - replace with real API calls
const mockDocuments = [
  {
    id: '1',
    title: 'Manual do Usuário - Sistema Cursor',
    file_size: 2048000,
    mime_type: 'application/pdf',
    created_at: '2024-01-10T14:30:00Z',
    metadata: { pages: 45, category: 'manual' }
  },
  {
    id: '2',
    title: 'Políticas de RH 2024',
    file_size: 1024000,
    mime_type: 'application/pdf',
    created_at: '2024-01-09T10:15:00Z',
    metadata: { pages: 12, category: 'hr' }
  },
  {
    id: '3',
    title: 'Relatório Financeiro Q4',
    file_size: 3072000,
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    created_at: '2024-01-08T16:45:00Z',
    metadata: { category: 'finance' }
  }
]

export default function Documents() {
  const [documents] = useState(mockDocuments)
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const { addNotification } = useUIStore()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const validation = validateFile(file)
      
      if (!validation.isValid) {
        addNotification({
          type: 'error',
          title: 'Arquivo Inválido',
          message: validation.error || 'Arquivo não suportado'
        })
        return
      }

      handleUpload(file)
    })
  }, [addNotification])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    multiple: true
  })

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      clearInterval(interval)
      setUploadProgress(100)

      addNotification({
        type: 'success',
        title: 'Upload Concluído',
        message: `${file.name} foi enviado com sucesso!`
      })

      // Reset upload state
      setTimeout(() => {
        setUploadProgress(0)
        setUploading(false)
      }, 1000)

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro no Upload',
        message: 'Falha ao enviar o arquivo. Tente novamente.'
      })
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = (documentId: string) => {
    addNotification({
      type: 'success',
      title: 'Documento Removido',
      message: 'Documento foi removido com sucesso'
    })
  }

  const handleDownload = (document: any) => {
    addNotification({
      type: 'info',
      title: 'Download Iniciado',
      message: `Fazendo download de ${document.title}`
    })
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('text')) return '📄'
    return '📁'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Documentos
          </h1>
          <p className="text-neutral-600 dark:text-gray-400 mt-1">
            Gerencie sua base de conhecimento
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
        <input
          type="text"
          placeholder="Buscar documentos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Enviar Documentos
        </h3>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragActive
              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
              : 'border-neutral-300 dark:border-gray-600 hover:border-primary-400 hover:bg-neutral-50 dark:hover:bg-gray-700'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          
          {uploading ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600 dark:text-gray-400">
                Enviando arquivo...
              </p>
              <div className="w-full bg-neutral-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-neutral-500">{uploadProgress}%</p>
            </div>
          ) : (
            <div>
              <p className="text-neutral-600 dark:text-gray-400 mb-2">
                {isDragActive
                  ? 'Solte os arquivos aqui...'
                  : 'Arraste arquivos aqui ou clique para selecionar'
                }
              </p>
              <p className="text-sm text-neutral-500 dark:text-gray-500">
                Suporte: PDF, DOC, DOCX, TXT, MD (máx. 10MB)
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Documents List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-neutral-200 dark:border-gray-700"
      >
        <div className="p-6 border-b border-neutral-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Meus Documentos ({filteredDocuments.length})
          </h3>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 dark:text-gray-400">
              {searchQuery ? 'Nenhum documento encontrado' : 'Nenhum documento enviado ainda'}
            </p>
            <p className="text-sm text-neutral-500 dark:text-gray-500 mt-1">
              {searchQuery ? 'Tente buscar com outros termos' : 'Envie seus primeiros documentos para começar'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-gray-700">
            {filteredDocuments.map((document, index) => (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 hover:bg-neutral-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-600/20 rounded-lg flex items-center justify-center">
                      <span className="text-xl">
                        {getFileIcon(document.mime_type)}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-neutral-900 dark:text-white">
                        {document.title}
                      </h4>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-neutral-500 dark:text-gray-400">
                        <span>{formatFileSize(document.file_size)}</span>
                        <span>•</span>
                        <span>
                          {new Date(document.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        {document.metadata.pages && (
                          <>
                            <span>•</span>
                            <span>{document.metadata.pages} páginas</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownload(document)}
                      className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-gray-600 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-neutral-600 dark:text-gray-400" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(document.id)}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
} 