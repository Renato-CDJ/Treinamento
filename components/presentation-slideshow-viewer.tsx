"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  CheckCircle2,
  FileText,
  PresentationIcon,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { markFilePresentationAsRead } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

interface PresentationSlideshowViewerProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  filePath: string
  isPDF?: boolean
}

export function PresentationSlideshowViewer({
  isOpen,
  onClose,
  fileName,
  filePath,
  isPDF = false,
}: PresentationSlideshowViewerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [slides, setSlides] = useState<string[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false)

  useEffect(() => {
    if (isOpen && !isPDF) {
      loadSlides()
    }
  }, [isOpen, fileName, isPDF])

  const loadSlides = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/presentations/slides?filename=${encodeURIComponent(fileName)}`)
      const data = await response.json()

      if (data.slides && data.slides.length > 0) {
        setSlides(data.slides)
      } else {
        setError("Nenhum slide encontrado")
      }
    } catch (err) {
      console.error("[v0] Error loading slides:", err)
      setError("Erro ao carregar slides")
    } finally {
      setLoading(false)
    }
  }

  const handlePrevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(0, prev - 1))
  }, [])

  const handleNextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))
  }, [slides.length])

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === "ArrowLeft") handlePrevSlide()
      if (e.key === "ArrowRight") handleNextSlide()
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false)
    },
    [isOpen, handlePrevSlide, handleNextSlide, isFullscreen],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress])

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleMarkAsRead = () => {
    if (!user) return

    markFilePresentationAsRead(fileName, user.id, user.fullName)
    setHasMarkedAsRead(true)

    toast({
      title: "Marcado como lido",
      description: "Esta apresentação foi marcada como lido com sucesso.",
    })

    setTimeout(() => {
      onClose()
    }, 1500)
  }

  const isLastSlide = currentSlide === slides.length - 1

  if (isPDF) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={`p-0 gap-0 ${isFullscreen ? "!max-w-full !w-screen !h-screen" : "!max-w-none !w-[95vw] !h-[95vh]"}`}
          showCloseButton={false}
        >
          <div className="flex flex-col h-full bg-background">
            <div className="flex items-center justify-between px-8 py-5 border-b bg-gradient-to-r from-orange-500/10 to-transparent">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <FileText className="h-7 w-7 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">{fileName}</h3>
                  <Badge variant="outline" className="text-sm mt-1.5 px-3 py-1">
                    PDF
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="h-11 w-11 hover:bg-orange-500/10"
                >
                  {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-11 w-11 hover:bg-red-500/10">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center overflow-hidden bg-gray-950">
              <div className="w-full h-full">
                <iframe
                  src={`${filePath}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-full"
                  title={fileName}
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-8 py-5 border-t bg-gradient-to-r from-orange-500/10 to-transparent">
              <p className="text-base text-muted-foreground">Visualize todo o conteúdo para concluir</p>
              <Button
                onClick={handleMarkAsRead}
                disabled={hasMarkedAsRead}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg px-8 py-6 text-base"
                size="lg"
              >
                <CheckCircle2 className="h-6 w-6 mr-2" />
                {hasMarkedAsRead ? "✓ Marcado como Lido" : "Marcar como Lido"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`p-0 gap-0 ${isFullscreen ? "!max-w-full !w-screen !h-screen" : "!max-w-none !w-[95vw] !h-[95vh]"}`}
        showCloseButton={false}
      >
        <div className="flex flex-col h-full bg-background">
          <div className="flex items-center justify-between px-8 py-5 border-b bg-gradient-to-r from-orange-500/10 to-transparent">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <PresentationIcon className="h-7 w-7 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">{fileName}</h3>
                <div className="flex gap-2 mt-1.5">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    PowerPoint
                  </Badge>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    Slide {currentSlide + 1} de {slides.length}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-11 w-11 hover:bg-orange-500/10"
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-11 w-11 hover:bg-red-500/10">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden bg-gray-950 relative">
            {loading ? (
              <div className="text-white text-center">
                <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-xl">Carregando apresentação...</p>
              </div>
            ) : error ? (
              <div className="text-white text-center">
                <p className="text-red-500 mb-4 text-xl">{error}</p>
                <Button onClick={onClose} variant="outline" size="lg" className="px-8 py-6 text-base bg-transparent">
                  Fechar
                </Button>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center p-12">
                <img
                  src={slides[currentSlide] || "/placeholder.svg"}
                  alt={`Slide ${currentSlide + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error("[v0] Error loading slide:", slides[currentSlide])
                    e.currentTarget.src = "/placeholder.svg?height=1080&width=1920"
                  }}
                />

                {currentSlide > 0 && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handlePrevSlide}
                    className="absolute left-8 top-1/2 -translate-y-1/2 h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-transform"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                )}
                {currentSlide < slides.length - 1 && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleNextSlide}
                    className="absolute right-8 top-1/2 -translate-y-1/2 h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-transform"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-8 py-5 border-t bg-gradient-to-r from-orange-500/10 to-transparent">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrevSlide}
                disabled={currentSlide === 0}
                className="gap-2 bg-transparent px-6 py-6 text-base"
              >
                <ChevronLeft className="h-5 w-5" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleNextSlide}
                disabled={currentSlide === slides.length - 1}
                className="gap-2 bg-transparent px-6 py-6 text-base"
              >
                Próximo
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {isLastSlide && (
              <Button
                onClick={handleMarkAsRead}
                disabled={hasMarkedAsRead}
                className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-lg px-8 py-6 text-base"
                size="lg"
              >
                <CheckCircle2 className="h-6 w-6" />
                {hasMarkedAsRead ? "✓ Marcado como Lido" : "Marcar como Lido"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
