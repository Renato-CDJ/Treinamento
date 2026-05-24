"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useCachedSituations } from "@/hooks/use-cached-data"
import { Search, AlertCircle, ZoomIn, ZoomOut, Eye, Info, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface OperatorSituationsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SituationData {
  id: string
  name: string
  description?: string
  color?: string
}

// Modal de detalhes da situacao individual - Design elegante
const SituationDetailModal = memo(function SituationDetailModal({
  situation,
  open,
  onClose,
}: {
  situation: SituationData | null
  open: boolean
  onClose: () => void
}) {
  if (!situation) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        {/* Header com gradiente */}
        <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600">
          {/* Decoracao de fundo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-30 bg-yellow-300" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-20 bg-orange-300" />
          </div>
          
          <div className="relative">
            {/* Badge de categoria */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <AlertCircle className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Situacao
              </span>
            </div>
            
            {/* Titulo */}
            <h3 className="text-xl font-bold text-white leading-tight pr-8">
              {situation.name}
            </h3>
          </div>
        </div>
        
        {/* Conteudo */}
        <div className="px-6 py-6 bg-card">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl flex-shrink-0 bg-orange-100 dark:bg-orange-900/30">
              <Info className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Descricao / Orientacoes
              </h4>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {situation.description || "Esta situacao nao possui orientacoes detalhadas."}
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-orange-500" />
            <span>Clique fora para fechar</span>
          </div>
          <Button 
            onClick={onClose}
            className="px-6 rounded-xl font-semibold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})

// Componente individual de situacao - Design elegante
const SituationItem = memo(function SituationItem({
  situation,
  globalZoom,
  onViewDetails,
}: {
  situation: SituationData
  globalZoom: number
  onViewDetails: (situation: SituationData) => void
}) {
  // Truncar descricao para preview
  const truncatedDescription = useMemo(() => {
    if (!situation.description) return ""
    const maxLength = 100
    const text = situation.description.replace(/\n/g, " ").trim()
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + "..."
  }, [situation.description])

  return (
    <button
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all duration-200 group",
        "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400",
        "bg-gradient-to-br from-orange-50/80 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/10",
        "border-orange-200/60 dark:border-orange-800/40 hover:border-orange-300 dark:hover:border-orange-700"
      )}
      onClick={() => onViewDetails(situation)}
    >
      <div className="flex items-start gap-3">
        <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1 ring-2 ring-orange-200 dark:ring-orange-800 transition-transform group-hover:scale-110 bg-orange-500" />
        <div className="flex-1 min-w-0">
          <h3 
            className="font-semibold text-foreground group-hover:text-foreground/80 transition-colors leading-tight"
            style={{ fontSize: `${globalZoom * 0.95}%` }}
          >
            {situation.name}
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
        <div className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all bg-orange-100 dark:bg-orange-900/40">
          <Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </div>
      </div>
    </button>
  )
})

export const OperatorSituationsModal = memo(function OperatorSituationsModal({
  open,
  onOpenChange,
}: OperatorSituationsModalProps) {
  const [search, setSearch] = useState("")
  const [globalZoom, setGlobalZoom] = useState(100)
  const [selectedSituation, setSelectedSituation] = useState<SituationData | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { situations: situationsRaw } = useCachedSituations()

  const situations = useMemo<SituationData[]>(() => 
    situationsRaw
      .filter((s: any) => s.is_active !== false)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || "",
        color: s.color || "#f97316",
      }))
  , [situationsRaw])

  const filteredSituations = useMemo(() => {
    if (!search.trim()) return situations
    const query = search.toLowerCase()
    return situations.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    )
  }, [situations, search])

  // Dividir em duas colunas
  const { leftColumn, rightColumn } = useMemo(() => {
    const mid = Math.ceil(filteredSituations.length / 2)
    return {
      leftColumn: filteredSituations.slice(0, mid),
      rightColumn: filteredSituations.slice(mid),
    }
  }, [filteredSituations])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setSearch("")
  }, [onOpenChange])

  const handleSituationClick = useCallback((situation: SituationData) => {
    setSelectedSituation(situation)
    setShowDetailModal(true)
  }, [])

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false)
    setSelectedSituation(null)
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl border-0 shadow-2xl [&>button]:z-50">
        {/* Header elegante */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white overflow-hidden flex-shrink-0">
          {/* Decoracao de fundo */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-4 text-white">
                <div className="p-3 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl shadow-lg">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <span className="block">Situacoes</span>
                  <span className="text-sm font-normal text-slate-400 mt-1 block">
                    Consulte as orientacoes para cada tipo de situacao
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {/* Barra de busca */}
            <div className="flex items-center gap-3 mt-5">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar situacao por nome ou descricao..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-orange-400/50 focus-visible:border-orange-400/50 rounded-xl"
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-semibold text-sm">
              <span>{filteredSituations.length}</span>
              <span className="text-xs opacity-80">itens</span>
            </div>
          </div>
          {search && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearch("")}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              Limpar busca
            </Button>
          )}
        </div>

        {/* Conteudo em duas colunas */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 bg-gradient-to-b from-background to-muted/20">
            {filteredSituations.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>
                <p className="font-medium text-foreground">Nenhuma situacao encontrada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search ? "Tente buscar por outro termo" : "Nenhuma situacao disponivel no momento"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coluna Esquerda */}
                <div className="space-y-3">
                  {leftColumn.map((situation) => (
                    <SituationItem
                      key={situation.id}
                      situation={situation}
                      globalZoom={globalZoom}
                      onViewDetails={handleSituationClick}
                    />
                  ))}
                </div>
                
                {/* Coluna Direita */}
                <div className="space-y-3">
                  {rightColumn.map((situation) => (
                    <SituationItem
                      key={situation.id}
                      situation={situation}
                      globalZoom={globalZoom}
                      onViewDetails={handleSituationClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>

      {/* Modal de detalhes da situacao */}
      <SituationDetailModal
        situation={selectedSituation}
        open={showDetailModal}
        onClose={handleCloseDetailModal}
      />
    </Dialog>
  )
})
