"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCachedContracts } from "@/hooks/use-cached-data"
import { 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  Search,
  Eye,
  Loader2,
  CreditCard,
  Home,
  GraduationCap,
  Building2,
  Users,
  Wallet,
  HandCoins,
  PiggyBank,
  Info,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mapeamento de icones por tipo de contrato
const CONTRACT_ICONS: Record<string, any> = {
  default_cdc: CreditCard,
  default_cred_senior: Users,
  default_renegociacao: HandCoins,
  default_consignacao: Wallet,
  default_microcredito: PiggyBank,
  default_girocaixa_facil: Building2,
  default_fies: GraduationCap,
  default_construcard: Home,
  default_cheque_especial: CreditCard,
  default_cheque_especial_empresa: Building2,
  default_financiamento_habitacional: Home,
  default_procred_360: Building2,
}

// Categorias dos contratos
const CONTRACT_CATEGORIES: Record<string, string> = {
  default_cdc: "Pessoa Fisica",
  default_cred_senior: "Aposentados",
  default_renegociacao: "Renegociacao",
  default_consignacao: "Consignado",
  default_microcredito: "MEI",
  default_girocaixa_facil: "Empresarial",
  default_fies: "Estudantil",
  default_construcard: "Construcao",
  default_cheque_especial: "Conta Corrente",
  default_cheque_especial_empresa: "Empresarial",
  default_financiamento_habitacional: "Habitacional",
  default_procred_360: "MEI",
}

// Contratos padrao registrados no codigo
const DEFAULT_CONTRACTS = [
  {
    id: "default_cdc",
    name: "CREDITO DIRETO CAIXA - CDC",
    description: "O Credito Direto Caixa (CDC) e uma modalidade de emprestimo pessoal oferecida pela Caixa Economica Federal. Ele funciona como um credito pre-aprovado, que pode ser contratado de forma rapida e simples, com o valor liberado diretamente na conta do cliente.",
    is_active: true,
  },
  {
    id: "default_cred_senior",
    name: "CRED SENIOR",
    description: "O Cred Senior da Caixa e uma linha de credito pessoal voltada para aposentados e pensionistas do INSS, oferecida pela Caixa Economica Federal. Ele funciona como um emprestimo consignado, com parcelas descontadas diretamente do beneficio, garantindo juros mais baixos e prazos mais longos.",
    is_active: true,
  },
  {
    id: "default_renegociacao",
    name: "RENEGOCIACAO DE DIVIDAS",
    description: "A renegociacao de dividas da Caixa e um servico oferecido pela Caixa Economica Federal para clientes que estao com dificuldades em pagar seus emprestimos, financiamentos ou outros contratos ativos. O objetivo e reorganizar o debito e facilitar o pagamento, evitando que a divida cresca ainda mais com juros e encargos.",
    is_active: true,
  },
  {
    id: "default_consignacao",
    name: "CONSIGNACAO CAIXA",
    description: "A \"consignacao Caixa\" geralmente se refere ao emprestimo consignado oferecido pela Caixa Economica Federal, uma modalidade de credito em que as parcelas sao descontadas diretamente do salario, aposentadoria ou pensao do cliente.",
    is_active: true,
  },
  {
    id: "default_microcredito",
    name: "MICROCREDITO GIRO",
    description: "O microcredito e uma modalidade de emprestimo de pequeno valor, voltada para microempreendedores individuais (MEIs), trabalhadores informais e pessoas de baixa renda que tem dificuldade em acessar credito tradicional. Ele serve para financiar atividades produtivas, como compra de equipamentos, estoque ou capital de giro.",
    is_active: true,
  },
  {
    id: "default_girocaixa_facil",
    name: "GIROCAIXA FACIL",
    description: "O GiroCaixa Facil e uma linha de credito da Caixa Economica Federal destinada a empresas com faturamento anual de ate R$ 50 milhoes, voltada para financiar capital de giro. Ele oferece limite de ate R$ 2 milhoes, com prazos flexiveis e contratacao simplificada. E um emprestimo empresarial.",
    is_active: true,
  },
  {
    id: "default_fies",
    name: "FIES",
    description: "O FIES (Fundo de Financiamento Estudantil) e um programa do governo federal que oferece financiamento das mensalidades em instituicoes privadas de ensino superior para estudantes que nao tem condicoes de arcar com os custos. Ele e administrado pelo Ministerio da Educacao (MEC) e operado por bancos como a Caixa Economica Federal.",
    is_active: true,
  },
  {
    id: "default_construcard",
    name: "CONSTRUCARD",
    description: "E um tipo de emprestimo oferecido pela Caixa Economica Federal, mas com uma caracteristica especial: ele e voltado exclusivamente para compra de materiais de construcao e reforma em lojas credenciadas. (Nao ofertamos o envio do boleto)",
    is_active: true,
  },
  {
    id: "default_cheque_especial",
    name: "CHEQUE ESPECIAL CAIXA",
    description: "O Cheque Especial e uma modalidade de credito automatico vinculada a conta corrente. Ele funciona como um \"limite extra\" que o banco disponibiliza para o cliente usar quando o saldo da conta nao e suficiente para cobrir saques, pagamentos ou transferencias. (Nao ofertamos o envio do boleto)",
    is_active: true,
  },
  {
    id: "default_cheque_especial_empresa",
    name: "CHEQUE ESPECIAL EMPRESA CAIXA",
    description: "O Cheque Especial e uma modalidade de credito automatico vinculada a conta corrente. Ele funciona como um \"limite extra\" que o banco disponibiliza para o cliente usar quando o saldo da conta nao e suficiente para cobrir saques, pagamentos ou transferencias. (Nao ofertamos o envio do boleto)",
    is_active: true,
  },
  {
    id: "default_financiamento_habitacional",
    name: "FINANCIAMENTO HABITACIONAL",
    description: "Um financiamento habitacional e um tipo de credito que os clientes utilizam para comprar um imovel (casa, apartamento ou terreno) pagando em parcelas mensais.",
    is_active: true,
  },
  {
    id: "default_procred_360",
    name: "GIROCAIXA PROCRED 360 e MICROGIRO PROCRED 360",
    description: "Programa ProCred 360, que e uma linha de capital de giro voltada exclusivamente para MEI e Microempresas com faturamento anual de ate R$ 360 mil. A emissao de 2a via de boleto e feita pelo SIFEC.",
    is_active: true,
  },
]

interface ContractData {
  id: string
  name: string
  description: string
  isDefault: boolean
}

// Modal de detalhes do contrato individual - Design elegante
const ContractDetailModal = memo(function ContractDetailModal({
  contract,
  open,
  onClose,
}: {
  contract: ContractData | null
  open: boolean
  onClose: () => void
}) {
  if (!contract) return null

  const IconComponent = CONTRACT_ICONS[contract.id] || FileText
  const category = CONTRACT_CATEGORIES[contract.id] || "Outros"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        {/* Header com gradiente */}
        <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600">
          {/* Decoracao de fundo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-30 bg-cyan-300" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-20 bg-indigo-300" />
          </div>
          
          <div className="relative">
            {/* Badge de categoria */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <IconComponent className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                {category}
              </span>
            </div>
            
            {/* Titulo */}
            <h3 className="text-xl font-bold text-white leading-tight pr-8">
              {contract.name}
            </h3>
          </div>
        </div>
        
        {/* Conteudo */}
        <div className="px-6 py-6 bg-card">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl flex-shrink-0 bg-blue-100 dark:bg-blue-900/30">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Descricao / Orientacoes
              </h4>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {contract.description || "Este contrato nao possui orientacoes detalhadas."}
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <span>Clique fora para fechar</span>
          </div>
          <Button 
            onClick={onClose}
            className="px-6 rounded-xl font-semibold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})

// Componente individual de contrato - Design elegante
const ContractItem = memo(function ContractItem({
  contract,
  globalZoom,
  onViewDetails,
}: {
  contract: ContractData
  globalZoom: number
  onViewDetails: (contract: ContractData) => void
}) {
  // Truncar descricao para preview
  const truncatedDescription = useMemo(() => {
    if (!contract.description) return ""
    const maxLength = 100
    const text = contract.description.replace(/\n/g, " ").trim()
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + "..."
  }, [contract.description])

  const IconComponent = CONTRACT_ICONS[contract.id] || FileText

  return (
    <button
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all duration-200 group",
        "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400",
        "bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10",
        "border-blue-200/60 dark:border-blue-800/40 hover:border-blue-300 dark:hover:border-blue-700"
      )}
      onClick={() => onViewDetails(contract)}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 transition-transform group-hover:scale-110">
          <IconComponent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 
            className="font-semibold text-foreground group-hover:text-foreground/80 transition-colors leading-tight"
            style={{ fontSize: `${globalZoom * 0.95}%` }}
          >
            {contract.name}
          </h3>
          
          {truncatedDescription && (
            <p 
              className="text-muted-foreground mt-1.5 line-clamp-2"
              style={{ fontSize: `${globalZoom * 0.8}%` }}
            >
              {truncatedDescription}
            </p>
          )}
        </div>
        <div className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all bg-blue-100 dark:bg-blue-900/40">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </button>
  )
})

interface OperatorInitialGuideModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OperatorInitialGuideModal({ open, onOpenChange }: OperatorInitialGuideModalProps) {
  const { data: contractsData, loading } = useCachedContracts()
  const [searchQuery, setSearchQuery] = useState("")
  const [globalZoom, setGlobalZoom] = useState(100)
  const [selectedContract, setSelectedContract] = useState<ContractData | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Combina contratos padrao com contratos do banco de dados e filtra ativos
  const allContracts = useMemo(() => {
    const dbContracts = contractsData
      .filter((c: any) => c.is_active)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || "",
        isDefault: false,
      }))
    
    const defaultActive = DEFAULT_CONTRACTS
      .filter((c) => c.is_active)
      .map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        isDefault: true,
      }))
    
    return [...defaultActive, ...dbContracts]
  }, [contractsData])

  // Filtra contratos pela busca
  const filteredContracts = useMemo(() => {
    if (!searchQuery.trim()) return allContracts
    const query = searchQuery.toLowerCase()
    return allContracts.filter(
      (c) => 
        c.name.toLowerCase().includes(query) || 
        c.description.toLowerCase().includes(query)
    )
  }, [allContracts, searchQuery])

  // Dividir em duas colunas
  const { leftColumn, rightColumn } = useMemo(() => {
    const mid = Math.ceil(filteredContracts.length / 2)
    return {
      leftColumn: filteredContracts.slice(0, mid),
      rightColumn: filteredContracts.slice(mid),
    }
  }, [filteredContracts])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setSearchQuery("")
  }, [onOpenChange])

  const handleContractClick = useCallback((contract: ContractData) => {
    setSelectedContract(contract)
    setShowDetailModal(true)
  }, [])

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false)
    setSelectedContract(null)
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl border-0 shadow-2xl [&>button]:z-50">
        {/* Header elegante */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white overflow-hidden flex-shrink-0">
          {/* Decoracao de fundo */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-4 text-white">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <span className="block">Guia Inicial - Contratos</span>
                  <span className="text-sm font-normal text-slate-400 mt-1 block">
                    Consulte as informacoes sobre os tipos de contratos
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {/* Barra de busca */}
            <div className="flex items-center gap-3 mt-5">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar contrato por nome ou descricao..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-400/50 focus-visible:border-blue-400/50 rounded-xl"
                />
              </div>
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setGlobalZoom(Math.max(80, globalZoom - 10))}
                  className="h-9 w-9 text-white hover:bg-white/10 rounded-lg"
                  title="Diminuir texto"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-12 text-center text-slate-300">{globalZoom}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setGlobalZoom(Math.min(150, globalZoom + 10))}
                  className="h-9 w-9 text-white hover:bg-white/10 rounded-lg"
                  title="Aumentar texto"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Resultados:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold text-sm">
              <span>{filteredContracts.length}</span>
              <span className="text-xs opacity-80">itens</span>
            </div>
          </div>
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearchQuery("")}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              Limpar busca
            </Button>
          )}
        </div>

        {/* Conteudo em duas colunas */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 bg-gradient-to-b from-background to-muted/20">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
                <p className="text-muted-foreground">Carregando contratos...</p>
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
                <p className="font-medium text-foreground">Nenhum contrato encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Tente buscar por outro termo" : "Nenhum contrato disponivel no momento"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coluna Esquerda */}
                <div className="space-y-3">
                  {leftColumn.map((contract) => (
                    <ContractItem
                      key={contract.id}
                      contract={contract}
                      globalZoom={globalZoom}
                      onViewDetails={handleContractClick}
                    />
                  ))}
                </div>
                
                {/* Coluna Direita */}
                <div className="space-y-3">
                  {rightColumn.map((contract) => (
                    <ContractItem
                      key={contract.id}
                      contract={contract}
                      globalZoom={globalZoom}
                      onViewDetails={handleContractClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>

      {/* Modal de detalhes do contrato */}
      <ContractDetailModal
        contract={selectedContract}
        open={showDetailModal}
        onClose={handleCloseDetailModal}
      />
    </Dialog>
  )
}
