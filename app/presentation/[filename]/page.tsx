"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Maximize, Minimize, X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { markFilePresentationAsRead } from "@/lib/store"
import { CheckCircle2 } from "lucide-react"

export default function PresentationPage() {
  const params = useParams()
  const router = useRouter()
  const filename = params.filename as string
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<string[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false)

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const decodedFilename = decodeURIComponent(filename)

        const response = await fetch(`/api/presentations/slides?filename=${encodeURIComponent(decodedFilename)}`)
        const data = await response.json()

        if (data.slides && data.slides.length > 0) {
          setSlides(data.slides)
        } else {
          setSlides([])
        }
      } catch (error) {
        console.error("[v0] Error loading slides:", error)
        setSlides([])
      } finally {
        setIsLoading(false)
      }
    }

    loadSlides()
  }, [filename])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "PageUp":
          setCurrentSlide((prev) => Math.max(0, prev - 1))
          break
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault()
          setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))
          break
        case "Home":
          setCurrentSlide(0)
          break
        case "End":
          setCurrentSlide(slides.length - 1)
          break
        case "f":
        case "F":
          toggleFullscreen()
          break
        case "Escape":
          if (document.fullscreenElement) {
            document.exitFullscreen()
            setIsFullscreen(false)
          } else {
            router.back()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [slides.length, toggleFullscreen, router])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const handleMarkAsRead = () => {
    if (user) {
      const decodedFilename = decodeURIComponent(filename)
        .replace(/\.(pptx?|PPTX?)$/, "")
        .replace(/\.+$/, "")
      markFilePresentationAsRead(decodedFilename, user.id, user.fullName || user.username)
      setHasMarkedAsRead(true)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background z-[9999] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando apresentação...</p>
        </div>
      </div>
    )
  }

  const presentationUrl = `/presentations/${decodeURIComponent(filename)}`
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.origin + presentationUrl : presentationUrl,
  )}&embedded=true`

  if (slides.length > 0) {
    const isLastSlide = currentSlide === slides.length - 1
    console.log(
      "[v0] Current slide:",
      currentSlide,
      "Total slides:",
      slides.length,
      "Is last slide:",
      isLastSlide,
      "User:",
      user,
      "Has marked:",
      hasMarkedAsRead,
    )

    return (
      <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
        <div className="h-16 bg-gradient-to-r from-black via-black/95 to-black/90 backdrop-blur flex items-center justify-between px-6 border-b border-white/10 shadow-xl">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-white hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5 mr-2" />
              Fechar
            </Button>
            <Separator orientation="vertical" className="h-6 bg-white/20" />
            <div className="text-sm font-medium text-white/90 truncate max-w-[400px]">
              {decodeURIComponent(filename)
                .replace(/\.(pptx?|PPTX?)$/, "")
                .replace(/\.+$/, "")}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
              <span className="text-sm font-medium text-white">
                {currentSlide + 1} / {slides.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/10 hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4" style={{ height: "calc(95vh - 3.5rem - 4rem)" }}>
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={slides[currentSlide] || "/placeholder.svg"}
              alt={`Slide ${currentSlide + 1}`}
              fill
              className="object-contain"
              priority={currentSlide < 3}
              sizes="95vw"
            />
          </div>
        </div>

        <div className="h-20 bg-gradient-to-r from-black via-black/95 to-black/90 backdrop-blur flex items-center justify-center gap-3 px-6 border-t border-white/10 shadow-2xl">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white disabled:opacity-30 transition-all min-w-[130px]"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Anterior
          </Button>

          <div className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm min-w-[140px] text-center">
            <div className="text-xs text-white/60 mb-1">Slide</div>
            <div className="text-base font-bold text-white">
              {currentSlide + 1} de {slides.length}
            </div>
          </div>

          {isLastSlide && user && !hasMarkedAsRead && (
            <Button
              variant="default"
              size="lg"
              onClick={handleMarkAsRead}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 transition-all min-w-[180px] font-semibold"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Marcar como Lido
            </Button>
          )}

          {isLastSlide && hasMarkedAsRead && (
            <Button
              variant="outline"
              size="lg"
              disabled
              className="bg-green-600/20 border-green-600/40 text-green-400 min-w-[180px] font-semibold"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Marcado como Lido
            </Button>
          )}

          {!isLastSlide && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
              disabled={currentSlide === slides.length - 1}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white disabled:opacity-30 transition-all min-w-[130px]"
            >
              Próximo
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="absolute bottom-20 right-4 text-xs text-white/60 bg-black/60 backdrop-blur px-3 py-2 rounded-md border border-white/10">
          ← → Navegar • Space Próximo • F Tela cheia • ESC Sair
        </div>
      </div>
    )
  }

  // Fallback: Use Google Viewer for presentations without slides
  return (
    <div className="fixed inset-0 bg-background z-[9999] flex flex-col">
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
          <div className="text-sm font-medium truncate max-w-[300px]">
            {decodeURIComponent(filename)
              .replace(/\.(pptx?|PPTX?)$/, "")
              .replace(/\.+$/, "")}
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 relative overflow-hidden bg-muted/20 flex items-center justify-center p-8">
        <div className="w-full h-full max-w-[95vw] max-h-[90vh]">
          <iframe
            src={googleViewerUrl}
            className="w-full h-full border-0 rounded-lg shadow-2xl bg-white"
            title="Presentation Viewer"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  )
}
