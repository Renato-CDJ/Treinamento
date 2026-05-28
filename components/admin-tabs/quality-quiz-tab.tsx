"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useQualityQuizzes, getQualityQuizRanking } from "@/hooks/use-supabase-admin"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  Brain,
  Plus,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  Medal,
  Crown,
  Star,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Send,
  History,
  Target,
  Sparkles,
  Zap,
  Award,
  BarChart3,
  Users,
} from "lucide-react"

interface QuizOption {
  id: string
  label: string
  text: string
}

export function QualityQuizTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { data: quizzesData, loading, create, update, remove, getAttempts } = useQualityQuizzes()

  const [activeSection, setActiveSection] = useState<"quizzes" | "ranking" | "history">("quizzes")
  const [showQuizDialog, setShowQuizDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showAttemptsDialog, setShowAttemptsDialog] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<any | null>(null)
  const [previewQuiz, setPreviewQuiz] = useState<any | null>(null)
  const [selectedQuizAttempts, setSelectedQuizAttempts] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState<QuizOption[]>([
    { id: "opt-a", label: "A", text: "" },
    { id: "opt-b", label: "B", text: "" },
    { id: "opt-c", label: "C", text: "" },
    { id: "opt-d", label: "D", text: "" },
  ])
  const [correctAnswer, setCorrectAnswer] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [scheduledDate, setScheduledDate] = useState("")
  const [points, setPoints] = useState(10)
  const [category, setCategory] = useState("")
  const [difficulty, setDifficulty] = useState<"facil" | "medio" | "dificil">("medio")
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined)

  // Ranking state
  const [rankings, setRankings] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loadingRankings, setLoadingRankings] = useState(false)

  // Map quizzes
  const quizzes = useMemo(() => quizzesData.map((q: any) => ({
    id: q.id,
    title: q.title,
    question: q.question,
    options: q.options || [],
    correctAnswer: q.correct_answer,
    createdBy: q.created_by,
    createdByName: q.created_by_name,
    createdAt: new Date(q.created_at),
    isActive: q.is_active,
    scheduledDate: q.scheduled_date ? new Date(q.scheduled_date) : undefined,
    points: q.points || 10,
    category: q.category,
    difficulty: q.difficulty,
    timeLimit: q.time_limit,
  })), [quizzesData])

  const activeQuizzes = useMemo(() => quizzes.filter(q => q.isActive), [quizzes])
  const historicalQuizzes = useMemo(() => quizzes.filter(q => !q.isActive), [quizzes])

  const resetForm = useCallback(() => {
    setTitle("")
    setQuestion("")
    setOptions([
      { id: "opt-a", label: "A", text: "" },
      { id: "opt-b", label: "B", text: "" },
      { id: "opt-c", label: "C", text: "" },
      { id: "opt-d", label: "D", text: "" },
    ])
    setCorrectAnswer("")
    setIsActive(true)
    setScheduledDate("")
    setPoints(10)
    setCategory("")
    setDifficulty("medio")
    setTimeLimit(undefined)
    setEditingQuiz(null)
  }, [])

  const handleDialogChange = (open: boolean) => {
    setShowQuizDialog(open)
    if (!open) {
      resetForm()
    }
  }

  const handleSaveQuiz = async () => {
    if (!user || !title.trim() || !question.trim() || !correctAnswer) {
      toast({
        title: "Erro",
        description: "Preencha o titulo, pergunta e selecione a resposta correta.",
        variant: "destructive",
      })
      return
    }

    const allOptionsFilled = options.every((opt) => opt.text.trim())
    if (!allOptionsFilled) {
      toast({
        title: "Erro",
        description: "Preencha todas as opcoes de resposta.",
        variant: "destructive",
      })
      return
    }

    if (scheduledDate) {
      const selectedDate = new Date(scheduledDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        toast({
          title: "Erro",
          description: "A data agendada nao pode ser no passado.",
          variant: "destructive",
        })
        return
      }
    }

    setSaving(true)
    try {
      const quizData = {
        title,
        question,
        options,
        correct_answer: correctAnswer,
        is_active: isActive,
        scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        points,
        category: category || null,
        difficulty,
        time_limit: timeLimit || null,
      }

      if (editingQuiz) {
        const { error } = await update(editingQuiz.id, quizData)
        if (error) throw new Error(error)
        toast({
          title: "Quiz atualizado",
          description: "O quiz foi atualizado com sucesso.",
        })
      } else {
        const { error } = await create({
          ...quizData,
          created_by: user.id,
          created_by_name: user.fullName,
        })
        if (error) throw new Error(error)
        toast({
          title: "Quiz criado",
          description: scheduledDate
            ? `O quiz foi agendado para ${new Date(scheduledDate).toLocaleDateString("pt-BR")}.`
            : "O quiz foi criado e esta ativo.",
        })
      }

      setShowQuizDialog(false)
      resetForm()
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

  const handleEditQuiz = (quiz: any) => {
    setEditingQuiz(quiz)
    setTitle(quiz.title)
    setQuestion(quiz.question)
    setOptions(quiz.options)
    setCorrectAnswer(quiz.correctAnswer)
    setIsActive(quiz.isActive)
    setScheduledDate(quiz.scheduledDate ? new Date(quiz.scheduledDate).toISOString().split("T")[0] : "")
    setPoints(quiz.points)
    setCategory(quiz.category || "")
    setDifficulty(quiz.difficulty || "medio")
    setTimeLimit(quiz.timeLimit)
    setShowQuizDialog(true)
  }

  const handleDeleteQuiz = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este quiz?")) {
      const { error } = await remove(id)
      if (error) {
        toast({
          title: "Erro",
          description: error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Quiz excluido",
        description: "O quiz foi excluido com sucesso.",
      })
    }
  }

  const handlePreviewQuiz = (quiz: any) => {
    setPreviewQuiz(quiz)
    setShowPreviewDialog(true)
  }

  const handleViewAttempts = async (quiz: any) => {
    const { data, error } = await getAttempts(quiz.id)
    if (error) {
      toast({
        title: "Erro",
        description: error,
        variant: "destructive",
      })
      return
    }
    setSelectedQuizAttempts(data)
    setPreviewQuiz(quiz)
    setShowAttemptsDialog(true)
  }

  const updateOption = (index: number, text: string) => {
    const newOptions = [...options]
    newOptions[index].text = text
    setOptions(newOptions)
  }

  const addOption = () => {
    if (options.length >= 6) return
    const labels = ["A", "B", "C", "D", "E", "F"]
    const newLabel = labels[options.length]
    setOptions([...options, { id: `opt-${newLabel.toLowerCase()}`, label: newLabel, text: "" }])
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) return
    const newOptions = options.filter((_, i) => i !== index)
    // Relabel
    const labels = ["A", "B", "C", "D", "E", "F"]
    newOptions.forEach((opt, i) => {
      opt.label = labels[i]
      opt.id = `opt-${labels[i].toLowerCase()}`
    })
    setOptions(newOptions)
    if (correctAnswer === options[index].id) {
      setCorrectAnswer("")
    }
  }

  const loadRankings = useCallback(async () => {
    setLoadingRankings(true)
    const data = await getQualityQuizRanking(selectedMonth, selectedYear)
    setRankings(data)
    setLoadingRankings(false)
  }, [selectedMonth, selectedYear])

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1)
      setSelectedMonth(11)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1)
      setSelectedMonth(0)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const getMonthName = (monthIndex: number): string => {
    const date = new Date(selectedYear, monthIndex, 1)
    return date.toLocaleDateString("pt-BR", { month: "long" })
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return selectedMonth === now.getMonth() && selectedYear === now.getFullYear()
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "facil":
        return <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">Facil</Badge>
      case "medio":
        return <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">Medio</Badge>
      case "dificil":
        return <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30">Dificil</Badge>
      default:
        return null
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-amber-500" />
      case 2:
        return <Medal className="h-5 w-5 text-slate-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-muted-foreground">{rank}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Quiz da Qualidade
          </h2>
          <p className="text-muted-foreground">Crie e gerencie quizzes para avaliar o conhecimento dos operadores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar Menu */}
        <Card className="h-fit bg-gradient-to-b from-card to-card/95 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-emerald-500" />
              Menu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={activeSection === "quizzes" ? "default" : "ghost"}
              onClick={() => setActiveSection("quizzes")}
              className={`w-full justify-start text-base transition-all duration-300 ${
                activeSection === "quizzes"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
                  : ""
              }`}
            >
              <Target className="h-4 w-4 mr-2" />
              Quizzes Ativos
              {activeQuizzes.length > 0 && (
                <Badge className="ml-auto" variant="secondary">
                  {activeQuizzes.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeSection === "ranking" ? "default" : "ghost"}
              onClick={() => {
                setActiveSection("ranking")
                loadRankings()
              }}
              className={`w-full justify-start text-base transition-all duration-300 ${
                activeSection === "ranking"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
                  : ""
              }`}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Ranking
            </Button>
            <Button
              variant={activeSection === "history" ? "default" : "ghost"}
              onClick={() => setActiveSection("history")}
              className={`w-full justify-start text-base transition-all duration-300 ${
                activeSection === "history"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
                  : ""
              }`}
            >
              <History className="h-4 w-4 mr-2" />
              Historico
              {historicalQuizzes.length > 0 && (
                <Badge className="ml-auto" variant="secondary">
                  {historicalQuizzes.length}
                </Badge>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-6">
          {activeSection === "quizzes" && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{activeQuizzes.length}</p>
                        <p className="text-xs text-muted-foreground">Quizzes Ativos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{quizzes.length}</p>
                        <p className="text-xs text-muted-foreground">Total de Quizzes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Star className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {quizzes.reduce((acc, q) => acc + q.points, 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Pontos Disponiveis</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Quizzes Ativos</h3>
                <Button
                  onClick={() => setShowQuizDialog(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Quiz
                </Button>
              </div>

              {/* Quizzes List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground">Carregando quizzes...</p>
                  </div>
                </div>
              ) : activeQuizzes.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Brain className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Nenhum quiz ativo</h3>
                      <p className="text-muted-foreground mb-4">Crie um novo quiz para os operadores responderem.</p>
                      <Button
                        onClick={() => setShowQuizDialog(true)}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Quiz
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {activeQuizzes.map((quiz) => (
                    <Card key={quiz.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-emerald-500">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-foreground truncate">{quiz.title}</h4>
                              {getDifficultyBadge(quiz.difficulty)}
                              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                {quiz.points} pts
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{quiz.question}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {quiz.createdAt.toLocaleDateString("pt-BR")}
                              </span>
                              {quiz.scheduledDate && (
                                <span className="flex items-center gap-1 text-amber-600">
                                  <Clock className="h-3 w-3" />
                                  Agendado: {quiz.scheduledDate.toLocaleDateString("pt-BR")}
                                </span>
                              )}
                              {quiz.category && (
                                <Badge variant="outline" className="text-xs">
                                  {quiz.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePreviewQuiz(quiz)}
                              className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-500"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewAttempts(quiz)}
                              className="h-8 w-8 hover:bg-purple-500/10 hover:text-purple-500"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditQuiz(quiz)}
                              className="h-8 w-8 hover:bg-amber-500/10 hover:text-amber-500"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {activeSection === "ranking" && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        Ranking de Operadores
                      </CardTitle>
                      <CardDescription>Classificacao baseada nos pontos dos quizzes</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-center min-w-[140px]">
                        <p className="text-sm font-medium capitalize">
                          {getMonthName(selectedMonth)} {selectedYear}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextMonth}
                        disabled={isCurrentMonth()}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingRankings ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    </div>
                  ) : rankings.length === 0 ? (
                    <div className="text-center py-12">
                      <Trophy className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma participacao neste periodo.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rankings.slice(0, 3).length > 0 && (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          {rankings.slice(0, 3).map((r, idx) => (
                            <Card
                              key={r.operatorId}
                              className={`text-center p-4 ${
                                idx === 0
                                  ? "bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30"
                                  : idx === 1
                                  ? "bg-gradient-to-br from-slate-400/20 to-slate-500/10 border-slate-400/30"
                                  : "bg-gradient-to-br from-amber-600/20 to-amber-700/10 border-amber-600/30"
                              }`}
                            >
                              <div className="flex justify-center mb-2">{getRankIcon(r.rank)}</div>
                              <p className="font-semibold text-foreground truncate">{r.operatorName}</p>
                              <p className="text-2xl font-bold text-emerald-500">{r.totalPoints}</p>
                              <p className="text-xs text-muted-foreground">pontos</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {r.accuracy}% de acerto
                              </p>
                            </Card>
                          ))}
                        </div>
                      )}
                      {rankings.length > 3 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[60px]">Pos</TableHead>
                              <TableHead>Operador</TableHead>
                              <TableHead className="text-center">Quizzes</TableHead>
                              <TableHead className="text-center">Acertos</TableHead>
                              <TableHead className="text-center">Precisao</TableHead>
                              <TableHead className="text-right">Pontos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rankings.slice(3).map((r) => (
                              <TableRow key={r.operatorId}>
                                <TableCell className="font-medium">{r.rank}</TableCell>
                                <TableCell>{r.operatorName}</TableCell>
                                <TableCell className="text-center">{r.totalAttempts}</TableCell>
                                <TableCell className="text-center">{r.correctAnswers}</TableCell>
                                <TableCell className="text-center">{r.accuracy}%</TableCell>
                                <TableCell className="text-right font-semibold text-emerald-500">
                                  {r.totalPoints}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === "history" && (
            <>
              <h3 className="text-lg font-semibold text-foreground">Historico de Quizzes</h3>
              {historicalQuizzes.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12">
                    <div className="text-center">
                      <History className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum quiz no historico.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {historicalQuizzes.map((quiz) => (
                    <Card key={quiz.id} className="overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-foreground truncate">{quiz.title}</h4>
                              <Badge variant="outline" className="text-muted-foreground">
                                Inativo
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{quiz.question}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewAttempts(quiz)}
                              className="h-8 w-8"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditQuiz(quiz)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Quiz Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-emerald-500" />
              {editingQuiz ? "Editar Quiz" : "Novo Quiz"}
            </DialogTitle>
            <DialogDescription>
              {editingQuiz ? "Atualize as informacoes do quiz." : "Crie um novo quiz para os operadores."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo do Quiz</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Quiz sobre Produto X"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="question">Pergunta</Label>
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Digite a pergunta do quiz..."
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Opcoes de Resposta</Label>
                {options.length < 6 && (
                  <Button variant="outline" size="sm" onClick={addOption}>
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm cursor-pointer transition-all ${
                        correctAnswer === option.id
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      onClick={() => setCorrectAnswer(option.id)}
                    >
                      {option.label}
                    </div>
                    <Input
                      value={option.text}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Opcao ${option.label}`}
                      className="flex-1"
                    />
                    {options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {correctAnswer === option.id && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Clique na letra para selecionar a resposta correta
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points">Pontos</Label>
                <Input
                  id="points"
                  type="number"
                  min={1}
                  max={100}
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value) || 10)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Dificuldade</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facil">Facil</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="dificil">Dificil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria (opcional)</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Produto, Atendimento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Agendar para (opcional)</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label>Status do Quiz</Label>
                <p className="text-sm text-muted-foreground">
                  {isActive ? "O quiz esta ativo e visivel para operadores" : "O quiz esta inativo"}
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => handleDialogChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveQuiz}
                disabled={saving}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    {editingQuiz ? "Atualizar" : scheduledDate ? "Agendar" : "Publicar"}
                    {!editingQuiz && !scheduledDate && <Send className="h-4 w-4 ml-2" />}
                    {!editingQuiz && scheduledDate && <Calendar className="h-4 w-4 ml-2" />}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Preview do Quiz
            </DialogTitle>
          </DialogHeader>
          {previewQuiz && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{previewQuiz.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  {getDifficultyBadge(previewQuiz.difficulty)}
                  <Badge className="bg-emerald-500/20 text-emerald-600">
                    {previewQuiz.points} pontos
                  </Badge>
                </div>
                <p className="text-foreground bg-muted/50 p-4 rounded-lg">{previewQuiz.question}</p>
              </div>
              <div className="space-y-2">
                {previewQuiz.options.map((opt: QuizOption) => (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-lg border-2 flex items-center gap-3 ${
                      opt.id === previewQuiz.correctAnswer
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border"
                    }`}
                  >
                    <span
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                        opt.id === previewQuiz.correctAnswer
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="flex-1">{opt.text}</span>
                    {opt.id === previewQuiz.correctAnswer && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attempts Dialog */}
      <Dialog open={showAttemptsDialog} onOpenChange={setShowAttemptsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Respostas do Quiz
            </DialogTitle>
            {previewQuiz && (
              <DialogDescription>{previewQuiz.title}</DialogDescription>
            )}
          </DialogHeader>
          <div className="py-4">
            {selectedQuizAttempts.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma resposta ainda.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operador</TableHead>
                    <TableHead>Resposta</TableHead>
                    <TableHead className="text-center">Resultado</TableHead>
                    <TableHead className="text-center">Pontos</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedQuizAttempts.map((attempt: any) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">{attempt.operator_name}</TableCell>
                      <TableCell>
                        {previewQuiz?.options.find((o: QuizOption) => o.id === attempt.selected_answer)?.label || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {attempt.is_correct ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-emerald-500">
                        +{attempt.points_earned}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(attempt.attempted_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
