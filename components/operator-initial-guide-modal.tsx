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
  const category = CONTRACT_CATEGORIES[contract.id] || "Outros"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[90vw] h-auto max-h-[80vh] p-0 gap-0 flex flex-col overflow-hidden border-border bg-card">
        {/* Header com gradiente laranja */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white shrink-0">
          <DialogHeader>
            <div className="flex items-start gap-4 min-w-0">
              <div className="p-2.5 bg-white/20 rounded-xl shrink-0">
                <IconComponent className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-bold text-white break-words leading-tight">
                  {contract.name}
                </DialogTitle>
                <DialogDescription className="text-orange-100 mt-1 text-sm">
                  {category}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Conteudo com scroll nativo */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-5">
            {contract.description ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  Descricao / Orientacoes
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm break-words">
                    {contract.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <FileText className="h-7 w-7 text-orange-500" />
                </div>
                <p className="font-medium text-muted-foreground">Nenhuma descricao disponivel</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Este contrato nao possui orientacoes detalhadas
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer fixo */}
        <div className="p-4 border-t border-border bg-muted/50 flex justify-end shrink-0">
          <Button onClick={onClose} className="bg-orange-500 hover:bg-orange-600 text-white">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})

// Componente individual de contrato
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

  return (
    <div 
      className="group cursor-pointer p-4 rounded-lg border border-border hover:border-orange-300 hover:bg-orange-50/50 dark:hover:border-orange-700 dark:hover:bg-orange-950/20 transition-all bg-card"
      onClick={() => onViewDetails(contract)}
    >
      {/* Titulo do contrato */}
      <h3 
        className="font-bold text-orange-500 group-hover:text-orange-600 transition-colors"
        style={{ fontSize: `${globalZoom * 0.95}%` }}
      >
        {contract.name}
      </h3>
      
      {/* Preview da descricao */}
      {truncatedDescription && (
        <p 
          className="text-muted-foreground mt-1 line-clamp-2"
          style={{ fontSize: `${globalZoom * 0.8}%` }}
        >
          {truncatedDescription}
        </p>
      )}
      
      {/* Indicador de clique */}
      <div className="mt-2 flex items-center gap-1 text-xs text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
        <Eye className="h-3 w-3" />
        <span>Clique para ver detalhes</span>
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
      <DialogContent className="!max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col border-border bg-card overflow-hidden [&>button]:z-50">
        {/* Header com gradiente laranja */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              Guia Inicial - Contratos
            </DialogTitle>
            <DialogDescription className="text-orange-100 mt-2">
              Consulte as informacoes sobre os tipos de contratos disponiveis
            </DialogDescription>
          </DialogHeader>
          
          {/* Barra de busca e controles */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-200" />
              <Input
                placeholder="Buscar contrato..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-orange-200 focus-visible:ring-white/30"
              />
            </div>
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGlobalZoom(Math.max(80, globalZoom - 10))}
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Diminuir texto"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">{globalZoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGlobalZoom(Math.min(150, globalZoom + 10))}
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Aumentar texto"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="px-6 py-3 bg-muted/50 border-b border-border flex items-center justify-between flex-shrink-0">
          <span className="text-sm text-muted-foreground">
            {filteredContracts.length} {filteredContracts.length === 1 ? "contrato encontrado" : "contratos encontrados"}
          </span>
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearchQuery("")}
              className="text-xs h-7"
            >
              Limpar busca
            </Button>
          )}
        </div>

        {/* Conteudo em duas colunas */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
                <p className="text-muted-foreground">Carregando contratos...</p>
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">Nenhum contrato encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Tente buscar por outro termo" : "Nenhum contrato disponivel no momento"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Coluna Esquerda */}
                <div className="space-y-6">
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
                <div className="space-y-6">
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
