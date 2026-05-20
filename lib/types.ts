// Core types for the call center script system

export type UserRole = "operator" | "admin"
export type AdminType = "master" | "monitoria" | "supervisao"

export interface AdminPermissions {
  dashboard?: boolean
  scripts?: boolean
  products?: boolean
  attendanceConfig?: boolean
  tabulations?: boolean
  situations?: boolean
  channels?: boolean
  notes?: boolean
  operators?: boolean
  messagesQuiz?: boolean
  chat?: boolean
  settings?: boolean
}

export interface User {
  id: string
  username: string
  fullName: string
  name?: string
  email?: string
  role: UserRole
  adminType?: AdminType
  allowedTabs?: string[]
  isOnline: boolean
  isActive?: boolean
  createdAt: Date
  lastLoginAt?: Date
  lastHeartbeat?: Date
  lastScriptAccess?: Date
  currentProductName?: string
  loginSessions?: LoginSession[]
  permissions?: AdminPermissions
  password?: string
}

export interface LoginSession {
  id: string
  loginAt: Date
  logoutAt?: Date
  duration?: number // in milliseconds
}

export interface AttendanceTypeOption {
  id: string
  value: string
  label: string
  description?: string
  createdAt: Date
}

export interface PersonTypeOption {
  id: string
  value: string
  label: string
  description?: string
  createdAt: Date
}

export interface ScriptStep {
  id: string
  title: string
  content: string
  order: number
  buttons: ScriptButton[]
  createdAt: Date
  updatedAt: Date
  productId?: string // Added productId to track which product this step belongs to
  productName?: string
  isActive?: boolean
  tabulations?: Array<{
    id: string
    name: string
    description: string
  }> // Changed from single tabulationInfo to array of tabulations
  contentSegments?: ContentSegment[]
  formatting?: {
    textColor?: string
    bold?: boolean
    italic?: boolean
    textAlign?: "left" | "center" | "right" | "justify"
  }
  alert?: {
    title: string // Added title field to alert object for customizable alert titles
    message: string
    createdAt: Date
  }
}

export interface ContentSegment {
  id: string
  text: string
  formatting: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    color?: string
    backgroundColor?: string
    fontSize?: "sm" | "base" | "lg" | "xl" | "2xl" | "3xl"
    alignment?: "left" | "center" | "right"
    fontFamily?: string
    listType?: "none" | "bullet" | "numbered"
    textShadow?: string
  }
}

export interface ScriptButton {
  id: string
  label: string
  nextStepId: string | null // null means end of script
  variant: "default" | "primary" | "secondary" | "destructive"
  order: number
  primary?: boolean
}

export interface Tabulation {
  id: string
  name: string
  description: string
  color: string
  category?: "before" | "after"
  createdAt: Date
}

export interface ServiceSituation {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: Date
  expanded?: boolean // Added expanded state for accordion-style display
}

export interface Channel {
  id: string
  name: string
  contact: string // Changed from icon to contact (number or link)
  isActive: boolean
  createdAt: Date
}

export interface Note {
  id: string
  userId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  title: string
  content: string
  createdBy: string // admin user id
  createdByName: string // admin user name
  createdAt: Date
  isActive: boolean
  seenBy: string[] // array of operator user ids who have seen this message
  recipients: string[] // array of operator user ids, empty array means all operators
  segments?: ContentSegment[] // Added segments field for formatted content
}

export interface Quiz {
  id: string
  question: string
  options: QuizOption[]
  correctAnswer: string
  createdBy: string
  createdByName: string
  createdAt: Date
  isActive: boolean
  scheduledDate?: Date
  recipients?: string[] // Array of operator IDs, empty means all operators (consistent with Message and Presentation)
}

export interface QuizOption {
  id: string
  label: string // a, b, c, d
  text: string
}

export interface QuizAttempt {
  id: string
  quizId: string
  operatorId: string
  operatorName: string
  selectedAnswer: string // id of the selected option
  isCorrect: boolean
  attemptedAt: Date
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: "operator" | "admin"
  recipientId?: string // If undefined, message goes to all admins (from operator) or all operators (from admin)
  content: string
  attachment?: {
    type: "image"
    url: string
    name: string
  }
  replyTo?: {
    messageId: string
    content: string
    senderName: string
  }
  createdAt: Date
  isRead: boolean
  isEdited?: boolean
  editedAt?: Date
}

export interface ChatSettings {
  isEnabled: boolean // Admin can enable/disable chat globally
  updatedAt: Date
  updatedBy: string
}

export interface CallSession {
  id: string
  operatorId: string
  currentStepId: string
  startedAt: Date
  tabulationId?: string
  situationId?: string
  channelId?: string
  notes: string[]
}

export interface AttendanceConfig {
  attendanceType: "ativo" | "receptivo"
  personType: "fisica" | "juridica"
  product: string
}

export interface Product {
  id: string
  name: string
  scriptId: string // Links to the first step of the script for this product
  category: "habitacional" | "comercial" | "cartao" | "outros" | "boleto_pre_formatado"
  isActive: boolean
  createdAt: Date
  attendanceTypes?: ("ativo" | "receptivo")[]
  personTypes?: ("fisica" | "juridica")[]
  description?: string // Added description field for hover tooltip
}

export interface PresentationSlide {
  id: string
  order: number
  imageUrl: string
  imageData?: string // base64 for pasted images
  title?: string
  description?: string
}

export interface Presentation {
  id: string
  title: string
  description: string
  slides: PresentationSlide[]
  createdBy: string // admin user id
  createdByName: string // admin user name
  createdAt: Date
  updatedAt: Date
  uploadedAt?: Date
  isActive: boolean
  recipients: string[] // array of operator user ids, empty array means all operators
}

export interface PresentationProgress {
  id: string
  presentationId: string
  operatorId: string
  operatorName: string
  viewedAt: Date
  marked_as_seen: boolean
  completion_date?: Date
}

export interface FilePresentationProgress {
  id: string
  fileName: string
  operatorId: string
  operatorName: string
  viewedAt: Date
  marked_as_seen: boolean
  completion_date?: Date
  last_accessed?: Date
}

export interface OperatorRanking {
  operatorId: string
  operatorName: string
  totalAttempts: number
  correctAnswers: number
  score: number
  accuracy: number
  rank: number
}

export type Ranking = OperatorRanking

export interface QualityQuestion {
  id: string
  operatorId: string
  operatorName: string
  question: string
  createdAt: Date
  answer?: string
  answeredBy?: string
  answeredByName?: string
  answeredAt?: Date
  status?: string
  isResolved: boolean // operator confirmed it was clarified
  resolvedAt?: Date
  wasClear?: boolean // true = esclarecido, false = nao esclarecido
  reopenReason?: string // reason the operator gave when marking "nao esclareceu"
  reopenedAt?: Date
  previousAnswers?: Array<{ answer: string; answeredByName: string; answeredAt: Date; reopenReason: string }>
}

export interface ResultCode {
  id: string
  name: string
  description: string
  phase: "before" | "after" // before = Antes da Identificacao Positiva, after = Apos Identificacao Positiva
  createdAt: Date
  isActive: boolean
}

export interface Contract {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface SupervisorTeam {
  id?: string
  supervisorId: string // User ID from access control
  operatorIds: string[] // Array of operator IDs assigned to this supervisor
  createdAt: Date
  updatedAt?: Date
}

export interface Feedback {
  id: string
  operatorId: string
  operatorName: string
  createdBy: string // admin user id
  createdByName: string // admin user name
  createdAt: Date
  callDate: Date // Data e hora da ligação
  ecNumber: string // EC da Ligação
  feedbackType: "positive" | "negative"
  severity: "elogio" | "leve" | "medio" | "grave" // Added severity level field
  score: number // Pontuação de 0 a 100
  details: string // Detalhes do feedback
  positivePoints: string // Pontos positivos
  improvementPoints: string // Pontos a melhorar
  isRead: boolean // Se o operador marcou como lido
  readAt?: Date // Quando foi marcado como lido
  isActive: boolean
}

// Quality Center types for social feed
export type QualityPostType = "comunicado" | "quiz" | "recado" | "pergunta" | "feedback"

export interface QualityPost {
  id: string
  type: QualityPostType
  content: string
  authorId: string
  authorName: string
  createdAt: Date
  isActive: boolean
  // Quiz specific fields
  quizOptions?: QualityQuizOption[]
  // Engagement
  likes: string[] // array of user ids who liked
  comments: QualityComment[]
  correctOption?: number
  // For questions only - if it's a question to admin
  isQuestionToAdmin?: boolean
  // Recipients/Mentions - array of user ids, empty means all operators
  recipients?: string[]
  recipientNames?: string[] // names for display
  sendToAll?: boolean // true if sent to all operators
  // Background color for post content area
  backgroundColor?: string // CSS color or color name, defaults to system color
  // Archive flag - posts older than 24h are archived to localStorage
  isArchived?: boolean
}

export interface QualityQuizOption {
  id: string
  text: string
  votes: string[] // array of user ids who voted
  isCorrect?: boolean // marks the correct answer
}

export interface QualityComment {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: Date
}

export interface Campaign {
  id: string
  name: string // Nome da campanha (ex: SINEB - 224,225 e 226)
  howItWorks: string // Como funciona?
  positiveCase: string // Em caso positivo
  negativeCase: string // Em caso negativo
  delayRange: string // Faixa de atraso
  complement: string // Complemento
  systemSite: string // Sistema/Site
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
