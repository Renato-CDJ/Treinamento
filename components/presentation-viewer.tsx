"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { markPresentationAsSeen, getPresentationProgressByOperator } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import type { Presentation } from "@/lib/types"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, CheckCircle2, Maximize2, Minimize2, ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PresentationViewerProps {
  presentation: Presentation
  isOpen: boolean
  onClose: () => void
}

function isImageAvailable(slide: { imageUrl?: string; imageData?: string }): boolean {
  if (slide.imageData === "[IMAGE_STORED_LOCALLY]") return false
  return !!slide.imageUrl
}

export function PresentationViewer({ presentation, isOpen, onClose }: PresentationViewerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [markedAsSeen, setMarkedAsSeen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      const progress = getPresentationProgressByOperator(user.id)
      const isMarked = progress.some((p) => p.presentationId === presentation.id && p.marked_as_seen)
      setMarkedAsSeen(isMarked)
    }
  }, [isOpen, user, presentation.id])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isFullscreen) return

      if (event.key === "ArrowRight") {
        if (currentSlideIndex < presentation.slides.length - 1) {
          setCurrentSlideIndex(currentSlideIndex + 1)
        }
      } else if (event.key === "ArrowLeft") {
        if (currentSlideIndex > 0) {
          setCurrentSlideIndex(currentSlideIndex - 1)
        }
      } else if (event.key === "Escape") {
        handleToggleFullscreen()
      }
    }

    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyPress)
      return () => {
        document.removeEventListener("keydown", handleKeyPress)
      }
    }
  }, [isFullscreen, currentSlideIndex, presentation.slides.length])

  const currentSlide = presentation.slides[currentSlideIndex]
  const hasNextSlide = currentSlideIndex < presentation.slides.length - 1
  const hasPrevSlide = currentSlideIndex > 0

  const handleNextSlide = () => {
    if (hasNextSlide) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    }
  }

  const handlePrevSlide = () => {
    if (hasPrevSlide) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    }
  }

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 10, 50))
  }

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleMarkAsSeen = () => {
    if (user && !markedAsSeen) {
      markPresentationAsSeen(presentation.id, user.id, user.fullName)
      setMarkedAsSeen(true)
      toast({
        title: "Treinamento marcado como visto",
        description: "O treinamento foi registrado como concluído.",
      })
    }
  }

  const UnavailableImagePlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
      <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
      <p className="text-lg font-medium text-center">Imagem não disponível neste dispositivo</p>
      <p className="text-sm text-center mt-2 max-w-md">
        Esta apresentação foi criada em outro computador. As imagens só estão disponíveis no dispositivo original.
      </p>
    </div>
  )

  if (!currentSlide) {
    return null
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center">
        <div className="flex-1 w-full flex items-center justify-center overflow-hidden relative px-2 py-2">
          <div className="relative w-full h-full max-w-full flex items-center justify-center">
            {isImageAvailable(currentSlide) ? (
              <img
                src={currentSlide.imageUrl || "/placeholder.svg"}
                alt={`Slide ${currentSlideIndex + 1}`}
                className="w-full h-full object-contain rounded-lg"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "center center",
                }}
              />
            ) : (
              <div className="text-center text-gray-400 bg-gray-900/50 rounded-xl p-8">
                <ImageIcon className="h-20 w-20 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Imagem não disponível</p>
                <p className="text-sm mt-2">Criada em outro dispositivo</p>
              </div>
            )}

            <Button
              variant="default"
              size="lg"
              onClick={handlePrevSlide}
              disabled={!hasPrevSlide}
              title="Slide anterior (← ou clique)"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white border-0 z-20 transition-all duration-200 shadow-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={handleNextSlide}
              disabled={!hasNextSlide}
              title="Próximo slide (→ ou clique)"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white border-0 z-20 transition-all duration-200 shadow-lg"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="w-full border-t border-white/20 px-4 py-3 flex items-center justify-between gap-4 flex-wrap bg-black/50">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              title="Diminuir zoom"
              className="hover:bg-white/10 text-white border-white/30 h-9 px-2 bg-transparent"
            >
              <ZoomOut className="h-4 w-4" />
              <span className="text-xs ml-1">-</span>
            </Button>
            <span className="text-sm font-semibold w-16 text-center px-2 py-1 bg-white/10 rounded text-white">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              title="Aumentar zoom"
              className="hover:bg-white/10 text-white border-white/30 h-9 px-2"
            >
              <ZoomIn className="h-4 w-4" />
              <span className="text-xs ml-1">+</span>
            </Button>
          </div>

          <Badge variant="secondary" className="text-sm px-3 py-1 bg-white/20 text-white border-white/30">
            {currentSlideIndex + 1} de {presentation.slides.length}
          </Badge>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevSlide}
              disabled={!hasPrevSlide}
              title="Slide anterior"
              className="hover:bg-white/10 text-white border-white/30 h-9 px-2 bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs ml-1">Ant</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextSlide}
              disabled={!hasNextSlide}
              title="Próximo slide"
              className="hover:bg-white/10 text-white border-white/30 h-9 px-2 bg-transparent"
            >
              <span className="text-xs mr-1">Prox</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleFullscreen}
              title="Sair da tela cheia (ESC)"
              className="hover:bg-white/10 text-white border-white/30 h-9 px-2 bg-transparent"
            >
              <Minimize2 className="h-4 w-4" />
              <span className="text-xs ml-1 hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] sm:max-w-[96vw] md:max-w-[94vw] h-[95vh] rounded-lg p-0 gap-0 flex flex-col bg-background">
        <DialogHeader className="border-b px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 bg-background">
          <div className="flex items-center justify-between gap-4 w-full flex-wrap sm:flex-nowrap">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-2xl font-bold break-words">{presentation.title}</DialogTitle>
              {presentation.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{presentation.description}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-background to-muted/20 relative transition-all duration-300">
            <div className="relative flex items-center justify-center w-full h-full max-w-5xl max-h-[60vh] transition-all duration-300">
              <div className="relative flex items-center justify-center w-full h-full border-2 border-border rounded-xl bg-background shadow-2xl overflow-hidden transition-all duration-300">
                {isImageAvailable(currentSlide) ? (
                  <div className="flex items-center justify-center w-full h-full p-0 sm:p-2 md:p-4">
                    <img
                      src={currentSlide.imageUrl || "/placeholder.svg"}
                      alt={`Slide ${currentSlideIndex + 1}`}
                      className="w-full h-full object-contain rounded-lg transition-transform duration-300"
                      style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: "center center",
                      }}
                    />
                  </div>
                ) : (
                  <UnavailableImagePlaceholder />
                )}
              </div>
            </div>
          </div>

          <div className="border-t px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0 bg-background space-y-3 sm:space-y-4 transition-all duration-300">
            <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2 order-2 sm:order-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleFullscreen}
                  title="Tela cheia"
                  className="hover:bg-muted h-9 w-9 p-0 bg-transparent"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  title="Diminuir zoom"
                  className="hover:bg-muted h-9 px-2 bg-transparent"
                >
                  <ZoomOut className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs ml-1">-</span>
                </Button>
                <span className="text-xs sm:text-sm font-semibold w-12 sm:w-16 text-center px-2 py-1 bg-muted rounded">
                  {zoom}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  title="Aumentar zoom"
                  className="hover:bg-muted h-9 px-2"
                >
                  <ZoomIn className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs ml-1">+</span>
                </Button>
              </div>

              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1 flex-shrink-0">
                  {currentSlideIndex + 1} de {presentation.slides.length}
                </Badge>
              </div>

              <div className="flex items-center gap-2 order-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevSlide}
                  disabled={!hasPrevSlide}
                  title="Slide anterior"
                  className="hover:bg-muted h-9 px-2 bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs ml-1">Ant</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextSlide}
                  disabled={!hasNextSlide}
                  title="Próximo slide"
                  className="hover:bg-muted h-9 px-2 bg-transparent"
                >
                  <span className="hidden sm:inline text-xs mr-1">Prox</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {currentSlideIndex === presentation.slides.length - 1 && (
            <div className="border-t px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0 bg-muted/30 flex justify-center gap-2 sm:gap-3 items-center flex-wrap transition-all duration-300">
              <Button
                onClick={handleMarkAsSeen}
                disabled={markedAsSeen}
                className={`gap-2 px-4 sm:px-6 text-sm sm:text-base transition-all duration-300 ${markedAsSeen ? "bg-green-600 hover:bg-green-700" : ""}`}
              >
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{markedAsSeen ? "Treinamento Concluído" : "Marcar como Visto"}</span>
                <span className="sm:hidden">{markedAsSeen ? "Concluído" : "Visto"}</span>
              </Button>
              {markedAsSeen && (
                <Badge variant="default" className="text-xs sm:text-sm">
                  Concluído
                </Badge>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
