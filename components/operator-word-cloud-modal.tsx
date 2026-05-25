"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HelpCircle, Search, X, LayoutGrid, List, Info, CheckCircle2 } from "lucide-react"
import { useWordCloud } from "@/hooks/use-supabase-admin"
import { cn } from "@/lib/utils"

interface OperatorWordCloudModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface WordData {
  id: string
  word: string
  description: string
}

// Modal de detalhes da duvida - Design elegante
const WordDetailModal = memo(function WordDetailModal({
  word,
  open,
  onClose,
}: {
  word: WordData | null
  open: boolean
  onClose: () => void
}) {
  if (!word) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        {/* Header com gradiente */}
        <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-600">
          {/* Decoracao de fundo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-30 bg-violet-300" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-20 bg-indigo-300" />
          </div>
          
          <div className="relative">
            {/* Badge de categoria */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <HelpCircle className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Duvida
              </span>
            </div>
            
            {/* Titulo */}
            <h3 className="text-xl font-bold text-white leading-tight pr-8">
              {word.word}
            </h3>
          </div>
        </div>
        
        {/* Conteudo */}
        <div className="px-6 py-6 bg-card">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30">
              <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Descricao / Orientacoes
              </h4>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {word.description || "Esta duvida nao possui orientacoes detalhadas."}
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-indigo-500" />
            <span>Clique fora para fechar</span>
          </div>
          <Button 
            onClick={onClose}
            className="px-6 rounded-xl font-semibold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white"
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})

// Componente individual de duvida - Design elegante
const WordItem = memo(function WordItem({
  word,
  onViewDetails,
}: {
  word: WordData
  onViewDetails: (word: WordData) => void
}) {
  // Truncar descricao para preview
  const truncatedDescription = useMemo(() => {
    if (!word.description) return ""
    const maxLength = 100
    const text = word.description.replace(/\n/g, " ").trim()
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + "..."
  }, [word.description])

  return (
    <button
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all duration-200 group",
        "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400",
        "bg-gradient-to-br from-indigo-50/80 to-violet-50/50 dark:from-indigo-950/20 dark:to-violet-950/10",
        "border-indigo-200/60 dark:border-indigo-800/40 hover:border-indigo-300 dark:hover:border-indigo-700"
      )}
      onClick={() => onViewDetails(word)}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 transition-transform group-hover:scale-110">
          <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-foreground/80 transition-colors leading-tight">
            {word.word}
          </h3>
          
          {truncatedDescription && (
            <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm">
              {truncatedDescription}
            </p>
          )}
        </div>
        <div className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all bg-indigo-100 dark:bg-indigo-900/40">
          <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
    </button>
  )
})

export function OperatorWordCloudModal({ open, onOpenChange }: OperatorWordCloudModalProps) {
  const { data: words, loading } = useWordCloud()
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"cloud" | "list">("list")
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const activeWords = useMemo(() => 
    (words || []).filter((w: any) => w.is_active !== false).map((w: any) => ({
      id: w.id,
      word: w.word,
      description: w.description || ""
    })),
    [words]
  )

  const filteredWords = useMemo(() => {
    if (!searchTerm) return activeWords
    const term = searchTerm.toLowerCase()
    return activeWords.filter((w: WordData) => 
      w.word.toLowerCase().includes(term) ||
      w.description.toLowerCase().includes(term)
    )
  }, [activeWords, searchTerm])

  // Dividir em duas colunas
  const { leftColumn, rightColumn } = useMemo(() => {
    const mid = Math.ceil(filteredWords.length / 2)
    return {
      leftColumn: filteredWords.slice(0, mid),
      rightColumn: filteredWords.slice(mid),
    }
  }, [filteredWords])

  const handleWordClick = useCallback((word: WordData) => {
    setSelectedWord(word)
    setShowDetailModal(true)
  }, [])

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false)
    setSelectedWord(null)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedWord(null)
    setSearchTerm("")
    onOpenChange(false)
  }, [onOpenChange])

  // Generate random but consistent sizes and colors for words - using Indigo theme colors
  const getWordStyle = useCallback((word: string, index: number) => {
    const sizes = [
      "text-xs",
      "text-sm",
      "text-base",
      "text-lg",
      "text-xl",
      "text-2xl",
      "text-3xl",
      "text-4xl",
    ]
    
    const colors = [
      "text-indigo-500",
      "text-violet-400",
      "text-indigo-400",
      "text-violet-500",
      "text-indigo-300",
      "text-violet-300",
    ]
    
    const charSum = word.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
    const sizeIndex = (charSum + index * 3) % sizes.length
    const colorIndex = (word.charCodeAt(0) + word.length + index) % colors.length
    
    return {
      size: sizes[sizeIndex],
      color: colors[colorIndex]
    }
  }, [])

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="!max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl border-0 shadow-2xl [&>button]:z-50">
          {/* Header elegante */}
          <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white overflow-hidden flex-shrink-0">
            {/* Decoracao de fundo */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />
            </div>
            
            <div className="relative">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-4 text-white">
                  <div className="p-3 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-xl shadow-lg">
                    <HelpCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block">Duvidas</span>
                    <span className="text-sm font-normal text-slate-400 mt-1 block">
                      Consulte as duvidas frequentes e suas orientacoes
                    </span>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              {/* Barra de busca e controles */}
              <div className="flex items-center gap-3 mt-5">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar duvida por termo ou descricao..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-400/50 focus-visible:border-indigo-400/50 rounded-xl"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 p-1.5 bg-white/5 border border-white/10 rounded-xl">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "gap-2 h-9 rounded-lg",
                      viewMode === "list" 
                        ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">Lista</span>
                  </Button>
                  <Button
                    variant={viewMode === "cloud" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("cloud")}
                    className={cn(
                      "gap-2 h-9 rounded-lg",
                      viewMode === "cloud" 
                        ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline">Nuvem</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Resultados:</span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold text-sm">
                <span>{filteredWords.length}</span>
                <span className="text-xs opacity-80">duvidas</span>
              </div>
            </div>
            {searchTerm && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSearchTerm("")}
                className="text-xs h-8 text-muted-foreground hover:text-foreground"
              >
                Limpar busca
              </Button>
            )}
          </div>

          {/* Conteudo */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6 bg-gradient-to-b from-background to-muted/20">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-muted" />
                    <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                  </div>
                  <p className="text-muted-foreground mt-4">Carregando duvidas...</p>
                </div>
              ) : filteredWords.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <HelpCircle className="h-8 w-8 text-indigo-500" />
                  </div>
                  <p className="font-medium text-foreground">Nenhuma duvida encontrada</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm ? "Tente buscar por outro termo" : "Nenhuma duvida disponivel no momento"}
                  </p>
                </div>
              ) : viewMode === "list" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Coluna Esquerda */}
                  <div className="space-y-3">
                    {leftColumn.map((word) => (
                      <WordItem
                        key={word.id}
                        word={word}
                        onViewDetails={handleWordClick}
                      />
                    ))}
                  </div>
                  
                  {/* Coluna Direita */}
                  <div className="space-y-3">
                    {rightColumn.map((word) => (
                      <WordItem
                        key={word.id}
                        word={word}
                        onViewDetails={handleWordClick}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 md:p-12 min-h-[400px]">
                  <div className="flex flex-wrap items-center justify-center content-center gap-x-8 gap-y-4 h-full">
                    {filteredWords.map((word: WordData, index: number) => {
                      const style = getWordStyle(word.word, index)
                      return (
                        <span
                          key={word.id}
                          onClick={() => handleWordClick(word)}
                          className={`
                            ${style.size} ${style.color}
                            font-bold
                            transition-all duration-200
                            hover:scale-110 hover:brightness-125
                            cursor-pointer
                            select-none
                          `}
                        >
                          {word.word}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gradient-to-r from-muted/50 to-muted/30 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 shadow-sm" />
              <span className="font-medium">Clique em uma duvida para ver detalhes</span>
            </div>
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="rounded-xl"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes da duvida */}
      <WordDetailModal
        word={selectedWord}
        open={showDetailModal}
        onClose={handleCloseDetailModal}
      />
    </>
  )
}
