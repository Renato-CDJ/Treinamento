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
  Search,
  Maximize2,
  Minimize2,
  X,
  Video,
  Play,
} from "lucide-react"

type TrainingType = "pdf" | "video"

interface Training {
  id: string
  type: TrainingType
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

interface OperatorTrainingsViewProps {
  mediaType: TrainingType
}

const VIEW_CONFIG: Record<
  TrainingType,
  { title: string; description: string; emptyLabel: string }
> = {
  pdf: {
    title: "Treinamentos",
    description: "Materiais de capacitacao disponibilizados pela Qualidade",
    emptyLabel: "Nenhum treinamento disponivel",
  },
  video: {
    title: "Vídeos Treinamento",
    description: "Vídeos de capacitacao disponibilizados pela Qualidade",
    emptyLabel: "Nenhum vídeo disponivel",
  },
}

export function OperatorTrainingsView({ mediaType }: OperatorTrainingsViewProps) {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selected, setSelected] = useState<Training | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const config = VIEW_CONFIG[mediaType]

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
      t.type === mediaType &&
      (t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.filename.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500/10 rounded-xl">
          {mediaType === "video" ? (
            <Video className="h-6 w-6 text-orange-500" />
          ) : (
            <BookOpen className="h-6 w-6 text-orange-500" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{config.title}</h2>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {/* Search */}
      {trainings.some((t) => t.type === mediaType) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={mediaType === "video" ? "Pesquisar vídeos..." : "Pesquisar treinamentos..."}
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
            {mediaType === "video" ? (
              <Video className="h-12 w-12" />
            ) : (
              <BookOpen className="h-12 w-12" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {searchQuery ? "Nenhum resultado encontrado" : config.emptyLabel}
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
                    {training.type === "video" ? (
                      <Video className="h-6 w-6 text-orange-500" />
                    ) : (
                      <FileText className="h-6 w-6 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base mb-1 line-clamp-2 capitalize">
                      {training.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {training.type === "video" ? "Vídeo" : "PDF"}
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
                    {training.type === "video" ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Assistir
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </>
                    )}
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
              ? "p-0 gap-0 !max-w-full !w-screen !h-[100dvh] !max-h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none"
              : "p-0 gap-0 !max-w-none !w-[95vw] !h-[90dvh] !max-h-[90dvh]"
          }
          showCloseButton={false}
        >
          <div className="flex flex-col h-full bg-background">
            {/* Viewer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-orange-500/10 to-transparent">
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3 bg-orange-500/20 rounded-xl shrink-0">
                  {selected?.type === "video" ? (
                    <Video className="h-6 w-6 text-orange-500" />
                  ) : (
                    <FileText className="h-6 w-6 text-orange-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg truncate capitalize">
                    {selected?.title}
                  </h3>
                  <Badge variant="outline" className="text-xs mt-1">
                    {selected?.type === "video" ? "Vídeo" : "PDF"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
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

            {/* Conteúdo (PDF ou Vídeo) */}
            <div className="flex-1 min-h-0 overflow-hidden bg-black">
              {selected && selected.type === "video" && (
                <video
                  src={encodePath(selected.url)}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  controlsList="nodownload"
                >
                  Seu navegador não suporta a reprodução de vídeos.
                </video>
              )}
              {selected && selected.type === "pdf" && (
                <iframe
                  src={`${encodePath(selected.url)}#view=FitH`}
                  className="w-full h-full bg-muted"
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
