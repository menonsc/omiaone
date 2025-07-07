import React, { useState } from 'react';
import { Upload, FileText, Brain, Settings, Trash2, Download, Eye, Search, Plus } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'error';
  aiInsights?: string;
}

export default function SettingsAI() {
  const { addNotification } = useUIStore();
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Relatório_Trimestral.pdf',
      type: 'PDF',
      size: '2.4 MB',
      uploadedAt: '2024-01-15',
      status: 'completed',
      aiInsights: 'Documento analisado com sucesso. Principais tópicos: vendas, marketing, operações.'
    },
    {
      id: '2',
      name: 'Manual_Processos.docx',
      type: 'DOCX',
      size: '1.8 MB',
      uploadedAt: '2024-01-14',
      status: 'processing',
      aiInsights: 'Processando documento...'
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2048,
    autoProcess: true,
    language: 'pt-BR'
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Selecione um arquivo para upload'
      });
      return;
    }

    setIsUploading(true);
    try {
      // Simular upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newDocument: Document = {
        id: Date.now().toString(),
        name: selectedFile.name,
        type: selectedFile.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        size: `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'processing',
        aiInsights: 'Processando documento...'
      };

      setDocuments(prev => [newDocument, ...prev]);
      setSelectedFile(null);
      
      addNotification({
        type: 'success',
        title: 'Sucesso',
        message: 'Documento enviado para processamento'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao fazer upload do documento'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    addNotification({
      type: 'success',
      title: 'Sucesso',
      message: 'Documento removido'
    });
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'processing': return 'Processando';
      case 'error': return 'Erro';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="p-8 pt-10 pl-10 max-w-6xl">
      <h1 className="text-2xl font-bold mb-2 text-neutral-900">Inteligência IA</h1>
      <p className="text-neutral-600 mb-6">Gerencie documentos e configurações de inteligência artificial.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações de IA */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Configurações de IA
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                  Modelo de IA
                </label>
                <select
                  value={aiSettings.model}
                  onChange={(e) => setAiSettings(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="gpt-4">GPT-4 (Recomendado)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3">Claude-3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                  Temperatura: {aiSettings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={aiSettings.temperature}
                  onChange={(e) => setAiSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <p className="text-xs text-neutral-500 dark:text-gray-400 mt-1">
                  Controla a criatividade das respostas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                  Máximo de Tokens
                </label>
                <input
                  type="number"
                  value={aiSettings.maxTokens}
                  onChange={(e) => setAiSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                  Idioma
                </label>
                <select
                  value={aiSettings.language}
                  onChange={(e) => setAiSettings(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={aiSettings.autoProcess}
                  onChange={(e) => setAiSettings(prev => ({ ...prev, autoProcess: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-600"
                />
                <span className="ml-3 text-sm text-neutral-700 dark:text-gray-300">
                  Processamento automático
                </span>
              </label>
            </div>

            <button className="w-full mt-6 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 transition-colors flex items-center justify-center">
              <Settings className="w-4 h-4 mr-2" />
              Salvar Configurações
            </button>
          </div>
        </div>

        {/* Upload e Lista de Documentos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload de Documentos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Upload de Documentos
              </h3>
            </div>
            
            <div className="border-2 border-dashed border-neutral-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.docx,.txt,.csv,.xlsx"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-600 dark:text-gray-400">
                  Clique para selecionar ou arraste arquivos aqui
                </p>
                <p className="text-xs text-neutral-500 dark:text-gray-500 mt-1">
                  PDF, DOCX, TXT, CSV, XLSX (máx. 10MB)
                </p>
              </label>
            </div>

            {selectedFile && (
              <div className="mt-4 p-3 bg-neutral-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm text-neutral-700 dark:text-gray-300">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar para Processamento
                </>
              )}
            </button>
          </div>

          {/* Lista de Documentos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Documentos Processados
                </h3>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-neutral-200 dark:border-gray-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-neutral-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                        {doc.name}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-gray-400">
                        {doc.type} • {doc.size} • {doc.uploadedAt}
                      </p>
                      {doc.aiInsights && (
                        <p className="text-xs text-neutral-600 dark:text-gray-300 mt-1">
                          {doc.aiInsights}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(doc.status)}`}>
                      {getStatusText(doc.status)}
                    </span>
                    
                    <div className="flex gap-1">
                      <button className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredDocuments.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
                  <p className="text-neutral-500 dark:text-gray-400">
                    {searchTerm ? 'Nenhum documento encontrado' : 'Nenhum documento processado ainda'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 