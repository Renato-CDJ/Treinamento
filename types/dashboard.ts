// Tipos de dados para o Dashboard de Qualidade

export type UserRole = 'admin' | 'editor' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

export type TurnoType = 'MANHÃ' | 'TARDE' | 'INTEGRAL' | 'TARDE (4h)'

export type RegistroType = 'OPERADOR(A)' | 'NEGOCIADOR' | 'ESTAGIARIO'

export type CarteiraType = 'CAIXA' | 'CARREFOUR' | 'ATIVOS' | 'BMG DIG.' | 'ITAPAVA DIG.' | 'MERCANTIL' | 'FACILITIES' | 'WILL' | string

export type PresencaStatus = 'PRESENTE' | 'FALTOU' | 'NÃO COMPARECEU' | ''

export type AvisoStatus = 'COM AVISO PRÉVIO' | 'SEM AVISO PRÉVIO'

export interface ColaboradorIntegracao {
  id: string
  qtd: number
  colaborador: string
  cpf: string
  admissao: string
  dias: number
  turno: TurnoType
  registro: RegistroType
  carteira: CarteiraType
  dia1: PresencaStatus
  dia2: PresencaStatus
  aplicado: boolean
  observacao?: string
  createdAt: string
}

export interface ColaboradorDesligamento {
  id: string
  qtd: number
  nome?: string
  nomeOperador: string
  carteira: CarteiraType
  admissao: string
  dias: number
  motivo: string
  status: AvisoStatus
  dataDesligamento: string
  createdAt: string
}

export interface DashboardStats {
  totalIntegracao: number
  totalDesligamentos: number
  presentes: number
  ausentes: number
  taxaPresenca: number
  comAvisoPrevio: number
  semAvisoPrevio: number
}
