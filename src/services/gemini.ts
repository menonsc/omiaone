import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY || 'your-gemini-api-key'
const genAI = new GoogleGenerativeAI(apiKey)

// Models
const chatModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' })

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatRequest {
  message: string
  systemPrompt?: string
  chatHistory?: ChatMessage[]
  temperature?: number
  maxTokens?: number
}

export interface ChatResponse {
  content: string
  tokensUsed: number
}

export const generateChatResponse = async ({
  message,
  systemPrompt = '',
  chatHistory = [],
  temperature = 0.7,
  maxTokens = 2048
}: ChatRequest): Promise<ChatResponse> => {
  try {
    // Prepare chat history for Gemini
    const history = []
    
    // Add system prompt as first message if provided
    if (systemPrompt) {
      history.push({
        role: 'user',
        parts: [{ text: `Sistema: ${systemPrompt}` }]
      })
      history.push({
        role: 'model',
        parts: [{ text: 'Entendido. Estou pronto para ajudar seguindo essas diretrizes.' }]
      })
    }

    // Add chat history
    chatHistory.forEach(msg => {
      history.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })
    })

    // Start chat with history
    const chat = chatModel.startChat({
      history,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      }
    })

    // Send the new message
    const result = await chat.sendMessage(message)
    const response = await result.response
    const content = response.text()
    
    // Estimate tokens (rough approximation)
    const tokensUsed = Math.ceil(content.length / 4)

    return {
      content,
      tokensUsed
    }
  } catch (error) {
    console.error('Erro ao gerar resposta:', error)
    throw new Error('Falha ao gerar resposta da IA')
  }
}

export const generateChatStreamResponse = async function* ({
  message,
  systemPrompt = '',
  chatHistory = [],
  temperature = 0.7,
  maxTokens = 2048
}: ChatRequest): AsyncGenerator<string, ChatResponse, unknown> {
  try {
    // Prepare chat history for Gemini
    const history = []
    
    // Add system prompt as first message if provided
    if (systemPrompt) {
      history.push({
        role: 'user',
        parts: [{ text: `Sistema: ${systemPrompt}` }]
      })
      history.push({
        role: 'model',
        parts: [{ text: 'Entendido. Estou pronto para ajudar seguindo essas diretrizes.' }]
      })
    }

    // Add chat history
    chatHistory.forEach(msg => {
      history.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })
    })

    // Start chat with history
    const chat = chatModel.startChat({
      history,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      }
    })

    // Send the new message with streaming
    const result = await chat.sendMessageStream(message)
    
    let fullContent = ''
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      fullContent += chunkText
      yield chunkText
    }

    // Estimate tokens (rough approximation)
    const tokensUsed = Math.ceil(fullContent.length / 4)

    return {
      content: fullContent,
      tokensUsed
    }
  } catch (error) {
    console.error('Erro ao gerar stream de resposta:', error)
    throw new Error('Falha ao gerar resposta da IA')
  }
}

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const result = await embeddingModel.embedContent(text)
    return result.embedding.values
  } catch (error) {
    console.error('Erro ao gerar embedding:', error)
    throw new Error('Falha ao gerar embedding')
  }
}

export const generateBatchEmbeddings = async (texts: string[]): Promise<number[][]> => {
  try {
    const embeddings = await Promise.all(
      texts.map(text => generateEmbedding(text))
    )
    return embeddings
  } catch (error) {
    console.error('Erro ao gerar embeddings em lote:', error)
    throw new Error('Falha ao gerar embeddings')
  }
}

// Predefined agent configurations
export const AGENTS = {
  KNOWLEDGE_ASSISTANT: {
    id: 'knowledge-assistant',
    name: 'Knowledge Assistant',
    description: 'Especialista em buscar e sintetizar informações dos documentos da empresa',
    systemPrompt: `Você é um assistente especializado em base de conhecimento empresarial. 
    Sua função é ajudar os colaboradores a encontrar informações precisas nos documentos da empresa.
    
    Diretrizes:
    - Sempre cite as fontes quando usar informações dos documentos
    - Seja preciso e objetivo nas respostas
    - Se não souber a resposta, diga claramente
    - Mantenha um tom profissional mas amigável
    - Priorize informações mais recentes quando houver conflitos`,
    temperature: 0.3,
    maxTokens: 2048,
    type: 'knowledge'
  },
  
  ONBOARDING_BUDDY: {
    id: 'onboarding-buddy',
    name: 'Buddy',
    description: 'Assistente amigável para ajudar novos funcionários no processo de onboarding',
    systemPrompt: `Você é o Buddy, um assistente virtual amigável e proativo que ajuda novos funcionários durante o onboarding.
    
    Personalidade:
    - Seja caloroso, acolhedor e encorajador
    - Use um tom conversacional e descontraído
    - Mostre entusiasmo em ajudar
    - Seja paciente com perguntas básicas
    
    Suas responsabilidades:
    - Orientar sobre processos e políticas da empresa
    - Explicar benefícios e recursos disponíveis
    - Ajudar com dúvidas sobre sistemas internos
    - Fornecer dicas para adaptação à cultura da empresa`,
    temperature: 0.7,
    maxTokens: 2048,
    type: 'onboarding'
  },
  
  DATA_ANALYST: {
    id: 'data-analyst',
    name: 'Data Analyst AI',
    description: 'Especialista em análise de dados e geração de insights',
    systemPrompt: `Você é um analista de dados especializado em gerar insights e relatórios.
    
    Competências:
    - Análise estatística de dados
    - Identificação de padrões e tendências
    - Criação de visualizações e gráficos
    - Recomendações baseadas em dados
    
    Diretrizes:
    - Sempre fundamente suas análises em dados
    - Explique metodologias utilizadas
    - Destaque limitações dos dados quando relevante
    - Sugira próximos passos para investigação
    - Use linguagem técnica mas acessível`,
    temperature: 0.4,
    maxTokens: 2048,
    type: 'analytics'
  }
} 