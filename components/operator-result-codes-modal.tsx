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
    return (
      <div
        key={tabulation.id}
        className="flex items-start gap-3 py-2.5 px-3 rounded-md hover:bg-muted/50 transition-colors group"
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
          style={{ backgroundColor: tabulation.color }}
        />
        <div className="flex-1 min-w-0">
          <h4
            className="font-medium text-foreground leading-tight"
            style={{ fontSize: `${globalZoom}%` }}
          >
            {tabulation.name}
          </h4>
          {showDescriptions && tabulation.description && (
            <p
              className="text-muted-foreground leading-relaxed mt-0.5 text-sm"
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
            className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setSelectedTabulation(tabulation)}
            title="Ver descricao"
          >
            <Info className="h-4 w-4" />
          </Button>
        )}
      </div>
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
      <div className="rounded-lg border bg-card">
        {/* Header da secao */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isBefore ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"
            )}>
              <Icon className={cn(
                "h-5 w-5",
                isBefore ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <span className={cn(
            "text-sm font-medium px-2.5 py-1 rounded-full",
            isBefore 
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          )}>
            {tabulations.length}
          </span>
        </div>
        
        {/* Lista de tabulacoes */}
        <div className="p-2">
          {tabulations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-5 w-5 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma tabulacao encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {tabulations.map((t) => renderTabulationCard(t))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl w-[95vw] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:z-50">
        {/* Header compacto */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-5 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-3 text-white">
              <div className="p-2 bg-white/10 rounded-lg">
                <Tags className="h-5 w-5" />
              </div>
              Tabulacoes Disponiveis
            </DialogTitle>
            <DialogDescription className="text-slate-300 mt-1 text-sm">
              Selecione a tabulacao correta de acordo com o momento do atendimento
            </DialogDescription>
          </DialogHeader>
          
          {/* Barra de busca e controles */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar tabulacao por nome ou descricao..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus-visible:ring-white/30 h-10"
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

        {/* Filtros por categoria */}
        <div className="px-5 py-3 border-b flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Filtrar:</span>
          <div className="flex gap-2">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("all")}
              className="h-8 text-xs font-medium"
            >
              Todas ({totalBefore + totalAfter})
            </Button>
            <Button
              variant={activeCategory === "before" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("before")}
              className={cn(
                "h-8 text-xs font-medium gap-1.5",
                activeCategory === "before" && "bg-amber-500 hover:bg-amber-600 text-white"
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
                activeCategory === "after" && "bg-emerald-500 hover:bg-emerald-600 text-white"
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
        <div className="flex-1 min-h-0 overflow-y-auto bg-muted/20">
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

      {/* Modal de descricao da tabulacao */}
      {selectedTabulation && (
        <Dialog open={!!selectedTabulation} onOpenChange={() => setSelectedTabulation(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedTabulation.color }}
                />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {selectedTabulation.category === "before" ? "Antes do CPF" : "Depois do CPF"}
                </span>
              </div>
              <DialogTitle className="text-lg">
                {selectedTabulation.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-2">
              <p className="text-muted-foreground leading-relaxed">
                {selectedTabulation.description || "Esta tabulacao nao possui descricao."}
              </p>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline"
                onClick={() => setSelectedTabulation(null)}
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
