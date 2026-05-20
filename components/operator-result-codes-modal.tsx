"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, Tags, ZoomIn, ZoomOut, ShieldCheck, ShieldQuestion, CheckCircle2, Eye, EyeOff, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { STATIC_TABULATIONS, type StaticTabulation } from "@/components/admin-tabs/result-codes-tab"

interface OperatorResultCodesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Converter tabulacoes estaticas para formato do componente
interface TabulationDisplay {
  id: string
  name: string
  description: string
  color: string
  category: "before" | "after"
}

export function OperatorResultCodesModal({ open, onOpenChange }: OperatorResultCodesModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [globalZoom, setGlobalZoom] = useState(100)
  const [activeCategory, setActiveCategory] = useState<"all" | "before" | "after">("all")
  const [showDescriptions, setShowDescriptions] = useState(true)
  const [selectedTabulation, setSelectedTabulation] = useState<TabulationDisplay | null>(null)

  // Usar tabulacoes estaticas do codigo (sem consulta ao banco)
  const tabulations: TabulationDisplay[] = useMemo(() => 
    STATIC_TABULATIONS.map((t, index) => ({
      id: `static-${index}`,
      name: t.name,
      description: t.description,
      color: t.phase === "before" ? "#f59e0b" : "#22c55e",
      category: t.phase,
    })), [])

  // Filter by search
  const filteredTabulations = useMemo(() => {
    let result = tabulations
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      )
    }
    if (activeCategory !== "all") {
      result = result.filter((t) => t.category === activeCategory)
    }
    return result
  }, [tabulations, searchQuery, activeCategory])

  // Separate by category
  const beforeTabulations = useMemo(() => {
    return filteredTabulations
      .filter((t) => t.category === "before")
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredTabulations])

  const afterTabulations = useMemo(() => {
    return filteredTabulations
      .filter((t) => t.category === "after")
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredTabulations])

  // Contadores totais (sem filtro de categoria)
  const totalBefore = useMemo(() => {
    let result = tabulations.filter((t) => t.category === "before")
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      )
    }
    return result.length
  }, [tabulations, searchQuery])

  const totalAfter = useMemo(() => {
    let result = tabulations.filter((t) => t.category === "after")
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      )
    }
    return result.length
  }, [tabulations, searchQuery])

  const renderTabulationCard = (tabulation: TabulationDisplay, category: "before" | "after") => {
    const isBefore = category === "before"
    return (
      <div
        key={tabulation.id}
        className={cn(
          "rounded-lg border bg-card hover:shadow-md transition-all duration-200 group overflow-hidden",
          isBefore ? "border-amber-200 dark:border-amber-900/50" : "border-emerald-200 dark:border-emerald-900/50"
        )}
      >
        <div
          className={cn(
            "flex items-start gap-3 p-3",
            isBefore ? "bg-amber-50/50 dark:bg-amber-950/20" : "bg-emerald-50/50 dark:bg-emerald-950/20"
          )}
          style={{ borderLeft: `4px solid ${tabulation.color}` }}
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 mt-1 ring-2 ring-white dark:ring-gray-800"
            style={{ backgroundColor: tabulation.color }}
          />
          <div className="flex-1 min-w-0">
            <h4
              className="font-semibold text-foreground leading-tight"
              style={{ fontSize: `${globalZoom}%` }}
            >
              {tabulation.name}
            </h4>
            {showDescriptions && tabulation.description && (
              <p
                className="text-muted-foreground leading-relaxed mt-1"
                style={{ fontSize: `${Math.round(globalZoom * 0.85)}%` }}
              >
                {tabulation.description}
              </p>
            )}
          </div>
          {tabulation.description && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0 opacity-60 hover:opacity-100"
              onClick={() => setSelectedTabulation(tabulation)}
              title="Ver descricao"
            >
              <Info className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  const CategorySection = ({ 
    type, 
    tabulations, 
    icon: Icon, 
    title, 
    subtitle, 
    accentColor,
    borderColor,
    bgColor,
    iconBg
  }: { 
    type: "before" | "after"
    tabulations: TabulationDisplay[]
    icon: typeof ShieldQuestion
    title: string
    subtitle: string
    accentColor: string
    borderColor: string
    bgColor: string
    iconBg: string
  }) => (
    <div className={cn("rounded-xl border-2 overflow-hidden", borderColor)}>
      {/* Header da secao */}
      <div className={cn("p-4", bgColor)}>
        <div className="flex items-start gap-3">
          <div className={cn("p-2.5 rounded-xl", iconBg)}>
            <Icon className={cn("h-6 w-6", accentColor)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={cn("font-bold text-lg", accentColor)}>{title}</h3>
              <span className={cn(
                "text-sm font-bold px-2.5 py-0.5 rounded-full",
                type === "before" 
                  ? "bg-amber-500 text-white" 
                  : "bg-emerald-500 text-white"
              )}>
                {tabulations.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>
      
      {/* Lista de tabulacoes */}
      <div className="p-4 bg-card">
        {tabulations.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
            <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Nenhuma tabulacao encontrada</p>
            <p className="text-xs mt-1">Tente ajustar sua busca</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {tabulations.map((t) => renderTabulationCard(t, type))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl w-[95vw] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:z-50">
        {/* Header compacto */}
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 p-5 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Tags className="h-5 w-5" />
              </div>
              Tabulacoes Disponiveis
            </DialogTitle>
            <DialogDescription className="text-orange-100 mt-1 text-sm">
              Selecione a tabulacao correta de acordo com o momento do atendimento
            </DialogDescription>
          </DialogHeader>
          
          {/* Barra de busca e controles */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-200" />
              <Input
                placeholder="Buscar tabulacao por nome ou descricao..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-orange-200 focus-visible:ring-white/30 h-10"
              />
            </div>
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1 backdrop-blur-sm">
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

        {/* Filtros por categoria */}
        <div className="px-5 py-3 bg-muted/50 border-b flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Filtrar:</span>
          <div className="flex gap-2">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("all")}
              className={cn(
                "h-8 text-xs font-medium",
                activeCategory === "all" && "bg-orange-500 hover:bg-orange-600"
              )}
            >
              Todas ({totalBefore + totalAfter})
            </Button>
            <Button
              variant={activeCategory === "before" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("before")}
              className={cn(
                "h-8 text-xs font-medium gap-1.5",
                activeCategory === "before" && "bg-amber-500 hover:bg-amber-600"
              )}
            >
              <ShieldQuestion className="h-3.5 w-3.5" />
              Antes do CPF ({totalBefore})
            </Button>
            <Button
              variant={activeCategory === "after" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("after")}
              className={cn(
                "h-8 text-xs font-medium gap-1.5",
                activeCategory === "after" && "bg-emerald-500 hover:bg-emerald-600"
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Depois do CPF ({totalAfter})
            </Button>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSearchQuery("")}
                className="text-xs h-8"
              >
                Limpar busca
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDescriptions(!showDescriptions)}
              className="h-8 text-xs font-medium gap-1.5"
            >
              {showDescriptions ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Ocultar Descricoes
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Mostrar Descricoes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-muted/30">
          <div className="p-5">
            {tabulations.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Tags className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium">Nenhuma tabulacao cadastrada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Entre em contato com o administrador
                </p>
              </div>
            ) : filteredTabulations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhum resultado encontrado</p>
                <p className="text-sm mt-1">Tente buscar por outro termo ou limpar os filtros</p>
              </div>
            ) : (
              <div className={cn(
                "grid gap-5",
                activeCategory === "all" ? "lg:grid-cols-2" : "grid-cols-1 max-w-3xl mx-auto"
              )}>
                {/* Coluna: Antes da confirmacao de CPF */}
                {(activeCategory === "all" || activeCategory === "before") && (
                  <CategorySection
                    type="before"
                    tabulations={beforeTabulations}
                    icon={ShieldQuestion}
                    title="ANTES da Confirmacao"
                    subtitle="Cliente NAO confirmou CPF/dados"
                    accentColor="text-amber-600 dark:text-amber-400"
                    borderColor="border-amber-300 dark:border-amber-800"
                    bgColor="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40"
                    iconBg="bg-amber-100 dark:bg-amber-900/50"
                  />
                )}

                {/* Coluna: Depois da confirmacao de CPF */}
                {(activeCategory === "all" || activeCategory === "after") && (
                  <CategorySection
                    type="after"
                    tabulations={afterTabulations}
                    icon={ShieldCheck}
                    title="DEPOIS da Confirmacao"
                    subtitle="Cliente JA confirmou CPF/dados"
                    accentColor="text-emerald-600 dark:text-emerald-400"
                    borderColor="border-emerald-300 dark:border-emerald-800"
                    bgColor="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40"
                    iconBg="bg-emerald-100 dark:bg-emerald-900/50"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer com legenda */}
        <div className="px-5 py-3 border-t bg-card flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Antes do CPF</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Depois do CPF</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span>{filteredTabulations.length} tabulacoes disponiveis</span>
          </div>
        </div>
      </DialogContent>

      {/* Modal de descricao da tabulacao - Visual melhorado */}
      {selectedTabulation && (
        <Dialog open={!!selectedTabulation} onOpenChange={() => setSelectedTabulation(null)}>
          <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
            {/* Header com cor da categoria */}
            <div 
              className={cn(
                "px-6 py-5",
                selectedTabulation.category === "before" 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500" 
                  : "bg-gradient-to-r from-emerald-500 to-green-500"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm flex-shrink-0">
                  <div
                    className="w-4 h-4 rounded-full ring-2 ring-white/50"
                    style={{ backgroundColor: selectedTabulation.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-white/80 uppercase tracking-wide">
                    {selectedTabulation.category === "before" ? "Antes do CPF" : "Depois do CPF"}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1 leading-snug">
                    {selectedTabulation.name}
                  </h3>
                </div>
              </div>
            </div>
            
            {/* Conteudo da descricao */}
            <div className="px-6 py-6">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg flex-shrink-0",
                  selectedTabulation.category === "before"
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-emerald-100 dark:bg-emerald-900/30"
                )}>
                  <Info className={cn(
                    "h-5 w-5",
                    selectedTabulation.category === "before"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    Descricao
                  </h4>
                  <p className="text-base text-foreground leading-relaxed">
                    {selectedTabulation.description || "Esta tabulacao nao possui descricao."}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t bg-muted/30 flex justify-end">
              <Button 
                onClick={() => setSelectedTabulation(null)}
                className={cn(
                  "px-6",
                  selectedTabulation.category === "before"
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                )}
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
