"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, Tags, ZoomIn, ZoomOut, ShieldCheck, ShieldQuestion, CheckCircle2, Eye, EyeOff, Info, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
          "rounded-xl border bg-card hover:shadow-lg transition-all duration-300 group overflow-hidden cursor-pointer",
          isBefore 
            ? "border-amber-200 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-amber-500/10" 
            : "border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-emerald-500/10"
        )}
        onClick={() => setSelectedTabulation(tabulation)}
      >
        {/* Barra colorida no topo */}
        <div className={cn(
          "h-1 transition-opacity",
          isBefore 
            ? "bg-gradient-to-r from-amber-400 to-orange-400 opacity-60 group-hover:opacity-100" 
            : "bg-gradient-to-r from-emerald-400 to-green-400 opacity-60 group-hover:opacity-100"
        )} />
        
        <div className={cn(
          "flex items-start gap-3 p-4",
          isBefore ? "bg-amber-50/30 dark:bg-amber-950/10" : "bg-emerald-50/30 dark:bg-emerald-950/10"
        )}>
          <div className={cn(
            "p-2 rounded-lg shrink-0 transition-all duration-300 group-hover:scale-110",
            isBefore 
              ? "bg-amber-100 dark:bg-amber-900/40 group-hover:bg-amber-500 group-hover:shadow-lg" 
              : "bg-emerald-100 dark:bg-emerald-900/40 group-hover:bg-emerald-500 group-hover:shadow-lg"
          )}>
            {isBefore 
              ? <ShieldQuestion className="h-4 w-4 text-amber-600 dark:text-amber-400 group-hover:text-white transition-colors" />
              : <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                "font-semibold text-foreground leading-tight transition-colors",
                isBefore ? "group-hover:text-amber-600 dark:group-hover:text-amber-400" : "group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
              )}
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
            {/* Footer mini */}
            <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-1.5 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="h-3 w-3" />
              <span>Ver detalhes</span>
            </div>
          </div>
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
      <DialogContent className="!max-w-6xl w-[95vw] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:z-50 border-0 shadow-2xl rounded-2xl">
        {/* Header com gradiente azul */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 text-white relative overflow-hidden">
          {/* Pattern decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/20" />
            <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/20" />
            <div className="absolute right-1/3 top-1/2 w-24 h-24 rounded-full bg-white/10" />
          </div>
          
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <Tags className="h-6 w-6" />
              </div>
              <div>
                <span className="block">Tabulacoes</span>
                <span className="text-sm font-normal text-blue-100">Selecione de acordo com o momento do atendimento</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {/* Barra de busca e controles */}
          <div className="flex items-center gap-3 mt-5 relative z-10">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-200" />
              <Input
                placeholder="Buscar tabulacao por nome ou descricao..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-white/15 backdrop-blur-sm border-white/20 text-white placeholder:text-blue-200 focus-visible:ring-white/30 rounded-xl"
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

        {/* Filtros por categoria */}
        <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-200/50 dark:border-blue-800/50 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Filtrar:</span>
          <div className="flex gap-2">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("all")}
              className={cn(
                "h-8 text-xs font-medium",
                activeCategory === "all" && "bg-blue-500 hover:bg-blue-600"
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
                className="text-xs h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
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
        <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-b from-muted/20 to-background">
          <div className="p-6">
            {tabulations.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Tags className="h-10 w-10 text-blue-500" />
                </div>
                <p className="font-semibold text-foreground text-lg">Nenhuma tabulacao cadastrada</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Entre em contato com o administrador
                </p>
              </div>
            ) : filteredTabulations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">Nenhum resultado encontrado</p>
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
        <div className="px-6 py-3 border-t border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
              <span className="font-medium text-amber-700 dark:text-amber-300">Antes do CPF</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
              <span className="font-medium text-emerald-700 dark:text-emerald-300">Depois do CPF</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-medium text-blue-700 dark:text-blue-300">{filteredTabulations.length} tabulacoes disponiveis</span>
          </div>
        </div>
      </DialogContent>

      {/* Modal de descricao da tabulacao - Visual melhorado */}
      {selectedTabulation && (
        <Dialog open={!!selectedTabulation} onOpenChange={() => setSelectedTabulation(null)}>
          <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
            {/* Header com cor da categoria */}
            <div
              className={cn(
                "px-6 py-6 relative overflow-hidden",
                selectedTabulation.category === "before" 
                  ? "bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600" 
                  : "bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600"
              )}
            >
              {/* Pattern decorativo */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
                <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-white/20" />
              </div>
              
              <div className="flex items-start gap-4 relative z-10">
                <div className={cn(
                  "p-3 rounded-xl backdrop-blur-sm flex-shrink-0 shadow-lg",
                  selectedTabulation.category === "before" ? "bg-amber-400/30" : "bg-emerald-400/30"
                )}>
                  {selectedTabulation.category === "before" 
                    ? <ShieldQuestion className="h-6 w-6 text-white" />
                    : <ShieldCheck className="h-6 w-6 text-white" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <Badge className="mb-2 text-xs font-medium bg-white/20 text-white border-0">
                    {selectedTabulation.category === "before" ? "Antes do CPF" : "Depois do CPF"}
                  </Badge>
                  <h3 className="text-xl font-bold text-white leading-snug">
                    {selectedTabulation.name}
                  </h3>
                </div>
              </div>
            </div>
            
            {/* Conteudo da descricao */}
            <div className="px-6 py-6 bg-gradient-to-b from-muted/30 to-background">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2.5 rounded-xl flex-shrink-0",
                  selectedTabulation.category === "before"
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-emerald-100 dark:bg-emerald-900/30"
                )}>
                  <Eye className={cn(
                    "h-5 w-5",
                    selectedTabulation.category === "before"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    Orientacoes
                  </h4>
                  <div className={cn(
                    "p-4 rounded-xl border",
                    selectedTabulation.category === "before"
                      ? "bg-white dark:bg-card border-amber-200/50 dark:border-amber-800/50"
                      : "bg-white dark:bg-card border-emerald-200/50 dark:border-emerald-800/50"
                  )}>
                    <p className="text-foreground leading-relaxed">
                      {selectedTabulation.description || "Esta tabulacao nao possui descricao."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end">
              <Button 
                onClick={() => setSelectedTabulation(null)}
                className={cn(
                  "px-6 shadow-md",
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
