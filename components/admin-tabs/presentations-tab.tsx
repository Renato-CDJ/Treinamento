"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  FileText,
  Loader2,
  Eye,
  Download,
  BookOpen,
  Search,
  BarChart2,
  Users,
  RefreshCw,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Training {
  id: string
  title: string
  filename: string
  url: string
  size: number
  uploadedAt: string
}

interface TrainingView {
  id: string
  training_filename: string
  training_title: string
  user_id: string
  user_name: string
  viewed_at: string
}

export function PresentationsTab() {
  const { toast } = useToast()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Estado do relatório
  const [reportOpen, setReportOpen] = useState(false)
  const [reportTraining, setReportTraining] = useState<Training | null>(null)
  const [views, setViews] = useState<TrainingView[]>([])
  const [viewsLoading, setViewsLoading] = useState(false)
  const [allViewsCount, setAllViewsCount] = useState<Record<string, number>>({})

  // Busca PDFs da pasta public/presentations/slides
  const loadTrainings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/trainings")
      if (!res.ok) throw new Error("Erro ao carregar treinamentos")
      const data = await res.json()
      setTrainings(data.trainings || [])
    } catch (error) {
      console.error("[v0] Error loading trainings:", error)
      toast({ title: "Erro", description: "Falha ao carregar treinamentos.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Busca contagem total de visualizações por arquivo
  const loadAllViewsCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/trainings/views")
      if (!res.ok) return
      const data = await res.json()
      const counts: Record<string, number> = {}
      for (const v of data.views as TrainingView[]) {
        counts[v.training_filename] = (counts[v.training_filename] || 0) + 1
      }
      setAllViewsCount(counts)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    loadTrainings()
    loadAllViewsCounts()
  }, [loadTrainings, loadAllViewsCounts])

  // Abre relatório de um PDF específico
  const openReport = async (training: Training) => {
    setReportTraining(training)
    setReportOpen(true)
    setViewsLoading(true)
    try {
      const res = await fetch(`/api/trainings/views?filename=${encodeURIComponent(training.filename)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setViews(data.views || [])
    } catch {
      toast({ title: "Erro", description: "Falha ao carregar relatório.", variant: "destructive" })
    } finally {
      setViewsLoading(false)
    }
  }

  // Exporta relatório como CSV
  const exportCSV = () => {
    if (!reportTraining || views.length === 0) return

    const header = ["Operador", "Data", "Hora"]
    const rows = views.map((v) => {
      const d = new Date(v.viewed_at)
      return [
        v.user_name,
        format(d, "dd/MM/yyyy", { locale: ptBR }),
        format(d, "HH:mm:ss", { locale: ptBR }),
      ]
    })

    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `visualizacoes-${reportTraining.filename.replace(".pdf", "")}-${format(new Date(), "dd-MM-yyyy")}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return ""
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const filteredTrainings = trainings.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.filename.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalViews = Object.values(allViewsCount).reduce((a, b) => a + b, 0)

  // Operadores únicos que já visualizaram qualquer treinamento
  const uniqueViewersTotal = new Set(
    Object.values(allViewsCount)
  ).size

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-orange-500" />
            Treinamentos
          </h2>
          <p className="text-muted-foreground text-sm">
            PDFs detectados automaticamente em{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              public/presentations/slides/
            </code>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { loadTrainings(); loadAllViewsCounts() }}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">PDFs disponíveis</p>
                <p className="text-2xl font-bold">{trainings.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de visualizações</p>
                <p className="text-2xl font-bold text-orange-500">{totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">PDFs com visualizações</p>
                <p className="text-2xl font-bold text-green-500">
                  {Object.keys(allViewsCount).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar treinamentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Trainings List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Treinamentos</CardTitle>
          <CardDescription>
            {filteredTrainings.length} treinamento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTrainings.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium mb-1">
                {searchQuery
                  ? "Nenhum treinamento encontrado para esta pesquisa."
                  : "Nenhum PDF encontrado."}
              </p>
              {!searchQuery && (
                <p className="text-sm text-muted-foreground">
                  Adicione arquivos <strong>.pdf</strong> na pasta{" "}
                  <code className="bg-muted px-1 rounded">public/presentations/slides/</code>
                </p>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[420px]">
              <div className="space-y-3">
                {filteredTrainings.map((training) => (
                  <div
                    key={training.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-3 bg-orange-500/10 rounded-lg shrink-0">
                        <FileText className="h-6 w-6 text-orange-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold truncate">{training.title}</h4>
                          {allViewsCount[training.filename] ? (
                            <Badge
                              variant="secondary"
                              className="bg-orange-500/10 text-orange-600 border-orange-500/20 shrink-0"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {allViewsCount[training.filename]} visualização(ões)
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="shrink-0 text-muted-foreground">
                              Nenhuma visualização
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="truncate max-w-[200px]">{training.filename}</span>
                          {training.size > 0 && <span>{formatFileSize(training.size)}</span>}
                          {training.uploadedAt && (
                            <span>
                              {format(new Date(training.uploadedAt), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      {/* Relatório de visualizações */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openReport(training)}
                        title="Ver relatório de visualizações"
                      >
                        <BarChart2 className="h-4 w-4 text-orange-500" />
                      </Button>
                      {/* Abrir PDF */}
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="Visualizar PDF"
                      >
                        <a href={training.url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      {/* Download PDF */}
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="Baixar PDF"
                      >
                        <a href={training.url} download={training.filename}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Modal de Relatório */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-orange-500" />
              Relatório de Visualizações
            </DialogTitle>
            <DialogDescription className="truncate">
              {reportTraining?.title} — {reportTraining?.filename}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Resumo */}
            <div className="flex items-center gap-4">
              <div className="flex-1 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-500">{views.length}</p>
                <p className="text-xs text-muted-foreground">Total de visualizações</p>
              </div>
              <div className="flex-1 p-3 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">
                  {new Set(views.map((v) => v.user_id)).size}
                </p>
                <p className="text-xs text-muted-foreground">Operadores únicos</p>
              </div>
              <div className="flex-1 p-3 bg-muted rounded-lg text-center">
                <p className="text-sm font-medium">
                  {views.length > 0
                    ? format(new Date(views[0].viewed_at), "dd/MM/yyyy", { locale: ptBR })
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Última visualização</p>
              </div>
            </div>

            {/* Tabela */}
            {viewsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : views.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Nenhum operador visualizou este treinamento ainda.</p>
              </div>
            ) : (
              <ScrollArea className="h-64 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operador</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {views.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.user_name}</TableCell>
                        <TableCell>
                          {format(new Date(v.viewed_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(v.viewed_at), "HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            {/* Ações */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setReportOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
              <Button
                onClick={exportCSV}
                disabled={views.length === 0}
                className="bg-orange-500 hover:bg-orange-600 gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar Relatório CSV
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
