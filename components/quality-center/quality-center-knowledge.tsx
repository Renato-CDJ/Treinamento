"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Search,
  BookMarked,
  ArrowLeft,
  Phone,
  CreditCard,
  Briefcase,
  FileSignature,
  Tags,
  Home,
  ListChecks,
  Receipt,
  ShieldAlert,
  Headset,
  FileText,
  ChevronRight,
  Library,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface KnowledgeDoc {
  id: string
  title: string
  body: string
  fileName: string
}

interface Topic {
  fileName: string
  title: string
  sections: { id: string; title: string; body: string }[]
}

// Mapeia um icone e uma cor para cada documento com base no nome do arquivo.
function getTopicVisual(fileName: string): { icon: typeof Phone; color: string } {
  const name = fileName.toLowerCase()
  if (name.includes("canais")) return { icon: Phone, color: "text-sky-500 bg-sky-500/10" }
  if (name.includes("cartao") && name.includes("parcel")) return { icon: Receipt, color: "text-emerald-500 bg-emerald-500/10" }
  if (name.includes("cartao") || name.includes("credito")) return { icon: CreditCard, color: "text-violet-500 bg-violet-500/10" }
  if (name.includes("comercial")) return { icon: Briefcase, color: "text-amber-500 bg-amber-500/10" }
  if (name.includes("contrato")) return { icon: FileSignature, color: "text-blue-500 bg-blue-500/10" }
  if (name.includes("descricao") && name.includes("tabula")) return { icon: Tags, color: "text-pink-500 bg-pink-500/10" }
  if (name.includes("habitacional")) return { icon: Home, color: "text-teal-500 bg-teal-500/10" }
  if (name.includes("orienta") && name.includes("tabula")) return { icon: ListChecks, color: "text-orange-500 bg-orange-500/10" }
  if (name.includes("procedimento") || name.includes("divida")) return { icon: ShieldAlert, color: "text-rose-500 bg-rose-500/10" }
  if (name.includes("situac") || name.includes("atendimento")) return { icon: Headset, color: "text-cyan-500 bg-cyan-500/10" }
  return { icon: FileText, color: "text-orange-500 bg-orange-500/10" }
}

// Detecta se uma linha e um titulo de secao (ex.: "LIGACAO MUDA:", "CAIXA POSTAL:").
function isHeading(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length === 0 || trimmed.length > 70) return false
  // Remove o ":" final para avaliar o conteudo.
  const core = trimmed.replace(/:$/, "").trim()
  if (core.length === 0) return false
  const letters = core.replace(/[^a-zA-Z\u00C0-\u017F]/g, "")
  if (letters.length === 0) return false
  const isUpper = core === core.toUpperCase()
  const endsWithColon = trimmed.endsWith(":")
  // E titulo se estiver em maiusculas, ou se for uma linha curta terminada em ":".
  return isUpper || (endsWithColon && core.split(/\s+/).length <= 6)
}

// Renderiza o corpo do texto preservando quebras de linha, titulos e listas simples.
function RichBody({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  const blocks: { type: "list" | "text" | "heading"; items: string[] }[] = []

  for (const line of lines) {
    const isBullet = line.startsWith("- ") || line.startsWith("• ")
    const last = blocks[blocks.length - 1]
    if (isBullet) {
      const item = line.replace(/^[-•]\s+/, "")
      if (last && last.type === "list") last.items.push(item)
      else blocks.push({ type: "list", items: [item] })
    } else if (isHeading(line)) {
      blocks.push({ type: "heading", items: [line.replace(/:$/, "").trim()] })
    } else {
      blocks.push({ type: "text", items: [line] })
    }
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.type === "list") {
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )
        }
        if (block.type === "heading") {
          return (
            <div key={i} className="flex items-center gap-2 pt-2 first:pt-0">
              <span className="h-4 w-1 shrink-0 rounded-full bg-orange-500" />
              <h4 className="text-sm font-bold uppercase tracking-wide text-foreground">
                {block.items[0]}
              </h4>
            </div>
          )
        }
        return (
          <p key={i} className="text-sm leading-relaxed text-muted-foreground">
            {block.items[0]}
          </p>
        )
      })}
    </div>
  )
}

function fileTitle(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
}

export function QualityCenterKnowledge() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch("/api/assistant-knowledge")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        setDocs(Array.isArray(data.documents) ? data.documents : [])
        setError(false)
      })
      .catch(() => {
        if (!active) return
        setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Agrupa as secoes por arquivo (cada documento = um topico).
  const topics = useMemo<Topic[]>(() => {
    const map = new Map<string, Topic>()
    for (const doc of docs) {
      if (!map.has(doc.fileName)) {
        map.set(doc.fileName, {
          fileName: doc.fileName,
          title: fileTitle(doc.fileName),
          sections: [],
        })
      }
      map.get(doc.fileName)!.sections.push({ id: doc.id, title: doc.title, body: doc.body })
    }
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, "pt-BR"))
  }, [docs])

  const normalized = search.trim().toLowerCase()

  // Resultados de busca (achatados entre todos os topicos).
  const searchResults = useMemo(() => {
    if (!normalized) return []
    return docs
      .filter(
        (d) =>
          d.title.toLowerCase().includes(normalized) ||
          d.body.toLowerCase().includes(normalized) ||
          fileTitle(d.fileName).toLowerCase().includes(normalized)
      )
      .map((d) => ({ ...d, topicTitle: fileTitle(d.fileName) }))
  }, [docs, normalized])

  const activeTopic = topics.find((t) => t.fileName === selectedFile) || null

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="mt-4 text-sm text-muted-foreground">Carregando conteudos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-orange-500/10 p-2">
          <Library className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Base de Conhecimento</h2>
          <p className="text-sm text-muted-foreground">
            Consulte todas as informacoes de apoio ao atendimento organizadas por tema
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setSelectedFile(null)
          }}
          placeholder="Buscar em todos os conteudos..."
          className="h-11 pl-10"
        />
      </div>

      {error && (
        <Card className="border-border/50">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nao foi possivel carregar os conteudos. Tente novamente mais tarde.
            </p>
          </CardContent>
        </Card>
      )}

      {!error && topics.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
              <BookMarked className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">Nenhum conteudo disponivel</p>
            <p className="text-sm text-muted-foreground">Novos materiais serao adicionados em breve</p>
          </CardContent>
        </Card>
      )}

      {/* Search results */}
      {normalized && !error && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {searchResults.length} resultado(s) para{" "}
            <span className="font-medium text-foreground">&quot;{search}&quot;</span>
          </p>
          {searchResults.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            searchResults.map((r) => {
              const visual = getTopicVisual(r.fileName)
              const Icon = visual.icon
              return (
                <Card key={r.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={cn("rounded-md p-1.5", visual.color)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {r.topicTitle}
                      </Badge>
                    </div>
                    <h4 className="mb-1.5 font-semibold text-foreground">{r.title}</h4>
                    <RichBody text={r.body} />
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Topic grid */}
      {!normalized && !error && !activeTopic && topics.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => {
            const visual = getTopicVisual(topic.fileName)
            const Icon = visual.icon
            return (
              <button
                key={topic.fileName}
                onClick={() => setSelectedFile(topic.fileName)}
                className="group text-left"
              >
                <Card className="h-full border-border/50 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500/50 hover:shadow-lg">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className={cn("mb-4 w-fit rounded-xl p-3", visual.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-1 font-semibold leading-snug text-foreground text-pretty">
                      {topic.title}
                    </h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      {topic.sections.length} {topic.sections.length === 1 ? "topico" : "topicos"}
                    </p>
                    <div className="mt-auto flex items-center gap-1 text-sm font-medium text-orange-500">
                      Abrir conteudo
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      )}

      {/* Topic detail */}
      {!normalized && activeTopic && (
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedFile(null)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos temas
          </Button>

          <div className="flex items-center gap-3">
            {(() => {
              const visual = getTopicVisual(activeTopic.fileName)
              const Icon = visual.icon
              return (
                <span className={cn("rounded-xl p-3", visual.color)}>
                  <Icon className="h-6 w-6" />
                </span>
              )
            })()}
            <div>
              <h3 className="text-lg font-bold text-foreground">{activeTopic.title}</h3>
              <p className="text-sm text-muted-foreground">
                {activeTopic.sections.length} {activeTopic.sections.length === 1 ? "topico" : "topicos"}
              </p>
            </div>
          </div>

          <Card className="border-border/50">
            <CardContent className="p-2 sm:p-4">
              <Accordion type="multiple" className="w-full">
                {activeTopic.sections.map((section) => (
                  <AccordionItem key={section.id} value={section.id} className="border-border/50">
                    <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                      {section.title}
                    </AccordionTrigger>
                    <AccordionContent>
                      {section.body ? (
                        <RichBody text={section.body} />
                      ) : (
                        <p className="text-sm italic text-muted-foreground">Sem detalhes adicionais.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
