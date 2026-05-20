"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  ListChecks,
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Tabulacoes fixas - registradas diretamente no codigo para nao precisar
// ser recadastradas a cada deploy. Estas sao as tabulacoes oficiais.
// ---------------------------------------------------------------------------

export interface StaticTabulation {
  name: string
  description: string
  phase: "before" | "after"
}

export const STATIC_TABULATIONS: StaticTabulation[] = [
  // -- Antes da IP --
  {
    phase: "before",
    name: "LIGACAO CAIU",
    description:
      `Atendimento interrompido sem que seja possivel continuar o dialogo entre operador e cliente e sem possibilidade de realizacao da confirmacao do CPF. Exemplo de resposta por parte do cliente/terceiro: "Alo" / "Quem e" / "De onde fala" / "Sou eu" / "Do que se trata" / etc.`,
  },
  {
    phase: "before",
    name: "LIGACAO MUDA",
    description:
      "Utilizar se a ligacao se iniciou muda, fica sem fala do cliente. Lembrando que se a pessoa atender e houver ruidos ou vozes que nao se direcionar a voce sera considerada uma Ligacao muda.",
  },
  {
    phase: "before",
    name: "RECADO COM TERCEIRO",
    description:
      "Terceiro atende e informa que a empresa entrou em falencia ou terceiro informa que conhece o cliente, ou terceiro pede para ligar outro dia/horario ou em outro telefone.",
  },
  {
    phase: "before",
    name: "FALECIDO",
    description: "Terceiro informa que o titular faleceu.",
  },
  {
    phase: "before",
    name: "DESCONHECIDO NO TELEFONE",
    description:
      `Terceiro informa que nao conhece ninguem com o nome do cliente no telefone do cadastro. Exemplo de resposta por parte do cliente/terceiro: "Nao conheco" / "Nao e desse numero" / "Nao e daqui" / "Nunca ouvi falar" / etc.`,
  },
  {
    phase: "before",
    name: "PESSOA NAO CONFIRMA DADOS",
    description:
      `Cliente se recusa confirmar os dados para prosseguir com atendimento. Utilize quando: O cliente informa CPF/CNPJ, mas os dados nao conferem, o cliente se recusa a informar CPF/CNPJ, o cliente nao lembra os dados ou quando o cliente diz que nao pode falar no momento. Exemplo de resposta por parte do cliente: "Nao confirmo nada por telefone" / "Nao, eu vou na agencia" / "Nao lembro meu CPF" / etc.`,
  },
  {
    phase: "before",
    name: "FALENCIA OU CONCORDATA",
    description:
      "Utilizamos quando o socio ou responsavel financeiro informar que a empresa entrou em falencia.",
  },
  {
    phase: "before",
    name: "SINAL DE FAX",
    description: "Ligacao direcionada: sinal de FAX.",
  },
  {
    phase: "before",
    name: "CAIXA POSTAL",
    description: "Devemos utilizar quando a ligacao e direcionada diretamente a caixa postal.",
  },

  // -- Apos a IP --
  {
    phase: "after",
    name: "CONTATO INTERROMPIDO APOS IP, MAS SEM RESULTADO DEFINIDO",
    description:
      "A ligacao foi interrompida sem conseguir um posicionamento da parte do cliente sobre a divida. Situacao: Ao questionar se foi pago, o cliente responde apenas com um NAO e desliga.",
  },
  {
    phase: "after",
    name: "PESSOA SOLICITA RETORNO EM OUTRO MOMENTO",
    description: "Cliente pede para o operador retornar a ligacao em outro dia/horario.",
  },
  {
    phase: "after",
    name: "PAGAMENTO JA EFETUADO",
    description: "Cliente informa que ja efetuou o pagamento.",
  },
  {
    phase: "after",
    name: "PROMESSA DE PAGAMENTO SEM EMISSAO DE BOLETO",
    description:
      "Cliente informa que ira pagar ou depositar dentro do prazo estabelecido [10 dias corridos].",
  },
  {
    phase: "after",
    name: "CONTATO SEM NEGOCIACAO",
    description:
      "Cliente informa que nao consegue falar no momento e desliga, ou cliente informa que ira pagar ou depositar FORA do prazo estabelecido [10 dias corridos].",
  },
  {
    phase: "after",
    name: "SEM CAPACIDADE DE PAGAMENTO",
    description:
      "Cliente informa que nao possui capacidade de efetuar o pagamento. Exemplo dos motivos: Informa que nao tem recurso disponivel, desemprego, mudancas economicas ou nao pode fazer o pagamento naquele momento.",
  },
  {
    phase: "after",
    name: "DIVIDA NAO RECONHECIDA",
    description: "Cliente alega que desconhece a divida.",
  },
  {
    phase: "after",
    name: "NEGOCIACAO EM OUTRO CANAL",
    description: "Cliente informa que ja esta negociando em outro canal.",
  },
  {
    phase: "after",
    name: "PROMESSA DE PAGAMENTO COM EMISSAO DE BOLETO",
    description:
      "Cliente solicita boleto e informa data de pagamento dentro do periodo permitido [10 dias corridos].",
  },
  {
    phase: "after",
    name: "ACEITA ACAO/CAMPANHA SEM EMISSAO DE BOLETO",
    description: "Cliente aceita acao/campanha sem emissao de boleto.",
  },
  {
    phase: "after",
    name: "ACEITA ACAO/CAMPANHA COM EMISSAO DE BOLETO",
    description: "Cliente aceita acao/campanha com emissao de boleto.",
  },
  {
    phase: "after",
    name: "CLIENTE COM ACORDO ATIVO RETORNA NO RECEPTIVO",
    description:
      "Quando o cliente retorna no receptivo tendo acordo vigente para solicitar esclarecimentos ou solicitar o boleto.",
  },
  {
    phase: "after",
    name: "PROMESSA DE PAGAMENTO ACORDO DE PARCELAMENTO",
    description: "Cliente confirma o pagamento parcelado do CARTAO DE CREDITO.",
  },
  {
    phase: "after",
    name: "TRANSBORDO PARA ATENDIMENTO ENTRE CANAIS, COM IP",
    description:
      "Quando o atendimento e iniciado em um canal e precisa ser transbordado para resolucao por outro canal apos o cliente ter realizado a IP.",
  },
  {
    phase: "after",
    name: "TRANSBORDO PARA ATENDIMENTO ENTRE CANAIS, SEM IP",
    description:
      "Quando o atendimento e iniciado em um canal digital e precisa ser transbordado para resolucao no atendimento humano antes do cliente ter realizado a IP.",
  },
  {
    phase: "after",
    name: "RECUSA ACAO/CAMPANHA",
    description:
      "Cliente nao aceita a acao/campanha ofertada. Motivos possiveis: Sem capacidade de pagamento, Contato sem negociacao/acordo, Negociacao em outro canal, Pessoa solicita retorno em outro momento, Divida nao reconhecida, Promessa de pagamento sem emissao de boleto, Promessa de pagamento com emissao de boleto.",
  },
]

// ---------------------------------------------------------------------------

export function ResultCodesTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showReference, setShowReference] = useState(true)
  const [referenceFilter, setReferenceFilter] = useState<"all" | "before" | "after">("all")

  const filteredStaticTabs = useMemo(() => {
    let result = STATIC_TABULATIONS
    
    // Filtro por fase
    if (referenceFilter !== "all") {
      result = result.filter((t) => t.phase === referenceFilter)
    }
    
    // Filtro por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      )
    }
    
    return result
  }, [referenceFilter, searchQuery])

  const beforeCount = STATIC_TABULATIONS.filter((t) => t.phase === "before").length
  const afterCount = STATIC_TABULATIONS.filter((t) => t.phase === "after").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-orange-500" />
            Codigos de Resultado
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tabulacoes oficiais separadas para usar antes e depois da confirmacao dos dados (CPF)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Tabulacoes</p>
                <p className="text-2xl font-bold text-foreground">{STATIC_TABULATIONS.length}</p>
              </div>
              <ListChecks className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Antes da ID Positiva</p>
                <p className="text-2xl font-bold text-amber-500">{beforeCount}</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Apos ID Positiva</p>
                <p className="text-2xl font-bold text-green-500">{afterCount}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Referencia */}
      <Card className="border-blue-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-base">Tabela de Referencia de Tabulacoes</CardTitle>
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                {STATIC_TABULATIONS.length} tabulacoes
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReference((v) => !v)}
                className="h-8 px-2"
              >
                {showReference ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <CardDescription>
            Lista oficial de tabulacoes registradas no sistema - estas tabulacoes aparecem automaticamente na aba &quot;Tabulacoes Disponiveis&quot; do operador.
          </CardDescription>
        </CardHeader>

        {showReference && (
          <CardContent className="pt-0 space-y-4">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar tabulacao..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={referenceFilter}
                onValueChange={(v: "all" | "before" | "after") => setReferenceFilter(v)}
              >
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as fases</SelectItem>
                  <SelectItem value="before">Antes da IP</SelectItem>
                  <SelectItem value="after">Apos a IP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Before IP */}
            {(referenceFilter === "all" || referenceFilter === "before") && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    Tabulacoes antes da IP
                  </h3>
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                    {filteredStaticTabs.filter((t) => t.phase === "before").length}
                  </Badge>
                </div>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-amber-500/5">
                      <TableRow>
                        <TableHead className="text-xs font-semibold w-[220px]">Tabulacao</TableHead>
                        <TableHead className="text-xs font-semibold">Descricao</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaticTabs
                        .filter((t) => t.phase === "before")
                        .map((tab) => (
                          <TableRow key={tab.name} className="hover:bg-muted/20">
                            <TableCell className="py-3 align-top">
                              <span className="text-sm font-medium text-foreground leading-snug">
                                {tab.name}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 align-top">
                              <span className="text-sm text-muted-foreground leading-relaxed">
                                {tab.description}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      {filteredStaticTabs.filter((t) => t.phase === "before").length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                            Nenhuma tabulacao encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* After IP */}
            {(referenceFilter === "all" || referenceFilter === "after") && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <h3 className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Tabulacoes apos a IP
                  </h3>
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                    {filteredStaticTabs.filter((t) => t.phase === "after").length}
                  </Badge>
                </div>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-green-500/5">
                      <TableRow>
                        <TableHead className="text-xs font-semibold w-[220px]">Tabulacao</TableHead>
                        <TableHead className="text-xs font-semibold">Descricao</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaticTabs
                        .filter((t) => t.phase === "after")
                        .map((tab) => (
                          <TableRow key={tab.name} className="hover:bg-muted/20">
                            <TableCell className="py-3 align-top">
                              <span className="text-sm font-medium text-foreground leading-snug">
                                {tab.name}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 align-top">
                              <span className="text-sm text-muted-foreground leading-relaxed">
                                {tab.description}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      {filteredStaticTabs.filter((t) => t.phase === "after").length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                            Nenhuma tabulacao encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
