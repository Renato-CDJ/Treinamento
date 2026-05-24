"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCachedSituations } from "@/hooks/use-cached-data"
import { cn } from "@/lib/utils"
import { Search, AlertCircle, ZoomIn, ZoomOut, Eye, ChevronRight, Sparkles, AlertTriangle, BookOpen } from "lucide-react"

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

// Modal de detalhes da situacao individual
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
      <DialogContent className="max-w-2xl w-[90vw] h-auto max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden border-0 bg-card shadow-2xl rounded-2xl">
        {/* Header com gradiente amber */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 p-6 text-white shrink-0 relative overflow-hidden">
          {/* Pattern decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
            <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/20" />
          </div>
          
          <DialogHeader className="relative z-10">
            <div className="flex items-start gap-4 min-w-0">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shrink-0 shadow-lg">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <Badge className="mb-2 text-xs font-medium bg-white/20 text-white border-0">
                  Situacao Especial
                </Badge>
                <DialogTitle className="text-xl font-bold text-white break-words leading-tight">
                  {situation.name}
                </DialogTitle>
                <DialogDescription className="text-amber-100 mt-1 text-sm flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Orientacoes para atendimento
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Conteudo com scroll nativo */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-gradient-to-b from-muted/30 to-background">
          <div className="p-6">
            {situation.description ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  Como proceder
                </div>
                <div className="bg-white dark:bg-card rounded-xl p-5 border border-amber-200/50 dark:border-amber-800/50 shadow-sm">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm break-words">
                    {situation.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                </div>
                <p className="font-semibold text-foreground">Nenhuma descricao disponivel</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta situacao nao possui orientacoes detalhadas
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer fixo */}
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end shrink-0">
          <Button onClick={onClose} className="bg-amber-500 hover:bg-amber-600 text-white shadow-md px-6">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})

// Componente individual de situacao - Design de Card Moderno
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
    const maxLength = 120
    const text = situation.description.replace(/\n/g, " ").trim()
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + "..."
  }, [situation.description])

  return (
    <div 
      className="group cursor-pointer rounded-xl border border-border bg-card hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 overflow-hidden"
      onClick={() => onViewDetails(situation)}
    >
      {/* Barra superior colorida */}
      <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-60 group-hover:opacity-100 transition-opacity" />
      
      <div className="p-4">
        {/* Header do card */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2.5 rounded-xl shrink-0 transition-all duration-300 group-hover:scale-110",
            "bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-500 group-hover:shadow-lg"
          )}>
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 group-hover:text-white transition-colors" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 
              className="font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight line-clamp-2"
              style={{ fontSize: `${globalZoom * 0.9}%` }}
            >
              {situation.name}
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
          <div className="h-2 w-2 rounded-full bg-amber-500 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity" />
        </div>
      </div>
    </div>
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
      <DialogContent className="!max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col border-0 bg-card overflow-hidden [&>button]:z-50 shadow-2xl rounded-2xl">
        {/* Header com gradiente amber */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 p-6 text-white flex-shrink-0 relative overflow-hidden">
          {/* Pattern decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/20" />
            <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/20" />
            <div className="absolute right-1/3 top-1/2 w-24 h-24 rounded-full bg-white/10" />
          </div>
          
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <span className="block">Situacoes Especiais</span>
                <span className="text-sm font-normal text-amber-100">Orientacoes para casos especificos</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {/* Barra de busca e controles */}
          <div className="flex items-center gap-3 mt-5 relative z-10">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-200" />
              <Input
                placeholder="Buscar situacao por nome ou descricao..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-white/15 backdrop-blur-sm border-white/20 text-white placeholder:text-amber-200 focus-visible:ring-white/30 rounded-xl"
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
        <div className="px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-amber-200/50 dark:border-amber-800/50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {filteredSituations.length} {filteredSituations.length === 1 ? "situacao disponivel" : "situacoes disponiveis"}
            </span>
          </div>
          {search && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearch("")}
              className="text-xs h-7 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/30"
            >
              Limpar busca
            </Button>
          )}
        </div>

        {/* Conteudo em duas colunas */}
        <ScrollArea className="flex-1 min-h-0 bg-gradient-to-b from-muted/20 to-background">
          <div className="p-6">
            {filteredSituations.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-10 w-10 text-amber-500" />
                </div>
                <p className="font-semibold text-foreground text-lg">Nenhuma situacao encontrada</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {search ? "Tente buscar por outro termo" : "Nenhuma situacao disponivel no momento"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Coluna Esquerda */}
                <div className="space-y-4">
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
                <div className="space-y-4">
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
