"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { RichTextEditorWYSIWYG } from "@/components/rich-text-editor-wysiwyg"
import {
  useQualityPosts,
  useAdminQuestions,
  useAllUsers,
  createQualityPostSupabase,
  createFeedbackSupabase,
  getQualityStatsSupabase,
} from "@/hooks/use-supabase-realtime"
import { createClient } from "@/lib/supabase/client"
import type { QualityPost, User } from "@/lib/types"

const getSupabase = () => createClient()
import {
  Send,
  Megaphone,
  Brain,
  MessageSquare,
  ClipboardList,
  HelpCircle,
  BarChart3,
  Plus,
  Trash2,
  Users,
  ThumbsUp,
  MessageCircle,
  TrendingUp,
  ChevronDown,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface QualityCenterAdminPanelProps {
  pendingQuestions: number
}

export function QualityCenterAdminPanel({ pendingQuestions }: QualityCenterAdminPanelProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("publicar")
  const [operators, setOperators] = useState<User[]>([])
  const [questions, setQuestions] = useState<QualityPost[]>([])
  const [stats, setStats] = useState({ totalPosts: 0, totalLikes: 0, totalComments: 0, totalUsers: 0, onlineNow: 0 })

  // Publicar form
  const [publicationType, setPublicationType] = useState("comunicado")
  const [comunicadoContent, setComunicadoContent] = useState("")
  const [sendToAll, setSendToAll] = useState(true)

  // Quiz form
  const [quizQuestion, setQuizQuestion] = useState("")
  const [quizOptions, setQuizOptions] = useState(["", "", ""])
  const [correctOption, setCorrectOption] = useState(0)

  // Feedback form
  const [feedbackForm, setFeedbackForm] = useState({
    operatorId: "",
    callDate: "",
    callTime: "",
    ecNumber: "",
    feedbackType: "positive" as "positive" | "negative",
    severity: "leve" as "elogio" | "leve" | "medio" | "grave",
    score: 50,
    details: "",
    positivePoints: "",
    improvementPoints: "",
  })

  const { users: allUsers } = useAllUsers()
  const { questions: adminQuestions } = useAdminQuestions()
  
  useEffect(() => {
    setOperators(allUsers.filter((u) => u.role === "operator"))
  }, [allUsers])

  useEffect(() => {
    setQuestions(adminQuestions as any)
  }, [adminQuestions])

  useEffect(() => {
    const loadStats = async () => {
      const s = await getQualityStatsSupabase()
      setStats({
        totalPosts: s.totalPosts,
        totalLikes: s.totalLikes,
        totalComments: s.totalComments,
        totalUsers: s.totalUsers,
        onlineNow: s.onlineCount,
      })
    }
    loadStats()
    // Aumentado de 30s para 60s - estatísticas não precisam de atualização tão frequente
    const interval = setInterval(loadStats, 60000)
    return () => clearInterval(interval)
  }, [])

  const handlePublishComunicado = async () => {
    if (!comunicadoContent.trim()) {
      toast({ title: "Erro", description: "Digite o conteudo do comunicado", variant: "destructive" })
      return
    }

    try {
      await createQualityPostSupabase({
        type: publicationType as any,
        content: comunicadoContent,
        authorId: user?.id || "",
        authorName: user?.name || "Admin",
        authorRole: user?.role || "admin",
      })
      setComunicadoContent("")
      toast({ title: "Sucesso", description: "Comunicado publicado!" })
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao publicar", variant: "destructive" })
    }
  }

  const handlePublishQuiz = async () => {
    if (!quizQuestion.trim() || quizOptions.some(o => !o.trim())) {
      toast({ title: "Erro", description: "Preencha a pergunta e todas as opcoes", variant: "destructive" })
      return
    }

    try {
      // Formatar as opções do quiz com a estrutura correta
      const formattedQuizOptions = quizOptions.map((text, index) => ({
        id: `option-${Date.now()}-${index}`,
        text: text.trim(),
        votes: [],
        isCorrect: index === correctOption,
      }))

      await createQualityPostSupabase({
        type: "quiz",
        content: quizQuestion,
        authorId: user?.id || "",
        authorName: user?.name || "Admin",
        authorRole: user?.role || "admin",
        quizOptions: formattedQuizOptions,
        correctOption: correctOption,
      })
      setQuizQuestion("")
      setQuizOptions(["", "", ""])
      setCorrectOption(0)
      toast({ title: "Sucesso", description: "Quiz publicado!" })
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao publicar quiz", variant: "destructive" })
    }
  }

  const handleSendFeedback = async () => {
    if (!feedbackForm.operatorId || !feedbackForm.details.trim()) {
      toast({ title: "Erro", description: "Selecione o operador e preencha os detalhes", variant: "destructive" })
      return
    }

    try {
      const operator = operators.find((o) => o.id === feedbackForm.operatorId)
      await createFeedbackSupabase({
        ...feedbackForm,
        operatorName: operator?.name || "",
        createdBy: user?.id || "",
        createdByName: user?.name || "",
        supervisorId: user?.id || "",
        supervisorName: user?.name || "",
      })
      setFeedbackForm({
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
      toast({ title: "Sucesso", description: "Feedback enviado!" })
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao enviar feedback", variant: "destructive" })
    }
  }

  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    try {
      await getSupabase().from("quality_posts").update({
        admin_response: answer,
        responded_at: new Date().toISOString(),
        responded_by: user?.id,
      }).eq("id", questionId)
      toast({ title: "Sucesso", description: "Pergunta respondida!" })
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao responder", variant: "destructive" })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const tabs = [
    { id: "publicar", label: "Publicar", icon: Send },
    { id: "quiz", label: "Quiz", icon: Brain },
    { id: "feedback", label: "Feedback", icon: ClipboardList },
    { id: "perguntas", label: "Perguntas", icon: HelpCircle, badge: questions.length },
    { id: "estatisticas", label: "Estatisticas", icon: BarChart3 },
  ]

  const statCards = [
    { label: "Publicacoes", value: stats.totalPosts, icon: MessageSquare, color: "bg-blue-500/20", iconColor: "text-blue-400" },
    { label: "Curtidas", value: stats.totalLikes, icon: ThumbsUp, color: "bg-yellow-500/20", iconColor: "text-yellow-400" },
    { label: "Comentarios", value: stats.totalComments, icon: MessageCircle, color: "bg-orange-500/20", iconColor: "text-orange-400" },
    { label: "Usuarios", value: stats.totalUsers, icon: Users, color: "bg-green-500/20", iconColor: "text-green-400" },
  ]

  return (
    <div className="flex gap-6 p-6 h-[calc(100vh-60px)]">
      {/* Left Column - Painel Administrativo */}
      <div className="flex-1 min-w-0 space-y-4 overflow-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <BarChart3 className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Gerencie publicacoes, quizzes, feedbacks e estatisticas.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? "bg-orange-500 hover:bg-orange-600 text-white" : "text-muted-foreground hover:text-foreground"}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0">{tab.badge}</Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Forms Content */}
        <div className="space-y-6">
          {activeTab === "publicar" && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-lg">Novo Comunicado</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Crie um comunicado oficial para ser exibido aos operadores</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de Publicacao</Label>
                  <Select value={publicationType} onValueChange={setPublicationType}>
                    <SelectTrigger className="w-48 bg-background/50">
                      <Megaphone className="h-4 w-4 mr-2 text-orange-500" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comunicado">Comunicado</SelectItem>
                      <SelectItem value="recado">Recado</SelectItem>
                      <SelectItem value="aviso">Aviso</SelectItem>
                      <SelectItem value="procedimento">Procedimento</SelectItem>
                      <SelectItem value="dica">Dica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Conteudo do Script</Label>
                  <RichTextEditorWYSIWYG
                    value={comunicadoContent}
                    onChange={setComunicadoContent}
                    placeholder="Digite o conteudo do comunicado e use as ferramentas de formatacao..."
                    minHeight="200px"
                  />
                  <p className="text-xs text-yellow-500/80 flex items-center gap-1">
                    <span className="text-yellow-500">💡</span>
                    Selecione um trecho de texto e use as ferramentas de formatacao acima para aplicar estilos diretamente
                  </p>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <Label className="text-sm font-medium mb-3 block">Destinatarios</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="sendToAll" 
                      checked={sendToAll} 
                      onCheckedChange={(checked) => setSendToAll(checked as boolean)}
                      className="border-orange-500 data-[state=checked]:bg-orange-500"
                    />
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <label htmlFor="sendToAll" className="text-sm cursor-pointer">
                      Enviar para todos os operadores
                    </label>
                  </div>
                </div>

                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={handlePublishComunicado}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publicar Comunicado
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "quiz" && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-lg">Novo Quiz</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Crie um quiz para testar o conhecimento dos operadores</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pergunta</Label>
                  <Textarea
                    value={quizQuestion}
                    onChange={(e) => setQuizQuestion(e.target.value)}
                    placeholder="Digite a pergunta do quiz..."
                    className="bg-background/50 min-h-[100px]"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Opcoes de Resposta</Label>
                  {quizOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-colors ${
                          correctOption === index 
                            ? "bg-green-500 text-white" 
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                        onClick={() => setCorrectOption(index)}
                        title="Clique para marcar como resposta correta"
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...quizOptions]
                          newOptions[index] = e.target.value
                          setQuizOptions(newOptions)
                        }}
                        placeholder={`Opcao ${index + 1}`}
                        className="flex-1 bg-background/50"
                      />
                      {quizOptions.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newOptions = quizOptions.filter((_, i) => i !== index)
                            setQuizOptions(newOptions)
                            if (correctOption >= newOptions.length) {
                              setCorrectOption(newOptions.length - 1)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {quizOptions.length < 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuizOptions([...quizOptions, ""])}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Opcao
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Clique na letra para marcar a resposta correta (verde)
                  </p>
                </div>

                <Button 
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                  onClick={handlePublishQuiz}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Publicar Quiz
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "feedback" && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Novo Feedback</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Envie um feedback individual para um operador</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Operador</Label>
                    <Select value={feedbackForm.operatorId} onValueChange={(v) => setFeedbackForm({...feedbackForm, operatorId: v})}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((op) => (
                          <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo</Label>
                    <Select value={feedbackForm.feedbackType} onValueChange={(v: any) => setFeedbackForm({...feedbackForm, feedbackType: v})}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="positive">Positivo</SelectItem>
                        <SelectItem value="negative">Construtivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Data</Label>
                    <Input 
                      type="date" 
                      value={feedbackForm.callDate}
                      onChange={(e) => setFeedbackForm({...feedbackForm, callDate: e.target.value})}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Hora</Label>
                    <Input 
                      type="time"
                      value={feedbackForm.callTime}
                      onChange={(e) => setFeedbackForm({...feedbackForm, callTime: e.target.value})}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">EC/Protocolo</Label>
                    <Input 
                      value={feedbackForm.ecNumber}
                      onChange={(e) => setFeedbackForm({...feedbackForm, ecNumber: e.target.value})}
                      placeholder="Numero..."
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nota: {feedbackForm.score}%</Label>
                  <Slider
                    value={[feedbackForm.score]}
                    onValueChange={(v) => setFeedbackForm({...feedbackForm, score: v[0]})}
                    max={100}
                    step={5}
                    className="py-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Detalhes do Feedback</Label>
                  <Textarea
                    value={feedbackForm.details}
                    onChange={(e) => setFeedbackForm({...feedbackForm, details: e.target.value})}
                    placeholder="Descreva os pontos observados..."
                    className="bg-background/50 min-h-[120px]"
                  />
                </div>

                <Button 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleSendFeedback}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Feedback
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "perguntas" && (
            <div className="space-y-6">
              {/* Estatisticas de Perguntas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="p-3 rounded-xl bg-orange-500/20 mb-2">
                      <HelpCircle className="h-5 w-5 text-orange-500" />
                    </div>
                    <span className="text-2xl font-bold">{questions.length}</span>
                    <span className="text-xs text-muted-foreground">Pendentes</span>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="p-3 rounded-xl bg-green-500/20 mb-2">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="text-2xl font-bold">{stats.totalComments}</span>
                    <span className="text-xs text-muted-foreground">Respondidas</span>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="p-3 rounded-xl bg-blue-500/20 mb-2">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <span className="text-2xl font-bold">{operators.length}</span>
                    <span className="text-xs text-muted-foreground">Operadores</span>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="p-3 rounded-xl bg-purple-500/20 mb-2">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                    </div>
                    <span className="text-2xl font-bold">{stats.onlineNow}</span>
                    <span className="text-xs text-muted-foreground">Online Agora</span>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Perguntas */}
              <Card className="border-border/50 bg-card/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-orange-500" />
                      <CardTitle className="text-lg">Perguntas dos Operadores</CardTitle>
                      {questions.length > 0 && (
                        <Badge className="bg-red-500 text-white">{questions.length}</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Responda as duvidas dos operadores</p>
                </CardHeader>
                <CardContent>
                  {questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-4 bg-muted/50 rounded-full mb-4">
                        <HelpCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium">Nenhuma pergunta pendente</p>
                      <p className="text-sm text-muted-foreground">Todas as perguntas foram respondidas</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {questions.map((q) => (
                          <Card key={q.id} className="border-border/30 bg-background/50">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-orange-500/20 text-orange-500">
                                    {getInitials(q.authorName || "OP")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium">{q.authorName}</p>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true, locale: ptBR })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{q.content}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Digite sua resposta..."
                                  className="flex-1 bg-background/50"
                                  id={`answer-${q.id}`}
                                />
                                <Button
                                  className="bg-orange-500 hover:bg-orange-600 text-white"
                                  onClick={() => {
                                    const input = document.getElementById(`answer-${q.id}`) as HTMLInputElement
                                    if (input?.value.trim()) {
                                      handleAnswerQuestion(q.id, input.value.trim())
                                      input.value = ""
                                    }
                                  }}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Responder
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "estatisticas" && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-lg">Estatisticas Detalhadas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {statCards.map((stat) => (
                    <div key={stat.label} className={`p-4 rounded-xl ${stat.color} flex flex-col items-center justify-center`}>
                      <stat.icon className={`h-8 w-8 ${stat.iconColor} mb-2`} />
                      <span className="text-2xl font-bold">{stat.value}</span>
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
