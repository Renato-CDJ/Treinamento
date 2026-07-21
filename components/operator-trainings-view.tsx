"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  BookOpen,
  FileText,
  Loader2,
  Eye,
  Download,
  Search,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react"

interface Training {
  id: string
  title: string
  filename: string
  url: string
  size: number
  uploadedAt: string
}

function formatFileSize(bytes: number) {
  if (!bytes || bytes === 0) return ""
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function OperatorTrainingsView() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selected, setSelected] = useState<Training | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const loadTrainings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/trainings")
      if (!res.ok) throw new Error("Erro ao carregar treinamentos")
      const data = await res.json()
      setTrainings(data.trainings || [])
    } catch (error) {
      console.error("[v0] Error loading trainings:", error)
      setTrainings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrainings()
  }, [loadTrainings])

  const encodePath = (p: string) => p.split("/").map(encodeURIComponent).join("/")

  const filteredTrainings = trainings.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.filename.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500/10 rounded-xl">
          <BookOpen className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Treinamentos</h2>
          <p className="text-sm text-muted-foreground">
            Materiais de capacitacao disponibilizados pela Qualidade
          </p>
        </div>
      </div>

      {/* Search */}
      {trainings.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar treinamentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-3" />
          <p className="text-sm">Carregando treinamentos...</p>
        </div>
      ) : filteredTrainings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="p-6 bg-muted rounded-full mb-4">
            <BookOpen className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {searchQuery ? "Nenhum resultado encontrado" : "Nenhum treinamento disponivel"}
          </h3>
          <p className="text-sm">
            {searchQuery
              ? "Tente pesquisar por outro termo"
              : "Novos materiais serao adicionados em breve"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredTrainings.map((training) => (
            <Card
              key={training.id}
              className="group hover:shadow-lg transition-all duration-200 border hover:border-orange-500/50"
            >
              <CardContent className="p-4 flex flex-col gap-4 h-full">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-3 bg-orange-500/10 rounded-lg">
                    <FileText className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base mb-1 line-clamp-2 capitalize">
                      {training.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        PDF
                      </Badge>
                      {training.size > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(training.size)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-auto">
                  <Button
                    onClick={() => {
                      setSelected(training)
                      setIsFullscreen(false)
                    }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="icon" asChild title="Baixar PDF">
                    <a href={encodePath(training.url)} download={training.filename}>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* PDF Viewer */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent
          className={
            isFullscreen
              ? "p-0 gap-0 !max-w-full !w-screen !h-screen"
              : "p-0 gap-0 !max-w-none !w-[95vw] !h-[95vh]"
          }
          showCloseButton={false}
        >
          <div className="flex flex-col h-full bg-background">
            {/* Viewer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-orange-500/10 to-transparent">
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3 bg-orange-500/20 rounded-xl shrink-0">
                  <FileText className="h-6 w-6 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg truncate capitalize">
                    {selected?.title}
                  </h3>
                  <Badge variant="outline" className="text-xs mt-1">
                    PDF
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selected && (
                  <Button variant="ghost" size="icon" asChild title="Baixar PDF" className="h-10 w-10">
                    <a href={encodePath(selected.url)} download={selected.filename}>
                      <Download className="h-5 w-5" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen((f) => !f)}
                  className="h-10 w-10 hover:bg-orange-500/10"
                  title={isFullscreen ? "Restaurar" : "Tela cheia"}
                >
                  {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelected(null)}
                  className="h-10 w-10 hover:bg-red-500/10"
                  title="Fechar"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 overflow-hidden bg-muted">
              {selected && (
                <iframe
                  src={`${encodePath(selected.url)}#view=FitH`}
                  className="w-full h-full"
                  title={selected.title}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
