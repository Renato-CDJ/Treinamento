"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichTextEditorWYSIWYG } from "@/components/rich-text-editor-wysiwyg"
import { AdminScriptPreview } from "@/components/admin-script-preview"
import { AdminPageHeader } from "@/components/admin-page-header"
import {
  Workflow,
  Plus,
  Trash2,
  Flag,
  ArrowRight,
  ArrowDown,
  AlertCircle,
  Eye,
  Rocket,
  Copy,
  ChevronUp,
  ChevronDown,
  CircleDot,
  CheckCircle2,
  Sparkles,
  Link2,
  PanelsTopLeft,
  Loader2,
  Network,
  List,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getPersonTypes } from "@/lib/store"
import { importScriptsFromJson } from "@/hooks/use-supabase-admin"
import { createClient } from "@/lib/supabase/client"
import type { PersonTypeOption, ScriptStep } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ScriptFlowCanvas, type NodePosition } from "@/components/admin-tabs/script-flow-canvas"

interface BuilderButton {
  id: string
  label: string
  next: string | null // target screen key, null = end of flow
  primary: boolean
}

interface BuilderTabulation {
  id: string
  name: string
  description: string
}

interface BuilderScreen {
  key: string
  title: string
  content: string
  isStart: boolean
  buttons: BuilderButton[]
  tabulations: BuilderTabulation[]
  alertTitle: string
  alertMessage: string
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

function createEmptyScreen(isStart = false, index = 1): BuilderScreen {
  return {
    key: uid("tela"),
    title: isStart ? "Abordagem" : `Tela ${index}`,
    content: "",
    isStart,
    buttons: [],
    tabulations: [],
    alertTitle: "",
    alertMessage: "",
  }
}

const CATEGORIES = [
  { value: "habitacional", label: "Habitacional" },
  { value: "comercial", label: "Comercial" },
  { value: "cartao", label: "Cartão" },
  { value: "outros", label: "Outros" },
  { value: "boleto_pre_formatado", label: "Boleto Pré-Formatado" },
]

export function ScriptBuilderTab() {
  const { toast } = useToast()
  const [personTypeOptions, setPersonTypeOptions] = useState<PersonTypeOption[]>([])
  const [publishing, setPublishing] = useState(false)

  // Roteiro config
  const [productName, setProductName] = useState("")
  const [category, setCategory] = useState("habitacional")
  const [attendanceTypes, setAttendanceTypes] = useState<("ativo" | "receptivo")[]>([])
  const [personTypes, setPersonTypes] = useState<string[]>([])

  // Screens (flow)
  const [screens, setScreens] = useState<BuilderScreen[]>(() => [createEmptyScreen(true)])
  const [selectedKey, setSelectedKey] = useState<string>(() => "")
  const [showPreview, setShowPreview] = useState(false)

  // Builder mode: "list" (classic) or "canvas" (visual interligado)
  const [builderMode, setBuilderMode] = useState<"list" | "canvas">("list")
  const [positions, setPositions] = useState<Record<string, NodePosition>>({})

  useEffect(() => {
    setPersonTypeOptions(getPersonTypes())
  }, [])

  // Keep a position for every screen on the canvas, and drop stale ones
  useEffect(() => {
    setPositions((prev) => {
      let changed = false
      const next: Record<string, NodePosition> = { ...prev }
      screens.forEach((s, i) => {
        if (!next[s.key]) {
          next[s.key] = { x: 80 + (i % 3) * 320, y: 60 + Math.floor(i / 3) * 260 }
          changed = true
        }
      })
      Object.keys(next).forEach((k) => {
        if (!screens.some((s) => s.key === k)) {
          delete next[k]
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [screens])

  useEffect(() => {
    // Ensure a screen is always selected
    if (!screens.find((s) => s.key === selectedKey) && screens.length > 0) {
      setSelectedKey(screens[0].key)
    }
  }, [screens, selectedKey])

  const selectedScreen = screens.find((s) => s.key === selectedKey) || null

  // ---- Screen operations ----
  const addScreen = () => {
    const newScreen = createEmptyScreen(false, screens.length)
    setScreens((prev) => [...prev, newScreen])
    setSelectedKey(newScreen.key)
    setShowPreview(false)
  }

  const setNodePosition = (key: string, pos: NodePosition) => {
    setPositions((prev) => ({ ...prev, [key]: pos }))
  }

  // Connect (or disconnect) a button to a target screen via the canvas
  const connectButton = (fromKey: string, btnId: string, toKey: string | null) => {
    updateButton(fromKey, btnId, { next: toKey })
  }

  const duplicateScreen = (key: string) => {
    const target = screens.find((s) => s.key === key)
    if (!target) return
    const copy: BuilderScreen = {
      ...target,
      key: uid("tela"),
      title: `${target.title} (cópia)`,
      isStart: false,
      buttons: target.buttons.map((b) => ({ ...b, id: uid("btn") })),
      tabulations: target.tabulations.map((t) => ({ ...t, id: uid("tab") })),
    }
    const idx = screens.findIndex((s) => s.key === key)
    setScreens((prev) => [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)])
    setSelectedKey(copy.key)
  }

  const removeScreen = (key: string) => {
    if (screens.length === 1) {
      toast({ title: "Não é possível remover", description: "O roteiro precisa de ao menos uma tela.", variant: "destructive" })
      return
    }
    const wasStart = screens.find((s) => s.key === key)?.isStart
    let next = screens.filter((s) => s.key !== key)
    // clean dangling button targets
    next = next.map((s) => ({
      ...s,
      buttons: s.buttons.map((b) => (b.next === key ? { ...b, next: null } : b)),
    }))
    // ensure a start screen exists
    if (wasStart && !next.some((s) => s.isStart)) {
      next = next.map((s, i) => (i === 0 ? { ...s, isStart: true } : s))
    }
    setScreens(next)
  }

  const moveScreen = (key: string, dir: "up" | "down") => {
    const idx = screens.findIndex((s) => s.key === key)
    if (idx === -1) return
    const swapWith = dir === "up" ? idx - 1 : idx + 1
    if (swapWith < 0 || swapWith >= screens.length) return
    const next = [...screens]
    ;[next[idx], next[swapWith]] = [next[swapWith], next[idx]]
    setScreens(next)
  }

  const setAsStart = (key: string) => {
    setScreens((prev) => prev.map((s) => ({ ...s, isStart: s.key === key })))
  }

  const updateScreen = (key: string, patch: Partial<BuilderScreen>) => {
    setScreens((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)))
  }

  // ---- Button operations ----
  const addButton = (screenKey: string) => {
    setScreens((prev) =>
      prev.map((s) =>
        s.key === screenKey
          ? {
              ...s,
              buttons: [
                ...s.buttons,
                { id: uid("btn"), label: "Novo Botão", next: null, primary: s.buttons.length === 0 },
              ],
            }
          : s,
      ),
    )
  }

  const updateButton = (screenKey: string, btnId: string, patch: Partial<BuilderButton>) => {
    setScreens((prev) =>
      prev.map((s) =>
        s.key === screenKey
          ? { ...s, buttons: s.buttons.map((b) => (b.id === btnId ? { ...b, ...patch } : b)) }
          : s,
      ),
    )
  }

  const removeButton = (screenKey: string, btnId: string) => {
    setScreens((prev) =>
      prev.map((s) => (s.key === screenKey ? { ...s, buttons: s.buttons.filter((b) => b.id !== btnId) } : s)),
    )
  }

  // ---- Tabulation operations ----
  const addTabulation = (screenKey: string) => {
    setScreens((prev) =>
      prev.map((s) =>
        s.key === screenKey
          ? { ...s, tabulations: [...s.tabulations, { id: uid("tab"), name: "", description: "" }] }
          : s,
      ),
    )
  }

  const updateTabulation = (screenKey: string, tabId: string, patch: Partial<BuilderTabulation>) => {
    setScreens((prev) =>
      prev.map((s) =>
        s.key === screenKey
          ? { ...s, tabulations: s.tabulations.map((t) => (t.id === tabId ? { ...t, ...patch } : t)) }
          : s,
      ),
    )
  }

  const removeTabulation = (screenKey: string, tabId: string) => {
    setScreens((prev) =>
      prev.map((s) =>
        s.key === screenKey ? { ...s, tabulations: s.tabulations.filter((t) => t.id !== tabId) } : s,
      ),
    )
  }

  const toggleAttendanceType = (type: "ativo" | "receptivo") => {
    setAttendanceTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const togglePersonType = (type: string) => {
    setPersonTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  // ---- Validation ----
  const validation = useMemo(() => {
    const issues: string[] = []
    if (!productName.trim()) issues.push("Defina o nome do roteiro/produto.")
    if (attendanceTypes.length === 0) issues.push("Selecione ao menos um tipo de atendimento.")
    if (personTypes.length === 0) issues.push("Selecione ao menos um tipo de pessoa.")
    if (!screens.some((s) => s.isStart)) issues.push("Marque uma tela inicial (Abordagem).")
    screens.forEach((s) => {
      if (!s.title.trim()) issues.push(`Uma tela está sem título.`)
    })
    // orphan screens (not start and not referenced)
    const referenced = new Set<string>()
    screens.forEach((s) => s.buttons.forEach((b) => b.next && referenced.add(b.next)))
    const orphans = screens.filter((s) => !s.isStart && !referenced.has(s.key))
    return { issues, orphans, valid: issues.length === 0 }
  }, [productName, attendanceTypes, personTypes, screens])

  const startScreen = screens.find((s) => s.isStart)

  // Build a ScriptStep for live preview from a builder screen
  const toScriptStep = (screen: BuilderScreen): ScriptStep => ({
    id: screen.key,
    title: screen.title,
    content: screen.content,
    order: screens.findIndex((s) => s.key === screen.key) + 1,
    buttons: screen.buttons.map((b, i) => ({
      id: b.id,
      label: b.label,
      nextStepId: b.next,
      variant: b.primary ? "primary" : "secondary",
      order: i,
      primary: b.primary,
    })),
    tabulations: screen.tabulations.filter((t) => t.name.trim()),
    alert: screen.alertMessage.trim()
      ? { title: screen.alertTitle || "Alerta Importante", message: screen.alertMessage, createdAt: new Date() }
      : undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const screenLabel = (key: string | null) => {
    if (!key) return "Fim do fluxo"
    return screens.find((s) => s.key === key)?.title || "Tela removida"
  }

  // ---- Publish ----
  const handlePublish = async () => {
    if (!validation.valid) {
      toast({
        title: "Revise o roteiro",
        description: validation.issues[0],
        variant: "destructive",
      })
      return
    }

    setPublishing(true)
    try {
      // Build the "marcas" structure expected by importScriptsFromJson
      const stepsObj: Record<string, any> = {}
      screens.forEach((screen) => {
        stepsObj[screen.key] = {
          id: screen.key,
          title: screen.title,
          body: screen.content,
          botoes: screen.buttons.map((b, i) => ({
            id: b.id,
            label: b.label,
            next: b.next,
            primary: b.primary,
            order: i,
          })),
          tabulations: screen.tabulations
            .filter((t) => t.name.trim())
            .map((t) => ({ id: t.id, name: t.name, description: t.description })),
          alerta: screen.alertMessage.trim()
            ? { title: screen.alertTitle || "Alerta Importante", message: screen.alertMessage }
            : null,
        }
      })

      // Reorder so the start screen comes first (import treats first as Abordagem fallback)
      const orderedKeys = [
        ...screens.filter((s) => s.isStart).map((s) => s.key),
        ...screens.filter((s) => !s.isStart).map((s) => s.key),
      ]
      const orderedSteps: Record<string, any> = {}
      orderedKeys.forEach((k) => {
        orderedSteps[k] = stepsObj[k]
      })

      const payload = { marcas: { [productName.trim()]: orderedSteps } }

      const result = await importScriptsFromJson(payload)

      if (result.stepCount === 0) {
        throw new Error("Nenhuma tela foi criada. Verifique a conexão com o banco de dados.")
      }

      // Update product config (attendance/person types) on the created product
      try {
        const supabase = createClient()
        const { data: prod } = await supabase
          .from("products")
          .select("id, details")
          .eq("name", productName.trim())
          .limit(1)
          .single()
        if (prod) {
          await supabase
            .from("products")
            .update({
              category,
              details: {
                ...(prod.details || {}),
                attendanceTypes,
                personTypes,
              },
            })
            .eq("id", prod.id)
        }
      } catch (e) {
        console.log("[v0] Could not update product config:", e)
      }

      toast({
        title: "Roteiro publicado!",
        description: `${result.stepCount} tela(s) criadas no produto "${productName.trim()}".`,
      })

      // Reset builder
      setProductName("")
      setCategory("habitacional")
      setAttendanceTypes([])
      setPersonTypes([])
      const fresh = createEmptyScreen(true)
      setScreens([fresh])
      setSelectedKey(fresh.key)
      setShowPreview(false)
    } catch (err: any) {
      toast({
        title: "Erro ao publicar",
        description: err?.message || "Não foi possível publicar o roteiro.",
        variant: "destructive",
      })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Workflow}
        title="Criar Novo Roteiro"
        description="Monte o fluxo de atendimento do zero conectando telas de forma visual e interativa"
      >
        <Button
          variant="outline"
          onClick={() => setShowPreview((v) => !v)}
          className="border-border/60"
          disabled={!selectedScreen}
        >
          <Eye className="h-4 w-4 mr-2" />
          {showPreview ? "Voltar a editar" : "Pré-visualizar"}
        </Button>
        <Button
          onClick={handlePublish}
          disabled={publishing || !validation.valid}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/20"
        >
          {publishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
          Publicar Roteiro
        </Button>
      </AdminPageHeader>

      {/* Step 1: Configuração do roteiro */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500/5 to-amber-500/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-bold shadow-sm">
              1
            </div>
            <div>
              <CardTitle className="text-base">Identidade do Roteiro</CardTitle>
              <CardDescription>Defina onde e para quem este fluxo aparece</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="builder-name">Nome do Roteiro / Produto *</Label>
              <Input
                id="builder-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: HABITACIONAL ATIVO"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="builder-category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="builder-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Tipo de Atendimento *</Label>
              <div className="flex gap-3 flex-wrap">
                {(["ativo", "receptivo"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleAttendanceType(type)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                      attendanceTypes.includes(type)
                        ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        : "border-border/60 text-muted-foreground hover:border-orange-500/40",
                    )}
                  >
                    {attendanceTypes.includes(type) ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <CircleDot className="h-4 w-4 opacity-50" />
                    )}
                    {type === "ativo" ? "Atendimento Ativo" : "Atendimento Receptivo"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Tipo de Pessoa *</Label>
              <div className="flex gap-3 flex-wrap">
                {personTypeOptions.map((pt) => (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => togglePersonType(pt.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                      personTypes.includes(pt.value)
                        ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "border-border/60 text-muted-foreground hover:border-blue-500/40",
                    )}
                  >
                    {personTypes.includes(pt.value) ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <CircleDot className="h-4 w-4 opacity-50" />
                    )}
                    Pessoa {pt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Construtor de fluxo */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-bold shadow-sm">
            2
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Construa o Fluxo</h3>
            <p className="text-sm text-muted-foreground">
              Adicione telas, escreva o conteúdo e conecte os botões para criar o caminho do atendimento
            </p>
          </div>
        </div>

        {/* Mode switch: Lista (clássico) x Visual (interligar telas) */}
        <div className="inline-flex items-center rounded-lg border border-border/60 bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => {
              setBuilderMode("list")
              setShowPreview(false)
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              builderMode === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="h-4 w-4" />
            Modo Lista
          </button>
          <button
            type="button"
            onClick={() => {
              setBuilderMode("canvas")
              setShowPreview(false)
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              builderMode === "canvas"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Network className="h-4 w-4" />
            Modo Visual
          </button>
        </div>
      </div>

      {/* Canvas mode: interligar telas visualmente */}
      {builderMode === "canvas" && (
        <ScriptFlowCanvas
          screens={screens.map((s) => ({
            key: s.key,
            title: s.title,
            isStart: s.isStart,
            buttons: s.buttons.map((b) => ({ id: b.id, label: b.label, next: b.next, primary: b.primary })),
            alertMessage: s.alertMessage,
          }))}
          positions={positions}
          selectedKey={selectedKey}
          onSelect={(key) => {
            setSelectedKey(key)
            setShowPreview(false)
          }}
          onMove={setNodePosition}
          onConnect={connectButton}
          onAddScreen={addScreen}
          onAddButton={addButton}
          onSetStart={setAsStart}
          onRemoveScreen={removeScreen}
        />
      )}

      <div
        className={cn(
          "grid grid-cols-1 gap-5",
          builderMode === "list" && "lg:grid-cols-[320px_1fr]",
        )}
      >
        {/* Flow map (left) — only in list mode */}
        {builderMode === "list" && (
        <div className="space-y-3">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <PanelsTopLeft className="h-4 w-4 text-orange-500" />
                Mapa do Fluxo
                <Badge variant="secondary" className="ml-auto">
                  {screens.length} {screens.length === 1 ? "tela" : "telas"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {screens.map((screen, index) => {
                const isSelected = screen.key === selectedKey
                const isOrphan = validation.orphans.some((o) => o.key === screen.key)
                return (
                  <div key={screen.key} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKey(screen.key)
                        setShowPreview(false)
                      }}
                      className={cn(
                        "w-full text-left rounded-lg border p-3 transition-all group",
                        isSelected
                          ? "border-orange-500 bg-orange-500/10 shadow-sm"
                          : "border-border/60 hover:border-orange-500/40 hover:bg-muted/40",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                            screen.isStart
                              ? "bg-green-500 text-white"
                              : isSelected
                                ? "bg-orange-500 text-white"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {screen.isStart ? <Flag className="h-3 w-3" /> : index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {screen.title || "Sem título"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {screen.isStart && (
                              <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase">
                                Inicial
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                              <Link2 className="h-3 w-3" />
                              {screen.buttons.length} botão(ões)
                            </span>
                            {screen.alertMessage.trim() && (
                              <AlertCircle className="h-3 w-3 text-amber-500" />
                            )}
                            {isOrphan && (
                              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase">
                                Sem conexão
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                    {index < screens.length - 1 && (
                      <div className="flex justify-center py-0.5">
                        <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                )
              })}

              <Button
                variant="outline"
                onClick={addScreen}
                className="w-full border-dashed border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Tela
              </Button>
            </CardContent>
          </Card>

          {/* Validation panel */}
          <Card
            className={cn(
              "border shadow-sm",
              validation.valid
                ? "border-green-500/40 bg-green-500/5"
                : "border-amber-500/40 bg-amber-500/5",
            )}
          >
            <CardContent className="pt-4">
              {validation.valid ? (
                <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Tudo pronto para publicar!
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Pendências
                  </p>
                  <ul className="space-y-1">
                    {validation.issues.map((issue, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        {/* Editor / Preview (right) */}
        <div>
          {showPreview && selectedScreen ? (
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  Pré-visualização (como o operador vê)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminScriptPreview step={toScriptStep(selectedScreen)} />
              </CardContent>
            </Card>
          ) : selectedScreen ? (
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                        selectedScreen.isStart
                          ? "bg-gradient-to-br from-green-500 to-green-600"
                          : "bg-gradient-to-br from-orange-500 to-orange-600",
                      )}
                    >
                      {selectedScreen.isStart ? (
                        <Flag className="h-5 w-5 text-white" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">Editar Tela</CardTitle>
                      <CardDescription>Configure o conteúdo e as conexões desta tela</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!selectedScreen.isStart && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAsStart(selectedScreen.key)}
                        title="Marcar como tela inicial"
                        className="text-green-600 hover:text-green-700 hover:bg-green-500/10"
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        Tornar inicial
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveScreen(selectedScreen.key, "up")}
                      title="Mover para cima"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveScreen(selectedScreen.key, "down")}
                      title="Mover para baixo"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => duplicateScreen(selectedScreen.key)}
                      title="Duplicar tela"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeScreen(selectedScreen.key)}
                      title="Excluir tela"
                      className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">Conteúdo</TabsTrigger>
                    <TabsTrigger value="buttons">Botões ({selectedScreen.buttons.length})</TabsTrigger>
                    <TabsTrigger value="extra">Tabulações & Alerta</TabsTrigger>
                  </TabsList>

                  {/* Content tab */}
                  <TabsContent value="content" className="space-y-4 mt-5">
                    <div className="space-y-2">
                      <Label htmlFor="screen-title">Título da Tela *</Label>
                      <Input
                        id="screen-title"
                        value={selectedScreen.title}
                        onChange={(e) => updateScreen(selectedScreen.key, { title: e.target.value })}
                        placeholder="Ex: Abordagem, Identificação Positiva, Negociação..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texto do Roteiro</Label>
                      <RichTextEditorWYSIWYG
                        value={selectedScreen.content}
                        onChange={(content) => updateScreen(selectedScreen.key, { content })}
                        placeholder="Escreva o que o operador deve falar nesta etapa. Use as ferramentas para formatar (negrito, cores, listas...)."
                      />
                    </div>
                  </TabsContent>

                  {/* Buttons tab */}
                  <TabsContent value="buttons" className="space-y-4 mt-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-semibold">Botões de Navegação</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Cada botão leva o operador para a próxima tela do fluxo
                        </p>
                      </div>
                      <Button size="sm" onClick={() => addButton(selectedScreen.key)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>

                    {selectedScreen.buttons.length === 0 ? (
                      <div className="rounded-lg border-2 border-dashed border-border/60 py-10 text-center">
                        <Link2 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Nenhum botão ainda. Sem botões, esta tela encerra o fluxo.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedScreen.buttons.map((button) => (
                          <Card key={button.id} className="border-border/60">
                            <CardContent className="pt-5 space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs">Texto do Botão</Label>
                                  <Input
                                    value={button.label}
                                    onChange={(e) =>
                                      updateButton(selectedScreen.key, button.id, { label: e.target.value })
                                    }
                                    placeholder="Ex: É O CLIENTE"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs flex items-center gap-1.5">
                                    <ArrowRight className="h-3 w-3" />
                                    Leva para a tela
                                  </Label>
                                  <Select
                                    value={button.next ?? "__end__"}
                                    onValueChange={(value) =>
                                      updateButton(selectedScreen.key, button.id, {
                                        next: value === "__end__" ? null : value,
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__end__">Fim do fluxo</SelectItem>
                                      {screens
                                        .filter((s) => s.key !== selectedScreen.key)
                                        .map((s) => (
                                          <SelectItem key={s.key} value={s.key}>
                                            {s.title || "Sem título"}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`primary-${button.id}`}
                                    checked={button.primary}
                                    onCheckedChange={(checked) =>
                                      updateButton(selectedScreen.key, button.id, { primary: !!checked })
                                    }
                                  />
                                  <label htmlFor={`primary-${button.id}`} className="text-sm cursor-pointer">
                                    Botão principal (destaque)
                                  </label>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeButton(selectedScreen.key, button.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remover
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Extra tab: tabulations + alert */}
                  <TabsContent value="extra" className="space-y-6 mt-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Tabulações Recomendadas</Label>
                        <Button size="sm" onClick={() => addTabulation(selectedScreen.key)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>
                      {selectedScreen.tabulations.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed border-border/60 py-6 text-center">
                          <p className="text-sm text-muted-foreground">Nenhuma tabulação adicionada.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedScreen.tabulations.map((tab, idx) => (
                            <Card key={tab.id} className="border-border/60">
                              <CardContent className="pt-5 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Tabulação {idx + 1}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeTabulation(selectedScreen.key, tab.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-500/10 h-7"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <Input
                                  value={tab.name}
                                  onChange={(e) =>
                                    updateTabulation(selectedScreen.key, tab.id, { name: e.target.value })
                                  }
                                  placeholder="Nome da tabulação. Ex: Acordo Fechado"
                                />
                                <Textarea
                                  value={tab.description}
                                  onChange={(e) =>
                                    updateTabulation(selectedScreen.key, tab.id, { description: e.target.value })
                                  }
                                  placeholder="Orientação para o operador..."
                                  rows={3}
                                />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          Alerta para o Operador
                        </CardTitle>
                        <CardDescription>Mensagem em destaque exibida ao abrir esta tela (opcional)</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Input
                          value={selectedScreen.alertTitle}
                          onChange={(e) => updateScreen(selectedScreen.key, { alertTitle: e.target.value })}
                          placeholder="Título do alerta. Ex: Atenção"
                        />
                        <Textarea
                          value={selectedScreen.alertMessage}
                          onChange={(e) => updateScreen(selectedScreen.key, { alertMessage: e.target.value })}
                          placeholder="Mensagem importante para o operador..."
                          rows={2}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-border/60">
              <CardContent className="py-16 text-center text-muted-foreground">
                Selecione ou adicione uma tela para começar.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
