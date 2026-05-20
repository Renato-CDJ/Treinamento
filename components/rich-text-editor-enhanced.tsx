"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  Bold,
  Italic,
  Underline,
  Trash2,
  CornerDownLeft,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Paintbrush,
  Smile,
  ImageIcon,
  Type,
  Palette,
} from "lucide-react"
import type { ContentSegment } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface RichTextEditorEnhancedProps {
  value: string
  segments?: ContentSegment[]
  onChange: (content: string, segments: ContentSegment[]) => void
  placeholder?: string
}

const EMOJI_LIST = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😅",
  "😂",
  "🤣",
  "😊",
  "😇",
  "🙂",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😙",
  "😚",
  "😋",
  "😛",
  "😜",
  "🤪",
  "😝",
  "🤑",
  "🤗",
  "🤭",
  "🤔",
  "🤐",
  "🤨",
  "😐",
  "👍",
  "👎",
  "👏",
  "🙌",
  "👋",
  "🤝",
  "💪",
  "🙏",
  "✌️",
  "🤞",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "🤎",
  "💔",
  "⭐",
  "✨",
  "🎉",
  "🎊",
  "🎈",
  "🎁",
  "🏆",
  "🥇",
  "🥈",
  "🥉",
]

const FONT_FAMILIES = [
  { name: "Sans Serif", value: "sans-serif" },
  { name: "Serif", value: "serif" },
  { name: "Monospace", value: "monospace" },
  { name: "Arial", value: "Arial" },
  { name: "Verdana", value: "Verdana" },
  { name: "Times New Roman", value: "Times New Roman" },
  { name: "Georgia", value: "Georgia" },
  { name: "Courier New", value: "Courier New" },
]

const FONT_SIZES = [
  { name: "Pequeno", value: "sm" },
  { name: "Normal", value: "base" },
  { name: "Grande", value: "lg" },
  { name: "Extra Grande", value: "xl" },
  { name: "2X Grande", value: "2xl" },
  { name: "3X Grande", value: "3xl" },
]

export function RichTextEditorEnhanced({
  value,
  segments = [],
  onChange,
  placeholder = "Digite seu recado aqui...",
}: RichTextEditorEnhancedProps) {
  const [selectedText, setSelectedText] = useState("")
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [formatPainter, setFormatPainter] = useState<ContentSegment["formatting"] | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleTextSelection = useCallback(() => {
    if (!textareaRef.current) return

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const selected = value.substring(start, end)

    if (selected.length > 0) {
      setSelectedText(selected)
    }
  }, [value])

  const applyFormatting = useCallback(
    (formatting: Partial<ContentSegment["formatting"]>) => {
      if (!selectedText) return

      const newSegment: ContentSegment = {
        id: `seg-${Date.now()}-${Math.random()}`,
        text: selectedText,
        formatting: {
          ...formatting,
        },
      }

      const updatedSegments = [...segments, newSegment]
      onChange(value, updatedSegments)
      setSelectedText("")
    },
    [selectedText, segments, onChange, value],
  )

  const applyPainterFormatting = useCallback(() => {
    if (!selectedText || !formatPainter) return

    applyFormatting(formatPainter)
    setFormatPainter(null)
  }, [selectedText, formatPainter, applyFormatting])

  const removeSegment = useCallback(
    (id: string) => {
      const updatedSegments = segments.filter((s) => s.id !== id)
      onChange(value, updatedSegments)
      setSelectedSegmentId(null)
    },
    [segments, onChange, value],
  )

  const insertLineBreak = useCallback(() => {
    if (!textareaRef.current) return

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const newValue = value.substring(0, start) + "\n" + value.substring(end)

    onChange(newValue, segments)

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start + 1
        textareaRef.current.selectionEnd = start + 1
        textareaRef.current.focus()
      }
    }, 0)
  }, [value, segments, onChange])

  const insertEmoji = useCallback(
    (emoji: string) => {
      if (!textareaRef.current) return

      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const newValue = value.substring(0, start) + emoji + value.substring(end)

      onChange(newValue, segments)

      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = start + emoji.length
          textareaRef.current.selectionStart = newPos
          textareaRef.current.selectionEnd = newPos
          textareaRef.current.focus()
        }
      }, 0)
    },
    [value, segments, onChange],
  )

  const getSegmentStyle = useMemo(
    () => (segment: ContentSegment) => ({
      fontWeight: segment.formatting.bold ? "bold" : "normal",
      fontStyle: segment.formatting.italic ? "italic" : "normal",
      textDecoration: segment.formatting.underline ? "underline" : "none",
      color: segment.formatting.color || "inherit",
      backgroundColor: segment.formatting.backgroundColor || "transparent",
      textShadow: segment.formatting.textShadow || "none",
      textAlign: (segment.formatting.alignment || "left") as any,
      fontFamily: segment.formatting.fontFamily || "inherit",
      fontSize:
        segment.formatting.fontSize === "sm"
          ? "0.875rem"
          : segment.formatting.fontSize === "lg"
            ? "1.125rem"
            : segment.formatting.fontSize === "xl"
              ? "1.25rem"
              : segment.formatting.fontSize === "2xl"
                ? "1.5rem"
                : segment.formatting.fontSize === "3xl"
                  ? "1.875rem"
                  : "1rem",
      listStyle: segment.formatting.listType || "none",
    }),
    [],
  )

  return (
    <div className="space-y-3">
      <Label htmlFor="content" className="text-base font-semibold">
        Conteúdo do Recado
      </Label>

      <Card className="p-3 bg-muted/30">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Bold, Italic, Underline */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormatting({ bold: true })}
            disabled={!selectedText}
            title="Negrito (Selecione texto primeiro)"
            className="h-9"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormatting({ italic: true })}
            disabled={!selectedText}
            title="Itálico"
            className="h-9"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormatting({ underline: true })}
            disabled={!selectedText}
            title="Sublinhado"
            className="h-9"
          >
            <Underline className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Shadow */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormatting({ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" })}
            disabled={!selectedText}
            title="Sombra de Texto"
            className="h-9"
          >
            <Type className="h-4 w-4" />
          </Button>

          {/* Color Pickers */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={!selectedText}
                title="Cor do Texto"
                className="h-9 bg-transparent"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <Label>Cor do Texto</Label>
                <Input
                  type="color"
                  onChange={(e) => applyFormatting({ color: e.target.value })}
                  className="w-full h-10 cursor-pointer"
                />
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={!selectedText}
                title="Cor de Fundo"
                className="h-9 bg-transparent"
              >
                <Paintbrush className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <Label>Cor de Fundo</Label>
                <Input
                  type="color"
                  onChange={(e) => applyFormatting({ backgroundColor: e.target.value })}
                  className="w-full h-10 cursor-pointer"
                />
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6" />

          {/* Font Family */}
          <Select onValueChange={(value) => applyFormatting({ fontFamily: value })} disabled={!selectedText}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Font Size */}
          <Select onValueChange={(value) => applyFormatting({ fontSize: value as any })} disabled={!selectedText}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Tamanho" />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormatting({ listType: "bullet" })}
            disabled={!selectedText}
            title="Marcadores"
            className="h-9"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormatting({ listType: "numbered" })}
            disabled={!selectedText}
            title="Numeração"
            className="h-9"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormatting({ alignment: "left" })}
            disabled={!selectedText}
            title="Alinhar à Esquerda"
            className="h-9"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormatting({ alignment: "center" })}
            disabled={!selectedText}
            title="Centralizar"
            className="h-9"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyFormatting({ alignment: "right" })}
            disabled={!selectedText}
            title="Alinhar à Direita"
            className="h-9"
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Format Painter */}
          <Button
            size="sm"
            variant={formatPainter ? "default" : "outline"}
            onClick={() => {
              if (formatPainter) {
                applyPainterFormatting()
              } else if (selectedSegmentId) {
                const segment = segments.find((s) => s.id === selectedSegmentId)
                if (segment) {
                  setFormatPainter(segment.formatting)
                }
              }
            }}
            disabled={!selectedText && !formatPainter}
            title="Pincel de Formatação"
            className="h-9"
          >
            <Paintbrush className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Emojis */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" title="Inserir Emoji" className="h-9 bg-transparent">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <Label>Selecione um Emoji</Label>
                <div className="grid grid-cols-10 gap-1 max-h-60 overflow-y-auto">
                  {EMOJI_LIST.map((emoji, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="ghost"
                      onClick={() => insertEmoji(emoji)}
                      className="h-8 w-8 p-0 text-lg hover:bg-muted"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Image Attachment */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const input = document.createElement("input")
              input.type = "file"
              input.accept = "image/*"
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = () => {
                    insertEmoji(`\n[Imagem: ${file.name}]\n`)
                  }
                  reader.readAsDataURL(file)
                }
              }
              input.click()
            }}
            title="Anexar Imagem"
            className="h-9"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Line Break */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={insertLineBreak}
            className="h-9 bg-transparent"
            title="Quebrar Linha"
          >
            <CornerDownLeft className="h-4 w-4" />
          </Button>
        </div>

        {formatPainter && (
          <div className="mt-3 p-2 bg-primary/10 rounded-md">
            <p className="text-xs text-muted-foreground">
              Pincel de Formatação ativo! Selecione um texto para aplicar a formatação copiada.
            </p>
          </div>
        )}
      </Card>

      <textarea
        ref={textareaRef}
        id="content"
        value={value}
        onChange={(e) => onChange(e.target.value, segments)}
        onMouseUp={handleTextSelection}
        onKeyUp={handleTextSelection}
        placeholder={placeholder}
        rows={8}
        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />
      <p className="text-xs text-muted-foreground">
        💡 Selecione um trecho de texto acima e use as ferramentas de formatação para aplicar estilos
      </p>

      {/* Selected Text Indicator */}
      {selectedText && (
        <Card className="border-primary/50 bg-primary/5 p-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-primary">✓ Texto Selecionado:</p>
            <div className="p-2 bg-background rounded border border-border">
              <p className="text-sm break-words">"{selectedText}"</p>
            </div>
            <p className="text-xs text-muted-foreground">Clique em uma ferramenta acima para formatar</p>
          </div>
        </Card>
      )}

      {/* Formatted Segments */}
      {segments.length > 0 && (
        <Card className="p-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Segmentos Formatados ({segments.length})</h3>
            <div className="space-y-2">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="p-3 rounded border border-border hover:border-primary/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedSegmentId(segment.id === selectedSegmentId ? null : segment.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm break-words" style={getSegmentStyle(segment)}>
                        {segment.text}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSegment(segment.id)
                      }}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedSegmentId === segment.id && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFormatPainter(segment.formatting)
                        }}
                      >
                        <Paintbrush className="h-3 w-3 mr-2" />
                        Copiar Formatação
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
