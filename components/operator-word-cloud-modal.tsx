"use client"

import { useState, useMemo, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Cloud, Search, X, ArrowLeft, LayoutGrid, List } from "lucide-react"
import { useWordCloud } from "@/hooks/use-supabase-admin"

interface OperatorWordCloudModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OperatorWordCloudModal({ open, onOpenChange }: OperatorWordCloudModalProps) {
  const { data: words, loading } = useWordCloud()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWord, setSelectedWord] = useState<{ word: string; description: string } | null>(null)
  const [viewMode, setViewMode] = useState<"cloud" | "list">("cloud")

  const activeWords = useMemo(() => 
    (words || []).filter((w: any) => w.is_active !== false),
    [words]
  )

  const filteredWords = useMemo(() => {
    if (!searchTerm) return activeWords
    const term = searchTerm.toLowerCase()
    return activeWords.filter((w: any) => 
      w.word.toLowerCase().includes(term)
    )
  }, [activeWords, searchTerm])

  const handleWordClick = useCallback((word: any) => {
    setSelectedWord({ word: word.word, description: word.description || "Sem descricao disponivel." })
  }, [])

  const handleBackToCloud = useCallback(() => {
    setSelectedWord(null)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedWord(null)
    setSearchTerm("")
    onOpenChange(false)
  }, [onOpenChange])

  // Generate random but consistent sizes and colors for words - using Roteiro theme colors
  const getWordStyle = useCallback((word: string, index: number) => {
    // Sizes varying from small to very large
    const sizes = [
      "text-xs",      // pequeno
      "text-sm",      // pequeno
      "text-base",    // medio
      "text-lg",      // medio
      "text-xl",      // grande
      "text-2xl",     // grande
      "text-3xl",     // muito grande
      "text-4xl",     // muito grande
    ]
    
    // Orange/amber color palette matching Roteiro theme
    const colors = [
      "text-orange-500",   // laranja medio
      "text-amber-400",    // amber claro
      "text-orange-400",   // laranja claro
      "text-amber-500",    // amber medio
      "text-orange-300",   // laranja bem claro
      "text-amber-300",    // amber bem claro
    ]
    
    // Use word characteristics for pseudo-random but consistent selection
    const charSum = word.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
    const sizeIndex = (charSum + index * 3) % sizes.length
    const colorIndex = (word.charCodeAt(0) + word.length + index) % colors.length
    
    return {
      size: sizes[sizeIndex],
      color: colors[colorIndex]
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-6xl w-[95vw] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:z-50">
        {/* Header com gradiente laranja */}
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 p-5 text-white flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Cloud className="h-5 w-5" />
              </div>
              Dúvidas
            </DialogTitle>
          </DialogHeader>
        </div>

        {selectedWord ? (
          // Detail View
          <div className="flex-1 overflow-auto space-y-4 p-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCloud}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para a nuvem
            </Button>
            
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                      <span className="text-2xl font-bold text-primary">
                        {selectedWord.word.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">
                      {selectedWord.word}
                    </h3>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Descricao</h4>
                    <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                      {selectedWord.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Cloud View
          <div className="flex-1 overflow-hidden flex flex-col space-y-4 p-5">
            {/* Search and View Toggle */}
            <div className="flex gap-3 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar palavras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <Button
                  variant={viewMode === "cloud" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cloud")}
                  className="gap-2 h-8"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Nuvem</span>
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="gap-2 h-8"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Lista</span>
                </Button>
              </div>
            </div>

            {/* Word Cloud */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-4 border-muted" />
                    <div className="absolute inset-0 w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  </div>
                  <p className="text-sm text-muted-foreground">Carregando palavras...</p>
                </div>
              ) : filteredWords.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-3">
                    <Cloud className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {searchTerm ? `Nenhuma palavra encontrada para "${searchTerm}"` : "Nenhuma palavra disponivel"}
                  </p>
                </div>
              ) : viewMode === "cloud" ? (
                <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 md:p-12 h-full">
                  <div className="flex flex-wrap items-center justify-center content-center gap-x-8 gap-y-4 h-full">
                    {filteredWords.map((word: any, index: number) => {
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
              ) : (
                <div className="rounded-xl border border-border bg-card h-full overflow-auto">
                  <div className="divide-y divide-border">
                    {filteredWords.map((word: any, index: number) => (
                      <div
                        key={word.id}
                        onClick={() => handleWordClick(word)}
                        className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white font-bold text-lg flex-shrink-0">
                          {word.word.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{word.word}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {word.description || "Sem descrição disponível"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            {!loading && filteredWords.length > 0 && (
              <p className="text-xs text-center text-muted-foreground flex-shrink-0">
                Clique em uma palavra para ver sua descricao
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
