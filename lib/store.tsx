// Client-side state management using Supabase for realtime sync
// Falls back to localStorage when offline

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

// Get Supabase client
const getSupabaseClient = () => createClient()

import type {
  User,
  ScriptStep,
  Tabulation,
  ServiceSituation,
  Channel,
  Note,
  CallSession,
  Product,
  LoginSession,
  AttendanceTypeOption,
  PersonTypeOption,
  Message,
  Quiz,
  QuizAttempt,
  AdminPermissions,
  ChatMessage, // Imported for chat
  ChatSettings, // Imported for chat
  Presentation, // Imported for presentations
  PresentationProgress, // Imported for presentation progress
  Contract, // Imported for contracts
  FilePresentationProgress, // Added for file presentation progress
  SupervisorTeam, // Import for supervisor teams
  Feedback, // Added Feedback import
  ResultCode,
  QualityQuestion,
  QualityPost,
  QualityComment,
} from "./types"
import debounce from "lodash.debounce" // Import debounce

// Define handleSupabaseError as a placeholder
const handleSupabaseError = (error: unknown) => {
  console.error("Supabase error handler called:", error)
}

const notifyUpdateTimeout: NodeJS.Timeout | null = null
const NOTIFY_DEBOUNCE_MS = 300

// Removed redeclared notifyUpdate function
// export function notifyUpdate() {
//   if (typeof window === "undefined") return

//   // Clear existing timeout
//   if (notifyUpdateTimeout) {
//     clearTimeout(notifyUpdateTimeout)
//   }

//   // Debounce notifications to prevent excessive re-renders
//   notifyUpdateTimeout = setTimeout(() => {
//     window.dispatchEvent(new CustomEvent("store-updated"))
//   }, NOTIFY_DEBOUNCE_MS)
// }

function notifyUpdateImmediate() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent("store-updated"))
}

export function convertTimestamp(value: any): Date {
  // If it's already a Date object
  if (value instanceof Date) {
    return value
  }
  // If it's a string or number, try to convert
  return new Date(value)
}

// Helper function to sanitize data by handling large strings and invalid nested entities
function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const key in data) {
    const value = data[key]

    if (value === undefined || value === null) {
      // Skip undefined/null values
      continue
    } else if (value instanceof Date) {
      sanitized[key] = value.toISOString()
    } else if (Array.isArray(value)) {
      // For arrays, sanitize each element and limit large base64 strings
      sanitized[key] = value
        .map((item) => {
          if (typeof item === "object" && item !== null) {
            // Recursively sanitize objects in arrays
            return sanitizeData(item as Record<string, unknown>)
          }
          // Skip undefined values in arrays
          return item === undefined ? null : item
        })
        .filter((item) => item !== null) // Remove nulls that were undefined
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeData(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

// Helper function to strip imageData from presentations for sync
function sanitizePresentationsForSync(presentations: unknown[]): unknown[] {
  return presentations.map((pres) => {
    if (typeof pres === "object" && pres !== null) {
      const presentation = pres as Record<string, unknown>
      const slides = presentation.slides as Array<Record<string, unknown>> | undefined

      if (slides && Array.isArray(slides)) {
        return {
          ...presentation,
          slides: slides.map((slide) => {
            const sanitizedSlide: Record<string, unknown> = { ...slide }
            if (slide.imageData) {
              sanitizedSlide.imageData = "[IMAGE_STORED_LOCALLY]"
            } else {
              delete sanitizedSlide.imageData
            }
            return sanitizedSlide
          }),
        }
      }
    }
    return pres
  })
}

let duplicateCleaningInProgress = false // Add flag to prevent duplicate cleaning loop

let saveMutex = false
const saveQueue: Array<{ key: string; data: any }> = []

// Adding saveImmediately function that was missing
export function saveImmediately(key: string, data: unknown) {
  if (typeof window === "undefined") return

  // Save to localStorage immediately
  localStorage.setItem(key, JSON.stringify(data))
  localStorage.setItem(`${key}_timestamp`, String(Date.now()))

  notifyUpdateImmediate()
}

export function save(key: string, data: unknown) {
  if (typeof window === "undefined") return

  // Save to localStorage immediately
  localStorage.setItem(key, JSON.stringify(data))

  // Notify listeners with debounce
  scheduleNotification()
}

export const debouncedSave = debounce(async (key: string, data: any) => {
  if (typeof window === "undefined") return

  localStorage.setItem(key, JSON.stringify(data))
  localStorage.setItem(`${key}_timestamp`, String(Date.now()))
}, 1000) // Batch writes every 1000ms

export function loadScriptsFromDataFolder() {
  return
}

// Mock data for demonstration
const MOCK_USERS: User[] = [
  {
    id: "1",
    username: "admin",
    fullName: "Administrador Sistema",
    role: "admin",
    isOnline: true,
    createdAt: new Date(),
    permissions: {
      dashboard: true,
      scripts: true,
      products: true,
      attendanceConfig: true,
      tabulations: true,
      situations: true,
      channels: true,
      notes: true,
      operators: true,
      messagesQuiz: true,
      settings: true,
    },
  },
  {
    id: "2",
    username: "Monitoria1",
    fullName: "Monitoria 1",
    role: "admin",
    isOnline: true,
    createdAt: new Date(),
    permissions: {
      dashboard: true,
      scripts: true,
      products: true,
      attendanceConfig: true,
      tabulations: true,
      situations: true,
      channels: true,
      notes: true,
      operators: true,
      messagesQuiz: true,
      settings: true,
    },
  },
  {
    id: "3",
    username: "Monitoria2",
    fullName: "Monitoria 2",
    role: "admin",
    isOnline: true,
    createdAt: new Date(),
    permissions: {
      dashboard: true,
      scripts: true,
      products: true,
      attendanceConfig: true,
      tabulations: true,
      situations: true,
      channels: true,
      notes: true,
      operators: true,
      messagesQuiz: true,
      settings: true,
    },
  },
  {
    id: "4",
    username: "Monitoria3",
    fullName: "Monitoria 3",
    role: "admin",
    isOnline: true,
    createdAt: new Date(),
    permissions: {
      dashboard: true,
      scripts: true,
      products: true,
      attendanceConfig: true,
      tabulations: true,
      situations: true,
      channels: true,
      notes: true,
      operators: true,
      messagesQuiz: true,
      settings: true,
    },
  },
  {
    id: "5",
    username: "Monitoria4",
    fullName: "Monitoria 4",
    role: "admin",
    isOnline: true,
    createdAt: new Date(),
    permissions: {
      dashboard: true,
      scripts: true,
      products: true,
      attendanceConfig: true,
      tabulations: true,
      situations: true,
      channels: true,
      notes: true,
      operators: true,
      messagesQuiz: true,
      settings: true,
    },
  },
]

const MOCK_SCRIPT_STEPS: ScriptStep[] = []

const MOCK_TABULATIONS: Tabulation[] = [
  // Identification Issues
  {
    id: "tab-1",
    name: "PESSOA NÃO CONFIRMA OS DADOS",
    description:
      "Pessoa informa os números do CPF, porém os dados não conferem com os números registrados no CRM ou a pessoa se recusa a informar os números do CPF para realização da identificação positiva ou pessoa não.",
    color: "#f59e0b",
    createdAt: new Date(),
  },

  // Third Party Contact
  {
    id: "tab-2",
    name: "RECADO COM TERCEIRO",
    description:
      "Terceiro/cliente informa que a empresa entrou em falência/concordata ou terceiro informa que conhece o cliente, anota o recado ou não, ou terceiro pede para ligar outro dia/horário ou em outro telefone.",
    color: "#3b82f6",
    createdAt: new Date(),
  },
  {
    id: "tab-3",
    name: "FALECIDO",
    description: "Terceiro informa que o titular faleceu.",
    color: "#ef4444",
    createdAt: new Date(),
  },
  {
    id: "tab-4",
    name: "FALÊNCIA OU CONCORDATA",
    description: "Utilizamos quando o sócio ou responsável financeiro informar que a empresa entrou em falência.",
    color: "#dc2626",
    createdAt: new Date(),
  },
  {
    id: "tab-5",
    name: "DESCONHECIDO",
    description: "Terceiro informa que não conhece ninguém com o nome do cliente no telefone do cadastro.",
    color: "#6b7280",
    createdAt: new Date(),
  },

  // Contact Without Negotiation
  {
    id: "tab-6",
    name: "CONTATO SEM NEGOCIAÇÃO",
    description:
      "Cliente impossibilitado de falar no momento, faz promessa de pagamento para uma data que ultrapassa o período permitido (data definida para ações especiais, data fixa de boleto, etc). Ou informa que não se lembra se foi feito o pagamento ou débito.",
    color: "#8b5cf6",
    createdAt: new Date(),
  },
  {
    id: "tab-7",
    name: "CONTATO INTERROMPIDO APÓS IP, MAS SEM RESULTADO",
    description: "Se após identificação positiva a ligação for interrompida.",
    color: "#f97316",
    createdAt: new Date(),
  },
  {
    id: "tab-8",
    name: "PESSOA SOLICITA RETORNO EM OUTRO MOMENTO",
    description: "Cliente pede para o operador retornar a ligação em outro dia/horário.",
    color: "#06b6d4",
    createdAt: new Date(),
  },

  // Payment Related
  {
    id: "tab-9",
    name: "PAGAMENTO JÁ EFETUADO",
    description: "Cliente informa que já efetuou o pagamento.",
    color: "#10b981",
    createdAt: new Date(),
  },
  {
    id: "tab-10",
    name: "RECUSA AÇÃO/CAMPANHA",
    description: "Cliente não aceita a ação/ campanha ofertada.",
    color: "#ef4444",
    createdAt: new Date(),
  },
  {
    id: "tab-11",
    name: "TRANSBORDO PARA ATENDIMENTO ENTRE CANAIS",
    description:
      "Quando o atendimento é iniciado em um canal e precisa ser transbordado para resolução por outro canal.",
    color: "#8b5cf6",
    createdAt: new Date(),
  },
  {
    id: "tab-12",
    name: "SEM CAPACIDADE DE PAGAMENTO",
    description:
      "Cliente se recusa a efetuar o pagamento por qualquer motivo: não tem recurso disponível, desemprego, mudanças econômicas ou não pode fazer o pagamento naquele momento.",
    color: "#f59e0b",
    createdAt: new Date(),
  },
  {
    id: "tab-13",
    name: "NEGOCIAÇÃO EM OUTRO CANAL",
    description: "Cliente informa que já está negociando em outro canal.",
    color: "#3b82f6",
    createdAt: new Date(),
  },

  // Contract and Debt Issues
  {
    id: "tab-14",
    name: "SEM CONTRATO EM COBRANÇA",
    description: "O cliente está na base da Telecobrança, mas não constam contratos ativos (em cobrança).",
    color: "#6b7280",
    createdAt: new Date(),
  },
  {
    id: "tab-15",
    name: "DÍVIDA NÃO RECONHECIDA",
    description: "Cliente alega que desconhece a dívida.",
    color: "#f59e0b",
    createdAt: new Date(),
  },

  // Payment Promises
  {
    id: "tab-16",
    name: "PROMESSA DE PAGAMENTO SEM EMISSÃO DE BOLETO",
    description: "Cliente informa que irá depositar o valor para regularização do atraso dentro do prazo estabelecido.",
    color: "#10b981",
    createdAt: new Date(),
  },
  {
    id: "tab-17",
    name: "PROMESSA DE PAGAMENTO COM EMISSÃO DE BOLETO",
    description: "Cliente solicita boleto e informa data de pagamento.",
    color: "#22c55e",
    createdAt: new Date(),
  },

  // Campaign Acceptance
  {
    id: "tab-18",
    name: "ACEITA AÇÃO/CAMPANHA SEM EMISSÃO DE BOLETO",
    description: "Cliente aceita ação/ campanha sem emissão de boleto.",
    color: "#10b981",
    createdAt: new Date(),
  },
  {
    id: "tab-19",
    name: "ACEITA AÇÃO/CAMPANHA COM EMISSÃO DE BOLETO",
    description: "Cliente aceita ação/ campanha com emissão de boleto.",
    color: "#22c55e",
    createdAt: new Date(),
  },
  {
    id: "tab-20",
    name: "CLIENTE COM ACORDO ATIVO RETORNA NO RECEPTIVO",
    description:
      "Quando o cliente retorna no receptivo tendo acordo vigente para solicitar esclarecimentos ou solicitar o boleto.",
    color: "#06b6d4",
    createdAt: new Date(),
  },
  {
    id: "tab-21",
    name: "PROMESSA DE PAGAMENTO ACORDO DE PARCELAMENTO",
    description: "Cliente confirma o pagamento parcelado do CARTÃO DE CRÉDITO.",
    color: "#10b981",
    createdAt: new Date(),
  },

  // Technical Issues
  {
    id: "tab-22",
    name: "SINAL DE FAX",
    description: "Ligação direcionada: sinal de FAX.",
    color: "#6b7280",
    createdAt: new Date(),
  },
  {
    id: "tab-23",
    name: "CAIXA POSTAL",
    description: "Devemos utilizar quando a ligação é direcionada diretamente à caixa postal.",
    color: "#6b7280",
    createdAt: new Date(),
  },
  {
    id: "tab-24",
    name: "LIGAÇÃO CAIU",
    description:
      "São ligações que não conseguimos extrair uma informação para usar outra tabulação durante o atendimento.",
    color: "#f97316",
    createdAt: new Date(),
  },
  {
    id: "tab-25",
    name: "LIGAÇÃO MUDA",
    description:
      "Devemos utilizar quando a ligação se iniciar muda. Lembrando que se a pessoa atender e houver ruídos ou vozes que não se direcionar a você será considerada uma ligação muda.",
    color: "#f97316",
    createdAt: new Date(),
  },
]

const MOCK_SITUATIONS: ServiceSituation[] = [
  {
    id: "sit-1",
    name: "EM CASOS DE FALÊNCIA/CONCORDATA",
    description:
      "É necessário que o sócio ou responsável entre em contato com a CAIXA acessando www.caixa.gov.br/negociar e pelo WhatsApp 0800 101 0104.\n\nTabulação correta: Recado com terceiro",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-2",
    name: "FALECIDO",
    description:
      "Pessoa informa que o titular faleceu. É necessário que compareça à agência levando a certidão de óbito para que as ligações de cobrança sejam interrompidas.\n\nTabulação correta: FALECIDO",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-3",
    name: "SE O CLIENTE CITAR A LGPD OU PERGUNTAR POR QUE TEMOS OS SEUS DADOS",
    description:
      '"(NOME DO CLIENTE), seguindo a lei LGPD, n°13.709, possuímos alguns dados representando a CAIXAECONÔMICA FEDERAL, para garantir sua segurança. Caso você possua qualquer dúvida ou solicitação em relação a isso, pedimos que entre em contato conosco enviando um e-mail para: dpo@gruporoveri.com.br ."\n\nEXEMPLOS DE QUESTIONAMENTOS FEITOS PELOS CLIENTES:\n- Como você possui meus dados pessoais?\n- Vocês têm o direito de me ligar?\n- Isso está conforme a LGPD?\n- Quero que excluam meus dados!',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-4",
    name: "O CLIENTE SOLICITA O PROTOCOLO DA LIGAÇÃO",
    description:
      "Informar que nós somos uma central de negócios, ou seja, nosso atendimento não possui caráter de SAC. Entretanto, como mencionamos no início do contato, todas as ligações são gravadas e para que você tenha acesso a elas é necessário que as solicite na sua agência de relacionamento.\n\nPORQUE NÃO PODEMOS REPASSAR ESSA INFORMAÇÃO PARA O CLIENTE?\nNossa assessoria não é SAC.",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-5",
    name: 'Se o cliente informar que "Não reside no Imóvel"',
    description:
      "Orientação - Embora o senhor(a) não resida no local, a dívida está registrada em seu nome e CPF, o que o(a) mantém como responsável pela regularização. Para resolver essa situação de forma rápida e eficiente, sugerimos que entre em contato com a pessoa que realiza o pagamento dessa dívida. Isso pode ajudar a esclarecer se o pagamento já foi efetuado, se há uma data prevista para a quitação ou outras informações relevantes.",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-6",
    name: "CLIENTE SOLICITOU A LIGAÇÃO DO ATENDIMENTO",
    description:
      'CASO O CONTRATO SEJA DOS ESTADOS:\nPARANÁ - DDD (41,42,43,44,45 e 46)\nRIO DE JANEIRO - DDD (21)\nSÃO PAULO - DDD (11)\nM ATO GROSSO - DDD (65)\n\nDevemos informar: "A solicitação será repassada à CAIXA para verificação e atendimento no prazo de até 7 (sete) dias úteis."\n\n(PARA OUTROS ESTADOS)\nNesses casos, o que deve ser repassado para o cliente é: "Você pode solicitar a escuta da ligação na sua agência de relacionamento."',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-7",
    name: "QUANDO O CLIENTE DO FIES DISSER QUE QUER PAUSAR O PAGAMENTO DAS SUAS PARCELAS",
    description:
      'Caso o cliente do FIES questione a possibilidade de renegociar ou solicite o desconto para seu contrato, informar:\n\n1. "Você pode verificar se o seu contrato tem a possibilidade de realizar renegociação no site http://sifesweb.caixa.gov.br, APP FIES CAIXA ou na sua agência."\n\nATENÇÃO! Lembrando que essa orientação só deve ser repassada para aqueles clientes que já fizeram a confirmação positiva.',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-8",
    name: "CONTRATOS DE EMPRÉSTIMO CONSIGNADO",
    description:
      'Devemos orientar o cliente pedindo para que ele verifique novamente se o valor foi de fato descontado da folha de pagamento. Caso ele fale que vai aguardar em linha este retorno. Se o cliente disser que não pode fazer essa verificação durante o atendimento, podemos solicitar o melhor horário e telefone para realizar um contato futuro.\n\nQUESTIONAMENTO NORMALMENTE REALIZADO PELO CLIENTE:\n"Isso é descontado na minha folha de pagamento, não está aparecendo no sistema?"',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-9",
    name: "NÃO RECONHECE A DÍVIDA",
    description:
      "Orientações: Orientar o cliente a procurar uma agência da CAIXA para mais informações ou ligar no 0800 101 0104. Para cartão de crédito, indicar a central de atendimento que está no verso do cartão para contestação das despesas.",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-10",
    name: "O QUE FAZER QUANDO CAIR UM PRODUTO QUE NÃO ATENDO?",
    description:
      'PASSO A PASSO:\n1. ABORDAGEM PADRÃO;\n2. CONFIRMAÇÃO DE DADOS - IDENTIFICAÇÃO POSITIVA;\n3. INFORMAR AO CLIENTE: "PEÇO QUE AGUARDE UM INSTANTE QUE IREI TRANSFERIR AO SETOR RESPONSÁVEL";\n4. TRANSFERIR NA SEGUNDA ABA DO WEDOO EM "CAMPANHA RECEPTIVO";\n5. TABULAR: TRANSFERÊNCIA DE LIGAÇÃO.',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-11",
    name: "O QUE FAZER QUANDO CAIR ATENDIMENTO CNPJ?",
    description:
      "ABORDAGEM PADRÃO: FALAR NOME DO SÓCIO QUE CONSTA EM DADOS DO CLIENTE;\n\n● SE CONSTAR NOME DA EMPRESA EM DADOS DO CLIENTE, SOLICITE PARA FALAR COM SÓCIO OU RESPONSÁVEL FINANCEIRO DA EMPRESA;\n\n● VERIFIQUE O NOME DO SÓCIO OU RESPONSÁVEL FINANCEIRO DA EMPRESA EM: DETALHES DO CLIENTE;\n\n● SE NÃO CONSTAR ESSA INFORMAÇÃO SOLICITE O NOME COMPLETO E REALIZE A INCLUSÃO.",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-12",
    name: "EM CASOS DE SINEB 2.0",
    description:
      'A CAIXA está te oferecendo a proposta de renegociar o contrato para que você possa quitar seu(s) contrato(s) vencido(s).\n\n"Lembramos que o pagamento efetuado permite a exclusão do seu CPF dos cadastros restritivos dentro de até 10 dias úteis."\n\n- Alerto que as ligações terão continuidade e que os juros do(s) seu(s) contrato(s) são corrigidos diariamente.\n\n- "A CAIXA não garante que as condições dessa proposta serão mantidas para um acordo futuro."\n\n- "É importante regularizar a sua dívida para a exclusão do seu CPF dos cadastros restritivos."',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-13",
    name: "A Lei 12395/2024 do Estado do Mato Grosso e a Lei 16276/2025 do Rio Grande Sul",
    description:
      "A Lei 12395/2024 do Estado do Mato Grosso e a Lei 16276/2025 do Rio Grande Sul também determinam que deve ser informado a composição dos valores cobrados quanto a o que efetivamente correspondem, destacando-se o valor originário e seus adicionais (juros, multas, taxas, custas, honorários e outros que, somados, correspondam ao valor total cobrado do consumidor) ao cliente desse estado que solicitar.",
    isActive: true,
    createdAt: new Date(),
  },
]

const MOCK_CHANNELS: Channel[] = [
  {
    id: "ch-1",
    name: "Alô CAIXA",
    contact: "4004 0 104 (Capitais e Regiões Metropolitanas) | 0800 104 0 104 (Demais regiões)",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-2",
    name: "Atendimento CAIXA Cidadão",
    contact: "0800 726 0207",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-3",
    name: "Agência Digital",
    contact: "4004 0 104 (Capitais) | 0800 104 0 104 (Demais regiões)",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-4",
    name: "Atendimento para Pessoas Surdas",
    contact: "https://icom.app/8AG8Z | www.caixa.gov.br/libras",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-5",
    name: "SAC CAIXA",
    contact: "0800 721 0101",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-6",
    name: "Ouvidoria CAIXA",
    contact: "0800 725 7474",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-7",
    name: "Canal de Denúncias",
    contact: "0800 721 0738 | https://www.caixa.gov.br/denuncia",
    isActive: true,
    createdAt: new Date(),
  },
]

export const STORAGE_KEYS = {
  USERS: "callcenter_users",
  CURRENT_USER: "callcenter_current_user",
  SCRIPT_STEPS: "callcenter_script_steps",
  TABULATIONS: "callcenter_tabulations",
  SITUATIONS: "callcenter_situations",
  CHANNELS: "callcenter_channels",
  NOTES: "callcenter_notes",
  SESSIONS: "callcenter_sessions",
  PRODUCTS: "callcenter_products",
  LAST_UPDATE: "callcenter_last_update", // Track last update for real-time sync
  ATTENDANCE_TYPES: "callcenter_attendance_types",
  PERSON_TYPES: "callcenter_person_types",
  MESSAGES: "callcenter_messages",
  QUIZZES: "callcenter_quizzes",
  QUIZ_ATTEMPTS: "callcenter_quiz_attempts",
  CHAT_MESSAGES: "callcenter_chat_messages",
  CHAT_SETTINGS: "callcenter_chat_settings",
  PRESENTATIONS: "callcenter_presentations",
  PRESENTATION_PROGRESS: "callcenter_presentation_progress",
  CONTRACTS: "contracts", // Added storage key for contracts
  PPT_FILE_PROGRESS: "ppt_file_progress",
  FILE_PRESENTATION_PROGRESS: "callcenter_file_presentation_progress", // Added storage key for file presentation progress
  SUPERVISOR_TEAMS: "callcenter_supervisor_teams",
  FEEDBACKS: "callcenter_feedbacks", // Added storage key for feedbacks
RESULT_CODES: "callcenter_result_codes",
  QUALITY_QUESTIONS: "callcenter_quality_questions",
  QUALITY_POSTS: "callcenter_quality_posts",
  } as const

// Initialize mock data
export function initializeMockData() {
  if (typeof window === "undefined") return

  const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS)
  if (!existingUsers) {
    debouncedSave(STORAGE_KEYS.USERS, MOCK_USERS)
    console.log(
      "[v0] Users initialized:",
      MOCK_USERS.map((u) => u.username),
    )
  }

  if (!localStorage.getItem(STORAGE_KEYS.SCRIPT_STEPS)) {
    localStorage.setItem(STORAGE_KEYS.SCRIPT_STEPS, JSON.stringify([]))
  }

  if (!localStorage.getItem(STORAGE_KEYS.TABULATIONS)) {
    localStorage.setItem(STORAGE_KEYS.TABULATIONS, JSON.stringify(MOCK_TABULATIONS))
  }

  if (!localStorage.getItem(STORAGE_KEYS.SITUATIONS)) {
    localStorage.setItem(STORAGE_KEYS.SITUATIONS, JSON.stringify(MOCK_SITUATIONS))
  }

  if (!localStorage.getItem(STORAGE_KEYS.CHANNELS)) {
    localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(MOCK_CHANNELS))
  }

  if (!localStorage.getItem(STORAGE_KEYS.NOTES)) {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]))
  }

  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]))
  }

  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE_TYPES)) {
    const defaultAttendanceTypes: AttendanceTypeOption[] = [
      {
        id: "att-ativo",
        value: "ativo",
        label: "Ativo",
        createdAt: new Date(),
      },
      {
        id: "att-receptivo",
        value: "receptivo",
        label: "Receptivo",
        createdAt: new Date(),
      },
    ]
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_TYPES, JSON.stringify(defaultAttendanceTypes))
  }

  if (!localStorage.getItem(STORAGE_KEYS.PERSON_TYPES)) {
    const defaultPersonTypes: PersonTypeOption[] = [
      {
        id: "per-fisica",
        value: "fisica",
        label: "Física",
        createdAt: new Date(),
      },
      {
        id: "per-juridica",
        value: "juridica",
        label: "Jurídica",
        createdAt: new Date(),
      },
    ]
    localStorage.setItem(STORAGE_KEYS.PERSON_TYPES, JSON.stringify(defaultPersonTypes))
  }

  if (!localStorage.getItem(STORAGE_KEYS.LAST_UPDATE)) {
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString())
  }

  if (!localStorage.getItem(STORAGE_KEYS.CHAT_SETTINGS)) {
    const defaultChatSettings: ChatSettings = {
      isEnabled: true,
      updatedAt: new Date(),
      updatedBy: "system",
    }
    localStorage.setItem(STORAGE_KEYS.CHAT_SETTINGS, JSON.stringify(defaultChatSettings))
  }

  if (!localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES)) {
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify([]))
  }

  if (!localStorage.getItem(STORAGE_KEYS.PRESENTATIONS)) {
    localStorage.setItem(STORAGE_KEYS.PRESENTATIONS, JSON.stringify([]))
  }

  if (!localStorage.getItem(STORAGE_KEYS.PRESENTATION_PROGRESS)) {
    localStorage.setItem(STORAGE_KEYS.PRESENTATION_PROGRESS, JSON.stringify([]))
  }

  if (!localStorage.getItem(STORAGE_KEYS.QUIZ_ATTEMPTS)) {
    const mockQuizAttempts = [
      // Current month attempts
      {
        id: "att-1",
        quizId: "quiz-1",
        operatorId: "2",
        operatorName: "Monitoria 1",
        selectedAnswer: "opt-1",
        isCorrect: true,
        attemptedAt: new Date(),
      },
      {
        id: "att-2",
        quizId: "quiz-1",
        operatorId: "3",
        operatorName: "Monitoria 2",
        selectedAnswer: "opt-2",
        isCorrect: false,
        attemptedAt: new Date(),
      },
      {
        id: "att-3",
        quizId: "quiz-2",
        operatorId: "2",
        operatorName: "Monitoria 1",
        selectedAnswer: "opt-1",
        isCorrect: true,
        attemptedAt: new Date(),
      },
      {
        id: "att-4",
        quizId: "quiz-2",
        operatorId: "4",
        operatorName: "Monitoria 3",
        selectedAnswer: "opt-1",
        isCorrect: true,
        attemptedAt: new Date(),
      },
      {
        id: "att-5",
        quizId: "quiz-1",
        operatorId: "4",
        operatorName: "Monitoria 3",
        selectedAnswer: "opt-1",
        isCorrect: true,
        attemptedAt: new Date(),
      },
      {
        id: "att-6",
        quizId: "quiz-2",
        operatorId: "3",
        operatorName: "Monitoria 2",
        selectedAnswer: "opt-1",
        isCorrect: true,
        attemptedAt: new Date(),
      },
      {
        id: "att-7",
        quizId: "quiz-1",
        operatorId: "5",
        operatorName: "Monitoria 4",
        selectedAnswer: "opt-2",
        isCorrect: false,
        attemptedAt: new Date(),
      },
    ]
    localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(mockQuizAttempts))
  }

  // Initialize mock data for contracts
  if (!localStorage.getItem(STORAGE_KEYS.CONTRACTS)) {
    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify([]))
  }

  // Initialize mock data for file presentation progress
  if (!localStorage.getItem(STORAGE_KEYS.FILE_PRESENTATION_PROGRESS)) {
    localStorage.setItem(STORAGE_KEYS.FILE_PRESENTATION_PROGRESS, JSON.stringify([]))
  }

  // Initialize mock data for supervisor teams
  if (!localStorage.getItem(STORAGE_KEYS.SUPERVISOR_TEAMS)) {
    localStorage.setItem(STORAGE_KEYS.SUPERVISOR_TEAMS, JSON.stringify([]))
  }

  if (!localStorage.getItem(STORAGE_KEYS.FEEDBACKS)) {
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify([]))
  }

  cleanupOldSessions()
  cleanupDuplicateUsers() // Add this line to initialize the cleanup

  loadScriptsFromDataFolder()
}

// User authentication
export function authenticateUser(username: string, password: string): User | null {
  if (typeof window === "undefined") return null

  const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")

  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase())

  if (user) {
    if (user.role === "admin") {
      const masterPasswords = ["rcp@$", "#qualidade@$"]
      const isValidPassword = user.password ? user.password === password : masterPasswords.includes(password)

      if (!isValidPassword) {
        return null
      }

      const session: LoginSession = {
        id: `session-${Date.now()}`,
        loginAt: new Date(),
      }

      user.lastLoginAt = new Date()
      user.isOnline = true
      user.loginSessions = user.loginSessions || []
      user.loginSessions.push(session)

      // Update user in storage
      const updatedUsers = users.map((u) => (u.id === user.id ? user : u))
      debouncedSave(STORAGE_KEYS.USERS, updatedUsers)

      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
      return user
    }

    // Operator login logic
    const session: LoginSession = {
      id: `session-${Date.now()}`,
      loginAt: new Date(),
    }

    user.lastLoginAt = new Date()
    user.isOnline = true
    user.loginSessions = user.loginSessions || []
    user.loginSessions.push(session)

    // Update user in storage
    const updatedUsers = users.map((u) => (u.id === user.id ? user : u))
    debouncedSave(STORAGE_KEYS.USERS, updatedUsers)

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    return user
  }

  return null
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  return userStr ? JSON.parse(userStr) : null
}

export function logout() {
  if (typeof window === "undefined") return

  const currentUser = getCurrentUser()
  if (currentUser && currentUser.loginSessions && currentUser.loginSessions.length > 0) {
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")
    const user = users.find((u) => u.id === currentUser.id)

    // </CHANGE> Added check to ensure lastSession exists before accessing properties
    if (user && user.loginSessions && user.loginSessions.length > 0) {
      const lastSession = user.loginSessions[user.loginSessions.length - 1]
      if (lastSession && !lastSession.logoutAt) {
        lastSession.logoutAt = new Date()
        lastSession.duration = lastSession.logoutAt.getTime() - new Date(lastSession.loginAt).getTime()
        user.isOnline = false

        // Update user in storage
        const updatedUsers = users.map((u) => (u.id === user.id ? user : u))
        debouncedSave(STORAGE_KEYS.USERS, updatedUsers)
        notifyUpdateImmediate()
      }
    }
  }

  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
}

// Supabase realtime sync for scripts and products
let supabaseScriptsLoaded = false
let supabaseProductsLoaded = false

async function syncScriptsFromSupabase() {
  try {
    const { data: scripts, error } = await getSupabaseClient()
      .from("scripts")
      .select("*")
      .order("step_order", { ascending: true })
    
    if (!error && scripts && scripts.length > 0) {
      const mappedSteps: ScriptStep[] = scripts.map((s: any) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        productId: s.product_id,
        productName: s.product_name,
        order: s.step_order || 0,
        buttons: s.buttons || [],
        tabulations: s.tabulations || [],
        alert: s.alert,
        isActive: s.is_active ?? true,
        createdAt: new Date(s.created_at),
        updatedAt: s.updated_at ? new Date(s.updated_at) : new Date(s.created_at),
      }))
      
      localStorage.setItem(STORAGE_KEYS.SCRIPT_STEPS, JSON.stringify(mappedSteps))
      supabaseScriptsLoaded = true
      notifyUpdateImmediate()
    }
  } catch (e) {
    console.error("[Store] Error syncing scripts from Supabase:", e)
  }
}

async function syncProductsFromSupabase() {
  try {
    const { data: products, error } = await getSupabaseClient()
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true })
    
    if (!error && products && products.length > 0) {
      const mappedProducts: Product[] = products.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        scriptId: `${p.id}-inicio`,
        category: p.category || "outros",
        isActive: p.is_active ?? true,
        details: p.details || {},
        createdAt: new Date(p.created_at),
        updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(p.created_at),
      }))
      
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(mappedProducts))
      supabaseProductsLoaded = true
      notifyUpdateImmediate()
    }
  } catch (e) {
    console.error("[Store] Error syncing products from Supabase:", e)
  }
}

// Initialize Supabase sync on load with polling (sem realtime)
let syncInitialized = false

// Polling interval - 60 seconds para reduzir requisições
const SYNC_POLLING_INTERVAL = 60000

function initializeSupabaseSync() {
  if (syncInitialized || typeof window === "undefined") return
  syncInitialized = true
  
  // Initial sync
  syncScriptsFromSupabase()
  syncProductsFromSupabase()
  
  // Polling ao invés de realtime
  setInterval(() => {
    syncScriptsFromSupabase()
    syncProductsFromSupabase()
  }, SYNC_POLLING_INTERVAL)
}

// Initialize on first access
if (typeof window !== "undefined") {
  // Delay initialization to ensure client is ready
  setTimeout(initializeSupabaseSync, 100)
}

// Script steps
export function getScriptSteps(): ScriptStep[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SCRIPT_STEPS) || "[]")
}

export function getScriptStepById(id: string, productId?: string): ScriptStep | null {
  const steps = getScriptSteps()

  // If productId is provided, filter by product first
  if (productId) {
    const productSteps = steps.filter((s) => s.productId === productId)
    return productSteps.find((s) => s.id === id) || null
  }

  return steps.find((s) => s.id === id) || null
}

// Memoization for expensive operations
const scriptStepsCache = new Map<string, { data: ScriptStep[]; timestamp: number }>()
const productCache = new Map<string, { data: Product; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute cache TTL

// Removed redeclared clearCaches function
// export function clearCaches() {
//   scriptStepsCache.clear()
//   productCache.clear()
// }

if (typeof window !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    scriptStepsCache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_TTL) {
        scriptStepsCache.delete(key)
      }
    })
    productCache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_TTL) {
        productCache.delete(key)
      }
    })
  }, 300000) // Clean every 5 minutes - aumentado para reduzir overhead
}

export function getScriptStepsByProduct(productId: string): ScriptStep[] {
  if (typeof window === "undefined") return []

  const cached = scriptStepsCache.get(productId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const allSteps = getScriptSteps()
  const filtered = allSteps.filter((step) => step.productId === productId)

  scriptStepsCache.set(productId, { data: filtered, timestamp: Date.now() })

  return filtered
}

export function getProductById(id: string): Product | null {
  const cached = productCache.get(id)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const products = getProducts()
  const product = products.find((p) => p.id === id) || null

  if (product) {
    productCache.set(id, { data: product, timestamp: Date.now() })
  }

  return product
}

export function updateScriptStep(step: ScriptStep) {
  if (typeof window === "undefined") return

  const steps = getScriptSteps()
  const index = steps.findIndex((s) => s.id === step.id)

  if (index !== -1) {
    steps[index] = { ...step, updatedAt: new Date() }
    debouncedSave(STORAGE_KEYS.SCRIPT_STEPS, steps)
    clearCaches() // Clear cache
    notifyUpdateImmediate()
  }
}

export function createScriptStep(step: Omit<ScriptStep, "id" | "createdAt" | "updatedAt">): ScriptStep {
  if (typeof window === "undefined") return { ...step, id: "", createdAt: new Date(), updatedAt: new Date() }

  const newStep: ScriptStep = {
    ...step,
    id: `step-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const steps = getScriptSteps()
  steps.push(newStep)
  debouncedSave(STORAGE_KEYS.SCRIPT_STEPS, steps)
  notifyUpdateImmediate() // Notify about update

  return newStep
}

export function deleteScriptStep(id: string) {
  if (typeof window === "undefined") return

  const steps = getScriptSteps().filter((s) => s.id !== id)
  debouncedSave(STORAGE_KEYS.SCRIPT_STEPS, steps)
  notifyUpdateImmediate() // Notify about update
}

export function deleteAllStepsFromProduct(productId: string) {
  if (typeof window === "undefined") return

  const steps = getScriptSteps().filter((s) => s.productId !== productId)
  debouncedSave(STORAGE_KEYS.SCRIPT_STEPS, steps)
  clearCaches()
  notifyUpdateImmediate()
}

// Supabase sync for tabulations, situations, channels
async function syncTabulationsFromSupabase() {
  try {
    const { data, error } = await getSupabaseClient()
      .from("tabulations")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true })
    
    if (!error && data && data.length > 0) {
      const mapped: Tabulation[] = data.map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description || "",
        color: t.color || "#6b7280",
        createdAt: new Date(t.created_at),
      }))
      localStorage.setItem(STORAGE_KEYS.TABULATIONS, JSON.stringify(mapped))
      notifyUpdateImmediate()
    }
  } catch (e) {
    console.error("[Store] Error syncing tabulations:", e)
  }
}

async function syncSituationsFromSupabase() {
  try {
    const { data, error } = await getSupabaseClient()
      .from("situations")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true })
    
    if (!error && data && data.length > 0) {
      const mapped: ServiceSituation[] = data.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || "",
        isActive: s.is_active ?? true,
        createdAt: new Date(s.created_at),
      }))
      localStorage.setItem(STORAGE_KEYS.SITUATIONS, JSON.stringify(mapped))
      notifyUpdateImmediate()
    }
  } catch (e) {
    console.error("[Store] Error syncing situations:", e)
  }
}

async function syncChannelsFromSupabase() {
  try {
    const { data, error } = await getSupabaseClient()
      .from("channels")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true })
    
    if (!error && data && data.length > 0) {
      const mapped: Channel[] = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || "",
        contact: c.icon || "",
        isActive: c.is_active ?? true,
        createdAt: new Date(c.created_at),
      }))
      localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(mapped))
      notifyUpdateImmediate()
    }
  } catch (e) {
    console.error("[Store] Error syncing channels:", e)
  }
}

// Initialize sync for tabulations, situations, channels with polling (sem realtime)
if (typeof window !== "undefined") {
  syncTabulationsFromSupabase()
  syncSituationsFromSupabase()
  syncChannelsFromSupabase()
  
  // Polling ao invés de realtime
  setInterval(() => {
    syncTabulationsFromSupabase()
    syncSituationsFromSupabase()
    syncChannelsFromSupabase()
  }, SYNC_POLLING_INTERVAL)
}

// Tabulations
export function getTabulations(): Tabulation[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.TABULATIONS) || "[]")
}

// Situations
export function getSituations(): ServiceSituation[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SITUATIONS) || "[]")
}

// Channels
export function getChannels(): Channel[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHANNELS) || "[]")
}

// Notes
export function getNotes(userId: string): Note[] {
  if (typeof window === "undefined") return []
  const notes: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || "[]")
  return notes.filter((n) => n.userId === userId)
}

export function saveNote(userId: string, content: string) {
  if (typeof window === "undefined") return

  const notes: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || "[]")
  const newNote: Note = {
    id: `note-${Date.now()}`,
    userId,
    content,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  notes.push(newNote)
  debouncedSave(STORAGE_KEYS.NOTES, notes)
}

// Call sessions
export function createCallSession(operatorId: string, startStepId: string): CallSession {
  if (typeof window === "undefined")
    return {
      id: "",
      operatorId,
      currentStepId: startStepId,
      startedAt: new Date(),
      notes: [],
    }

  const session: CallSession = {
    id: `session-${Date.now()}`,
    operatorId,
    currentStepId: startStepId,
    startedAt: new Date(),
    notes: [],
  }

  const sessions: CallSession[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || "[]")
  sessions.push(session)
  debouncedSave(STORAGE_KEYS.SESSIONS, sessions)

  return session
}

export function updateCallSession(session: CallSession) {
  if (typeof window === "undefined") return

  const sessions: CallSession[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || "[]")
  const index = sessions.findIndex((s) => s.id === session.id)

  if (index !== -1) {
    sessions[index] = session
    debouncedSave(STORAGE_KEYS.SESSIONS, sessions)
  }
}

// Products
export function getProducts(): Product[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || "[]")
}

export function createProduct(product: Omit<Product, "id" | "createdAt">): Product {
  if (typeof window === "undefined") return { ...product, id: "", createdAt: new Date() }

  const newProduct: Product = {
    ...product,
    id: `product-${Date.now()}`,
    createdAt: new Date(),
  }

  const products = getProducts()
  products.push(newProduct)
  saveImmediately(STORAGE_KEYS.PRODUCTS, products) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()
  clearCaches()

  return newProduct
}

export function updateProduct(product: Product) {
  if (typeof window === "undefined") return

  const products = getProducts()
  const index = products.findIndex((p) => p.id === product.id)

  if (index !== -1) {
    products[index] = product
    saveImmediately(STORAGE_KEYS.PRODUCTS, products) // Using saveImmediately instead of debouncedSave
    notifyUpdateImmediate()
    clearCaches()
  }
}

export function deleteProduct(id: string) {
  if (typeof window === "undefined") return

  const products = getProducts().filter((p) => p.id !== id)
  const steps = getScriptSteps().filter((s) => s.productId !== id)

  saveImmediately(STORAGE_KEYS.PRODUCTS, products) // Using saveImmediately instead of debouncedSave
  saveImmediately(STORAGE_KEYS.SCRIPT_STEPS, steps) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()
  clearCaches()
}

// Additional user management functions
export function getAllUsers(): User[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")
}

export function updateUser(user: User) {
  if (typeof window === "undefined") return

  try {
    const users = getAllUsers()
    const index = users.findIndex((u) => u.id === user.id)

    if (index !== -1) {
      users[index] = user
      localStorage.setItem(`${STORAGE_KEYS.USERS}_timestamp`, String(Date.now()))
      saveImmediately(STORAGE_KEYS.USERS, users)
      notifyUpdateImmediate()
    }
  } catch (error) {
    console.error("[v0] Error updating user:", error)
  }
}

export function deleteUser(userId: string) {
  if (typeof window === "undefined") return

  try {
    const users = getAllUsers()
    const beforeCount = users.length
    const updatedUsers = users.filter((u) => u.id !== userId)

    console.log(`[v0] 🗑️ Deleting user: ${userId}, Before: ${beforeCount} users, After: ${updatedUsers.length} users`)

    localStorage.setItem(`${STORAGE_KEYS.USERS}_timestamp`, String(Date.now()))
    saveImmediately(STORAGE_KEYS.USERS, updatedUsers)
    notifyUpdateImmediate()
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
  }
}

export function forceLogoutUser(userId: string) {
  if (typeof window === "undefined") return

  try {
    const users = getAllUsers()
    const user = users.find((u) => u.id === userId)

    if (user && user.loginSessions && user.loginSessions.length > 0) {
      const lastSession = user.loginSessions[user.loginSessions.length - 1]
      if (!lastSession.logoutAt) {
        lastSession.logoutAt = new Date()
        lastSession.duration = lastSession.logoutAt.getTime() - new Date(lastSession.loginAt).getTime()
        user.isOnline = false

        const updatedUsers = users.map((u) => (u.id === user.id ? user : u))
        saveImmediately(STORAGE_KEYS.USERS, updatedUsers)
        notifyUpdateImmediate()
      }
    }
  } catch (error) {
    console.error("[v0] Error forcing logout:", error)
  }
}

export function getTodayLoginSessions(userId: string): LoginSession[] {
  if (typeof window === "undefined") return []

  const users = getAllUsers()
  const user = users.find((u) => u.id === userId)

  if (!user || !user.loginSessions) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return user.loginSessions.filter((session) => {
    const sessionDate = convertFirestoreTimestamp(session.loginAt)
    sessionDate.setHours(0, 0, 0, 0)
    return sessionDate.getTime() === today.getTime()
  })
}

export function getLoginSessionsForDate(userId: string, date: Date): LoginSession[] {
  if (typeof window === "undefined") return []

  const users = getAllUsers()
  const user = users.find((u) => u.id === userId)

  if (!user || !user.loginSessions) return []

  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  return user.loginSessions.filter((session) => {
    const sessionDate = convertFirestoreTimestamp(session.loginAt)
    sessionDate.setHours(0, 0, 0, 0)
    return sessionDate.getTime() === targetDate.getTime()
  })
}

export function getConnectedTimeForDate(userId: string, date: Date): number {
  const sessions = getLoginSessionsForDate(userId, date)
  const isToday = new Date().toDateString() === date.toDateString()

  return sessions.reduce((total, session) => {
    if (session.duration) {
      return total + session.duration
    } else if (!session.logoutAt && isToday) {
      // Still logged in and checking for today
      return total + (Date.now() - convertFirestoreTimestamp(session.loginAt).getTime())
    }
    return total
  }, 0)
}

export function getTodayConnectedTime(userId: string): number {
  const sessions = getTodayLoginSessions(userId)

  return sessions.reduce((total, session) => {
    if (session.duration) {
      return total + session.duration
    } else if (!session.logoutAt) {
      // Still logged in
      return total + (Date.now() - convertFirestoreTimestamp(session.loginAt).getTime())
    }
    return total
  }, 0)
}

// Debouncing utility for localStorage operations
let updateTimeout: NodeJS.Timeout | null = null

// The previous notifyUpdate function was redeclared here.
// This version is kept for clarity to fix the linting error.
export function notifyUpdate() {
  if (typeof window === "undefined") return

  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }

  updateTimeout = setTimeout(() => {
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString())
    window.dispatchEvent(new CustomEvent("store-updated"))
  }, 300) // Increased from 100ms to reduce event frequency
}

export function getLastUpdate(): number {
  if (typeof window === "undefined") return 0
  return Number.parseInt(localStorage.getItem(STORAGE_KEYS.LAST_UPDATE) || "0")
}

interface JsonData {
  marcas?: Record<string, Record<string, any>>
}

// A sincronização de dados é feita via Supabase Realtime

export function importScriptFromJson(jsonData: JsonData): { productCount: number; stepCount: number } {
  if (typeof window === "undefined") return { productCount: 0, stepCount: 0 }

  let productCount = 0
  let stepCount = 0

  try {
    if (jsonData.marcas) {
      Object.entries(jsonData.marcas).forEach(([productName, productSteps]: [string, any]) => {
        if (!productSteps || typeof productSteps !== "object") {
          console.warn(`[v0] Skipping invalid product: ${productName}`)
          return
        }

        const steps: ScriptStep[] = []
        const productId = `prod-${productName.toLowerCase().replace(/\s+/g, "-")}`

        Object.entries(productSteps).forEach(([stepKey, stepData]: [string, any]) => {
          if (!stepData || typeof stepData !== "object" || !stepData.id || !stepData.title) {
            console.warn(`[v0] Skipping invalid step: ${stepKey} in product ${productName}`)
            return
          }

          const content = stepData.body || stepData.content || ""
          if (!content.trim()) {
            console.warn(`[v0] Warning: Empty content for step ${stepData.id}`)
          }

          const step: ScriptStep = {
            id: stepData.id,
            productId: productId,
            title: stepData.title || "",
            content: content,
            order: stepData.order || 0,
            buttons: (stepData.buttons || []).map((btn: any, index: number) => ({
              id: `btn-${stepData.id}-${index}`,
              label: btn.label || "",
              nextStepId: btn.next || btn.nextStepId || null,
              primary: btn.primary || false,
              variant: btn.variant || (btn.primary ? "primary" : "secondary"),
              order: btn.order || index,
            })),
            contentSegments: stepData.contentSegments || [],
            // Support tabulation IDs in JSON - can be: tabulacao, tabulacoes, tabulations
            // If provided as array of IDs, they will be resolved later when displayed
            tabulations: (() => {
              const rawTabs = stepData.tabulacao || stepData.tabulacoes || stepData.tabulations || []
              if (Array.isArray(rawTabs)) {
                // If already full objects with name, use them
                if (rawTabs.length > 0 && rawTabs[0].name) {
                  return rawTabs
                }
                // If array of IDs or objects with just id, convert to placeholder objects
                return rawTabs.map((t: any) => {
                  const id = typeof t === "string" ? t : t.id
                  return { id, name: "", description: "" }
                })
              }
              // Single ID
              if (rawTabs) {
                return [{ id: rawTabs, name: "", description: "" }]
              }
              return []
            })(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          steps.push(step)
        })

        if (steps.length > 0) {
          const existingSteps = getScriptSteps()
          const filteredSteps = existingSteps.filter((s) => s.productId !== productId)
          const newSteps = [...filteredSteps, ...steps]
          saveImmediately(STORAGE_KEYS.SCRIPT_STEPS, newSteps)
          stepCount += steps.length

          const firstStep =
            steps.find(
              (s) =>
                s.title.toLowerCase().includes("abordagem") ||
                s.id.toLowerCase().includes("abordagem") ||
                s.order === 1,
            ) || steps[0]

          if (!firstStep) {
            console.error(`[v0] No valid first step found for product ${productName}`)
            return
          }

          const product: Product = {
            id: productId,
            name: productName,
            scriptId: firstStep.id,
            category: productName.toLowerCase() as "habitacional" | "comercial" | "outros",
            isActive: true,
            createdAt: new Date(),
          }

          const existingProducts = getProducts()
          const existingIndex = existingProducts.findIndex((p) => p.id === productId)
          if (existingIndex !== -1) {
            existingProducts[existingIndex] = product
          } else {
            existingProducts.push(product)
            productCount++
          }
          saveImmediately(STORAGE_KEYS.PRODUCTS, existingProducts)
        }
      })

      clearCaches()
      notifyUpdateImmediate()
    }
  } catch (error) {
    console.error("[v0] Error importing script from JSON:", error)
    throw error
  }

  return { productCount, stepCount }
}

// The previous clearCaches function was redeclared here.
// This version is kept for clarity to fix the linting error.
export function clearCaches() {
  scriptStepsCache.clear()
  productCache.clear()
}

// Helper function to check if user is currently online
export function isUserOnline(userId: string): boolean {
  if (typeof window === "undefined") return false

  const users = getAllUsers()
  const user = users.find((u) => u.id === userId)

  if (!user) return false

  // Check if user has isOnline flag set to true
  return user.isOnline === true
}

// Helper function to get count of online operators
export function getOnlineOperatorsCount(): number {
  if (typeof window === "undefined") return 0

  const users = getAllUsers()
  return users.filter((u) => u.role === "operator" && u.isOnline === true).length
}

// Heartbeat: operator pings every 30s to prove they're active
export function sendOperatorHeartbeat(userId: string): void {
  if (typeof window === "undefined") return
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")
  const index = users.findIndex((u: User) => u.id === userId)
  if (index !== -1) {
    users[index].lastHeartbeat = new Date()
    users[index].isOnline = true
    saveImmediately(STORAGE_KEYS.USERS, users)
  }
}

// Track when an operator accesses a script/product
export function trackScriptAccess(userId: string, productName: string): void {
  if (typeof window === "undefined") return
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")
  const index = users.findIndex((u: User) => u.id === userId)
  if (index !== -1) {
    users[index].lastScriptAccess = new Date()
    users[index].currentProductName = productName
    saveImmediately(STORAGE_KEYS.USERS, users)
  }
}

// Get all operators with their status details
export function getOperatorsWithStatus(): (User & { statusDetail: "online" | "idle" | "offline" })[] {
  if (typeof window === "undefined") return []
  const users = getAllUsers().filter((u) => u.role === "operator")
  const now = Date.now()
  const HEARTBEAT_TIMEOUT = 60000 // 60 seconds - if no heartbeat in 60s, mark as idle
  const OFFLINE_TIMEOUT = 180000 // 3 minutes - if no heartbeat in 3 min, mark offline

  return users.map((u) => {
    const lastBeat = u.lastHeartbeat ? convertFirestoreTimestamp(u.lastHeartbeat).getTime() : 0
    const diff = now - lastBeat

    let statusDetail: "online" | "idle" | "offline" = "offline"
    if (u.isOnline && lastBeat > 0) {
      if (diff < HEARTBEAT_TIMEOUT) {
        statusDetail = "online"
      } else if (diff < OFFLINE_TIMEOUT) {
        statusDetail = "idle"
      } else {
        statusDetail = "offline"
      }
    } else if (u.isOnline) {
      statusDetail = "online"
    }

    return { ...u, statusDetail }
  })
}

export function getQuizRespondentsCount(): number {
  if (typeof window === "undefined") return 0
  const attempts = getQuizAttempts()
  // Get unique operator IDs from attempts
  const uniqueOperators = new Set(attempts.map((a) => a.operatorId))
  return uniqueOperators.size
}

export function getMessageViewersCount(): number {
  if (typeof window === "undefined") return 0
  const messages = getMessages()
  // Flatten all seenBy arrays and get unique operator IDs
  const allViewers = messages.flatMap((m) => m.seenBy || [])
  const uniqueViewers = new Set(allViewers)
  return uniqueViewers.size
}

export function getPresentationViewersCount(): number {
  if (typeof window === "undefined") return 0
  const progress = getPresentationProgress()
  // Filter for marked_as_seen and get unique operator IDs
  const seenProgress = progress.filter((p) => p.marked_as_seen)
  const uniqueViewers = new Set(seenProgress.map((p) => p.operatorId))
  return uniqueViewers.size
}

// Attendance type options
export function getAttendanceTypes(): AttendanceTypeOption[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE_TYPES) || "[]")
}

export function createAttendanceType(option: Omit<AttendanceTypeOption, "id" | "createdAt">): AttendanceTypeOption {
  if (typeof window === "undefined") return { ...option, id: "", createdAt: new Date() }

  const newOption: AttendanceTypeOption = {
    ...option,
    id: `att-${Date.now()}`,
    createdAt: new Date(),
  }

  const types = getAttendanceTypes()
  types.push(newOption)
  saveImmediately(STORAGE_KEYS.ATTENDANCE_TYPES, types) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()

  return newOption
}

export function updateAttendanceType(option: AttendanceTypeOption) {
  if (typeof window === "undefined") return

  const types = getAttendanceTypes()
  const index = types.findIndex((t) => t.id === option.id)

  if (index !== -1) {
    types[index] = option
    saveImmediately(STORAGE_KEYS.ATTENDANCE_TYPES, types) // Using saveImmediately instead of debouncedSave
    notifyUpdateImmediate()
  }
}

export function deleteAttendanceType(id: string) {
  if (typeof window === "undefined") return

  const types = getAttendanceTypes().filter((t) => t.id !== id)
  saveImmediately(STORAGE_KEYS.ATTENDANCE_TYPES, types) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()
}

// Person type options
export function getPersonTypes(): PersonTypeOption[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PERSON_TYPES) || "[]")
}

export function createPersonType(option: Omit<PersonTypeOption, "id" | "createdAt">): PersonTypeOption {
  if (typeof window === "undefined") return { ...option, id: "", createdAt: new Date() }

  const newOption: PersonTypeOption = {
    ...option,
    id: `per-${Date.now()}`,
    createdAt: new Date(),
  }

  const options = getPersonTypes()
  options.push(newOption)
  debouncedSave(STORAGE_KEYS.PERSON_TYPES, options)
  notifyUpdateImmediate()

  return newOption
}

export function updatePersonType(option: PersonTypeOption) {
  if (typeof window === "undefined") return

  const options = getPersonTypes()
  const index = options.findIndex((o) => o.id === option.id)

  if (index !== -1) {
    options[index] = option
    debouncedSave(STORAGE_KEYS.PERSON_TYPES, options)
    notifyUpdateImmediate()
  }
}

export function deletePersonType(id: string) {
  if (typeof window === "undefined") return

  const options = getPersonTypes().filter((o) => o.id !== id)
  debouncedSave(STORAGE_KEYS.PERSON_TYPES, options)
  notifyUpdateImmediate()
}

// Messages management functions
export function getMessages(): Message[] {
  if (typeof window === "undefined") return []
  const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || "[]")

  return messages.map((m: Message) => ({
    ...m,
    createdAt: convertFirestoreTimestamp(m.createdAt),
  }))
}

export function getActiveMessages(): Message[] {
  return getMessages().filter((m) => m.isActive)
}

export function createMessage(message: Omit<Message, "id" | "createdAt" | "seenBy">): Message {
  if (typeof window === "undefined") return { ...message, id: "", createdAt: new Date(), seenBy: [] }

  const newMessage: Message = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    seenBy: [],
  }

  const messages = getMessages()
  messages.push(newMessage)
  saveImmediately(STORAGE_KEYS.MESSAGES, messages) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()

  return newMessage
}

export function updateMessage(message: Message) {
  if (typeof window === "undefined") return

  const messages = getMessages()
  const index = messages.findIndex((m) => m.id === message.id)

  if (index !== -1) {
    messages[index] = message
    saveImmediately(STORAGE_KEYS.MESSAGES, messages) // Using saveImmediately instead of debouncedSave
    notifyUpdateImmediate()
  }
}

export function deleteMessage(id: string) {
  if (typeof window === "undefined") return

  const messages = getMessages().filter((m) => m.id !== id)
  saveImmediately(STORAGE_KEYS.MESSAGES, messages) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()
}

export function markMessageAsSeen(messageId: string, operatorId: string) {
  if (typeof window === "undefined") return

  const messages = getMessages()
  const message = messages.find((m) => m.id === messageId)

  if (message && !message.seenBy.includes(operatorId)) {
    message.seenBy.push(operatorId)
    updateMessage(message)
  }
}

export function getActiveMessagesForOperator(operatorId: string): Message[] {
  const allMessages = getMessages()
  
  return allMessages.filter((m) => {
    if (!m.isActive) return false

    // Check if message is for this operator
    if (m.recipients && m.recipients.length > 0) {
      return m.recipients.includes(operatorId)
    }

    // Empty recipients means all operators
    return true
  })
}

export function getHistoricalMessagesForOperator(operatorId: string): Message[] {
  return getMessages().filter((m) => {
    if (m.isActive) return false

    // Check if message is for this operator
    if (m.recipients && m.recipients.length > 0) {
      return m.recipients.includes(operatorId)
    }

    // Empty recipients means all operators
    return true
  })
}

// Quizzes management functions
export function getQuizzes(): Quiz[] {
  if (typeof window === "undefined") return []
  const quizzes = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZZES) || "[]")

  return quizzes.map((q: Quiz) => ({
    ...q,
    createdAt: convertFirestoreTimestamp(q.createdAt),
    scheduledDate: q.scheduledDate ? convertFirestoreTimestamp(q.scheduledDate) : undefined,
  }))
}

export function getActiveQuizzes(): Quiz[] {
  return getQuizzes().filter((q) => q.isActive)
}

export function createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Quiz {
  if (typeof window === "undefined") return { ...quiz, id: "", createdAt: new Date() }

  const newQuiz: Quiz = {
    ...quiz,
    id: `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  }

  const quizzes = getQuizzes()
  quizzes.push(newQuiz)
  saveImmediately(STORAGE_KEYS.QUIZZES, quizzes) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()

  return newQuiz
}

export function updateQuiz(quiz: Quiz) {
  if (typeof window === "undefined") return

  const quizzes = getQuizzes()
  const index = quizzes.findIndex((q) => q.id === quiz.id)

  if (index !== -1) {
    quizzes[index] = quiz
    saveImmediately(STORAGE_KEYS.QUIZZES, quizzes) // Using saveImmediately instead of debouncedSave
    notifyUpdateImmediate()
  }
}

export function deleteQuiz(id: string) {
  if (typeof window === "undefined") return

  const quizzes = getQuizzes().filter((q) => q.id !== id)
  saveImmediately(STORAGE_KEYS.QUIZZES, quizzes) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()
}

export function getActiveQuizzesForOperator(): Quiz[] {
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  return getQuizzes().filter((q) => {
    if (!q.isActive) return false

    // Check if quiz is scheduled for future
    if (q.scheduledDate) {
      const scheduledDate = new Date(q.scheduledDate)
      if (scheduledDate > now) return false
    }

    const quizDate = new Date(q.createdAt)
    if (quizDate < twentyFourHoursAgo) return false

    return true
  })
}

export function getHistoricalQuizzes(): Quiz[] {
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  return getQuizzes().filter((q) => {
    const quizDate = new Date(q.createdAt)
    return quizDate < twentyFourHoursAgo
  })
}

export function hasOperatorAnsweredQuiz(quizId: string, operatorId: string): boolean {
  const attempts = getQuizAttempts()
  return attempts.some((a) => a.quizId === quizId && a.operatorId === operatorId)
}

// Quiz Attempts management functions
export function getQuizAttempts(): QuizAttempt[] {
  if (typeof window === "undefined") return []
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZ_ATTEMPTS) || "[]")

  return raw.map((attempt: any) => ({
    ...attempt,
    attemptedAt: convertFirestoreTimestamp(attempt.attemptedAt),
  }))
}

export function getQuizAttemptsByOperator(operatorId: string): QuizAttempt[] {
  return getQuizAttempts().filter((a) => a.operatorId === operatorId)
}

export function getQuizAttemptsByQuiz(quizId: string): QuizAttempt[] {
  return getQuizAttempts().filter((a) => a.quizId === quizId)
}

export function createQuizAttempt(attempt: Omit<QuizAttempt, "id" | "attemptedAt">): QuizAttempt {
  if (typeof window === "undefined") return { ...attempt, id: "", attemptedAt: new Date() }

  const newAttempt: QuizAttempt = {
    ...attempt,
    id: `attempt-${Date.now()}`,
    attemptedAt: new Date(),
  }

  const attempts = getQuizAttempts()
  attempts.push(newAttempt)
  saveImmediately(STORAGE_KEYS.QUIZ_ATTEMPTS, attempts) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()

  return newAttempt
}

// Monthly ranking functions for quiz leaderboard
export interface OperatorRanking {
  operatorId: string
  operatorName: string
  totalAttempts: number
  correctAnswers: number
  score: number
  accuracy: number
  rank: number
}

export function getMonthlyQuizRanking(year?: number, month?: number): OperatorRanking[] {
  if (typeof window === "undefined") return []

  const now = new Date()
  const targetYear = year ?? now.getFullYear()
  const targetMonth = month !== undefined ? month : now.getMonth()

  const attempts = getQuizAttempts()

  const monthlyAttempts = attempts.filter((attempt) => {
    const attemptDate = attempt.attemptedAt

    // Validate the date is valid before using it in comparisons
    if (isNaN(attemptDate.getTime())) {
      console.warn("[v0] Invalid date found in quiz attempt:", attempt.attemptedAt)
      return false
    }

    const yearMatch = attemptDate.getFullYear() === targetYear
    const monthMatch = attemptDate.getMonth() === targetMonth

    return yearMatch && monthMatch
  })

  const allUsers = getAllUsers()
  const operatorUsers = allUsers.filter((u) => u.role === "operator")
  const operatorIds = new Set(operatorUsers.map((u) => u.id))

  // Group by operator
  const operatorStats = new Map<string, { name: string; total: number; correct: number; firstAttempt: Date }>()

  monthlyAttempts.forEach((attempt) => {
    if (!operatorIds.has(attempt.operatorId)) {
      return // Skip non-operator users
    }

    const attemptDate = attempt.attemptedAt

    // Skip if date is invalid
    if (isNaN(attemptDate.getTime())) {
      console.warn("[v0] Invalid date in attempt for operator:", attempt.operatorName)
      return
    }

    const existing = operatorStats.get(attempt.operatorId) || {
      name: attempt.operatorName,
      total: 0,
      correct: 0,
      firstAttempt: attemptDate,
    }

    existing.total++
    if (attempt.isCorrect) {
      existing.correct++
    }

    if (attemptDate < existing.firstAttempt) {
      existing.firstAttempt = attemptDate
    }

    operatorStats.set(attempt.operatorId, existing)
  })

  // Convert to ranking array
  const rankings: OperatorRanking[] = Array.from(operatorStats.entries()).map(([operatorId, stats]) => ({
    operatorId,
    operatorName: stats.name,
    totalAttempts: stats.total,
    correctAnswers: stats.correct,
    score: stats.correct * 10, // 10 points per correct answer
    accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    rank: 0, // Will be set after sorting
  }))

  rankings.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy
    return a.totalAttempts - b.totalAttempts // More attempts = lower rank on tie
  })

  // Assign ranks
  rankings.forEach((ranking, index) => {
    ranking.rank = index + 1
  })

  return rankings
}

export function getCurrentMonthName(): string {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]
  return months[new Date().getMonth()]
}

export function updateAdminPermissions(userId: string, permissions: AdminPermissions) {
  if (typeof window === "undefined") return

  try {
    const users = getAllUsers()
    const user = users.find((u) => u.id === userId)

    if (user && user.role === "admin") {
      user.permissions = permissions
      updateUser(user)
    }
  } catch (error) {
    console.error("[v0] Error updating admin permissions:", error)
  }
}

export function getAdminUsers(): User[] {
  if (typeof window === "undefined") return []

  const users = getAllUsers()
  return users.filter((u) => u.role === "admin" && u.username !== "admin")
}

export function createAdminUser(username: string, fullName: string, password?: string): User | null {
  if (typeof window === "undefined") return null

  try {
    const users = getAllUsers()

    // Check if username already exists
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return null
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      fullName,
      role: "admin",
      isOnline: false,
      createdAt: new Date(),
      password: password || undefined,
      permissions: {
        dashboard: true,
        scripts: true,
        products: true,
        attendanceConfig: true,
        tabulations: true,
        situations: true,
        channels: true,
        notes: true,
        operators: true,
        messagesQuiz: true,
        chat: true,
        settings: true,
      },
    }

    users.push(newUser)
    saveImmediately(STORAGE_KEYS.USERS, users)
    notifyUpdateImmediate()

    return newUser
  } catch (error) {
    console.error("[v0] Error creating admin user:", error)
    return null
  }
}

export function canDeleteAdminUser(userId: string): boolean {
  if (typeof window === "undefined") return false

  const users = getAllUsers()
  const user = users.find((u) => u.id === userId)

  // Cannot delete the main admin user
  return user !== undefined && user.username !== "admin"
}

export function cleanupOldSessions() {
  if (typeof window === "undefined") return

  try {
    const users = getAllUsers()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let cleanedCount = 0

    users.forEach((user) => {
      if (user.loginSessions && user.loginSessions.length > 50) {
        const originalLength = user.loginSessions.length
        // Keep only last 50 sessions and those within 30 days
        user.loginSessions = user.loginSessions
          .filter((session) => new Date(session.loginAt) > thirtyDaysAgo)
          .slice(-50)

        cleanedCount += originalLength - user.loginSessions.length
      }
    })

    if (cleanedCount > 0) {
      debouncedSave(STORAGE_KEYS.USERS, users)
    }
  } catch (error) {
    console.error("[v0] Error cleaning up sessions:", error)
  }
}

export function cleanupDuplicateUsers() {
  if (typeof window === "undefined") return { removed: 0, kept: 0 }

  try {
    const users = getAllUsers()
    const seenUsernames = new Map<string, User>()
    const duplicates: string[] = []

    // Normalize username for comparison (remove spaces, lowercase, trim)
    const normalizeUsername = (username: string): string => {
      return username.toLowerCase().trim().replace(/\s+/g, "")
    }

    users.forEach((user) => {
      const normalized = normalizeUsername(user.username)

      if (seenUsernames.has(normalized)) {
        // Found duplicate - keep the older one (earlier createdAt)
        const existing = seenUsernames.get(normalized)!
        const existingDate = new Date(existing.createdAt).getTime()
        const currentDate = new Date(user.createdAt).getTime()

        if (currentDate < existingDate) {
          // Current user is older, replace
          duplicates.push(existing.id)
          seenUsernames.set(normalized, user)
        } else {
          // Existing user is older, keep it
          duplicates.push(user.id)
        }
      } else {
        seenUsernames.set(normalized, user)
      }
    })

    if (duplicates.length > 0) {
      const cleanedUsers = users.filter((u) => !duplicates.includes(u.id))
      console.log(
        `[v0] 🧹 Cleaned ${duplicates.length} duplicate users. Before: ${users.length}, After: ${cleanedUsers.length}`,
      )

      localStorage.setItem(`${STORAGE_KEYS.USERS}_timestamp`, String(Date.now()))
      saveImmediately(STORAGE_KEYS.USERS, cleanedUsers)
      notifyUpdateImmediate()

      return { removed: duplicates.length, kept: cleanedUsers.length }
    }

    return { removed: 0, kept: users.length }
  } catch (error) {
    console.error("[v0] Error cleaning duplicate users:", error)
    return { removed: 0, kept: 0 }
  }
}

export function getAllChatMessages(): ChatMessage[] {
  if (typeof window === "undefined") return []
  const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES) || "[]")

  // Convert Firestore timestamps to Date objects
  return messages.map((msg: any) => ({
    ...msg,
    createdAt: convertFirestoreTimestamp(msg.createdAt),
  }))
}

export function getChatSettings(): ChatSettings {
  if (typeof window === "undefined") return { isEnabled: true, updatedAt: new Date(), updatedBy: "system" }
  return JSON.parse(
    localStorage.getItem(STORAGE_KEYS.CHAT_SETTINGS) ||
      JSON.stringify({ isEnabled: true, updatedAt: new Date(), updatedBy: "system" }),
  )
}

export function updateChatSettings(settings: ChatSettings) {
  if (typeof window === "undefined") return
  debouncedSave(STORAGE_KEYS.CHAT_SETTINGS, settings)
  notifyUpdateImmediate()
}

export async function sendChatMessage(
  senderId: string,
  senderName: string,
  senderRole: "operator" | "admin",
  content: string,
  recipientId?: string,
  attachment?: {
    type: "image"
    url: string
    name: string
  },
  replyTo?: {
    messageId: string
    content: string
    senderName: string
  },
): Promise<ChatMessage> {
  const newMessage: ChatMessage = {
    id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    senderId,
    senderName,
    senderRole,
    recipientId,
    content,
    attachment,
    replyTo,
    createdAt: new Date(),
    isRead: false,
  }

  // Save to localStorage (backup)
  if (typeof window !== "undefined") {
    const messages = getAllChatMessages()
    messages.push(newMessage)
    debouncedSave(STORAGE_KEYS.CHAT_MESSAGES, messages)
  }

  // Save to Supabase
  try {
    const supabase = getSupabaseClient()
    await supabase.from("chat_messages").insert({
      sender_id: senderId,
      sender_name: senderName,
      recipient_id: recipientId,
      recipient_name: "",
      content: content,
      message_type: attachment ? "image" : "text",
      is_read: false,
      is_global: !recipientId,
      is_edited: false,
    })
  } catch (error) {
    console.error("[v0] Erro ao salvar mensagem:", error)
  }

  notifyUpdateImmediate()
  return newMessage
}

export function markChatMessageAsRead(messageId: string) {
  if (typeof window === "undefined") return

  const messages = getAllChatMessages()
  const message = messages.find((m) => m.id === messageId)

  if (message && !message.isRead) {
    message.isRead = true
    debouncedSave(STORAGE_KEYS.CHAT_MESSAGES, messages)
    notifyUpdateImmediate()
  }
}

export function editChatMessage(messageId: string, newContent: string): boolean {
  if (typeof window === "undefined") return false

  const messages = getAllChatMessages()
  const messageIndex = messages.findIndex((m) => m.id === messageId)

  if (messageIndex === -1) return false

  messages[messageIndex] = {
    ...messages[messageIndex],
    content: newContent,
    isEdited: true,
    editedAt: new Date(),
  }
  
  debouncedSave(STORAGE_KEYS.CHAT_MESSAGES, messages)
  notifyUpdateImmediate()
  return true
}

export function getChatMessagesForUser(userId: string, userRole: "operator" | "admin"): ChatMessage[] {
  const messages = getAllChatMessages()

  if (userRole === "operator") {
    // Operator sees: messages they sent + messages from admins to them specifically or to all operators
    return messages
      .filter(
        (m) => m.senderId === userId || (m.senderRole === "admin" && (!m.recipientId || m.recipientId === userId)),
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } else {
    // Admin sees: messages from specific operator when filtering, or all operator messages
    return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }
}

export function getUnreadChatCount(userId: string, userRole: "operator" | "admin"): number {
  const messages = getChatMessagesForUser(userId, userRole)
  return messages.filter((m) => !m.isRead && m.senderId !== userId).length
}

export function deleteChatMessage(messageId: string) {
  if (typeof window === "undefined") return

  const messages = getAllChatMessages().filter((m) => m.id !== messageId)
  debouncedSave(STORAGE_KEYS.CHAT_MESSAGES, messages)
  notifyUpdateImmediate()
}

export function saveChatMessages(messages: ChatMessage[]) {
  if (typeof window === "undefined") return
  saveImmediately(STORAGE_KEYS.CHAT_MESSAGES, messages) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()
}

export function getPresentations(): Presentation[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRESENTATIONS) || "[]")
}

export function getActivePresentations(): Presentation[] {
  return getPresentations().filter((p) => p.isActive)
}

export function getActivePresentationsForOperator(operatorId: string): Presentation[] {
  return getActivePresentations().filter((p) => {
    if (p.recipients && p.recipients.length > 0) {
      return p.recipients.includes(operatorId)
    }
    return true // Empty recipients means for all operators
  })
}

export function createPresentation(presentation: Omit<Presentation, "id" | "uploadedAt">): Presentation {
  if (typeof window === "undefined") return { ...presentation, id: "", uploadedAt: new Date() }

  const newPresentation: Presentation = {
    ...presentation,
    id: `pres-${Date.now()}`,
    uploadedAt: new Date(),
  }

  const presentations = getPresentations()
  presentations.push(newPresentation)
  saveImmediately(STORAGE_KEYS.PRESENTATIONS, presentations) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()

  return newPresentation
}

export function updatePresentation(presentation: Presentation) {
  if (typeof window === "undefined") return

  const presentations = getPresentations()
  const index = presentations.findIndex((p) => p.id === presentation.id)

  if (index !== -1) {
    presentations[index] = presentation
    saveImmediately(STORAGE_KEYS.PRESENTATIONS, presentations) // Using saveImmediately instead of debouncedSave
    notifyUpdateImmediate()
  }
}

export function deletePresentation(id: string) {
  if (typeof window === "undefined") return

  const presentations = getPresentations().filter((p) => p.id !== id)
  saveImmediately(STORAGE_KEYS.PRESENTATIONS, presentations) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()
}

// Presentation Progress tracking
export function getPresentationProgress(): PresentationProgress[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRESENTATION_PROGRESS) || "[]")
}

export function getPresentationProgressByOperator(operatorId: string): PresentationProgress[] {
  return getPresentationProgress().filter((p) => p.operatorId === operatorId)
}

export function getPresentationProgressByPresentation(presentationId: string): PresentationProgress[] {
  return getPresentationProgress().filter((p) => p.presentationId === presentationId)
}

export function markPresentationAsSeen(presentationId: string, operatorId: string, operatorName: string) {
  if (typeof window === "undefined") return

  const progress = getPresentationProgress()
  const existing = progress.find((p) => p.presentationId === presentationId && p.operatorId === operatorId)

  if (existing) {
    existing.marked_as_seen = true
    existing.completion_date = new Date()
  } else {
    const newProgress: PresentationProgress = {
      id: `prog-${Date.now()}`,
      presentationId,
      operatorId,
      operatorName,
      viewedAt: new Date(),
      marked_as_seen: true,
      completion_date: new Date(),
    }
    progress.push(newProgress)
  }

  debouncedSave(STORAGE_KEYS.PRESENTATION_PROGRESS, progress)
  notifyUpdateImmediate()
}

export function savePresentationProgress(progress: Omit<PresentationProgress, "id">) {
  if (typeof window === "undefined") return

  const allProgress = getPresentationProgress()
  const existingIndex = allProgress.findIndex(
    (p) => p.presentationId === progress.presentationId && p.operatorId === progress.operatorId,
  )

  if (existingIndex !== -1) {
    allProgress[existingIndex] = {
      ...allProgress[existingIndex],
      ...progress,
    }
  } else {
    allProgress.push({
      id: `prog-${Date.now()}`,
      ...progress,
    })
  }

  saveImmediately(STORAGE_KEYS.PRESENTATION_PROGRESS, allProgress) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()
}

export function exportPresentationReport(presentationId: string): string {
  const presentation = getPresentations().find((p) => p.id === presentationId)
  const progressList = getPresentationProgressByPresentation(presentationId)

  if (!presentation) {
    return ""
  }

  // Create CSV content
  let csvContent = "data:text/csv;charset=utf-8,"

  // Header
  csvContent += "Relatório de Treinamento - Apresentação\n\n"
  csvContent += `Título:,${presentation.title.replace(/,/g, ";")}\n`
  csvContent += `Descrição:,${presentation.description.replace(/,/g, ";")}\n`
  csvContent += `Total de Slides:,${presentation.slides.length}\n`
  csvContent += `Criada por:,${presentation.createdByName}\n`
  csvContent += `Data de criação:,${new Date(presentation.createdAt).toLocaleDateString("pt-BR")}\n`
  csvContent += `Total de Operadores que Visualizaram:,${progressList.filter((p) => p.marked_as_seen).length}\n\n`

  // Progress details
  csvContent += "Detalhes de Visualização:\n"
  csvContent += "Operador,Data de Visualização,Hora,Marcado como Visto\n"

  progressList.forEach((progress) => {
    const date = new Date(progress.viewedAt)
    csvContent += `${progress.operatorName},${date.toLocaleDateString("pt-BR")},${date.toLocaleTimeString("pt-BR")},${progress.marked_as_seen ? "Sim" : "Não"}\n`
  })

  return csvContent
}

export function saveContracts(contracts: Contract[]) {
  if (typeof window === "undefined") return
  saveImmediately(STORAGE_KEYS.CONTRACTS, contracts) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()
}

export function getContracts(): Contract[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTRACTS) || "[]")
}

export function addContract(contract: Omit<Contract, "id" | "createdAt">): Contract {
  return createContract(contract)
}

export function createContract(contract: Omit<Contract, "id" | "createdAt">): Contract {
  if (typeof window === "undefined") return { ...contract, id: "", createdAt: new Date() }

  const newContract: Contract = {
    ...contract,
    id: `contract-${Date.now()}`,
    createdAt: new Date(),
  }

  const contracts = getContracts()
  contracts.push(newContract)
  saveImmediately(STORAGE_KEYS.CONTRACTS, contracts) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()

  return newContract
}

export function updateContract(id: string, updates: Partial<Omit<Contract, "id" | "createdAt">>): void {
  if (typeof window === "undefined") return

  const contracts = getContracts()
  const index = contracts.findIndex((c) => c.id === id)
  if (index !== -1) {
    contracts[index] = {
      ...contracts[index],
      ...updates,
      updatedAt: new Date(),
    }
    saveImmediately(STORAGE_KEYS.CONTRACTS, contracts) // Using saveImmediately instead of debouncedSave
    notifyUpdateImmediate()
  }
}

export function deleteContract(id: string): void {
  if (typeof window === "undefined") return

  const contracts = getContracts().filter((c) => c.id !== id)
  saveImmediately(STORAGE_KEYS.CONTRACTS, contracts) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()
}

export function getActiveContracts(): Contract[] {
  if (typeof window === "undefined") return []
  return getContracts().filter((c) => c.isActive)
}

export function cleanupRealtimeSync() {
  unsubscribers.forEach((unsub) => unsub())
  unsubscribers = []
  syncEnabled = false
  if (batchTimer) {
    clearTimeout(batchTimer)
  }
  if (notificationTimer) {
    clearTimeout(notificationTimer)
  }
}

let notificationTimer: NodeJS.Timeout | null = null
function scheduleNotification() {
  if (notificationTimer) {
    clearTimeout(notificationTimer)
  }
  notificationTimer = setTimeout(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("store-updated"))
    }
  }, 100) // Small delay to batch multiple updates
}

// File presentation progress tracking
export function getFilePresentationProgress(): FilePresentationProgress[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.FILE_PRESENTATION_PROGRESS) || "[]")
}

export function getFilePresentationProgressByOperator(operatorId: string): FilePresentationProgress[] {
  return getFilePresentationProgress().filter((p) => p.operatorId === operatorId)
}

export function getFilePresentationProgressByFile(fileName: string): FilePresentationProgress[] {
  return getFilePresentationProgress().filter((p) => p.fileName === fileName)
}

export function markFilePresentationAsRead(fileName: string, operatorId: string, operatorName: string) {
  if (typeof window === "undefined") return

  const progress = getFilePresentationProgress()
  const existing = progress.find((p) => p.fileName === fileName && p.operatorId === operatorId)

  if (existing) {
    existing.marked_as_seen = true
    existing.completion_date = new Date()
  } else {
    const newProgress: FilePresentationProgress = {
      id: `file-prog-${Date.now()}`,
      fileName,
      operatorId,
      operatorName,
      viewedAt: new Date(),
      marked_as_seen: true,
      completion_date: new Date(),
    }
    progress.push(newProgress)
  }

  saveImmediately(STORAGE_KEYS.FILE_PRESENTATION_PROGRESS, progress)
  notifyUpdateImmediate()
}

export function saveFilePresentationProgress(progress: Omit<FilePresentationProgress, "id">) {
  if (typeof window === "undefined") return

  const allProgress = getFilePresentationProgress()
  const existingIndex = allProgress.findIndex(
    (p) => p.fileName === progress.fileName && p.operatorId === progress.operatorId,
  )

  if (existingIndex !== -1) {
    allProgress[existingIndex] = {
      ...allProgress[existingIndex],
      ...progress,
      last_accessed: new Date(),
    }
  } else {
    allProgress.push({
      id: `fprog-${Date.now()}`,
      ...progress,
      last_accessed: new Date(),
    })
  }

  saveImmediately(STORAGE_KEYS.FILE_PRESENTATION_PROGRESS, allProgress) // Using saveImmediately instead of debouncedSave
  notifyUpdateImmediate()
}

export function exportFilePresentationReport(fileName: string): string {
  const progressList = getFilePresentationProgressByFile(fileName)

  if (progressList.length === 0) {
    return ""
  }

  // Create CSV content
  let csvContent = "data:text/csv;charset=utf-8,"

  // Header
  csvContent += "Relatório de Treinamento - Arquivo\n\n"
  csvContent += `Arquivo:,${fileName.replace(/,/g, ";")}\n`
  csvContent += `Total de Operadores que Marcaram como Lido:,${progressList.filter((p) => p.marked_as_seen).length}\n\n`

  // Progress details
  csvContent += "Detalhes de Leitura:\n"
  csvContent += "Operador,Data de Visualização,Hora,Marcado como Lido\n"

  progressList.forEach((progress) => {
    const date = new Date(progress.viewedAt)
    const dateStr = date.toLocaleDateString("pt-BR")
    const timeStr = date.toLocaleTimeString("pt-BR")
    const seenStr = progress.marked_as_seen ? "Sim" : "Não"

    csvContent += `${progress.operatorName.replace(/,/g, ";")},${dateStr},${timeStr},${seenStr}\n`
  })

  return csvContent
}

export function addUser(user: Omit<User, "id" | "createdAt">) {
  if (typeof window === "undefined") return null

  try {
    const users = getAllUsers()

    // Normalize username for comparison
    const normalizeUsername = (username: string): string => {
      return username.toLowerCase().trim().replace(/\s+/g, "")
    }

    const normalizedNew = normalizeUsername(user.username)

    // Check if user already exists (case-insensitive, space-insensitive)
    const existingUser = users.find((u) => normalizeUsername(u.username) === normalizedNew)

    if (existingUser) {
      console.log(
        `[v0] ⚠️ User "${user.username}" already exists as "${existingUser.username}" (ID: ${existingUser.id})`,
      )
      return null
    }

    const newUser: User = {
      ...user,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }

    const beforeCount = users.length
    users.push(newUser)

    console.log(`[v0] ➕ Adding user: ${newUser.username}, Before: ${beforeCount} users, After: ${users.length} users`)

    localStorage.setItem(`${STORAGE_KEYS.USERS}_timestamp`, String(Date.now()))
    saveImmediately(STORAGE_KEYS.USERS, users)
    notifyUpdateImmediate()

    return newUser
  } catch (error) {
    console.error("[v0] Error adding user:", error)
    return null
  }
}

// Supervisor Team management functions
export function getSupervisorTeams(): SupervisorTeam[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.SUPERVISOR_TEAMS)
  return data ? JSON.parse(data) : []
}

export function getSupervisorTeam(supervisorId: string): SupervisorTeam | undefined {
  const teams = getSupervisorTeams()
  return teams.find((team) => team.supervisorId === supervisorId)
}

export function assignOperatorToSupervisor(supervisorId: string, operatorId: string) {
  const teams = getSupervisorTeams()
  const existingTeamIndex = teams.findIndex((team) => team.supervisorId === supervisorId)

  // Remove operator from any other team first
  teams.forEach((team) => {
    team.operatorIds = team.operatorIds.filter((id) => id !== operatorId)
  })

  if (existingTeamIndex >= 0) {
    if (!teams[existingTeamIndex].operatorIds.includes(operatorId)) {
      teams[existingTeamIndex].operatorIds.push(operatorId)
    }
  } else {
    teams.push({
      supervisorId,
      operatorIds: [operatorId],
      createdAt: new Date(),
    })
  }

  save(STORAGE_KEYS.SUPERVISOR_TEAMS, teams)
}

export function removeOperatorFromSupervisor(supervisorId: string, operatorId: string) {
  const teams = getSupervisorTeams()
  const team = teams.find((t) => t.supervisorId === supervisorId)

  if (team) {
    team.operatorIds = team.operatorIds.filter((id) => id !== operatorId)
    save(STORAGE_KEYS.SUPERVISOR_TEAMS, teams)
  }
}

export function moveOperatorToSupervisor(operatorId: string, newSupervisorId: string) {
  const teams = getSupervisorTeams()

  // Remove from all teams
  teams.forEach((team) => {
    team.operatorIds = team.operatorIds.filter((id) => id !== operatorId)
  })

  // Add to new supervisor
  const targetTeam = teams.find((t) => t.supervisorId === newSupervisorId)
  if (targetTeam) {
    targetTeam.operatorIds.push(operatorId)
  } else {
    teams.push({
      supervisorId: newSupervisorId,
      operatorIds: [operatorId],
      createdAt: new Date(),
    })
  }

  save(STORAGE_KEYS.SUPERVISOR_TEAMS, teams)
}

export function getOperatorSupervisor(operatorId: string): string | null {
  const teams = getSupervisorTeams()
  const team = teams.find((t) => t.operatorIds.includes(operatorId))
  return team ? team.supervisorId : null
}

export function createSupervisorTeam(team: Omit<SupervisorTeam, "id" | "createdAt" | "updatedAt">): SupervisorTeam {
  if (typeof window === "undefined") return { ...team, id: "", createdAt: new Date(), updatedAt: new Date() }

  const newTeam: SupervisorTeam = {
    ...team,
    id: `team-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const teams = getSupervisorTeams()
  teams.push(newTeam)
  debouncedSave(STORAGE_KEYS.SUPERVISOR_TEAMS, teams)
  notifyUpdateImmediate()

  return newTeam
}

export function updateSupervisorTeam(team: SupervisorTeam) {
  if (typeof window === "undefined") return

  const teams = getSupervisorTeams()
  const index = teams.findIndex((t) => t.id === team.id)

  if (index !== -1) {
    teams[index] = { ...team, updatedAt: new Date() }
    debouncedSave(STORAGE_KEYS.SUPERVISOR_TEAMS, teams)
    notifyUpdateImmediate()
  }
}

export function deleteSupervisorTeam(id: string) {
  if (typeof window === "undefined") return

  const teams = getSupervisorTeams().filter((t) => t.id !== id)
  debouncedSave(STORAGE_KEYS.SUPERVISOR_TEAMS, teams)
  notifyUpdateImmediate()
}

export function assignOperatorsToTeam(teamId: string, operatorIds: string[]) {
  if (typeof window === "undefined") return

  const teams = getSupervisorTeams()
  const team = teams.find((t) => t.id === teamId)

  if (team) {
    team.operatorIds = Array.from(new Set([...(team.operatorIds || []), ...operatorIds])) // Add unique operator IDs
    updateSupervisorTeam(team)
  }
}

export function removeOperatorsFromTeam(teamId: string, operatorIds: string[]) {
  if (typeof window === "undefined") return

  const teams = getSupervisorTeams()
  const team = teams.find((t) => t.id === teamId)

  if (team) {
    team.operatorIds = (team.operatorIds || []).filter((id) => !operatorIds.includes(id))
    updateSupervisorTeam(team)
  }
}

export function getOperatorsInTeam(teamId: string): User[] {
  const team = getSupervisorTeams().find((t) => t.id === teamId)
  if (!team || !team.operatorIds) return []

  const allOperators = getAllUsers().filter((u) => u.role === "operator")
  return allOperators.filter((operator) => team.operatorIds?.includes(operator.id))
}

export function getFeedbacks(): Feedback[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.FEEDBACKS)
  if (!data) return []
  const feedbacks = JSON.parse(data)
  return feedbacks.map((f: any) => ({
    ...f,
    createdAt: convertFirestoreTimestamp(f.createdAt),
    callDate: convertFirestoreTimestamp(f.callDate),
    readAt: f.readAt ? convertFirestoreTimestamp(f.readAt) : undefined,
  }))
}

export function getFeedbacksByOperator(operatorId: string): Feedback[] {
  const allFeedbacks = getFeedbacks()
  const filtered = allFeedbacks.filter((f) => f.operatorId === operatorId)
  return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export function getActiveFeedbacksForOperator(operatorId: string): Feedback[] {
  return getFeedbacks()
    .filter((f) => f.operatorId === operatorId && f.isActive && !f.isRead)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export function getHistoricalFeedbacksForOperator(operatorId: string): Feedback[] {
  return getFeedbacks()
    .filter((f) => f.operatorId === operatorId && f.isRead)
    .sort((a, b) => b.readAt!.getTime() - a.readAt!.getTime())
}

export function addFeedback(feedback: Omit<Feedback, "id" | "createdAt">): Feedback {
  const feedbacks = getFeedbacks()

  const cleanFeedback: Record<string, unknown> = {}
  for (const key in feedback) {
    const value = (feedback as Record<string, unknown>)[key]
    if (value !== undefined) {
      cleanFeedback[key] = value
    }
  }

  const newFeedback: Feedback = {
    ...(cleanFeedback as Omit<Feedback, "id" | "createdAt">),
    id: `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date(),
  }

  feedbacks.push(newFeedback)
  console.log(`[v0] ✅ Created feedback for ${newFeedback.operatorName} (Total: ${feedbacks.length})`)
  saveImmediately(STORAGE_KEYS.FEEDBACKS, feedbacks)
  return newFeedback
}

export function updateFeedback(id: string, updates: Partial<Feedback>): void {
  const feedbacks = getFeedbacks()
  const index = feedbacks.findIndex((f) => f.id === id)
  if (index !== -1) {
    feedbacks[index] = { ...feedbacks[index], ...updates }
    saveImmediately(STORAGE_KEYS.FEEDBACKS, feedbacks)
  }
}

export function markFeedbackAsRead(feedbackId: string, operatorId: string): void {
  const feedbacks = getFeedbacks()
  const index = feedbacks.findIndex((f) => f.id === feedbackId && f.operatorId === operatorId)
  if (index !== -1) {
    feedbacks[index].isRead = true
    feedbacks[index].readAt = new Date()
    saveImmediately(STORAGE_KEYS.FEEDBACKS, feedbacks)
    notifyUpdateImmediate()
  }
}

export function deleteFeedback(id: string): void {
  const feedbacks = getFeedbacks()
  const filtered = feedbacks.filter((f) => f.id !== id)
  saveImmediately(STORAGE_KEYS.FEEDBACKS, filtered)
  notifyUpdateImmediate()
}

// ===== Result Codes (Codigos de Resultado) =====
export function getResultCodes(): ResultCode[] {
  if (typeof window === "undefined") return []
  const codes = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULT_CODES) || "[]")
  return codes.map((c: ResultCode) => ({
    ...c,
    createdAt: convertFirestoreTimestamp(c.createdAt),
  }))
}

export function getActiveResultCodes(): ResultCode[] {
  return getResultCodes().filter((c) => c.isActive)
}

export function getResultCodesByPhase(phase: "before" | "after"): ResultCode[] {
  return getActiveResultCodes().filter((c) => c.phase === phase)
}

export function createResultCode(code: Omit<ResultCode, "id" | "createdAt">): ResultCode {
  if (typeof window === "undefined") return { ...code, id: "", createdAt: new Date() }

  const newCode: ResultCode = {
    ...code,
    id: `rc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  }

  const codes = getResultCodes()
  codes.push(newCode)
  saveImmediately(STORAGE_KEYS.RESULT_CODES, codes)
  notifyUpdateImmediate()

  return newCode
}

export function updateResultCode(id: string, updates: Partial<ResultCode>): void {
  const codes = getResultCodes()
  const index = codes.findIndex((c) => c.id === id)
  if (index !== -1) {
    codes[index] = { ...codes[index], ...updates }
    saveImmediately(STORAGE_KEYS.RESULT_CODES, codes)
    notifyUpdateImmediate()
  }
}

export function deleteResultCode(id: string): void {
  const codes = getResultCodes().filter((c) => c.id !== id)
  saveImmediately(STORAGE_KEYS.RESULT_CODES, codes)
  notifyUpdateImmediate()
}

// ===== Quality Questions (Pergunte para Qualidade) =====
export function getQualityQuestions(): QualityQuestion[] {
  if (typeof window === "undefined") return []
  const questions = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUALITY_QUESTIONS) || "[]")
  return questions.map((q: QualityQuestion) => ({
    ...q,
    createdAt: convertFirestoreTimestamp(q.createdAt),
    answeredAt: q.answeredAt ? convertFirestoreTimestamp(q.answeredAt) : undefined,
    resolvedAt: q.resolvedAt ? convertFirestoreTimestamp(q.resolvedAt) : undefined,
  }))
}

export function getQualityQuestionsByOperator(operatorId: string): QualityQuestion[] {
  return getQualityQuestions().filter((q) => q.operatorId === operatorId)
}

export function getPendingQualityQuestions(): QualityQuestion[] {
  return getQualityQuestions().filter((q) => !q.answer)
}

export function getAnsweredQualityQuestions(): QualityQuestion[] {
  return getQualityQuestions().filter((q) => !!q.answer)
}

export function getOpenQuestionsCountByOperator(operatorId: string): number {
  return getQualityQuestionsByOperator(operatorId).filter((q) => !q.isResolved).length
}

export function canOperatorAskMore(operatorId: string): boolean {
  const pending = getQualityQuestionsByOperator(operatorId).filter((q) => !q.isResolved)
  return pending.length < 3
}

export function createQualityQuestion(data: { operatorId: string; operatorName: string; question: string }): QualityQuestion {
  const newQ: QualityQuestion = {
    id: `qq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    operatorId: data.operatorId,
    operatorName: data.operatorName,
    question: data.question,
    createdAt: new Date(),
    isResolved: false,
  }
  const questions = getQualityQuestions()
  questions.push(newQ)
  saveImmediately(STORAGE_KEYS.QUALITY_QUESTIONS, questions)
  notifyUpdateImmediate()
  return newQ
}

export function answerQualityQuestion(questionId: string, answer: string, adminId: string, adminName: string): void {
  const questions = getQualityQuestions()
  const index = questions.findIndex((q) => q.id === questionId)
  if (index !== -1) {
    questions[index].answer = answer
    questions[index].answeredBy = adminId
    questions[index].answeredByName = adminName
    questions[index].answeredAt = new Date()
    saveImmediately(STORAGE_KEYS.QUALITY_QUESTIONS, questions)
    notifyUpdateImmediate()
  }
}

export function resolveQualityQuestion(questionId: string, wasClear: boolean): void {
  const questions = getQualityQuestions()
  const index = questions.findIndex((q) => q.id === questionId)
  if (index !== -1) {
    questions[index].isResolved = true
    questions[index].wasClear = wasClear
    questions[index].resolvedAt = new Date()
    saveImmediately(STORAGE_KEYS.QUALITY_QUESTIONS, questions)
    notifyUpdateImmediate()
  }
}

export function reopenQualityQuestion(questionId: string, reason: string): void {
  const questions = getQualityQuestions()
  const index = questions.findIndex((q) => q.id === questionId)
  if (index !== -1) {
    const q = questions[index]
    // Save the previous answer to history
    if (!q.previousAnswers) q.previousAnswers = []
    if (q.answer) {
      q.previousAnswers.push({
        answer: q.answer,
        answeredByName: q.answeredByName || "Admin",
        answeredAt: q.answeredAt || new Date(),
        reopenReason: reason,
      })
    }
    // Reset the question to pending state
    q.answer = undefined
    q.answeredBy = undefined
    q.answeredByName = undefined
    q.answeredAt = undefined
    q.isResolved = false
    q.wasClear = undefined
    q.resolvedAt = undefined
    q.reopenReason = reason
    q.reopenedAt = new Date()
    saveImmediately(STORAGE_KEYS.QUALITY_QUESTIONS, questions)
    notifyUpdateImmediate()
  }
}

export function deleteQualityQuestion(id: string): void {
  const questions = getQualityQuestions().filter((q) => q.id !== id)
  saveImmediately(STORAGE_KEYS.QUALITY_QUESTIONS, questions)
  notifyUpdateImmediate()
}

// ===== Quality Center Posts (Social Feed) =====
export function getQualityPosts(): QualityPost[] {
  if (typeof window === "undefined") return []
  const posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUALITY_POSTS) || "[]")
  return posts.map((p: QualityPost) => ({
    ...p,
    createdAt: convertFirestoreTimestamp(p.createdAt),
    comments: (p.comments || []).map((c: QualityComment) => ({
      ...c,
      createdAt: convertFirestoreTimestamp(c.createdAt),
    })),
  }))
}

export function getActiveQualityPosts(): QualityPost[] {
  return getQualityPosts().filter((p) => p.isActive).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getQualityPostsByType(type: QualityPost["type"]): QualityPost[] {
  return getActiveQualityPosts().filter((p) => p.type === type)
}

export function getAdminQuestions(): QualityPost[] {
  return getActiveQualityPosts().filter((p) => p.type === "pergunta" && p.isQuestionToAdmin)
}

export function createQualityPost(post: Omit<QualityPost, "id" | "createdAt" | "likes" | "comments">): QualityPost {
  if (typeof window === "undefined") return { ...post, id: "", createdAt: new Date(), likes: [], comments: [] }
  
  const newPost: QualityPost = {
    ...post,
    id: `qp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    likes: [],
    comments: [],
  }
  
  const posts = getQualityPosts()
  posts.push(newPost)
  saveImmediately(STORAGE_KEYS.QUALITY_POSTS, posts)
  notifyUpdateImmediate()
  
  return newPost
}

export function updateQualityPost(id: string, updates: Partial<QualityPost>): void {
  const posts = getQualityPosts()
  const index = posts.findIndex((p) => p.id === id)
  if (index !== -1) {
    posts[index] = { ...posts[index], ...updates }
    saveImmediately(STORAGE_KEYS.QUALITY_POSTS, posts)
    notifyUpdateImmediate()
  }
}

export function deleteQualityPost(id: string): void {
  const posts = getQualityPosts().filter((p) => p.id !== id)
  saveImmediately(STORAGE_KEYS.QUALITY_POSTS, posts)
  notifyUpdateImmediate()
}

export function likeQualityPost(postId: string, userId: string): void {
  const posts = getQualityPosts()
  const index = posts.findIndex((p) => p.id === postId)
  if (index !== -1) {
    const likes = posts[index].likes || []
    if (likes.includes(userId)) {
      posts[index].likes = likes.filter((id) => id !== userId)
    } else {
      posts[index].likes = [...likes, userId]
    }
    saveImmediately(STORAGE_KEYS.QUALITY_POSTS, posts)
    notifyUpdateImmediate()
  }
}

export function voteOnQualityQuiz(postId: string, optionId: string, userId: string): void {
  const posts = getQualityPosts()
  const index = posts.findIndex((p) => p.id === postId)
  if (index !== -1 && posts[index].quizOptions) {
    // Remove previous vote
    posts[index].quizOptions = posts[index].quizOptions!.map((opt) => ({
      ...opt,
      votes: opt.votes.filter((id) => id !== userId),
    }))
    // Add new vote
    const optIndex = posts[index].quizOptions!.findIndex((o) => o.id === optionId)
    if (optIndex !== -1) {
      posts[index].quizOptions![optIndex].votes.push(userId)
    }
    saveImmediately(STORAGE_KEYS.QUALITY_POSTS, posts)
    notifyUpdateImmediate()
  }
}

export function addCommentToQualityPost(postId: string, comment: Omit<QualityComment, "id" | "createdAt">): void {
  const posts = getQualityPosts()
  const index = posts.findIndex((p) => p.id === postId)
  if (index !== -1) {
    const newComment: QualityComment = {
      ...comment,
      id: `qc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }
    posts[index].comments = [...(posts[index].comments || []), newComment]
    saveImmediately(STORAGE_KEYS.QUALITY_POSTS, posts)
    notifyUpdateImmediate()
  }
}

export function getQualityCenterStats(): {
  totalPosts: number
  totalLikes: number
  totalComments: number
  totalUsers: number
  onlineNow: number
} {
  const posts = getActiveQualityPosts()
  const users = getAllUsers().filter((u) => u.role === "operator")
  const onlineUsers = users.filter((u) => u.isOnline)
  
  return {
    totalPosts: posts.length,
    totalLikes: posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0),
    totalComments: posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0),
    totalUsers: users.length,
    onlineNow: onlineUsers.length,
  }
}

// Hook to subscribe to store updates and trigger re-renders
export function useStoreSubscription(): number {
  const [version, setVersion] = useState(0)
  
  useEffect(() => {
    const handleUpdate = () => {
      setVersion((v) => v + 1)
    }
    
    window.addEventListener("store-updated", handleUpdate)
    return () => window.removeEventListener("store-updated", handleUpdate)
  }, [])
  
  return version
}
