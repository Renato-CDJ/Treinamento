"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { getAllUsers, addFeedback, getFeedbacks, updateFeedback, deleteFeedback } from "@/lib/store"
import type { Feedback, User } from "@/lib/types"
import {
  MessageSquare,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Star,
  Edit,
  Download,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export function FeedbackTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [operators, setOperators] = useState<User[]>([])
  const [admins, setAdmins] = useState<User[]>([]) // Added admins state for createdBy dropdown
  const [showDialog, setShowDialog] = useState(false)
  const [viewDialog, setViewDialog] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [filterType, setFilterType] = useState<"all" | "positive" | "negative">("all")
  const [filterOperator, setFilterOperator] = useState<string>("all")

  const [formData, setFormData] = useState({
    operatorId: "",
    callDate: "",
    callTime: "",
    ecNumber: "",
    feedbackType: "positive" as "positive" | "negative",
    severity: "leve" as "elogio" | "leve" | "medio" | "grave", // Added severity field
    score: 50,
    details: "",
    positivePoints: "",
    improvementPoints: "",
  })

  const loadData = () => {
    const allFeedbacks = getFeedbacks()
    setFeedbacks(allFeedbacks)

    const allUsers = getAllUsers()
    const operatorUsers = allUsers.filter((u) => u.role === "operator")
    const adminUsers = allUsers.filter((u) => u.role === "admin") // Load admin users
    setOperators(operatorUsers)
    setAdmins(adminUsers)
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener("store-updated", handleUpdate)
    return () => window.removeEventListener("store-updated", handleUpdate)
  }, [])

  const resetForm = () => {
    setFormData({
      operatorId: "",
      callDate: "",
      callTime: "",
      ecNumber: "",
      feedbackType: "positive",
      severity: "leve",
      score: 50,
      details: "",
      positivePoints: "",
      improvementPoints: "",
    })
  }

  const handleExportToExcel = () => {
    const csvContent = [
      ["Operador", "Tipo", "Gravidade", "Pontuação", "EC", "Data Ligação", "Aplicado Por", "Status", "Detalhes"],
      ...filteredFeedbacks.map((f) => [
        f.operatorName,
        f.feedbackType === "positive" ? "Positivo" : "Negativo",
        f.severity === "elogio"
          ? "Elogio"
          : f.severity === "leve"
            ? "Leve"
            : f.severity === "medio"
              ? "Médio"
              : "Grave",
        `${f.score}/100`,
        f.ecNumber,
        format(f.callDate, "dd/MM/yyyy HH:mm", { locale: ptBR }),
        f.createdByName,
        f.isRead ? "Lido" : "Não Lido",
        `"${f.details.replace(/"/g, '""')}"`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `feedbacks_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`
    link.click()

    toast({
      title: "Exportado com sucesso",
      description: "Os feedbacks foram exportados para Excel/CSV",
    })
  }

  const handleSubmit = () => {
    if (!user) return

    if (!formData.operatorId || !formData.callDate || !formData.callTime || !formData.ecNumber) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    const operator = operators.find((op) => op.id === formData.operatorId)
    if (!operator) return

    const callDateTime = new Date(`${formData.callDate}T${formData.callTime}`)

    if (selectedFeedback) {
      updateFeedback(selectedFeedback.id, {
        ...formData,
        callDate: callDateTime,
        operatorName: operator.fullName,
      })
      toast({
        title: "Feedback atualizado",
        description: `Feedback para ${operator.fullName} foi atualizado com sucesso`,
      })
    } else {
      addFeedback({
        operatorId: formData.operatorId,
        operatorName: operator.fullName,
        createdBy: user.id,
        createdByName: user.fullName,
        callDate: callDateTime,
        ecNumber: formData.ecNumber,
        feedbackType: formData.feedbackType,
        severity: formData.severity, // Added severity to creation
        score: formData.score,
        details: formData.details,
        positivePoints: formData.positivePoints,
        improvementPoints: formData.improvementPoints,
        isRead: false,
        isActive: true,
      })
      toast({
        title: "Feedback criado",
        description: `Feedback para ${operator.fullName} foi criado com sucesso`,
      })
    }

    setShowDialog(false)
    setSelectedFeedback(null)
    resetForm()
  }

  const handleEdit = (feedback: Feedback) => {
    setSelectedFeedback(feedback)
    const callDate = format(feedback.callDate, "yyyy-MM-dd")
    const callTime = format(feedback.callDate, "HH:mm")

    setFormData({
      operatorId: feedback.operatorId,
      callDate,
      callTime,
      ecNumber: feedback.ecNumber,
      feedbackType: feedback.feedbackType,
      severity: feedback.severity || "leve", // Handle legacy feedbacks without severity
      score: feedback.score,
      details: feedback.details,
      positivePoints: feedback.positivePoints,
      improvementPoints: feedback.improvementPoints,
    })
    setShowDialog(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este feedback?")) {
      deleteFeedback(id)
      toast({
        title: "Feedback excluído",
        description: "O feedback foi excluído com sucesso",
      })
    }
  }

  const handleView = (feedback: Feedback) => {
    setSelectedFeedback(feedback)
    setViewDialog(true)
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "elogio":
        return { label: "Elogio", className: "bg-blue-500 text-white" }
      case "leve":
        return { label: "Leve", className: "bg-yellow-500 text-white" }
      case "medio":
        return { label: "Médio", className: "bg-orange-500 text-white" }
      case "grave":
        return { label: "Grave", className: "bg-red-500 text-white" }
      default:
        return { label: "Leve", className: "bg-gray-500 text-white" }
    }
  }

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (filterType !== "all" && f.feedbackType !== filterType) return false
    if (filterOperator !== "all" && f.operatorId !== filterOperator) return false
    return true
  })

  const stats = {
    total: feedbacks.length,
    positive: feedbacks.filter((f) => f.feedbackType === "positive").length,
    negative: feedbacks.filter((f) => f.feedbackType === "negative").length,
    read: feedbacks.filter((f) => f.isRead).length,
    unread: feedbacks.filter((f) => !f.isRead).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Feedback</h2>
          <p className="text-muted-foreground">Envie feedbacks imediatos para os operadores</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportToExcel}
            variant="outline"
            className="border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950 bg-transparent"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button
            onClick={() => {
              setSelectedFeedback(null)
              resetForm()
              setShowDialog(true)
            }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Feedback
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positivos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negativos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.negative}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.read}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidos</CardTitle>
            <XCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unread}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Label>Tipo</Label>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="positive">Positivo</SelectItem>
                <SelectItem value="negative">Negativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label>Operador</Label>
            <Select value={filterOperator} onValueChange={setFilterOperator}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {operators.map((op) => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedbacks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feedbacks Registrados</CardTitle>
          <CardDescription>{filteredFeedbacks.length} feedback(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <ScrollArea className="h-[500px]">
              <div className="min-w-[1000px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operador</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Gravidade</TableHead>
                      <TableHead>Pontuação</TableHead>
                      <TableHead>EC</TableHead>
                      <TableHead>Data Ligação</TableHead>
                      <TableHead>Aplicado Por</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeedbacks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          Nenhum feedback encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFeedbacks.map((feedback) => {
                        const severityBadge = getSeverityBadge(feedback.severity || "leve")
                        return (
                          <TableRow key={feedback.id}>
                            <TableCell className="font-medium">{feedback.operatorName}</TableCell>
                            <TableCell>
                              <Badge variant={feedback.feedbackType === "positive" ? "default" : "destructive"}>
                                {feedback.feedbackType === "positive" ? (
                                  <>
                                    <TrendingUp className="mr-1 h-3 w-3" />
                                    Positivo
                                  </>
                                ) : (
                                  <>
                                    <TrendingDown className="mr-1 h-3 w-3" />
                                    Negativo
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={severityBadge.className}>{severityBadge.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="font-semibold">{feedback.score}/100</span>
                              </div>
                            </TableCell>
                            <TableCell>{feedback.ecNumber}</TableCell>
                            <TableCell>{format(feedback.callDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{feedback.createdByName}</TableCell>
                            <TableCell>
                              {feedback.isRead ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                                >
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Lido
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800"
                                >
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Não Lido
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleView(feedback)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(feedback)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(feedback.id)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedFeedback ? "Editar Feedback" : "Novo Feedback"}</DialogTitle>
            <DialogDescription>Preencha as informações do feedback para o operador</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Operador *</Label>
              <Select value={formData.operatorId} onValueChange={(v) => setFormData({ ...formData, operatorId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o operador" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.fullName} (@{op.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data da Ligação *</Label>
                <Input
                  type="date"
                  value={formData.callDate}
                  onChange={(e) => setFormData({ ...formData, callDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora da Ligação *</Label>
                <Input
                  type="time"
                  value={formData.callTime}
                  onChange={(e) => setFormData({ ...formData, callTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>EC da Ligação *</Label>
              <Input
                placeholder="Digite o número do EC"
                value={formData.ecNumber}
                onChange={(e) => setFormData({ ...formData, ecNumber: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Feedback</Label>
                <Select
                  value={formData.feedbackType}
                  onValueChange={(v) => setFormData({ ...formData, feedbackType: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positivo</SelectItem>
                    <SelectItem value="negative">Negativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nível de Gravidade</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(v) => setFormData({ ...formData, severity: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elogio">Elogio</SelectItem>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="grave">Grave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Pontuação (0-100)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: Number.parseInt(e.target.value) || 0 })}
                />
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
            </div>

            <div>
              <Label>Detalhes do Feedback</Label>
              <Textarea
                placeholder="Descreva o feedback sobre o atendimento"
                rows={4}
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              />
            </div>

            <div>
              <Label>Pontos Positivos</Label>
              <Textarea
                placeholder="Descreva os pontos positivos do atendimento"
                rows={3}
                value={formData.positivePoints}
                onChange={(e) => setFormData({ ...formData, positivePoints: e.target.value })}
              />
            </div>

            <div>
              <Label>Pontos a Melhorar</Label>
              <Textarea
                placeholder="Descreva os pontos que precisam ser melhorados"
                rows={3}
                value={formData.improvementPoints}
                onChange={(e) => setFormData({ ...formData, improvementPoints: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {selectedFeedback ? "Atualizar" : "Criar"} Feedback
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Feedback</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Operador</Label>
                  <p className="font-semibold text-foreground">{selectedFeedback.operatorName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <Badge
                    variant={selectedFeedback.feedbackType === "positive" ? "default" : "destructive"}
                    className="mt-1"
                  >
                    {selectedFeedback.feedbackType === "positive" ? "Positivo" : "Negativo"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Gravidade</Label>
                  <div className="mt-1">
                    <Badge className={getSeverityBadge(selectedFeedback.severity || "leve").className}>
                      {getSeverityBadge(selectedFeedback.severity || "leve").label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Pontuação</Label>
                  <p className="font-semibold text-foreground">{selectedFeedback.score}/100</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">EC da Ligação</Label>
                  <p className="font-semibold text-foreground">{selectedFeedback.ecNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data da Ligação</Label>
                  <p className="font-semibold text-foreground">
                    {format(selectedFeedback.callDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Aplicado Por</Label>
                <p className="font-semibold text-foreground">{selectedFeedback.createdByName}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Detalhes</Label>
                <p className="text-sm text-foreground">{selectedFeedback.details}</p>
              </div>

              {selectedFeedback.positivePoints && (
                <div>
                  <Label className="text-muted-foreground">Pontos Positivos</Label>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selectedFeedback.positivePoints}</p>
                </div>
              )}

              {selectedFeedback.improvementPoints && (
                <div>
                  <Label className="text-muted-foreground">Pontos a Melhorar</Label>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selectedFeedback.improvementPoints}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">
                  {selectedFeedback.isRead ? (
                    <Badge
                      variant="outline"
                      className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                    >
                      Lido em{" "}
                      {selectedFeedback.readAt && format(selectedFeedback.readAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800"
                    >
                      Não Lido
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
