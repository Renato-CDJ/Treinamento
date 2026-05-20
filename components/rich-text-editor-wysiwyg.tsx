"use client"

import { useRef, useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  Bold,
  Italic,
  Underline,
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
  RotateCcw,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface RichTextEditorWYSIWYGProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
  minHeight?: string
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
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Verdana", value: "Verdana, sans-serif" },
  { name: "Times New Roman", value: "'Times New Roman', serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Courier New", value: "'Courier New', monospace" },
]

const FONT_SIZES = [
  { name: "Pequeno", value: "12px" },
  { name: "Normal", value: "16px" },
  { name: "Grande", value: "20px" },
  { name: "Extra Grande", value: "24px" },
  { name: "2X Grande", value: "28px" },
  { name: "3X Grande", value: "32px" },
]

export function RichTextEditorWYSIWYG({
  value,
  onChange,
  placeholder = "Digite seu script aqui...",
}: RichTextEditorWYSIWYGProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  })

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      const selection = window.getSelection()
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

      editorRef.current.innerHTML = value || ""

      // Restore cursor position if possible
      if (range && editorRef.current.contains(range.startContainer)) {
        try {
          selection?.removeAllRanges()
          selection?.addRange(range)
        } catch (e) {
          // Ignore errors from invalid range
        }
      }
    }
  }, [value])

  const updateContentDebounced = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      // Only trigger onChange if content actually changed
      if (content !== value) {
        onChange(content)
      }
    }
  }, [onChange, value])

  const executeCommand = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value)
      editorRef.current?.focus()
      updateContentDebounced()
      updateActiveFormats()
    },
    [updateContentDebounced],
  )

  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    })
  }, [])

  const handleSelectionChange = useCallback(() => {
    updateActiveFormats()
  }, [updateActiveFormats])

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange)
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
    }
  }, [handleSelectionChange])

  const insertEmoji = useCallback(
    (emoji: string) => {
      executeCommand("insertText", emoji)
    },
    [executeCommand],
  )

  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const img = `<img src="${event.target?.result}" alt="${file.name}" style="max-width: 100%; height: auto; display: block; margin: 10px 0;" />`
          document.execCommand("insertHTML", false, img)
          updateContentDebounced()
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }, [updateContentDebounced])

  const applyTextShadow = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const span = document.createElement("span")
      span.style.textShadow = "2px 2px 4px rgba(0,0,0,0.3)"
      range.surroundContents(span)
      updateContentDebounced()
    }
  }, [updateContentDebounced])

  const applyFontFamily = useCallback(
    (fontFamily: string) => {
      executeCommand("fontName", fontFamily)
    },
    [executeCommand],
  )

  const applyFontSize = useCallback(
    (fontSize: string) => {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const span = document.createElement("span")
        span.style.fontSize = fontSize
        range.surroundContents(span)
        updateContentDebounced()
      }
    },
    [updateContentDebounced],
  )

  const resetFormatting = useCallback(() => {
    if (editorRef.current) {
      // Remove all formatting tags mas mantém o texto
      const text = editorRef.current.innerText
      editorRef.current.innerHTML = text
      onChange(text)
      updateActiveFormats()
    }
  }, [onChange, updateActiveFormats])

  return (
    <div className="space-y-3">
      <Label htmlFor="content" className="text-base font-semibold">
        Conteúdo do Script
      </Label>

      <Card className="p-3 bg-muted/30">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Text Styling */}
          <Button
            size="sm"
            variant={activeFormats.bold ? "default" : "outline"}
            onClick={() => executeCommand("bold")}
            title="Negrito (Ctrl+B)"
            className={`h-9 transition-all ${activeFormats.bold ? "shadow-md" : ""}`}
            type="button"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeFormats.italic ? "default" : "outline"}
            onClick={() => executeCommand("italic")}
            title="Itálico (Ctrl+I)"
            className={`h-9 transition-all ${activeFormats.italic ? "shadow-md" : ""}`}
            type="button"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeFormats.underline ? "default" : "outline"}
            onClick={() => executeCommand("underline")}
            title="Sublinhado (Ctrl+U)"
            className={`h-9 transition-all ${activeFormats.underline ? "shadow-md" : ""}`}
            type="button"
          >
            <Underline className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Shadow */}
          <Button
            size="sm"
            variant="outline"
            onClick={applyTextShadow}
            title="Sombra de Texto"
            className="h-9 bg-transparent"
            type="button"
          >
            <Type className="h-4 w-4" />
          </Button>

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" title="Cor do Texto" className="h-9 bg-transparent" type="button">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <Label>Cor do Texto</Label>
                <Input
                  type="color"
                  onChange={(e) => executeCommand("foreColor", e.target.value)}
                  className="w-full h-10 cursor-pointer"
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Background Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" title="Cor de Fundo" className="h-9 bg-transparent" type="button">
                <Paintbrush className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <Label>Cor de Fundo</Label>
                <Input
                  type="color"
                  onChange={(e) => executeCommand("backColor", e.target.value)}
                  className="w-full h-10 cursor-pointer"
                />
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6" />

          {/* Font Family */}
          <Select onValueChange={applyFontFamily}>
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
          <Select onValueChange={applyFontSize}>
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
            variant={activeFormats.insertUnorderedList ? "default" : "outline"}
            onClick={() => executeCommand("insertUnorderedList")}
            title="Marcadores"
            className="h-9"
            type="button"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeFormats.insertOrderedList ? "default" : "outline"}
            onClick={() => executeCommand("insertOrderedList")}
            title="Numeração"
            className="h-9"
            type="button"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <Button
            size="sm"
            variant={activeFormats.justifyLeft ? "default" : "outline"}
            onClick={() => executeCommand("justifyLeft")}
            title="Alinhar à Esquerda"
            className="h-9"
            type="button"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeFormats.justifyCenter ? "default" : "outline"}
            onClick={() => executeCommand("justifyCenter")}
            title="Centralizar"
            className="h-9"
            type="button"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeFormats.justifyRight ? "default" : "outline"}
            onClick={() => executeCommand("justifyRight")}
            title="Alinhar à Direita"
            className="h-9"
            type="button"
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Emojis */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" title="Inserir Emoji" className="h-9 bg-transparent" type="button">
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
                      type="button"
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
            onClick={handleImageUpload}
            title="Anexar Imagem"
            className="h-9 bg-transparent"
            type="button"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={resetFormatting}
            title="Resetar Formatação"
            className="h-9 bg-transparent"
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <div
        ref={editorRef}
        contentEditable
        onInput={updateContentDebounced}
        onBlur={updateContentDebounced}
        onMouseUp={updateActiveFormats}
        onKeyUp={updateActiveFormats}
        className="min-h-[200px] w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
        style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        role="textbox"
        aria-label="Editor de texto formatado"
        aria-multiline="true"
      />

      <p className="text-xs text-muted-foreground">
        💡 Selecione um trecho de texto e use as ferramentas de formatação acima para aplicar estilos diretamente
      </p>

    </div>
  )
}
