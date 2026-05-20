"use client"
import { Table, TableBody, TableHead, TableHeader, TableCell, TableRow } from "@/components/ui/table"
import { useState, useEffect, useMemo, useCallback } from "react"
import { SafeHtml } from "@/components/safe-html"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useMessages, useQuizzes } from "@/hooks/use-supabase-admin"
import { useAllUsers } from "@/hooks/use-supabase-realtime"
import { useAuth } from "@/lib/auth-context"
import { getQuizAttemptsByQuiz, getMonthlyQuizRanking } from "@/lib/store"
import type { Message, Quiz, QuizOption, OperatorRanking, ContentSegment } from "@/lib/types"
import {
  MessageSquare,
  Brain,
  Plus,
  Trash2,
  Edit,
  Eye,
  Users,
  CheckCircle2,
  Calendar,
  Search,
  Download,
  FileSpreadsheet,
  History,
  Clock,
  ChevronDown,
  ChevronRight,
  Trophy,
  ChevronLeft,
  Medal,
  Crown,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RichTextEditorWYSIWYG } from "@/components/rich-text-editor-wysiwyg"

export function MessagesQuizTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Use Supabase hooks for realtime data
  const { data: messagesData, loading: messagesLoading, create: createMessage, update: updateMessage, remove: deleteMessage } = useMessages()
  const { data: quizzesData, loading: quizzesLoading, create: createQuiz, update: updateQuiz, remove: deleteQuiz, getAttempts } = useQuizzes()
  const { users: allUsersData } = useAllUsers()
  
  const [activeSection, setActiveSection] = useState<"messages" | "quiz" | "ranking">("messages")
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [showQuizDialog, setShowQuizDialog] = useState(false)
  const [showMessageHistoryDialog, setShowMessageHistoryDialog] = useState(false)
  const [showQuizHistoryDialog, setShowQuizHistoryDialog] = useState(false)
  const [editingMessage, setEditingMessage] = useState<any | null>(null)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [saving, setSaving] = useState(false)

  const [expandedMessageIds, setExpandedMessageIds] = useState<Set<string>>(new Set())
  const [expandedQuizIds, setExpandedQuizIds] = useState<Set<string>>(new Set())

  // Message form state
  const [messageContent, setMessageContent] = useState("")
  const [messageSegments, setMessageSegments] = useState<ContentSegment[]>([])
  const [messageActive, setMessageActive] = useState(true)
  const [messageRecipients, setMessageRecipients] = useState<string[]>([])
  const [sendToAll, setSendToAll] = useState(true)
  const [operatorSearch, setOperatorSearch] = useState("")

  // Quiz form state
  const [quizQuestion, setQuizQuestion] = useState("")
  const [quizOptions, setQuizOptions] = useState<QuizOption[]>([
    { id: "opt-a", label: "a", text: "" },
    { id: "opt-b", label: "b", text: "" },
    { id: "opt-c", label: "c", text: "" },
    { id: "opt-d", label: "d", text: "" },
  ])
  const [quizCorrectAnswer, setQuizCorrectAnswer] = useState("")
  const [quizActive, setQuizActive] = useState(true)
  const [quizScheduledDate, setQuizScheduledDate] = useState("")

  // Ranking state
  const [rankings, setRankings] = useState<OperatorRanking[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Map Supabase data to component format
  const messages = useMemo<Message[]>(() => messagesData.map((m: any) => ({
    id: m.id,
    title: m.title || "",
    content: m.content,
    priority: m.priority || "normal",
    isActive: m.is_active,
    createdAt: new Date(m.created_at),
    seenBy: m.seen_by || [],
    recipients: m.recipients || [],
    sendToAll: m.send_to_all ?? true,
    segments: m.segments || [],
    createdBy: m.created_by || m.createdBy || "",
    createdByName: m.created_by_name || m.createdByName || "",
  })), [messagesData])

  const quizzes = useMemo<Quiz[]>(() => quizzesData.map((q: any) => ({
    id: q.id,
    question: q.question,
    options: q.options || [],
    correctAnswer: q.correct_answer,
    isActive: q.is_active,
    createdAt: new Date(q.created_at),
    scheduledDate: q.scheduled_date ? new Date(q.scheduled_date) : undefined,
    createdBy: q.created_by || q.createdBy || "",
    createdByName: q.created_by_name || q.createdByName || "",
  })), [quizzesData])

  const operators = useMemo(() => allUsersData
    .filter((u: any) => u.role === "operator")
    .map((u: any) => ({ id: u.id, fullName: u.fullName || u.username })), [allUsersData])

  // Active and historical messages/quizzes
  const activeMessages = useMemo(() => messages.filter(m => m.isActive), [messages])
  const historicalMessages = useMemo(() => messages.filter(m => !m.isActive), [messages])
  const activeQuizzes = useMemo(() => quizzes.filter(q => q.isActive), [quizzes])
  const historicalQuizzes = useMemo(() => quizzes.filter(q => !q.isActive), [quizzes])

  // CHANGE: Memoize expensive filtering operations
  const filteredOperators = useMemo(() => {
    if (!operatorSearch.trim()) return operators

    const searchLower = operatorSearch.toLowerCase()
    return operators.filter((op) => op.fullName.toLowerCase().includes(searchLower))
  }, [operators, operatorSearch])

  const toggleMessageExpanded = (messageId: string) => {
    setExpandedMessageIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const toggleQuizExpanded = (quizId: string) => {
    setExpandedQuizIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(quizId)) {
        newSet.delete(quizId)
      } else {
        newSet.add(quizId)
      }
      return newSet
    })
  }

  const resetMessageForm = () => {
    setMessageContent("")
    setMessageSegments([])
    setMessageActive(true)
    setMessageRecipients([])
    setSendToAll(true)
    setEditingMessage(null)
    setOperatorSearch("")
  }



  const handleSaveMessage = useCallback(async () => {
    if (!user || !messageContent.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    if (!sendToAll && messageRecipients.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um operador ou escolha enviar para todos.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const recipients = sendToAll ? [] : messageRecipients

      if (editingMessage) {
        const { error } = await updateMessage(editingMessage.id, {
          title: messageContent.substring(0, 50) + (messageContent.length > 50 ? "..." : ""),
          content: messageContent,
          is_active: messageActive,
          recipients,
          segments: messageSegments,
          send_to_all: sendToAll,
        })
        if (error) throw new Error(error)
        toast({
          title: "Recado atualizado",
          description: "O recado foi atualizado com sucesso.",
        })
      } else {
        const { error } = await createMessage({
          title: messageContent.substring(0, 50) + (messageContent.length > 50 ? "..." : ""),
          content: messageContent,
          created_by: user.id,
          created_by_name: user.fullName,
          is_active: messageActive,
          recipients,
          segments: messageSegments,
          send_to_all: sendToAll,
          seen_by: [],
        })
        if (error) throw new Error(error)
        toast({
          title: "Recado criado",
          description: "O recado foi criado com sucesso.",
        })
      }

      setShowMessageDialog(false)
      resetMessageForm()
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao salvar recado",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }, [
    user,
    messageContent,
    sendToAll,
    messageRecipients,
    messageActive,
    messageSegments,
    editingMessage,
    toast,
    createMessage,
    updateMessage,
  ])

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message)
    setMessageContent(message.content)
    setMessageSegments(message.segments || [])
    setMessageActive(message.isActive)
    setMessageRecipients(message.recipients || [])
    setSendToAll(!message.recipients || message.recipients.length === 0)
    setShowMessageDialog(true)
  }

  const handleDeleteMessage = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este recado?")) {
      const { error } = await deleteMessage(id)
      if (error) {
        toast({
          title: "Erro",
          description: error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Recado excluído",
        description: "O recado foi excluído com sucesso.",
      })
    }
  }

  const toggleRecipient = (operatorId: string) => {
    setMessageRecipients((prev) =>
      prev.includes(operatorId) ? prev.filter((id) => id !== operatorId) : [...prev, operatorId],
    )
  }

  const resetQuizForm = () => {
    setQuizQuestion("")
    setQuizOptions([
      { id: "opt-a", label: "a", text: "" },
      { id: "opt-b", label: "b", text: "" },
      { id: "opt-c", label: "c", text: "" },
      { id: "opt-d", label: "d", text: "" },
    ])
    setQuizCorrectAnswer("")
    setQuizActive(true)
    setQuizScheduledDate("")
    setEditingQuiz(null)
  }

  const handleDialogChange = (open: boolean) => {
    setShowQuizDialog(open)
    if (!open) {
      resetQuizForm()
    }
  }

  const handleSaveQuiz = async () => {
    if (!user || !quizQuestion.trim() || !quizCorrectAnswer) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const allOptionsFilled = quizOptions.every((opt) => opt.text.trim())
    if (!allOptionsFilled) {
      toast({
        title: "Erro",
        description: "Preencha todas as opções de resposta.",
        variant: "destructive",
      })
      return
    }

    if (quizScheduledDate) {
      const selectedDate = new Date(quizScheduledDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        toast({
          title: "Erro",
          description: "A data agendada não pode ser no passado.",
          variant: "destructive",
        })
        return
      }
    }

    const scheduledDate = quizScheduledDate ? new Date(quizScheduledDate).toISOString() : null

    setSaving(true)
    try {
      if (editingQuiz) {
        const { error } = await updateQuiz(editingQuiz.id, {
          question: quizQuestion,
          options: quizOptions,
          correct_answer: quizCorrectAnswer,
          is_active: quizActive,
          scheduled_date: scheduledDate,
        })
        if (error) throw new Error(error)
        toast({
          title: "Quiz atualizado",
          description: "O quiz foi atualizado com sucesso.",
        })
      } else {
        const { error } = await createQuiz({
          question: quizQuestion,
          options: quizOptions,
          correct_answer: quizCorrectAnswer,
          created_by: user.id,
          created_by_name: user.fullName,
          is_active: quizActive,
          scheduled_date: scheduledDate,
        })
        if (error) throw new Error(error)
        toast({
          title: "Quiz criado",
          description: scheduledDate
            ? `O quiz foi agendado para ${new Date(scheduledDate).toLocaleDateString("pt-BR")}.`
            : "O quiz foi criado com sucesso.",
        })
      }

      setShowQuizDialog(false)
      resetQuizForm()
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao salvar quiz",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz)
    setQuizQuestion(quiz.question)
    setQuizOptions(quiz.options)
    setQuizCorrectAnswer(quiz.correctAnswer)
    setQuizActive(quiz.isActive)
    setQuizScheduledDate(quiz.scheduledDate ? new Date(quiz.scheduledDate).toISOString().split("T")[0] : "")
    setShowQuizDialog(true)
  }

  const handleDeleteQuiz = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este quiz?")) {
      const { error } = await deleteQuiz(id)
      if (error) {
        toast({
          title: "Erro",
          description: error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Quiz excluído",
        description: "O quiz foi excluído com sucesso.",
      })
    }
  }

  const updateQuizOption = (index: number, text: string) => {
    const newOptions = [...quizOptions]
    newOptions[index].text = text
    setQuizOptions(newOptions)
  }

  // CHANGE: Memoize quiz stats calculation
  const getQuizStats = useCallback((quizId: string) => {
    const attempts = getQuizAttemptsByQuiz(quizId)
    const correct = attempts.filter((a) => a.isCorrect).length
    const total = attempts.length
    return { correct, total, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 }
  }, [])

  // CHANGE: Memoize recipient names mapping
  const getRecipientNames = useCallback(
    (recipients: string[]) => {
      if (!recipients || recipients.length === 0) return "Todos os operadores"
      const names = recipients.map((id) => operators.find((op) => op.id === id)?.fullName).filter(Boolean)
      return names.join(", ")
    },
    [operators],
  )

  const handleExportQuizReport = (quiz: Quiz) => {
    const attempts = getQuizAttemptsByQuiz(quiz.id)
    const stats = getQuizStats(quiz.id)

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"

    // Header
    csvContent += "Relatório de Quiz\n\n"
    csvContent += `Pergunta:,${quiz.question.replace(/,/g, ";")}\n`
    csvContent += `Criado por:,${quiz.createdByName}\n`
    csvContent += `Data de criação:,${new Date(quiz.createdAt).toLocaleDateString("pt-BR")}\n`
    csvContent += `Total de tentativas:,${stats.total}\n`
    csvContent += `Acertos:,${stats.correct}\n`
    csvContent += `Erros:,${stats.total - stats.correct}\n`
    csvContent += `Percentual de acertos:,${stats.percentage}%\n\n`

    // Options
    csvContent += "Opções de Resposta:\n"
    quiz.options.forEach((opt) => {
      const isCorrect = opt.id === quiz.correctAnswer ? " (CORRETA)" : ""
      csvContent += `${opt.label},${opt.text.replace(/,/g, ";")}${isCorrect}\n`
    })

    csvContent += "\n"

    // Attempts details
    csvContent += "Detalhes das Tentativas:\n"
    csvContent += "Operador,Data,Horário,Resposta Selecionada,Resultado\n"

    attempts.forEach((attempt) => {
      const date = new Date(attempt.attemptedAt)
      const selectedOption = quiz.options.find((opt) => opt.id === attempt.selectedAnswer)
      csvContent += `${attempt.operatorName},${date.toLocaleDateString("pt-BR")},${date.toLocaleTimeString("pt-BR")},${selectedOption?.label || "N/A"},${attempt.isCorrect ? "Correto" : "Incorreto"}\n`
    })

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `quiz_relatorio_${quiz.id}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Relatório exportado",
      description: "O relatório do quiz foi exportado com sucesso.",
    })
  }

  const handleExportRankingReport = () => {
    if (rankings.length === 0) {
      toast({
        title: "Nenhum dado disponível",
        description: "Não há dados de ranking para exportar.",
        variant: "destructive",
      })
      return
    }

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"

    // Header
    csvContent += "Relatório de Ranking - Quiz\n\n"
    csvContent += `Mês:,${getMonthName(selectedMonth)} de ${selectedYear}\n`
    csvContent += `Data de exportação:,${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}\n\n`

    // Table header
    csvContent += "Posição,Nome do Operador,Quiz Respondidos,Acertos,Precisão,Pontuação\n"

    // Data rows
    rankings.forEach((ranking) => {
      csvContent += `${ranking.rank},${ranking.operatorName},${ranking.totalAttempts},${ranking.correctAnswers},${ranking.accuracy.toFixed(1)}%,${ranking.score}\n`
    })

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    const fileName = `ranking_quiz_${selectedYear}_${String(selectedMonth + 1).padStart(2, "0")}_${Date.now()}.csv`
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Relatório exportado",
      description: "O relatório de ranking foi exportado com sucesso.",
    })
  }

  const getMonthName = (monthIndex: number): string => {
    const date = new Date(selectedYear, monthIndex, 1)
    return date.toLocaleDateString("pt-BR", { month: "long" })
  }

  const loadRankings = useCallback(() => {
    setRankings(getMonthlyQuizRanking(selectedYear, selectedMonth))
  }, [selectedYear, selectedMonth])

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1)
      setSelectedMonth(11)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
    loadRankings()
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1)
      setSelectedMonth(0)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
    loadRankings()
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return selectedMonth === now.getMonth() && selectedYear === now.getFullYear()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Recados e Quiz</h2>
          <p className="text-muted-foreground">Gerencie recados e quizzes para os operadores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
        {/* Sidebar Menu */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Menu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={activeSection === "messages" ? "default" : "ghost"}
              onClick={() => setActiveSection("messages")}
              className={`w-full justify-start text-base transition-all duration-300 ${
                activeSection === "messages"
                  ? "bg-orange-500 hover:bg-orange-600 dark:bg-gradient-to-r dark:from-primary dark:via-accent dark:to-primary text-white shadow-lg"
                  : ""
              }`}
            >
              <MessageSquare className="h-5 w-5 mr-3" />
              Recados
            </Button>
            <Button
              variant={activeSection === "quiz" ? "default" : "ghost"}
              onClick={() => setActiveSection("quiz")}
              className={`w-full justify-start text-base transition-all duration-300 ${
                activeSection === "quiz"
                  ? "bg-orange-500 hover:bg-orange-600 dark:bg-gradient-to-r dark:from-chart-1 dark:via-chart-4 dark:to-chart-5 text-white shadow-lg"
                  : ""
              }`}
            >
              <Brain className="h-5 w-5 mr-3" />
              Quiz
            </Button>
            <Button
              variant={activeSection === "ranking" ? "default" : "ghost"}
              onClick={() => setActiveSection("ranking")}
              className={`w-full justify-start text-base transition-all duration-300 ${
                activeSection === "ranking"
                  ? "bg-orange-500 hover:bg-orange-600 dark:bg-gradient-to-r dark:from-chart-4 dark:via-chart-1 dark:to-chart-5 text-white shadow-lg"
                  : ""
              }`}
            >
              <Trophy className="h-5 w-5 mr-3" />
              Ranking
            </Button>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div>
          {activeSection === "messages" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={resetMessageForm}
                      className="bg-orange-500 hover:bg-orange-600 dark:bg-primary dark:hover:bg-primary/90 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Recado
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingMessage ? "Editar Recado" : "Novo Recado"}</DialogTitle>
                      <DialogDescription>Crie um recado formatado para ser exibido aos operadores</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <RichTextEditorWYSIWYG
                        value={messageContent}
                        onChange={(content) => {
                          setMessageContent(content)
                        }}
                        placeholder="Digite o conteúdo do recado e use as ferramentas de formatação"
                      />

                      <Separator />
                      <div className="space-y-3">
                        <Label>Destinatários</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="send-to-all"
                            checked={sendToAll}
                            onCheckedChange={(checked) => setSendToAll(checked as boolean)}
                          />
                          <Label htmlFor="send-to-all" className="cursor-pointer">
                            Enviar para todos os operadores
                          </Label>
                        </div>

                        {!sendToAll && (
                          <div className="border rounded-lg p-4 space-y-3">
                            <Label className="text-sm text-muted-foreground">Selecione os operadores:</Label>

                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Pesquisar operadores..."
                                value={operatorSearch}
                                onChange={(e) => setOperatorSearch(e.target.value)}
                                className="pl-9"
                              />
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {operators.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhum operador cadastrado.</p>
                              ) : filteredOperators.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhum operador encontrado.</p>
                              ) : (
                                filteredOperators.map((operator) => (
                                  <div key={operator.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`operator-${operator.id}`}
                                      checked={messageRecipients.includes(operator.id)}
                                      onCheckedChange={() => toggleRecipient(operator.id)}
                                    />
                                    <Label htmlFor={`operator-${operator.id}`} className="cursor-pointer">
                                      {operator.fullName}
                                    </Label>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator />
                      <div className="flex items-center space-x-2">
                        <Switch id="message-active" checked={messageActive} onCheckedChange={setMessageActive} />
                        <Label htmlFor="message-active">Ativo</Label>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowMessageDialog(false)} disabled={saving}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveMessage} disabled={saving}>
                          {saving ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showMessageHistoryDialog} onOpenChange={setShowMessageHistoryDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/10 bg-transparent"
                    >
                      <History className="h-4 w-4 mr-2" />
                      Ver Histórico de Recados
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[85vh]">
                    <DialogHeader>
                      <DialogTitle>Histórico de Recados Enviados</DialogTitle>
                      <DialogDescription>
                        Todos os recados enviados aos operadores ({messages.length} total)
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                      <div className="space-y-3">
                        {messages.length === 0 ? (
                          <div className="py-12 text-center">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <p className="text-muted-foreground">Nenhum recado no histórico.</p>
                          </div>
                        ) : (
                          messages
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((message) => {
                              const isExpanded = expandedMessageIds.has(message.id)
                              return (
                                <Card
                                  key={message.id}
                                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => toggleMessageExpanded(message.id)}
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex items-start gap-2 flex-1 min-w-0">
                                        {isExpanded ? (
                                          <ChevronDown className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <CardTitle className="text-base break-words overflow-wrap-anywhere">
                                            {message.title}
                                          </CardTitle>
                                          <CardDescription className="mt-1 break-words">
                                            <Clock className="inline h-3 w-3 mr-1" />
                                            {new Date(message.createdAt).toLocaleDateString("pt-BR")} às{" "}
                                            {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </CardDescription>
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-2 flex-shrink-0">
                                        <Badge variant={message.isActive ? "default" : "secondary"}>
                                          {message.isActive ? "Ativo" : "Inativo"}
                                        </Badge>
                                        <Badge variant="outline" className="whitespace-nowrap">
                                          <Eye className="h-3 w-3 mr-1" />
                                          {message.seenBy.length}
                                        </Badge>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  {isExpanded && (
                                    <CardContent>
                                      <SafeHtml
                                        html={message.content}
                                        className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere mb-3 prose prose-sm max-w-none dark:prose-invert"
                                      />
                                      <div className="text-xs text-muted-foreground break-words overflow-wrap-anywhere">
                                        <Users className="inline h-3 w-3 mr-1" />
                                        Destinatários: {getRecipientNames(message.recipients)}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Criado por: {message.createdByName}
                                      </div>
                                    </CardContent>
                                  )}
                                </Card>
                              )
                            })
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {messages.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">Nenhum recado cadastrado.</p>
                    </CardContent>
                  </Card>
                ) : (
                  messages.map((message) => (
                    <Card key={message.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardDescription>
                              Por {message.createdByName} • {new Date(message.createdAt).toLocaleDateString("pt-BR")} às{" "}
                              {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </CardDescription>
                            <CardDescription className="mt-1">
                              <Users className="inline h-3 w-3 mr-1" />
                              {getRecipientNames(message.recipients)}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={message.isActive ? "default" : "secondary"}>
                              {message.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                            <Badge variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              {message.seenBy.length}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <SafeHtml
                          html={message.content}
                          className="text-sm whitespace-pre-wrap mb-4 prose prose-sm max-w-none dark:prose-invert"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditMessage(message)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteMessage(message.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {activeSection === "quiz" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <Dialog open={showQuizDialog} onOpenChange={handleDialogChange}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={resetQuizForm}
                      className="bg-orange-500 hover:bg-orange-600 dark:bg-gradient-to-r dark:from-chart-1 dark:to-chart-4 dark:hover:opacity-90 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Quiz
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingQuiz ? "Editar Quiz" : "Novo Quiz"}</DialogTitle>
                      <DialogDescription>Crie um quiz com 4 opções de resposta para os operadores</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="quiz-question">Pergunta</Label>
                        <Textarea
                          id="quiz-question"
                          value={quizQuestion}
                          onChange={(e) => setQuizQuestion(e.target.value)}
                          placeholder="Digite a pergunta do quiz"
                          rows={3}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <Label>Opções de Resposta</Label>
                        {quizOptions.map((option, index) => (
                          <div key={option.id} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label className="font-bold w-8">{option.label})</Label>
                              <Input
                                value={option.text}
                                onChange={(e) => updateQuizOption(index, e.target.value)}
                                placeholder={`Digite a opção ${option.label}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Resposta Correta</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {quizOptions.map((option) => (
                            <Button
                              key={option.id}
                              variant={quizCorrectAnswer === option.id ? "default" : "outline"}
                              onClick={() => setQuizCorrectAnswer(option.id)}
                              className="font-bold"
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor="quiz-scheduled-date">
                          <Calendar className="inline h-4 w-4 mr-2" />
                          Agendar Quiz (Opcional)
                        </Label>
                        <Input
                          id="quiz-scheduled-date"
                          type="date"
                          value={quizScheduledDate}
                          onChange={(e) => setQuizScheduledDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                        />
                        <p className="text-xs text-muted-foreground">
                          Deixe em branco para disponibilizar imediatamente
                        </p>
                      </div>

                      <Separator />
                      <div className="flex items-center space-x-2">
                        <Switch id="quiz-active" checked={quizActive} onCheckedChange={setQuizActive} />
                        <Label htmlFor="quiz-active">Ativo</Label>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowQuizDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveQuiz}>Salvar</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={handleExportRankingReport}
                  variant="outline"
                  className="bg-orange-500 hover:bg-orange-600 dark:bg-gradient-to-r dark:from-chart-4 dark:to-chart-1 dark:hover:opacity-90 text-white border-0"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Ranking
                </Button>

                <Dialog open={showQuizHistoryDialog} onOpenChange={setShowQuizHistoryDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-chart-1 text-chart-1 hover:bg-chart-1/10 bg-transparent"
                    >
                      <History className="h-4 w-4 mr-2" />
                      Ver Histórico de Quizzes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[85vh]">
                    <DialogHeader>
                      <DialogTitle>Histórico de Quizzes Enviados</DialogTitle>
                      <DialogDescription>
                        Todos os quizzes enviados aos operadores ({quizzes.length} total)
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                      <div className="space-y-3">
                        {quizzes.length === 0 ? (
                          <div className="py-12 text-center">
                            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <p className="text-muted-foreground">Nenhum quiz no histórico.</p>
                          </div>
                        ) : (
                          quizzes
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((quiz) => {
                              const stats = getQuizStats(quiz.id)
                              const isScheduled = quiz.scheduledDate && new Date(quiz.scheduledDate) > new Date()
                              const isExpanded = expandedQuizIds.has(quiz.id)

                              return (
                                <Card
                                  key={quiz.id}
                                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => toggleQuizExpanded(quiz.id)}
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex items-start gap-2 flex-1 min-w-0">
                                        {isExpanded ? (
                                          <ChevronDown className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <CardTitle className="text-base break-words overflow-wrap-anywhere">
                                            {quiz.question}
                                          </CardTitle>
                                          <CardDescription className="mt-1 break-words">
                                            <Clock className="inline h-3 w-3 mr-1" />
                                            {new Date(quiz.createdAt).toLocaleDateString("pt-BR")} às{" "}
                                            {new Date(quiz.createdAt).toLocaleTimeString("pt-BR", {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </CardDescription>
                                          {quiz.scheduledDate && (
                                            <CardDescription className="mt-1 break-words">
                                              <Calendar className="inline h-3 w-3 mr-1" />
                                              {isScheduled ? "Agendado para: " : "Disponível desde: "}
                                              {new Date(quiz.scheduledDate).toLocaleDateString("pt-BR")}
                                            </CardDescription>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-2 flex-shrink-0">
                                        {isScheduled && <Badge variant="secondary">Agendado</Badge>}
                                        <Badge variant={quiz.isActive ? "default" : "secondary"}>
                                          {quiz.isActive ? "Ativo" : "Inativo"}
                                        </Badge>
                                        <Badge variant="outline" className="whitespace-nowrap">
                                          <Users className="h-3 w-3 mr-1" />
                                          {stats.total}
                                        </Badge>
                                        {stats.total > 0 && (
                                          <Badge
                                            variant={stats.percentage >= 70 ? "default" : "destructive"}
                                            className="whitespace-nowrap"
                                          >
                                            {stats.percentage}%
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </CardHeader>
                                  {isExpanded && (
                                    <CardContent>
                                      <div className="space-y-2 mb-3">
                                        {quiz.options.map((option) => (
                                          <div
                                            key={option.id}
                                            className={`p-2 rounded break-words overflow-wrap-anywhere ${
                                              option.id === quiz.correctAnswer
                                                ? "bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100"
                                                : "bg-muted/50"
                                            }`}
                                          >
                                            <span className="font-bold mr-2">{option.label})</span>
                                            <span className="break-words overflow-wrap-anywhere">{option.text}</span>
                                            {option.id === quiz.correctAnswer && (
                                              <CheckCircle2 className="inline h-4 w-4 ml-2 text-green-600 dark:text-green-400" />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Criado por: {quiz.createdByName}
                                      </div>
                                      {stats.total > 0 && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {stats.correct} acertos de {stats.total} tentativas ({stats.percentage}%)
                                        </div>
                                      )}
                                    </CardContent>
                                  )}
                                </Card>
                              )
                            })
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {quizzes.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">Nenhum quiz cadastrado.</p>
                    </CardContent>
                  </Card>
                ) : (
                  quizzes.map((quiz) => {
                    const stats = getQuizStats(quiz.id)
                    const isScheduled = quiz.scheduledDate && new Date(quiz.scheduledDate) > new Date()

                    return (
                      <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{quiz.question}</CardTitle>
                              <CardDescription>
                                Por {quiz.createdByName} • {new Date(quiz.createdAt).toLocaleDateString("pt-BR")} às{" "}
                                {new Date(quiz.createdAt).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </CardDescription>
                              {quiz.scheduledDate && (
                                <CardDescription className="mt-1">
                                  <Calendar className="inline h-3 w-3 mr-1" />
                                  {isScheduled ? "Agendado para: " : "Disponível desde: "}
                                  {new Date(quiz.scheduledDate).toLocaleDateString("pt-BR")}
                                </CardDescription>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isScheduled && <Badge variant="secondary">Agendado</Badge>}
                              <Badge variant={quiz.isActive ? "default" : "secondary"}>
                                {quiz.isActive ? "Ativo" : "Inativo"}
                              </Badge>
                              <Badge variant="outline">
                                <Users className="h-3 w-3 mr-1" />
                                {stats.total} tentativas
                              </Badge>
                              {stats.total > 0 && (
                                <Badge variant={stats.percentage >= 70 ? "default" : "destructive"}>
                                  {stats.percentage}% acertos
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 mb-4">
                            {quiz.options.map((option) => (
                              <div
                                key={option.id}
                                className={`p-2 rounded ${
                                  option.id === quiz.correctAnswer
                                    ? "bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100"
                                    : "bg-muted/50"
                                }`}
                              >
                                <span className="font-bold mr-2">{option.label})</span>
                                {option.text}
                                {option.id === quiz.correctAnswer && (
                                  <CheckCircle2 className="inline h-4 w-4 ml-2 text-green-600 dark:text-green-400" />
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditQuiz(quiz)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExportQuizReport(quiz)}
                              disabled={stats.total === 0}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Exportar Relatório
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteQuiz(quiz.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {activeSection === "ranking" && (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-card to-muted/30 border-2 border-chart-1/50 shadow-2xl">
                <CardHeader className="relative overflow-hidden pb-6">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-chart-1/10 rounded-full blur-3xl -z-10" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-chart-4/10 rounded-full blur-3xl -z-10" />
                  <div className="flex items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-chart-1 to-chart-4 shadow-lg">
                        <Trophy className="h-8 w-8 text-white animate-pulse" />
                      </div>
                      <div>
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 bg-clip-text text-transparent">
                          Ranking Mensal - {getMonthName(selectedMonth)} {selectedYear}
                        </CardTitle>
                        <CardDescription className="text-lg mt-1">Classificação geral dos operadores</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousMonth}
                        className="h-10 w-10 p-0 bg-transparent"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextMonth}
                        disabled={isCurrentMonth()}
                        className="h-10 w-10 p-0 bg-transparent"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleExportRankingReport}
                    className="bg-orange-500 hover:bg-orange-600 dark:bg-gradient-to-r dark:from-chart-4 dark:to-chart-1 text-white"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar Ranking
                  </Button>
                </CardHeader>
                <CardContent className="space-y-8">
                  {rankings.length === 0 ? (
                    <div className="text-center py-32">
                      <Trophy className="h-28 w-28 text-muted-foreground mx-auto mb-6 opacity-50" />
                      <p className="text-muted-foreground text-2xl">Nenhum quiz respondido este mês ainda.</p>
                    </div>
                  ) : (
                    <>
                      {rankings.length > 0 && (
                        <div className="space-y-8">
                          <div className="text-center">
                            <h3 className="text-4xl font-bold bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 bg-clip-text text-transparent mb-3">
                              🏆 Top 3 do Mês
                            </h3>
                            <p className="text-muted-foreground">Os melhores operadores do ranking</p>
                          </div>

                          <div className="flex items-end justify-center gap-4 px-12">
                            {/* 2nd Place */}
                            {rankings[1] && (
                              <div className="flex flex-col items-center flex-1 animate-in fade-in slide-in-from-left duration-700">
                                <div className="mb-3 text-center">
                                  <div
                                    className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-xl mb-2 animate-bounce"
                                    style={{ animationDelay: "200ms" }}
                                  >
                                    <Medal className="h-12 w-12 text-white" />
                                  </div>
                                  <p className="font-bold text-xl mb-2">{rankings[1].operatorName}</p>
                                  <p className="text-4xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
                                    {rankings[1].score}
                                  </p>
                                  <p className="text-sm text-muted-foreground">pontos</p>
                                </div>
                                <div
                                  className="w-full bg-gradient-to-br from-gray-300 to-gray-500 rounded-t-2xl shadow-2xl border-4 border-gray-400 dark:border-gray-600 relative overflow-hidden"
                                  style={{ height: "120px" }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <p className="text-7xl font-black text-white/90">2</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 1st Place */}
                            {rankings[0] && (
                              <div className="flex flex-col items-center flex-1 animate-in fade-in zoom-in-95 duration-700">
                                <div className="mb-3 text-center">
                                  <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-2xl mb-2 animate-bounce">
                                    <Crown className="h-14 w-14 text-white" />
                                  </div>
                                  <p className="font-bold text-2xl mb-2">{rankings[0].operatorName}</p>
                                  <p className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                                    {rankings[0].score}
                                  </p>
                                  <p className="text-sm text-muted-foreground">pontos</p>
                                </div>
                                <div
                                  className="w-full bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-t-2xl shadow-2xl border-4 border-yellow-500 dark:border-yellow-700 relative overflow-hidden"
                                  style={{ height: "160px" }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <p className="text-8xl font-black text-white/90">1</p>
                                  </div>
                                  <Sparkles className="absolute top-3 right-3 h-10 w-10 text-white/80 animate-spin" />
                                  <Star className="absolute bottom-3 left-3 h-8 w-8 text-white/80 animate-pulse" />
                                </div>
                              </div>
                            )}

                            {/* 3rd Place */}
                            {rankings[2] && (
                              <div
                                className="flex flex-col items-center flex-1 animate-in fade-in slide-in-from-right duration-700"
                                style={{ animationDelay: "400ms" }}
                              >
                                <div className="mb-3 text-center">
                                  <div
                                    className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-xl mb-2 animate-bounce"
                                    style={{ animationDelay: "400ms" }}
                                  >
                                    <Medal className="h-12 w-12 text-white" />
                                  </div>
                                  <p className="font-bold text-xl mb-2">{rankings[2].operatorName}</p>
                                  <p className="text-4xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
                                    {rankings[2].score}
                                  </p>
                                  <p className="text-sm text-muted-foreground">pontos</p>
                                </div>
                                <div
                                  className="w-full bg-gradient-to-br from-orange-400 to-orange-600 rounded-t-2xl shadow-2xl border-4 border-orange-500 dark:border-orange-700 relative overflow-hidden"
                                  style={{ height: "100px" }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <p className="text-7xl font-black text-white/90">3</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <Separator className="my-10" />

                      <div className="space-y-6">
                        <h3 className="text-3xl font-bold">Classificação Completa</h3>
                        <div className="rounded-lg border bg-card">
                          <div className="w-full overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="w-28 text-center font-bold">Posição</TableHead>
                                  <TableHead className="font-bold min-w-[200px]">Operador</TableHead>
                                  <TableHead className="text-center font-bold whitespace-nowrap min-w-[150px]">
                                    Quiz Respondidos
                                  </TableHead>
                                  <TableHead className="text-center font-bold min-w-[100px]">Acertos</TableHead>
                                  <TableHead className="text-center font-bold min-w-[100px]">Precisão</TableHead>
                                  <TableHead className="text-right font-bold min-w-[100px] pr-6">Pontos</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {rankings.map((ranking, index) => {
                                  const isTopThree = ranking.rank <= 3

                                  return (
                                    <TableRow
                                      key={ranking.operatorId}
                                      className={`transition-all duration-300 animate-in fade-in slide-in-from-left ${
                                        isTopThree ? "bg-muted/30" : ""
                                      }`}
                                      style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                      <TableCell className="text-center py-6">
                                        <div className="flex items-center justify-center">
                                          {ranking.rank === 1 ? (
                                            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg">
                                              <Crown className="h-7 w-7" />
                                            </div>
                                          ) : ranking.rank === 2 ? (
                                            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg">
                                              <Medal className="h-7 w-7" />
                                            </div>
                                          ) : ranking.rank === 3 ? (
                                            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg">
                                              <Medal className="h-7 w-7" />
                                            </div>
                                          ) : (
                                            <span className="text-2xl font-bold">{ranking.rank}º</span>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-6">
                                        <div className="flex items-center gap-2">
                                          <span className={`${isTopThree ? "font-bold text-2xl" : "text-xl"}`}>
                                            {ranking.operatorName}
                                          </span>
                                          {isTopThree && (
                                            <Star className="h-6 w-6 text-chart-1 fill-chart-1 flex-shrink-0" />
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center py-6">
                                        <div className="flex items-center justify-center gap-2">
                                          <Brain className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                                          <span className="font-semibold text-2xl">{ranking.totalAttempts}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center py-6">
                                        <div className="flex items-center justify-center gap-2">
                                          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                                          <span className="font-semibold text-2xl">{ranking.correctAnswers}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center py-6">
                                        <div className="flex items-center justify-center gap-2">
                                          <TrendingUp className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                                          <span className="font-semibold text-2xl">{ranking.accuracy.toFixed(1)}%</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right py-6 pr-6">
                                        <span
                                          className={`text-2xl font-bold ${
                                            isTopThree
                                              ? "bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent"
                                              : ""
                                          }`}
                                        >
                                          {ranking.score}
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
