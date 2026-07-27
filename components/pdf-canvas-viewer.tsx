"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Minus, Plus, Loader2 } from "lucide-react"

interface PdfCanvasViewerProps {
  url: string
  title: string
}

export function PdfCanvasViewer({ url, title }: PdfCanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfDocRef = useRef<any>(null)
  const renderTaskRef = useRef<any>(null)

  const [numPages, setNumPages] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [scale, setScale] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carrega o documento PDF
  useEffect(() => {
    let cancelled = false

    async function loadPdf() {
      setLoading(true)
      setError(null)
      try {
        const pdfjs = await import("pdfjs-dist")
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString()

        const loadingTask = pdfjs.getDocument(url)
        const pdf = await loadingTask.promise
        if (cancelled) return

        pdfDocRef.current = pdf
        setNumPages(pdf.numPages)
        setPageNum(1)
      } catch (err) {
        console.error("[v0] Error loading PDF:", err)
        if (!cancelled) setError("Não foi possível carregar o PDF.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPdf()

    return () => {
      cancelled = true
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }
      pdfDocRef.current = null
    }
  }, [url])

  // Renderiza a página atual no canvas
  const renderPage = useCallback(async () => {
    const pdf = pdfDocRef.current
    const canvas = canvasRef.current
    if (!pdf || !canvas) return

    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }

      const page = await pdf.getPage(pageNum)
      const outputScale = window.devicePixelRatio || 1
      const viewport = page.getViewport({ scale })

      const context = canvas.getContext("2d")
      if (!context) return

      canvas.width = Math.floor(viewport.width * outputScale)
      canvas.height = Math.floor(viewport.height * outputScale)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`

      const renderContext = {
        canvasContext: context,
        viewport,
        transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
      }

      const task = page.render(renderContext as any)
      renderTaskRef.current = task
      await task.promise
      renderTaskRef.current = null
    } catch (err: any) {
      if (err?.name !== "RenderingCancelledException") {
        console.error("[v0] Error rendering page:", err)
      }
    }
  }, [pageNum, scale])

  useEffect(() => {
    if (!loading && !error) {
      renderPage()
    }
  }, [renderPage, loading, error])

  const goPrev = () => setPageNum((p) => Math.max(1, p - 1))
  const goNext = () => setPageNum((p) => Math.min(numPages, p + 1))
  const zoomOut = () => setScale((s) => Math.max(0.25, Math.round((s - 0.1) * 100) / 100))
  const zoomIn = () => setScale((s) => Math.min(3, Math.round((s + 0.1) * 100) / 100))

  return (
    <div className="flex flex-col h-full w-full bg-gray-950">
      {/* Área de visualização */}
      <div className="flex-1 min-h-0 overflow-auto flex items-start justify-center p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-3" />
            <p className="text-sm">Carregando PDF...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-400 text-sm">{error}</div>
        ) : (
          <canvas ref={canvasRef} className="shadow-2xl" aria-label={title} />
        )}
      </div>

      {/* Barra de controles: apenas navegação de página e zoom */}
      {!loading && !error && numPages > 0 && (
        <div className="shrink-0 flex items-center justify-center gap-4 px-4 py-2 bg-neutral-900/95 border-t border-neutral-800">
          <div className="flex items-center gap-1 text-white text-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={goPrev}
              disabled={pageNum <= 1}
              className="h-8 w-8 text-white hover:bg-white/10 disabled:opacity-30"
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[60px] text-center tabular-nums">
              {pageNum} / {numPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={goNext}
              disabled={pageNum >= numPages}
              className="h-8 w-8 text-white hover:bg-white/10 disabled:opacity-30"
              title="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-5 w-px bg-neutral-700" />

          <div className="flex items-center gap-1 text-white text-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomOut}
              disabled={scale <= 0.25}
              className="h-8 w-8 text-white hover:bg-white/10 disabled:opacity-30"
              title="Diminuir zoom"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="min-w-[52px] text-center tabular-nums">{Math.round(scale * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomIn}
              disabled={scale >= 3}
              className="h-8 w-8 text-white hover:bg-white/10 disabled:opacity-30"
              title="Aumentar zoom"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
