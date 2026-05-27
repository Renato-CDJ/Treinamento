"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { CheckCircle2, AlertCircle, ArrowLeft, Search, ChevronRight, Maximize2, Minimize2, Eye } from "lucide-react"
import type { ScriptStep, ContentSegment } from "@/lib/types"
import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { SafeHtml } from "@/components/safe-html"

interface ScriptCardProps {
  step: ScriptStep
  onButtonClick: (nextStepId: string | null, buttonLabel?: string) => void
  onGoBack?: () => void
  canGoBack?: boolean
  operatorName: string
  customerFirstName?: string
  searchQuery?: string
  showControls?: boolean
  productName?: string
  onSearchStep?: (stepId: string) => void
  allSteps?: ScriptStep[]
}

function loadAccessibilitySettings(): { textSize: number; buttonSize: number } {
  if (typeof window === "undefined") return { textSize: 50, buttonSize: 50 }

  try {
    const saved = localStorage.getItem("callcenter_accessibility_settings")
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error("[v0] Error loading accessibility settings:", error)
  }

  return { textSize: 50, buttonSize: 50 }
}

function saveAccessibilitySettings(textSize: number, buttonSize: number) {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("callcenter_accessibility_settings", JSON.stringify({ textSize, buttonSize }))
  } catch (error) {
    console.error("[v0] Error saving accessibility settings:", error)
  }
}

const calculateFontSize = (baseSize: number, scale: number) => baseSize + (scale / 100) * baseSize
const calculatePadding = (basePadding: number, scale: number) => basePadding + (scale / 100) * basePadding

function renderContentWithSegments(
  content: string,
  segments: ContentSegment[] | undefined,
  textFontSize: number,
  operatorName: string,
  customerFirstName: string,
): React.ReactNode {
  const safeContent = content || ""

  if (!segments || segments.length === 0) {
    return safeContent
      .replace(/\[Nome do operador\]/gi, `<strong>${operatorName}</strong>`)
      .replace(/\[Primeiro nome do cliente\]/gi, `<strong>${customerFirstName}</strong>`)
      .replace(/$$Primeiro nome do cliente$$/gi, `<strong>${customerFirstName}</strong>`)
      .replace(/$$nome completo do cliente$$/gi, `<strong>${customerFirstName}</strong>`)
      .replace(/\[CPF do cliente\]/gi, "<strong>***.***.***-**</strong>")
      .replace(/\n/g, "<br>")
  }

  const textToElements = (text: string, keyPrefix: string): React.ReactNode[] => {
    const lines = text.split("\n")
    const elements: React.ReactNode[] = []

    lines.forEach((line, lineIdx) => {
      if (lineIdx > 0) {
        elements.push(<br key={`${keyPrefix}-br-${lineIdx}`} />)
      }
      if (line) {
        elements.push(<span key={`${keyPrefix}-line-${lineIdx}`}>{line}</span>)
      }
    })

    return elements
  }

  const segmentMap = new Map<string, ContentSegment>()
  segments.forEach((seg) => {
    segmentMap.set(seg.text, seg)
  })

  let lastIndex = 0
  const elements: React.ReactNode[] = []

  segments.forEach((segment, idx) => {
    const index = safeContent.indexOf(segment.text, lastIndex)
    if (index !== -1) {
      if (index > lastIndex) {
        const textBefore = safeContent.substring(lastIndex, index)
        elements.push(...textToElements(textBefore, `text-${idx}`))
      }

      const segmentStyle: React.CSSProperties = {
        fontWeight: segment.formatting.bold ? "bold" : "normal",
        fontStyle: segment.formatting.italic ? "italic" : "normal",
        color: segment.formatting.color || "inherit",
        backgroundColor: segment.formatting.backgroundColor || "transparent",
        fontSize:
          segment.formatting.fontSize === "sm"
            ? `${textFontSize * 0.875}px`
            : segment.formatting.fontSize === "lg"
              ? `${textFontSize * 1.125}px`
              : segment.formatting.fontSize === "xl"
                ? `${textFontSize * 1.25}px`
                : `${textFontSize}px`,
        padding: segment.formatting.backgroundColor ? "2px 4px" : "0",
        borderRadius: segment.formatting.backgroundColor ? "4px" : "0",
      }

      const segmentLines = segment.text.split("\n")
      const segmentElements: React.ReactNode[] = []

      segmentLines.forEach((line, lineIdx) => {
        if (lineIdx > 0) {
          segmentElements.push(<br key={`segment-${idx}-br-${lineIdx}`} />)
        }
        if (line) {
          segmentElements.push(
            <span key={`segment-${idx}-line-${lineIdx}`} style={segmentStyle}>
              {line}
            </span>,
          )
        }
      })

      elements.push(...segmentElements)

      lastIndex = index + segment.text.length
    }
  })

  if (lastIndex < safeContent.length) {
    const remainingText = safeContent.substring(lastIndex)
    elements.push(...textToElements(remainingText, "text-end"))
  }

  return elements
}

export const ScriptCard = memo(function ScriptCard({
  step,
  onButtonClick,
  onGoBack,
  canGoBack = false,
  operatorName,
  customerFirstName = "Cliente",
  searchQuery = "",
  showControls = true,
  productName = "",
  onSearchStep,
  allSteps = [],
}: ScriptCardProps) {
  const [textSize, setTextSize] = useState<number[]>([50])
  const [buttonSize, setButtonSize] = useState<number[]>([50])
  const [showTabulation, setShowTabulation] = useState(false)
  const [showTabulationPulse, setShowTabulationPulse] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [fullscreenMode, setFullscreenMode] = useState(false)

  const hasTabulations = step.tabulations && step.tabulations.length > 0

  useEffect(() => {
    saveAccessibilitySettings(textSize[0], buttonSize[0])
  }, [textSize, buttonSize])

  useEffect(() => {
    if (hasTabulations) {
      setShowTabulationPulse(true)
      const timer = setTimeout(() => setShowTabulationPulse(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [step.id, hasTabulations])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape" && canGoBack && onGoBack) {
        onGoBack()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [canGoBack, onGoBack])

  

  const processedContent = useMemo(() => {
    const safeContent = step.content || ""
    return safeContent
      .replace(/\[Nome do operador\]/gi, `<strong>${operatorName}</strong>`)
      .replace(/\[Primeiro nome do cliente\]/gi, `<strong>${customerFirstName}</strong>`)
      .replace(/$$Primeiro nome do cliente$$/gi, `<strong>${customerFirstName}</strong>`)
      .replace(/$$nome completo do cliente$$/gi, `<strong>${customerFirstName}</strong>`)
      .replace(/\[CPF do cliente\]/gi, "<strong>***.***.***-**</strong>")
      .replace(/\n/g, "<br>")
  }, [step.content, operatorName, customerFirstName])

  const highlightedTitle = useMemo(
    () =>
      searchQuery && step.title.toLowerCase().includes(searchQuery.toLowerCase())
        ? step.title.replace(
            new RegExp(`(${searchQuery})`, "gi"),
            '<mark class="bg-yellow-300 dark:bg-yellow-600">$1</mark>',
          )
        : step.title,
    [searchQuery, step.title],
  )

  const textFontSize = useMemo(() => calculateFontSize(16, textSize[0]), [textSize])
  const navButtonFontSize = useMemo(() => calculateFontSize(14, buttonSize[0]), [buttonSize])
  const navButtonPadding = useMemo(() => calculatePadding(12, buttonSize[0]), [buttonSize])
  const buttonFontSize = useMemo(() => calculateFontSize(12, buttonSize[0]), [buttonSize])
  const buttonPadding = useMemo(() => calculatePadding(12, buttonSize[0]), [buttonSize])

  const handleTabulationOpen = useCallback(() => setShowTabulation(true), [])
  const handleTabulationClose = useCallback(() => setShowTabulation(false), [])
  const handleAlertOpen = useCallback(() => setShowAlert(true), [])
  const handleAlertClose = useCallback(() => setShowAlert(false), [])
  const handleSearchOpen = useCallback(() => {
    setShowSearch(true)
    setSearchText("")
  }, [])
  const handleSearchClose = useCallback(() => {
    setShowSearch(false)
    setSearchText("")
  }, [])

  const toggleFullscreenMode = useCallback(() => {
    setFullscreenMode((prev) => !prev)
  }, [])

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchText(value)
      if (value.trim() && allSteps.length > 0) {
        const result = allSteps.find(
          (s) =>
            s.title.toLowerCase().includes(value.toLowerCase()) ||
            s.content.toLowerCase().includes(value.toLowerCase()),
        )
        if (result && onSearchStep) {
          onSearchStep(result.id)
        }
      }
    },
    [allSteps, onSearchStep],
  )

  

  const contentStyles = useMemo(() => {
    const styles: React.CSSProperties = {
      fontSize: `${textFontSize}px`,
      lineHeight: "1.75",
    }

    if (step.formatting) {
      if (step.formatting.textColor) {
        styles.color = step.formatting.textColor
      }
      if (step.formatting.bold) {
        styles.fontWeight = "bold"
      }
      if (step.formatting.italic) {
        styles.fontStyle = "italic"
      }
      if (step.formatting.textAlign) {
        styles.textAlign = step.formatting.textAlign
      }
    }

    return styles
  }, [textFontSize, step.formatting])

  const renderedContent = useMemo(() => {
    if (step.contentSegments && step.contentSegments.length > 0) {
      return renderContentWithSegments(
        step.content,
        step.contentSegments,
        textFontSize,
        operatorName,
        customerFirstName,
      )
    }
    return processedContent
  }, [step.content, step.contentSegments, textFontSize, operatorName, customerFirstName, processedContent])

  const renderedButtons = useMemo(() => {
    return step.buttons
      .sort((a, b) => a.order - b.order)
      .map((button) => {
        const isPrimary = button.primary || button.variant === "primary" || button.variant === "default"

        return (
          <button
            key={button.id}
            onClick={() => onButtonClick(button.nextStepId, button.label)}
            className={`
              group relative flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-300 max-w-full overflow-hidden
              ${isPrimary
                ? "bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 hover:from-orange-600 hover:via-orange-500 hover:to-amber-400 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98]"
                : "bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 text-white border border-zinc-600/50 hover:border-orange-500/50 shadow-md hover:shadow-lg hover:shadow-orange-500/10 hover:scale-[1.02] active:scale-[0.98]"
              }
            `}
            style={{
              fontSize: `clamp(12px, ${navButtonFontSize}px, 16px)`,
              padding: `${Math.min(navButtonPadding, 14)}px ${Math.min(navButtonPadding * 2, 28)}px`,
              minHeight: `${Math.min(navButtonPadding * 2.5, 48)}px`,
            }}
          >
            {/* Efeito de brilho no hover */}
            <span className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
              isPrimary 
                ? "bg-gradient-to-r from-white/0 via-white/20 to-white/0" 
                : "bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0"
            }`} />
            
            {/* Texto do botão */}
            <span className="relative z-10 text-wrap">{button.label}</span>
            
            {/* Ícone de seta */}
            <ChevronRight className={`relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 ${
              isPrimary ? "text-white/80" : "text-zinc-400 group-hover:text-orange-400"
            }`} />
          </button>
        )
      })
  }, [step.buttons, step.id, navButtonFontSize, navButtonPadding, onButtonClick])

  return (
    <div className="space-y-4 w-full max-w-5xl mx-auto px-2 md:px-4">
      {/* Controles de acessibilidade */}
      {showControls && (
        <div className="py-3">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            <div className="flex items-center gap-3 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                Texto
              </label>
              <Slider
                value={textSize}
                onValueChange={setTextSize}
                min={50}
                max={120}
                step={5}
                className="flex-1 [&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-0 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:shadow-md [&_.bg-primary]:bg-orange-500"
              />
              <span className="text-xs font-medium text-muted-foreground tabular-nums w-10 text-right">
                {textSize[0]}%
              </span>
            </div>
            <div className="flex items-center gap-3 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                Botoes
              </label>
              <Slider
                value={buttonSize}
                onValueChange={setButtonSize}
                min={50}
                max={150}
                step={5}
                className="flex-1 [&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-0 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:shadow-md [&_.bg-primary]:bg-orange-500"
              />
              <span className="text-xs font-medium text-muted-foreground tabular-nums w-10 text-right">
                {buttonSize[0]}%
              </span>
            </div>
            {/* Botao modo texto grande */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreenMode}
              className="flex items-center gap-2 bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 hover:border-emerald-400"
              title="Modo texto grande para melhor visualizacao"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-semibold">Texto Grande</span>
            </Button>
          </div>
        </div>
      )}

      {/* Badge do produto */}
      {productName && (
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500 text-white rounded-full text-xs font-semibold uppercase tracking-wide shadow-md shadow-orange-500/25">
            {productName}
          </span>
        </div>
      )}

      {/* Botao voltar flutuante */}
      {canGoBack && onGoBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onGoBack}
          className="fixed left-3 md:left-6 top-1/2 -translate-y-1/2 z-50 h-10 w-10 md:h-11 md:w-11 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 shadow-lg transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Card principal do script */}
      <Card className="relative border border-orange-500/30 bg-card shadow-xl overflow-hidden">
        {/* Gradiente sutil laranja no topo */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />

        {/* Botao de busca */}
        <Popover open={showSearch} onOpenChange={setShowSearch}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearchOpen}
              className="absolute top-4 left-4 z-20 h-9 w-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
              title="Buscar tela do roteiro"
            >
              <Search className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3 bg-zinc-900 border-zinc-700" align="start" side="bottom">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Search className="h-4 w-4 text-orange-500" />
                Buscar Tela
              </div>
              <Input
                placeholder="Digite titulo ou conteudo..."
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-9 text-sm bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                autoFocus
              />
              <p className="text-[10px] text-zinc-500">A tela sera exibida conforme voce digita</p>
            </div>
          </PopoverContent>
        </Popover>

        {/* Botao de tabulacao */}
        <button
          onClick={() => setShowTabulation(true)}
          className={`absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            hasTabulations
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
              : "bg-zinc-800/80 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-white"
          }`}
        >
          {hasTabulations ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          <span className="hidden md:inline">Tabulacao</span>
          {hasTabulations && showTabulationPulse && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
        </button>

        <CardHeader className="relative z-10 pb-4 pt-14 md:pt-12 px-4 md:px-8">
          <SafeHtml
            as="h2"
            html={highlightedTitle}
            className="text-xl md:text-2xl lg:text-3xl text-center font-bold text-balance leading-tight text-foreground"
          />
        </CardHeader>

        <CardContent className="relative z-10 space-y-4 pb-6 px-4 md:px-8">
          {/* Area de conteudo do script */}
          <div
            className="bg-white dark:bg-zinc-800/50 rounded-xl p-5 md:p-8 leading-relaxed min-h-[200px] md:min-h-[280px] border-2 border-orange-500/50 text-zinc-900 dark:text-zinc-100"
            style={contentStyles}
          >
            {typeof renderedContent === "string" ? (
              <SafeHtml html={renderedContent} />
            ) : (
              renderedContent
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botoes de navegacao */}
      <div className="flex justify-center items-center pt-2 pb-4">
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 w-full max-w-2xl">{renderedButtons}</div>
      </div>

      <Dialog open={showTabulation} onOpenChange={setShowTabulation}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto border border-zinc-700 bg-zinc-900 p-0 gap-0">
          {/* Header com gradiente laranja */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-center gap-2 text-lg font-bold text-white">
                <CheckCircle2 className="h-5 w-5" />
                Tabulacao Recomendada
              </DialogTitle>
              <DialogDescription className="text-sm text-white/80 text-center">
                Se voce encerrar o atendimento nesta tela, utilize a(s) seguinte(s) tabulacao(oes):
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-4 space-y-3">
            {step.tabulations && step.tabulations.length > 0 ? (
              step.tabulations.map((tabulation, index) => (
                <div
                  key={tabulation.id || index}
                  className="relative rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-orange-500/20 flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base text-white mb-1">
                        {tabulation.name}
                      </h4>
                      <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                        {tabulation.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-800/30 p-6 text-center">
                <CheckCircle2 className="h-10 w-10 mx-auto text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-500">
                  Nenhuma tabulacao especifica recomendada para esta tela. Continue o atendimento normalmente.
                </p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-zinc-700">
            <button
              onClick={() => setShowTabulation(false)}
              className="w-full py-2.5 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors"
            >
              Entendi
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Fullscreen - Modo Texto Grande para Acessibilidade */}
      {fullscreenMode && (
        <div className="fixed inset-0 z-[9999] bg-zinc-900 overflow-hidden flex flex-col">
          {/* Header fixo */}
          <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-white" />
                <span className="text-lg font-bold text-white">Modo Texto Grande</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreenMode}
                className="text-white hover:bg-white/20 gap-2"
              >
                <Minimize2 className="h-5 w-5" />
                <span className="hidden sm:inline">Fechar</span>
              </Button>
            </div>
            {/* Titulo do step */}
            <SafeHtml
              as="h1"
              html={highlightedTitle}
              className="text-2xl md:text-3xl lg:text-4xl text-center font-bold text-white mt-4 text-balance"
            />
          </div>

          {/* Conteudo scrollavel com texto grande */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-16">
            <div 
              className="max-w-5xl mx-auto bg-zinc-800 rounded-2xl p-8 md:p-12 lg:p-16 shadow-2xl border-4 border-orange-500/50"
              style={{
                fontSize: "clamp(24px, 4vw, 42px)",
                lineHeight: "1.8",
              }}
            >
              {typeof renderedContent === "string" ? (
                <SafeHtml html={renderedContent} className="text-zinc-100" />
              ) : (
                <div className="text-zinc-100" style={{ fontSize: "clamp(24px, 4vw, 42px)" }}>
                  {renderedContent}
                </div>
              )}
            </div>
          </div>

          {/* Botoes fixos na parte inferior */}
          <div className="flex-shrink-0 bg-zinc-800 border-t border-zinc-700 p-4 md:p-6">
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
              {step.buttons
                .sort((a, b) => a.order - b.order)
                .map((button) => {
                  const isPrimary = button.primary || button.variant === "primary" || button.variant === "default"
                  return (
                    <button
                      key={button.id}
                      onClick={() => {
                        onButtonClick(button.nextStepId, button.label)
                      }}
                      className={`
                        flex items-center justify-center gap-3 rounded-xl font-bold transition-all duration-300
                        ${isPrimary
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-400 text-white shadow-lg shadow-orange-500/30"
                          : "bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600"
                        }
                      `}
                      style={{
                        fontSize: "clamp(18px, 2.5vw, 28px)",
                        padding: "16px 32px",
                        minHeight: "64px",
                      }}
                    >
                      {button.label}
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
