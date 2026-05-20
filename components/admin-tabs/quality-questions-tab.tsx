"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  getQualityQuestions,
  answerQualityQuestion,
  deleteQualityQuestion,
} from "@/lib/store"
import type { QualityQuestion } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  HelpCircle,
  MessageSquare,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Filter,
  User,
  RotateCcw,
  History,
} from "lucide-react"

export function QualityQuestionsTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [questions, setQuestions] = useState<QualityQuestion[]>([])
  const [answerText, setAnswerText] = useState<Record<string, string>>({})
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "answered" | "resolved" | "reopened">("all")
  const [filterOperator, setFilterOperator] = useState<string>("all")

  const loadData = () => {
    const allQuestions = getQualityQuestions()
    setQuestions(allQuestions)
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener("store-updated", handleUpdate)
    return () => window.removeEventListener("store-updated", handleUpdate)
  }, [])

  const uniqueOperators = useMemo(() => {
    const ops = new Map<string, string>()
    questions.forEach((q) => ops.set(q.operatorId, q.operatorName))
    return Array.from(ops.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [questions])

  const filteredQuestions = useMemo(() => {
    let list = [...questions]
    // Operator filter
    if (filterOperator !== "all") {
      list = list.filter((q) => q.operatorId === filterOperator)
    }
    // Status filter
    if (filterStatus === "pending") {
      list = list.filter((q) => !q.answer && !q.reopenReason)
    } else if (filterStatus === "answered") {
      list = list.filter((q) => q.answer && !q.isResolved)
    } else if (filterStatus === "resolved") {
      list = list.filter((q) => q.isResolved)
    } else if (filterStatus === "reopened") {
      list = list.filter((q) => !q.answer && !!q.reopenReason)
    }
    return list.sort((a, b) => {
      // Reopened first, then pending, then answered, then resolved
      const aReopened = !a.answer && !!a.reopenReason
      const bReopened = !b.answer && !!b.reopenReason
      if (aReopened && !bReopened) return -1
      if (!aReopened && bReopened) return 1
      if (!a.answer && b.answer) return -1
      if (a.answer && !b.answer) return 1
      if (!a.isResolved && b.isResolved) return -1
      if (a.isResolved && !b.isResolved) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [questions, filterStatus, filterOperator])

  const pendingCount = questions.filter((q) => !q.answer && !q.reopenReason).length
  const reopenedCount = questions.filter((q) => !q.answer && !!q.reopenReason).length
  const answeredCount = questions.filter((q) => q.answer && !q.isResolved).length
  const resolvedCount = questions.filter((q) => q.isResolved).length
  const notClearCount = questions.filter((q) => q.isResolved && q.wasClear === false).length

  const handleAnswer = (questionId: string) => {
    const text = answerText[questionId]?.trim()
    if (!text || !user) return

    answerQualityQuestion(questionId, text, user.id, user.fullName)
    setAnswerText((prev) => ({ ...prev, [questionId]: "" }))
    loadData()
    toast({
      title: "Resposta enviada",
      description: "O operador sera notificado da sua resposta.",
    })
  }

  const handleDelete = (id: string) => {
    deleteQualityQuestion(id)
    loadData()
    toast({
      title: "Pergunta removida",
      description: "A pergunta foi removida com sucesso.",
    })
  }

  const getStatusBadge = (q: QualityQuestion) => {
    if (q.isResolved && q.wasClear) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white text-[10px]">
          <ThumbsUp className="h-3 w-3 mr-1" />
          Esclarecido
        </Badge>
      )
    }
    if (q.isResolved && q.wasClear === false) {
      return (
        <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px]">
          <ThumbsDown className="h-3 w-3 mr-1" />
          Nao esclarecido
        </Badge>
      )
    }
    if (q.answer) {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-[10px]">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Respondida
        </Badge>
      )
    }
    if (q.reopenReason) {
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-[10px]">
          <RotateCcw className="h-3 w-3 mr-1" />
          Reaberta
        </Badge>
      )
    }
    return (
      <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px]">
        <Clock className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Pergunte para Qualidade</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as perguntas enviadas pelos operadores
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{reopenedCount}</p>
                <p className="text-xs text-muted-foreground">Reabertas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{answeredCount}</p>
                <p className="text-xs text-muted-foreground">Aguardando</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{resolvedCount}</p>
                <p className="text-xs text-muted-foreground">Resolvidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ThumbsDown className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{notClearCount}</p>
                <p className="text-xs text-muted-foreground">Nao Esclarecidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Status:</span>
          {(["all", "pending", "reopened", "answered", "resolved"] as const).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={filterStatus === status ? "default" : "outline"}
              onClick={() => setFilterStatus(status)}
              className={`text-xs ${
                filterStatus === status
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : ""
              }`}
            >
              {status === "all" && "Todas"}
              {status === "pending" && `Pendentes (${pendingCount})`}
              {status === "reopened" && `Reabertas (${reopenedCount})`}
              {status === "answered" && `Respondidas (${answeredCount})`}
              {status === "resolved" && `Resolvidas (${resolvedCount})`}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Select value={filterOperator} onValueChange={setFilterOperator}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue placeholder="Filtrar por operador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os operadores</SelectItem>
              {uniqueOperators.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
              <HelpCircle className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">Nenhuma pergunta encontrada</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Perguntas dos operadores aparecerao aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <Card
              key={q.id}
              className={`overflow-hidden transition-all border backdrop-blur-sm ${
                !q.answer && q.reopenReason
                  ? "border-orange-500/20 bg-orange-500/[0.02]"
                  : !q.answer
                    ? "border-amber-500/20 bg-amber-500/[0.015]"
                    : q.isResolved && q.wasClear === false
                      ? "border-red-500/20 bg-red-500/[0.01]"
                      : q.isResolved
                        ? "border-border/30 bg-transparent opacity-70"
                        : "border-blue-500/20 bg-blue-500/[0.015]"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      !q.answer && q.reopenReason ? "bg-orange-500" : !q.answer ? "bg-amber-500" : q.isResolved ? "bg-muted" : "bg-blue-500"
                    }`}>
                      <HelpCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-semibold truncate">{q.operatorName}</CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(q.createdAt).toLocaleDateString("pt-BR")} as{" "}
                        {new Date(q.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(q)}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(q.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Question */}
                <div className="rounded-lg bg-muted/30 border border-border/50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Pergunta</p>
                  <p className="text-sm leading-relaxed break-words text-foreground">{q.question}</p>
                </div>

                {/* Reopen reason */}
                {q.reopenReason && !q.answer && (
                  <div className="rounded-lg bg-orange-500/5 border border-orange-500/20 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <RotateCcw className="h-3.5 w-3.5 text-orange-500" />
                      <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">Motivo da reabertura</p>
                    </div>
                    <p className="text-sm leading-relaxed break-words text-foreground">{q.reopenReason}</p>
                    {q.reopenedAt && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        Reaberta em {new Date(q.reopenedAt).toLocaleDateString("pt-BR")} as{" "}
                        {new Date(q.reopenedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                )}

                {/* Previous answers history */}
                {q.previousAnswers && q.previousAnswers.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <History className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Respostas anteriores ({q.previousAnswers.length})
                      </p>
                    </div>
                    {q.previousAnswers.map((prev, idx) => (
                      <div key={idx} className="rounded-lg bg-muted/20 border border-border/30 p-2.5 space-y-1.5">
                        <p className="text-xs text-foreground">{prev.answer}</p>
                        <p className="text-[10px] text-muted-foreground">
                          por {prev.answeredByName} - {new Date(prev.answeredAt).toLocaleDateString("pt-BR")} as{" "}
                          {new Date(prev.answeredAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <div className="rounded bg-red-500/5 border border-red-500/10 px-2 py-1">
                          <p className="text-[10px] text-red-600 dark:text-red-400">
                            Motivo da reabertura: {prev.reopenReason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing answer */}
                {q.answer && (
                  <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Resposta</p>
                      {q.answeredByName && (
                        <span className="text-[10px] text-muted-foreground">por {q.answeredByName}</span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed break-words text-foreground">{q.answer}</p>
                    {q.answeredAt && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {new Date(q.answeredAt).toLocaleDateString("pt-BR")} as{" "}
                        {new Date(q.answeredAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                )}

                {/* Resolution feedback */}
                {q.isResolved && (
                  <div className={`rounded-lg p-3 border ${
                    q.wasClear
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-red-500/5 border-red-500/20"
                  }`}>
                    <p className={`text-xs font-semibold mb-0.5 ${
                      q.wasClear ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}>
                      Feedback do Operador
                    </p>
                    <p className="text-sm text-foreground">
                      {q.wasClear
                        ? "O operador confirmou que a duvida foi esclarecida."
                        : "O operador informou que a duvida NAO foi esclarecida."}
                    </p>
                    {q.resolvedAt && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(q.resolvedAt).toLocaleDateString("pt-BR")} as{" "}
                        {new Date(q.resolvedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                )}

                {/* Answer form */}
                {!q.answer && (
                  <div className="space-y-2 pt-1">
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={answerText[q.id] || ""}
                      onChange={(e) => setAnswerText((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      rows={3}
                      className="resize-none"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAnswer(q.id)}
                      disabled={!(answerText[q.id]?.trim())}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Resposta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
