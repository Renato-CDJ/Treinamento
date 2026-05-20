"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useCachedSituations } from "@/hooks/use-cached-data"
import { Search, AlertCircle, ZoomIn, ZoomOut, Eye } from "lucide-react"

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
      <DialogContent className="max-w-2xl w-[90vw] h-auto max-h-[80vh] p-0 gap-0 flex flex-col overflow-hidden border-border bg-card">
        {/* Header com gradiente laranja */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white shrink-0">
          <DialogHeader>
            <div className="flex items-start gap-4 min-w-0">
              <div className="p-2.5 bg-white/20 rounded-xl shrink-0">
                <AlertCircle className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-bold text-white break-words leading-tight">
                  {situation.name}
                </DialogTitle>
                <DialogDescription className="text-orange-100 mt-1 text-sm">
                  Detalhes da situacao
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Conteudo com scroll nativo */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-5">
            {situation.description ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  Descricao / Orientacoes
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm break-words">
                    {situation.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <AlertCircle className="h-7 w-7 text-orange-500" />
                </div>
                <p className="font-medium text-muted-foreground">Nenhuma descricao disponivel</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Esta situacao nao possui orientacoes detalhadas
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

// Componente individual de situacao
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
    <div 
      className="group cursor-pointer p-4 rounded-lg border border-border hover:border-orange-300 hover:bg-orange-50/50 dark:hover:border-orange-700 dark:hover:bg-orange-950/20 transition-all bg-card"
      onClick={() => onViewDetails(situation)}
    >
      {/* Titulo da situacao */}
      <h3 
        className="font-bold text-orange-500 group-hover:text-orange-600 transition-colors"
        style={{ fontSize: `${globalZoom * 0.95}%` }}
      >
        {situation.name}
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
      <DialogContent className="!max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col border-border bg-card overflow-hidden [&>button]:z-50">
        {/* Header com gradiente laranja */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertCircle className="h-6 w-6" />
              </div>
              Situacoes
            </DialogTitle>
            <DialogDescription className="text-orange-100 mt-2">
              Consulte as orientacoes para cada tipo de situacao
            </DialogDescription>
          </DialogHeader>
          
          {/* Barra de busca e controles */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-200" />
              <Input
                placeholder="Buscar situacao..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
            {filteredSituations.length} {filteredSituations.length === 1 ? "situacao encontrada" : "situacoes encontradas"}
          </span>
          {search && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearch("")}
              className="text-xs h-7"
            >
              Limpar busca
            </Button>
          )}
        </div>

        {/* Conteudo em duas colunas */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            {filteredSituations.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">Nenhuma situacao encontrada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search ? "Tente buscar por outro termo" : "Nenhuma situacao disponivel no momento"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Coluna Esquerda */}
                <div className="space-y-6">
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
                <div className="space-y-6">
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
