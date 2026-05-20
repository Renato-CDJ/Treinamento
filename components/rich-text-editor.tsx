"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Bold, Italic, Trash2, Plus, CornerDownLeft } from "lucide-react"
import type { ContentSegment } from "@/lib/types"

interface RichTextEditorProps {
  value: string
  segments?: ContentSegment[]
  onChange: (content: string, segments: ContentSegment[]) => void
  placeholder?: string
}

export function RichTextEditor({
  value,
  segments = [],
  onChange,
  placeholder = "Digite o texto do roteiro...",
}: RichTextEditorProps) {
  const [selectedText, setSelectedText] = useState("")
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [editingSegment, setEditingSegment] = useState<ContentSegment | null>(null)
  const [tempColor, setTempColor] = useState("#000000")
  const [tempBgColor, setTempBgColor] = useState("#ffffff")
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
        id: `seg-${Date.now()}`,
        text: selectedText,
        formatting: {
          ...editingSegment?.formatting,
          ...formatting,
        },
      }

      const updatedSegments = editingSegment
        ? segments.map((s) => (s.id === editingSegment.id ? newSegment : s))
        : [...segments, newSegment]

      onChange(value, updatedSegments)
      setSelectedText("")
      setEditingSegment(null)
    },
    [selectedText, editingSegment, segments, onChange, value],
  )

  const removeSegment = useCallback(
    (id: string) => {
      const updatedSegments = segments.filter((s) => s.id !== id)
      onChange(value, updatedSegments)
      setSelectedSegmentId(null)
    },
    [segments, onChange, value],
  )

  const updateSegmentFormatting = useCallback(
    (id: string, formatting: Partial<ContentSegment["formatting"]>) => {
      const updatedSegments = segments.map((s) =>
        s.id === id
          ? {
              ...s,
              formatting: { ...s.formatting, ...formatting },
            }
          : s,
      )
      onChange(value, updatedSegments)
    },
    [segments, onChange, value],
  )

  const handleColorChange = useCallback(
    (color: string) => {
      setTempColor(color)
      // Apply color after a short delay to batch updates
      const timer = setTimeout(() => {
        applyFormatting({ color })
      }, 300)
      return () => clearTimeout(timer)
    },
    [applyFormatting],
  )

  const handleBgColorChange = useCallback(
    (color: string) => {
      setTempBgColor(color)
      // Apply background color after a short delay to batch updates
      const timer = setTimeout(() => {
        applyFormatting({ backgroundColor: color })
      }, 300)
      return () => clearTimeout(timer)
    },
    [applyFormatting],
  )

  const insertLineBreak = useCallback(() => {
    if (!textareaRef.current) return

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const newValue = value.substring(0, start) + "\n" + value.substring(end)

    onChange(newValue, segments)

    // Set cursor position after the inserted line break
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start + 1
        textareaRef.current.selectionEnd = start + 1
        textareaRef.current.focus()
      }
    }, 0)
  }, [value, segments, onChange])

  const getSegmentStyle = useMemo(
    () => (segment: ContentSegment) => ({
      fontWeight: segment.formatting.bold ? "bold" : "normal",
      fontStyle: segment.formatting.italic ? "italic" : "normal",
      color: segment.formatting.color || "inherit",
      backgroundColor: segment.formatting.backgroundColor || "transparent",
      fontSize:
        segment.formatting.fontSize === "sm"
          ? "0.875rem"
          : segment.formatting.fontSize === "lg"
            ? "1.125rem"
            : segment.formatting.fontSize === "xl"
              ? "1.25rem"
              : "1rem",
    }),
    [],
  )

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content">Conteúdo do Script</Label>
          <Button type="button" size="sm" variant="outline" onClick={insertLineBreak} className="h-8 bg-transparent">
            <CornerDownLeft className="h-4 w-4 mr-2" />
            Quebrar Linha
          </Button>
        </div>
        <textarea
          ref={textareaRef}
          id="content"
          value={value}
          onChange={(e) => onChange(e.target.value, segments)}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          placeholder={placeholder}
          rows={10}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          Selecione um trecho de texto e use os botões abaixo para aplicar formatação
        </p>
      </div>

      {selectedText && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Formatar Seleção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-background rounded border border-border">
              <p className="text-sm font-mono break-words">"{selectedText}"</p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => applyFormatting({ bold: true })} className="flex-1">
                  <Bold className="h-4 w-4 mr-2" />
                  Negrito
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyFormatting({ italic: true })}
                  className="flex-1"
                >
                  <Italic className="h-4 w-4 mr-2" />
                  Itálico
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Cor do Texto</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={tempColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-12 h-10 cursor-pointer"
                  />
                  <Input
                    type="color"
                    value={tempBgColor}
                    onChange={(e) => handleBgColorChange(e.target.value)}
                    placeholder="Cor de fundo"
                    className="w-12 h-10 cursor-pointer"
                    title="Cor de fundo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Tamanho da Fonte</Label>
                <p className="text-xs text-muted-foreground">
                  Aumenta ou diminui o tamanho do texto para destacar informações importantes
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {["sm", "base", "lg", "xl"].map((size) => (
                    <Button
                      key={size}
                      size="sm"
                      variant="outline"
                      onClick={() => applyFormatting({ fontSize: size as any })}
                      className="text-xs"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              <Button size="sm" variant="default" onClick={() => applyFormatting({})}>
                <Plus className="h-4 w-4 mr-2" />
                Aplicar Formatação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {segments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Segmentos Formatados ({segments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {segments.map((segment) => (
              <div
                key={segment.id}
                className="p-3 rounded border border-border hover:border-primary/50 cursor-pointer transition-colors"
                onClick={() => setSelectedSegmentId(segment.id)}
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
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {selectedSegmentId === segment.id && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div className="flex gap-2">
                      <Checkbox
                        checked={segment.formatting.bold || false}
                        onCheckedChange={(checked) => updateSegmentFormatting(segment.id, { bold: checked as boolean })}
                      />
                      <label className="text-xs cursor-pointer">Negrito</label>
                    </div>
                    <div className="flex gap-2">
                      <Checkbox
                        checked={segment.formatting.italic || false}
                        onCheckedChange={(checked) =>
                          updateSegmentFormatting(segment.id, { italic: checked as boolean })
                        }
                      />
                      <label className="text-xs cursor-pointer">Itálico</label>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={segment.formatting.color || "#000000"}
                        onChange={(e) => updateSegmentFormatting(segment.id, { color: e.target.value })}
                        className="w-10 h-8 cursor-pointer"
                      />
                      <span className="text-xs">Cor</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
