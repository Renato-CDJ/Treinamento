"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useCachedContracts } from "@/hooks/use-cached-data"
import { cn } from "@/lib/utils"
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
  ChevronRight,
  Sparkles,
  BookOpen,
} from "lucide-react"

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

// Categorias dos contratos com cores
const CONTRACT_CATEGORIES: Record<string, { label: string; color: string; bgColor: string }> = {
  default_cdc: { label: "Pessoa Fisica", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  default_cred_senior: { label: "Aposentados", color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  default_renegociacao: { label: "Renegociacao", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  default_consignacao: { label: "Consignado", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30" },
  default_microcredito: { label: "MEI", color: "text-teal-600 dark:text-teal-400", bgColor: "bg-teal-100 dark:bg-teal-900/30" },
  default_girocaixa_facil: { label: "Empresarial", color: "text-indigo-600 dark:text-indigo-400", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
  default_fies: { label: "Estudantil", color: "text-pink-600 dark:text-pink-400", bgColor: "bg-pink-100 dark:bg-pink-900/30" },
  default_construcard: { label: "Construcao", color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  default_cheque_especial: { label: "Conta Corrente", color: "text-cyan-600 dark:text-cyan-400", bgColor: "bg-cyan-100 dark:bg-cyan-900/30" },
  default_cheque_especial_empresa: { label: "Empresarial", color: "text-indigo-600 dark:text-indigo-400", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
  default_financiamento_habitacional: { label: "Habitacional", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
  default_procred_360: { label: "MEI", color: "text-teal-600 dark:text-teal-400", bgColor: "bg-teal-100 dark:bg-teal-900/30" },
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

// Modal de detalhes do contrato individual
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
  const categoryInfo = CONTRACT_CATEGORIES[contract.id] || { label: "Outros", color: "text-gray-600", bgColor: "bg-gray-100" }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[90vw] h-auto max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden border-0 bg-card shadow-2xl rounded-2xl">
        {/* Header com gradiente teal */}
        <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 p-6 text-white shrink-0 relative overflow-hidden">
          {/* Pattern decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
            <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/20" />
          </div>
          
          <DialogHeader className="relative z-10">
            <div className="flex items-start gap-4 min-w-0">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shrink-0 shadow-lg">
                <IconComponent className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <Badge className={cn("mb-2 text-xs font-medium", categoryInfo.bgColor, categoryInfo.color, "border-0")}>
                  {categoryInfo.label}
                </Badge>
                <DialogTitle className="text-xl font-bold text-white break-words leading-tight">
                  {contract.name}
                </DialogTitle>
                <DialogDescription className="text-teal-100 mt-1 text-sm flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Informacoes do contrato
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Conteudo com scroll nativo */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-gradient-to-b from-muted/30 to-background">
          <div className="p-6">
            {contract.description ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                    <Eye className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  Descricao e Orientacoes
                </div>
                <div className="bg-white dark:bg-card rounded-xl p-5 border border-teal-200/50 dark:border-teal-800/50 shadow-sm">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm break-words">
                    {contract.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-teal-500" />
                </div>
                <p className="font-semibold text-foreground">Nenhuma descricao disponivel</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Este contrato nao possui orientacoes detalhadas
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer fixo */}
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end shrink-0">
          <Button onClick={onClose} className="bg-teal-500 hover:bg-teal-600 text-white shadow-md px-6">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})

// Componente individual de contrato - Design de Card Moderno
const ContractItem = memo(function ContractItem({
  contract,
  globalZoom,
  onViewDetails,
}: {
  contract: ContractData
  globalZoom: number
  onViewDetails: (contract: ContractData) => void
}) {
  const IconComponent = CONTRACT_ICONS[contract.id] || FileText
  const categoryInfo = CONTRACT_CATEGORIES[contract.id] || { label: "Outros", color: "text-gray-600", bgColor: "bg-gray-100" }
  
  // Truncar descricao para preview
  const truncatedDescription = useMemo(() => {
    if (!contract.description) return ""
    const maxLength = 120
    const text = contract.description.replace(/\n/g, " ").trim()
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + "..."
  }, [contract.description])

  return (
    <div 
      className="group cursor-pointer rounded-xl border border-border bg-card hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-300 overflow-hidden"
      onClick={() => onViewDetails(contract)}
    >
      {/* Barra superior colorida */}
      <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
      
      <div className="p-4">
        {/* Header do card */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2.5 rounded-xl shrink-0 transition-all duration-300 group-hover:scale-110",
            "bg-teal-100 dark:bg-teal-900/30 group-hover:bg-teal-500 group-hover:shadow-lg"
          )}>
            <IconComponent className="h-5 w-5 text-teal-600 dark:text-teal-400 group-hover:text-white transition-colors" />
          </div>
          
          <div className="flex-1 min-w-0">
            <Badge className={cn("mb-1.5 text-[10px] font-medium", categoryInfo.bgColor, categoryInfo.color, "border-0")}>
              {categoryInfo.label}
            </Badge>
            <h3 
              className="font-bold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-tight line-clamp-2"
              style={{ fontSize: `${globalZoom * 0.9}%` }}
            >
              {contract.name}
            </h3>
          </div>
          
          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
        </div>
        
        {/* Preview da descricao */}
        {truncatedDescription && (
          <p 
            className="text-muted-foreground mt-3 line-clamp-2 leading-relaxed"
            style={{ fontSize: `${globalZoom * 0.8}%` }}
          >
            {truncatedDescription}
          </p>
        )}
        
        {/* Footer do card */}
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Clique para detalhes</span>
          </div>
          <div className="h-2 w-2 rounded-full bg-teal-500 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity" />
        </div>
      </div>
    </div>
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
      <DialogContent className="!max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col border-0 bg-card overflow-hidden [&>button]:z-50 shadow-2xl rounded-2xl">
        {/* Header com gradiente teal */}
        <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 p-6 text-white flex-shrink-0 relative overflow-hidden">
          {/* Pattern decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/20" />
            <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/20" />
            <div className="absolute right-1/3 top-1/2 w-24 h-24 rounded-full bg-white/10" />
          </div>
          
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="block">Guia de Contratos</span>
                <span className="text-sm font-normal text-teal-100">Consulta rapida para atendimento</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {/* Barra de busca e controles */}
          <div className="flex items-center gap-3 mt-5 relative z-10">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-200" />
              <Input
                placeholder="Buscar contrato por nome ou descricao..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-white/15 backdrop-blur-sm border-white/20 text-white placeholder:text-teal-200 focus-visible:ring-white/30 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-xl p-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGlobalZoom(Math.max(80, globalZoom - 10))}
                className="h-8 w-8 text-white hover:bg-white/20 rounded-lg"
                title="Diminuir texto"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">{globalZoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGlobalZoom(Math.min(150, globalZoom + 10))}
                className="h-8 w-8 text-white hover:bg-white/20 rounded-lg"
                title="Aumentar texto"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="px-6 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border-b border-teal-200/50 dark:border-teal-800/50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
              {filteredContracts.length} {filteredContracts.length === 1 ? "contrato disponivel" : "contratos disponiveis"}
            </span>
          </div>
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearchQuery("")}
              className="text-xs h-7 text-teal-600 hover:text-teal-700 hover:bg-teal-100 dark:text-teal-400 dark:hover:bg-teal-900/30"
            >
              Limpar busca
            </Button>
          )}
        </div>

        {/* Conteudo em duas colunas */}
        <ScrollArea className="flex-1 min-h-0 bg-gradient-to-b from-muted/20 to-background">
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-teal-100 dark:bg-teal-900/30 rounded-full mb-4">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                </div>
                <p className="text-muted-foreground font-medium">Carregando contratos...</p>
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-teal-500" />
                </div>
                <p className="font-semibold text-foreground text-lg">Nenhum contrato encontrado</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchQuery ? "Tente buscar por outro termo" : "Nenhum contrato disponivel no momento"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Coluna Esquerda */}
                <div className="space-y-4">
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
                <div className="space-y-4">
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
