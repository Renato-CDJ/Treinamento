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

  const renderTabulationCard = (tabulation: TabulationDisplay) => {
    const isBefore = tabulation.category === "before"
    
    return (
      <button
        key={tabulation.id}
        onClick={() => setSelectedTabulation(tabulation)}
        className={cn(
          "w-full text-left p-4 rounded-xl border transition-all duration-200 group",
          "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          isBefore 
            ? "bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 border-amber-200/60 dark:border-amber-800/40 hover:border-amber-300 dark:hover:border-amber-700 focus:ring-amber-400" 
            : "bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10 border-emerald-200/60 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-700 focus:ring-emerald-400"
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-3 h-3 rounded-full flex-shrink-0 mt-1 ring-2 transition-transform group-hover:scale-110",
              isBefore ? "ring-amber-200 dark:ring-amber-800" : "ring-emerald-200 dark:ring-emerald-800"
            )}
            style={{ backgroundColor: tabulation.color }}
          />
          <div className="flex-1 min-w-0">
            <h4
              className="font-semibold text-foreground leading-tight group-hover:text-foreground/80 transition-colors"
              style={{ fontSize: `${globalZoom}%` }}
            >
              {tabulation.name}
            </h4>
            {showDescriptions && tabulation.description && (
              <p
                className="text-muted-foreground leading-relaxed mt-1.5 line-clamp-2"
                style={{ fontSize: `${Math.round(globalZoom * 0.85)}%` }}
              >
                {tabulation.description}
              </p>
            )}
          </div>
          <div className={cn(
            "p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all",
            isBefore ? "bg-amber-100 dark:bg-amber-900/40" : "bg-emerald-100 dark:bg-emerald-900/40"
          )}>
            <Info className={cn(
              "h-4 w-4",
              isBefore ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
            )} />
          </div>
        </div>
      </button>
    )
  }

  const CategorySection = ({ 
    type, 
    tabulations, 
    icon: Icon, 
    title, 
    subtitle
  }: { 
    type: "before" | "after"
    tabulations: TabulationDisplay[]
    icon: typeof ShieldQuestion
    title: string
    subtitle: string
  }) => {
    const isBefore = type === "before"
    
    return (
      <div className={cn(
        "rounded-2xl border overflow-hidden",
        isBefore 
          ? "bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/10 border-amber-200/50 dark:border-amber-800/30" 
          : "bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/10 border-emerald-200/50 dark:border-emerald-800/30"
      )}>
        {/* Header da secao */}
        <div className={cn(
          "flex items-center justify-between p-4",
          isBefore 
            ? "bg-gradient-to-r from-amber-100/80 to-amber-50/40 dark:from-amber-900/30 dark:to-amber-950/20" 
            : "bg-gradient-to-r from-emerald-100/80 to-emerald-50/40 dark:from-emerald-900/30 dark:to-emerald-950/20"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl shadow-sm",
              isBefore 
                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" 
                : "bg-gradient-to-br from-emerald-400 to-teal-500 text-white"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground tracking-tight">{title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-sm shadow-sm",
            isBefore 
              ? "bg-amber-500 text-white" 
              : "bg-emerald-500 text-white"
          )}>
            <span>{tabulations.length}</span>
            <span className="text-xs opacity-80">itens</span>
          </div>
        </div>
        
        {/* Lista de tabulacoes */}
        <div className="p-3">
          {tabulations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div className={cn(
                "w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center",
                isBefore ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"
              )}>
                <Search className={cn(
                  "h-5 w-5",
                  isBefore ? "text-amber-500" : "text-emerald-500"
                )} />
              </div>
              <p className="text-sm font-medium">Nenhuma tabulacao encontrada</p>
              <p className="text-xs mt-1 opacity-70">Tente ajustar sua busca</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {tabulations.map((t) => renderTabulationCard(t))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl w-[95vw] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl [&>button]:z-50">
        {/* Header elegante */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white overflow-hidden">
          {/* Decoracao de fundo */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-4 text-white">
                <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
                  <Tags className="h-6 w-6" />
                </div>
                <div>
                  <span className="block">Tabulacoes Disponiveis</span>
                  <span className="text-sm font-normal text-slate-400 mt-1 block">
                    Selecione de acordo com o momento do atendimento
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {/* Barra de busca */}
            <div className="flex items-center gap-3 mt-5">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar tabulacao por nome ou descricao..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-amber-400/50 focus-visible:border-amber-400/50 rounded-xl"
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

        {/* Filtros por categoria */}
        <div className="px-6 py-4 border-b bg-muted/30 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Categoria:</span>
            <div className="flex gap-1.5 p-1 bg-muted rounded-xl">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory("all")}
                className={cn(
                  "h-8 px-4 rounded-lg text-xs font-semibold transition-all",
                  activeCategory === "all" 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Todas ({totalBefore + totalAfter})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory("before")}
                className={cn(
                  "h-8 px-4 rounded-lg text-xs font-semibold gap-1.5 transition-all",
                  activeCategory === "before" 
                    ? "bg-amber-500 text-white shadow-sm hover:bg-amber-500" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ShieldQuestion className="h-3.5 w-3.5" />
                Antes ({totalBefore})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory("after")}
                className={cn(
                  "h-8 px-4 rounded-lg text-xs font-semibold gap-1.5 transition-all",
                  activeCategory === "after" 
                    ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-500" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Depois ({totalAfter})
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
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
            <Button
              variant={showDescriptions ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowDescriptions(!showDescriptions)}
              className="h-8 text-xs font-medium gap-1.5 rounded-lg"
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
        <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-b from-background to-muted/20">
          <div className="p-6">
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
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer com legenda */}
        <div className="px-6 py-4 border-t bg-gradient-to-r from-muted/50 to-muted/30 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm" />
              <span className="font-medium">Antes da Confirmacao</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm" />
              <span className="font-medium">Apos Confirmacao</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{filteredTabulations.length} tabulacoes</span>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Modal de descricao da tabulacao - Elegante */}
      {selectedTabulation && (
        <Dialog open={!!selectedTabulation} onOpenChange={() => setSelectedTabulation(null)}>
          <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
            {/* Header com gradiente sutil */}
            <div 
              className={cn(
                "relative px-6 pt-8 pb-6",
                selectedTabulation.category === "before" 
                  ? "bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600" 
                  : "bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600"
              )}
            >
              {/* Decoracao de fundo */}
              <div className="absolute inset-0 overflow-hidden">
                <div className={cn(
                  "absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-30",
                  selectedTabulation.category === "before" ? "bg-yellow-300" : "bg-teal-300"
                )} />
                <div className={cn(
                  "absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-20",
                  selectedTabulation.category === "before" ? "bg-orange-300" : "bg-emerald-300"
                )} />
              </div>
              
              <div className="relative">
                {/* Badge de categoria */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm mb-4">
                  <div
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-white/50"
                    style={{ backgroundColor: selectedTabulation.color }}
                  />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    {selectedTabulation.category === "before" ? "Antes da Confirmacao" : "Apos Confirmacao"}
                  </span>
                </div>
                
                {/* Titulo */}
                <h3 className="text-xl font-bold text-white leading-tight pr-8">
                  {selectedTabulation.name}
                </h3>
              </div>
            </div>
            
            {/* Conteudo */}
            <div className="px-6 py-6 bg-card">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-3 rounded-xl flex-shrink-0",
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
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Descricao
                  </h4>
                  <p className="text-foreground leading-relaxed">
                    {selectedTabulation.description || "Esta tabulacao nao possui descricao detalhada."}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className={cn(
                  "h-4 w-4",
                  selectedTabulation.category === "before" ? "text-amber-500" : "text-emerald-500"
                )} />
                <span>Clique fora para fechar</span>
              </div>
              <Button 
                onClick={() => setSelectedTabulation(null)}
                className={cn(
                  "px-6 rounded-xl font-semibold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5",
                  selectedTabulation.category === "before"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                )}
              >
                Entendi
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
