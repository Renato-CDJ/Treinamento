"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { SafeHtml } from "@/components/safe-html"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trophy, ChevronLeft, Loader2 } from "lucide-react"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useMessages, useQuizzes, useFeedbacksForOperator } from "@/hooks/use-supabase-admin"
import { useAdminQuestions } from "@/hooks/use-supabase-realtime"
import type { Message, Quiz, Feedback, QualityQuestion } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"
import {
  MessageSquare,
  Brain,
  CheckCircle2,
  XCircle,
  Eye,
  History,
  Maximize2,
  Mail,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Send,
  Clock,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OperatorMessagesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OperatorMessagesModal({ open, onOpenChange }: OperatorMessagesModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Use Supabase hooks for realtime data
  const { data: messagesData, loading: messagesLoading, markAsSeen } = useMessages(user?.id)
  const { data: quizzesData, loading: quizzesLoading, submitAttempt } = useQuizzes(user?.id)
  const { data: feedbacksData, loading: feedbacksLoading, markAsRead: markFeedbackAsRead } = useFeedbacksForOperator(user?.id)
  const { questions: adminQuestionsData } = useAdminQuestions()
  
  const [sidebarView, setSidebarView] = useState<"messages" | "quiz" | "feedback" | "questions">("messages")
  const [activeTab, setActiveTab] = useState<"messages" | "quiz">("messages")
  const [showHistory, setShowHistory] = useState(false)
  const [showFeedbackHistory, setShowFeedbackHistory] = useState(false)
  const [showQuestionsHistory, setShowQuestionsHistory] = useState(false)
  const [newQuestion, setNewQuestion] = useState("")
  const [reopeningQuestionId, setReopeningQuestionId] = useState<string | null>(null)
  const [reopenReason, setReopenReason] = useState("")
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [expandedMessage, setExpandedMessage] = useState<any | null>(null)
  const [resultTimeout, setResultTimeout] = useState<NodeJS.Timeout | null>(null)
  const [userPreviousAnswer, setUserPreviousAnswer] = useState<string | null>(null)
  const [fadingFeedbackId, setFadingFeedbackId] = useState<string | null>(null)

  // Map Supabase data to component format
  const messages = useMemo(() => messagesData
    .filter((m: any) => m.is_active && (!m.seen_by || !m.seen_by.includes(user?.id)))
    .map((m: any) => ({
      id: m.id,
      title: m.title,
      content: m.content,
      priority: m.priority || "normal",
      isActive: m.is_active,
      createdAt: new Date(m.created_at),
      seenBy: m.seen_by || [],
      createdBy: m.created_by || m.createdBy || "",
      createdByName: m.created_by_name || m.createdByName || "",
      attachment: m.attachment,
    })), [messagesData, user?.id])

  const historicalMessages = useMemo(() => messagesData
    .filter((m: any) => m.seen_by && m.seen_by.includes(user?.id))
    .map((m: any) => ({
      id: m.id,
      title: m.title,
      content: m.content,
      priority: m.priority || "normal",
      isActive: m.is_active,
      createdAt: new Date(m.created_at),
      seenBy: m.seen_by || [],
      createdBy: m.created_by || m.createdBy || "",
      createdByName: m.created_by_name || m.createdByName || "",
      attachment: m.attachment,
    })), [messagesData, user?.id])

  const quizzes = useMemo(() => quizzesData
    .filter((q: any) => q.is_active)
    .map((q: any) => ({
      id: q.id,
      question: q.question,
      options: q.options || [],
      correctAnswer: q.correct_answer,
      isActive: q.is_active,
      createdAt: new Date(q.created_at),
      createdBy: q.created_by || q.createdBy || "",
      createdByName: q.created_by_name || q.createdByName || "",
    })), [quizzesData])

  const historicalQuizzes = useMemo(() => quizzesData
    .filter((q: any) => !q.is_active)
    .map((q: any) => ({
      id: q.id,
      question: q.question,
      options: q.options || [],
      correctAnswer: q.correct_answer,
      isActive: q.is_active,
      createdAt: new Date(q.created_at),
      createdBy: q.created_by || q.createdBy || "",
      createdByName: q.created_by_name || q.createdByName || "",
    })), [quizzesData])

  const feedbacks = useMemo(() => feedbacksData
    .filter((f: any) => !f.is_read)
    .map((f: any) => ({
      id: f.id,
      type: f.type || f.feedback_type || "positive",
      feedbackType: f.feedback_type || f.type || "positive",
      severity: f.severity || "leve",
      message: f.message,
      senderName: f.sender_name,
      isRead: f.is_read,
      createdAt: new Date(f.created_at),
      operatorId: f.operator_id,
      operatorName: f.operator_name,
      createdBy: f.created_by,
      createdByName: f.created_by_name,
      callDate: f.call_date ? new Date(f.call_date) : new Date(f.created_at),
      ecNumber: f.ec_number || "",
      score: Number(f.score) || 0,
      details: f.details || "",
      positivePoints: f.positive_points || "",
      improvementPoints: f.improvement_points || "",
      isActive: f.is_active ?? true,
    })), [feedbacksData])

  // Filter questions for this operator
  const qualityQuestions = useMemo<QualityQuestion[]>(() => adminQuestionsData
    .filter((q: any) => q.authorId === user?.id)
    .map((q: any) => ({
      id: q.id,
      operatorId: q.operatorId || q.operator_id,
      operatorName: q.operatorName || q.operator_name,
      question: q.question,
      reply: q.reply,
      answer: q.answer || q.reply || "",
      status: q.reply ? "answered" : "pending",
      createdAt: new Date(q.createdAt),
      isResolved: q.is_resolved ?? false,
      answeredByName: q.answered_by_name || q.answeredByName || "",
      answeredAt: q.answered_at ? new Date(q.answered_at) : undefined,
      wasClear: q.was_clear,
      reopenReason: q.reopen_reason,
      previousAnswers: q.previous_answers || q.previousAnswers || [],
    })), [adminQuestionsData, user?.id])

  const unseenCount = useMemo(() => {
    if (!user) return 0
    return messages.filter((m) => !m.seenBy.includes(user.id)).length
  }, [messages, user])

  const unreadFeedbackCount = useMemo(() => {
    if (!user) return 0
    return feedbacks.filter((f) => !f.isRead).length
  }, [feedbacks, user])

  const hasSeenMessage = useCallback(
    (message: { seenBy: string[] }) => {
      if (!user?.id) return false
      return message.seenBy.includes(user.id)
    },
    [user],
  )

  const [answeredQuizzes, setAnsweredQuizzes] = useState<Set<string>>(new Set())

  const hasAnsweredQuiz = useCallback(
    (quizId: string) => {
      return answeredQuizzes.has(quizId)
    },
    [answeredQuizzes],
  )

  const handleMarkAsSeen = useCallback(
    async (messageId: string) => {
      if (user) {
        await markAsSeen(messageId)
        toast({
          title: "Mensagem marcada como vista",
          description: "A mensagem foi marcada como vista com sucesso.",
        })
      }
    },
    [user, markAsSeen, toast],
  )

  const handleSelectQuiz = (quiz: any) => {
    setSelectedQuiz(quiz)
    setSelectedAnswer("")
    setShowResult(false)
    setIsCorrect(false)
    setUserPreviousAnswer(null)
  }

  const handleSubmitQuiz = useCallback(async () => {
    if (!selectedQuiz || !selectedAnswer || !user) return

    const correct = selectedAnswer === selectedQuiz.correctAnswer
    setIsCorrect(correct)
    setShowResult(true)

    await submitAttempt(selectedQuiz.id, selectedAnswer, correct)
    setAnsweredQuizzes(prev => new Set([...prev, selectedQuiz.id]))

    if (resultTimeout) clearTimeout(resultTimeout)
    const timeout = setTimeout(() => {
      setShowResult(false)
      setSelectedQuiz(null)
      setSelectedAnswer("")
      setUserPreviousAnswer(null)
    }, 5000)
    setResultTimeout(timeout)
  }, [selectedQuiz, selectedAnswer, user, submitAttempt, resultTimeout])

  const displayMessages = useMemo(() => {
    const list = showHistory ? historicalMessages : messages
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [showHistory, historicalMessages, messages])

  const displayQuizzes = useMemo(() => {
    const list = showHistory ? historicalQuizzes : quizzes
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [showHistory, historicalQuizzes, quizzes])

  // Filter feedbacks to only show those relevant to the current user if user is logged in
  const displayedFeedbacks = useMemo(() => {
    if (!user) return []
    const list = showFeedbackHistory ? feedbacks : feedbacks.filter((f) => !f.isRead)
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [feedbacks, user, showFeedbackHistory])

  const handleSidebarChange = (view: "messages" | "quiz" | "feedback" | "questions") => {
    setSidebarView(view)
    if (view === "messages") {
      setActiveTab("messages")
      setShowHistory(false)
    } else if (view === "quiz") {
      setActiveTab("quiz")
      setShowHistory(false)
    } else if (view === "feedback") {
      setShowFeedbackHistory(false)
    } else if (view === "questions") {
      setShowQuestionsHistory(false)
    }
    setSelectedQuiz(null)
    setUserPreviousAnswer(null)
  }

  const handleMarkFeedbackAsReadFn = useCallback(
    async (feedbackId: string) => {
      if (!user) return

      setFadingFeedbackId(feedbackId)

      // Wait for animation to complete before marking as read
      setTimeout(async () => {
        await markFeedbackAsRead(feedbackId)
        setFadingFeedbackId(null)

        toast({
          title: "Feedback marcado como lido",
          description: "Voce confirmou a leitura deste feedback.",
        })
      }, 300) // Match animation duration
    },
    [user, toast, markFeedbackAsRead],
  )

  // Determine if feedback is positive based on score
  const isPositive = (feedback: Feedback) => feedback.score >= 70 // Example threshold, adjust as needed

  // Determine severity badge based on score
  const getSeverityBadge = (feedback: Feedback) => {
    const severity = feedback.severity || "leve"
    switch (severity) {
      case "elogio":
        return {
          label: "Elogio",
          className: "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700",
        }
      case "leve":
        return {
          label: "Leve",
          className: "bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700",
        }
      case "medio":
        return {
          label: "Médio",
          className: "bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700",
        }
      case "grave":
        return {
          label: "Grave",
          className: "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700",
        }
      default:
        return {
          label: "Leve",
          className: "bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700",
        }
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[98vw] w-[98vw] !max-h-[90vh] h-[85vh] p-0 gap-0 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-border">
            <div className="px-5 sm:px-8 pt-5 sm:pt-6 pb-0">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  Central da Qualidade
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Publicações, comunicados e avaliações da equipe
                </DialogDescription>
              </DialogHeader>

              {/* Horizontal Tabs */}
              <div className="flex items-center gap-1 -mb-px overflow-x-auto">
                <button
                  type="button"
                  onClick={() => handleSidebarChange("messages")}
                  className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    sidebarView === "messages"
                      ? "text-orange-500 bg-orange-500/10 border-b-2 border-orange-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Recados
                  {unseenCount > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-bold text-white bg-orange-500 rounded-full">
                      {unseenCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSidebarChange("quiz")}
                  className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    sidebarView === "quiz"
                      ? "text-orange-500 bg-orange-500/10 border-b-2 border-orange-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Brain className="h-4 w-4" />
                  Quiz
                </button>

                <button
                  type="button"
                  onClick={() => handleSidebarChange("feedback")}
                  className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    sidebarView === "feedback"
                      ? "text-orange-500 bg-orange-500/10 border-b-2 border-orange-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  Feedback
                  {unreadFeedbackCount > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-bold text-white bg-orange-500 rounded-full">
                      {unreadFeedbackCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSidebarChange("questions")}
                  className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    sidebarView === "questions"
                      ? "text-orange-500 bg-orange-500/10 border-b-2 border-orange-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <HelpCircle className="h-4 w-4" />
                  Pergunte para Qualidade
                  {qualityQuestions.filter((q) => q.answer && !q.isResolved).length > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-bold text-white bg-orange-500 rounded-full">
                      {qualityQuestions.filter((q) => q.answer && !q.isResolved).length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-5 sm:px-8 py-5 sm:py-6">
              {/* RECADOS */}
              {sidebarView === "messages" && (
                <div className="space-y-4">
                  {/* Subheader */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {showHistory ? "Histórico de recados anteriores" : `${displayMessages.length} recado(s) disponível(is)`}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHistory(!showHistory)}
                      className="gap-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <History className="h-3.5 w-3.5" />
                      {showHistory ? "Ver novos" : "Histórico"}
                    </Button>
                  </div>

                  {displayMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                      <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                        <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-muted-foreground text-sm font-medium">
                        {showHistory ? "Nenhuma mensagem no histórico" : "Nenhum recado no momento"}
                      </p>
                      <p className="text-muted-foreground/60 text-xs mt-1">Novos recados aparecerão aqui</p>
                    </div>
                  ) : (
                    displayMessages.map((message, index) => {
                      const seen = Array.isArray(message.seenBy) && user?.id !== undefined && message.seenBy.includes(user.id)

                      return (
                        <article
                          key={message.id}
                          className={`group rounded-xl border transition-all duration-200 overflow-hidden ${
                            seen
                              ? "border-border/50 bg-muted/20 opacity-70"
                              : "border-orange-500/30 bg-card hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5"
                          }`}
                        >
                          {/* Card Header - Author row */}
                          <div className="flex items-center gap-3 px-4 sm:px-5 pt-4 pb-2">
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                              <Mail className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground truncate">{message.createdByName}</span>
                                {!seen && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-orange-500 rounded-md">
                                    NOVO
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(message.createdAt).toLocaleDateString("pt-BR")} as{" "}
                                {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setExpandedMessage(message)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <Maximize2 className="h-4 w-4" />
                              </Button>
                              {seen && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Eye className="h-3 w-3" />
                                  Visto
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="px-4 sm:px-5 pb-4">
                            <div className="rounded-lg bg-muted/30 border border-border/50 p-4 max-h-[300px] overflow-y-auto">
                              <SafeHtml
                                html={message.content}
                                className="text-sm leading-relaxed break-words prose prose-sm max-w-none dark:prose-invert"
                              />
                              {message.attachment && message.attachment.type === "image" && (
                                <div className="mt-3">
                                  <img
                                    src={message.attachment.url || "/placeholder.svg"}
                                    alt={message.attachment.name}
                                    className="max-w-full h-auto rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(message.attachment!.url, "_blank")}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1.5">{message.attachment.name}</p>
                                </div>
                              )}
                            </div>

                            {!seen && !showHistory && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkAsSeen(message.id)}
                                className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Marcar como visto
                              </Button>
                            )}
                          </div>
                        </article>
                      )
                    })
                  )}
                </div>
              )}

              {sidebarView === "quiz" && (
                <div className="space-y-4">
                  {!selectedQuiz ? (
                    <>
                      {/* Subheader */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {showHistory ? "Histórico de quiz anteriores" : `${displayQuizzes.length} quiz(zes) disponível(is)`}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowHistory(!showHistory)}
                          className="gap-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <History className="h-3.5 w-3.5" />
                          {showHistory ? "Ver novos" : "Histórico"}
                        </Button>
                      </div>

                      {displayQuizzes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                          <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                            <Brain className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                          <p className="text-muted-foreground text-sm font-medium">
                            {showHistory ? "Nenhum quiz no histórico" : "Nenhum quiz no momento"}
                          </p>
                          <p className="text-muted-foreground/60 text-xs mt-1">Novos quizzes aparecerão aqui</p>
                        </div>
                      ) : (
                        displayQuizzes.map((quiz, index) => {
                          const answered = hasAnsweredQuiz(quiz.id)

                          return (
                            <article
                              key={quiz.id}
                              className={`group rounded-xl border transition-all duration-200 overflow-hidden ${
                                answered
                                  ? "border-border/50 bg-muted/20 opacity-70"
                                  : "border-orange-500/30 bg-card hover:border-orange-500/50 hover:shadow-lg cursor-pointer"
                              }`}
                              onClick={() => !answered && !showHistory && handleSelectQuiz(quiz)}
                            >
                              <div className="px-4 sm:px-5 py-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Brain className="h-4 w-4 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-semibold text-foreground truncate">{quiz.createdByName}</span>
                                      {!answered && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-orange-500 rounded-md">
                                          NOVO
                                        </span>
                                      )}
                                      {answered && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded-md">
                                          <CheckCircle2 className="h-3 w-3" />
                                          Respondido
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">
                                      {new Date(quiz.createdAt).toLocaleDateString("pt-BR")} as{" "}
                                      {new Date(quiz.createdAt).toLocaleTimeString("pt-BR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>

                                    <div className="rounded-lg bg-muted/30 border border-border/50 p-3 sm:p-4 mb-3">
                                      <p className="text-sm sm:text-base font-semibold text-foreground break-words">
                                        {quiz.question}
                                      </p>
                                    </div>

                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleSelectQuiz(quiz)
                                      }}
                                      className={`w-full text-sm font-medium ${
                                        !answered && !showHistory
                                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                                          : ""
                                      }`}
                                      disabled={answered && !showHistory}
                                    >
                                      {answered ? "Já respondido" : showHistory ? "Visualizar" : "Responder Quiz"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          )
                        })
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl border border-orange-500/30 bg-card overflow-hidden">
                      <div className="px-5 pt-5 pb-4 border-b border-border/50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                            <Brain className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-xs font-medium text-orange-500 uppercase tracking-wide">Quiz Ativo</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-foreground break-words">
                          {selectedQuiz.question}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Selecione a resposta correta abaixo
                        </p>
                      </div>
                      <div className="px-5 py-4 space-y-4">
                        <RadioGroup
                          value={selectedAnswer}
                          onValueChange={setSelectedAnswer}
                          disabled={showResult || showHistory}
                          className="space-y-2"
                        >
                          {selectedQuiz.options.map((option, index) => (
                            <div
                              key={option.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${
                                !showResult && !showHistory ? "hover:bg-muted/50 cursor-pointer" : ""
                              } ${
                                selectedAnswer === option.id && !showResult && !showHistory
                                  ? "border-orange-500 bg-orange-500/5"
                                  : showResult && option.id === selectedQuiz.correctAnswer
                                    ? "border-green-500 bg-green-500/10"
                                    : showResult && option.id === selectedAnswer && !isCorrect
                                      ? "border-red-500 bg-red-500/10"
                                      : showHistory && option.id === userPreviousAnswer && !isCorrect
                                        ? "border-red-500 bg-red-500/10"
                                        : showHistory && option.id === userPreviousAnswer && isCorrect
                                          ? "border-green-500 bg-green-500/10"
                                          : "border-border/50"
                              }`}
                            >
                              <RadioGroupItem
                                value={option.id}
                                id={option.id}
                                className="h-4 w-4 mt-0.5 flex-shrink-0"
                                disabled={showResult || showHistory}
                              />
                              <Label
                                htmlFor={option.id}
                                className={`flex-1 min-w-0 cursor-pointer text-sm transition-all break-words ${
                                  showResult && option.id === selectedQuiz.correctAnswer
                                    ? "text-green-600 dark:text-green-400 font-semibold"
                                    : showResult && option.id === selectedAnswer && !isCorrect
                                      ? "text-red-600 dark:text-red-400"
                                      : selectedAnswer === option.id && !showResult && !showHistory
                                        ? "font-semibold text-foreground"
                                        : showHistory && option.id === userPreviousAnswer && isCorrect
                                          ? "text-green-600 dark:text-green-400 font-semibold"
                                          : showHistory && option.id === userPreviousAnswer && !isCorrect
                                            ? "text-red-600 dark:text-red-400"
                                            : "text-foreground"
                                }`}
                              >
                                <span className="font-semibold text-orange-500 mr-2">{option.label})</span>
                                {option.text}
                                {showResult && option.id === selectedQuiz.correctAnswer && (
                                  <CheckCircle2 className="inline h-4 w-4 ml-2 text-green-500" />
                                )}
                                {showResult && option.id === selectedAnswer && !isCorrect && (
                                  <XCircle className="inline h-4 w-4 ml-2 text-red-500" />
                                )}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>

                        {/* Result */}
                        {showResult && (
                          <div
                            className={`p-4 rounded-lg border transition-all ${
                              isCorrect
                                ? "bg-green-500/10 border-green-500/40"
                                : "bg-red-500/10 border-red-500/40"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              {isCorrect ? (
                                <Trophy className="h-6 w-6 text-yellow-500" />
                              ) : (
                                <XCircle className="h-6 w-6 text-red-500" />
                              )}
                              <div>
                                <h4 className={`text-base font-bold ${isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                  {isCorrect ? "Parabéns! Resposta correta!" : "Resposta incorreta"}
                                </h4>
                                <p className={`text-xs ${isCorrect ? "text-green-600/80 dark:text-green-400/80" : "text-red-500/80"}`}>
                                  {isCorrect
                                    ? "Excelente trabalho! Você demonstrou conhecimento."
                                    : "Não foi desta vez, tente novamente no próximo Quiz."}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (resultTimeout) clearTimeout(resultTimeout)
                                  setShowResult(false)
                                  setSelectedQuiz(null)
                                  setSelectedAnswer("")
                                  setUserPreviousAnswer(null)
                                  setIsCorrect(false)
                                }}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm"
                              >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Voltar
                              </Button>
                              {isCorrect && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (resultTimeout) clearTimeout(resultTimeout)
                                    setShowResult(false)
                                    setSelectedQuiz(null)
                                    setSelectedAnswer("")
                                    setUserPreviousAnswer(null)
                                    setIsCorrect(false)
                                  }}
                                  className="flex-1 text-sm"
                                >
                                  Próximo Quiz
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className={`flex gap-2 pt-2 ${showResult ? "hidden" : ""}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedQuiz(null)
                              setUserPreviousAnswer(null)
                            }}
                            className="flex-1 text-sm"
                          >
                            Voltar
                          </Button>
                          {!showResult && !showHistory && (
                            <Button
                              size="sm"
                              onClick={handleSubmitQuiz}
                              disabled={!selectedAnswer}
                              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm"
                            >
                              Enviar Resposta
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {sidebarView === "feedback" && (
                <div className="space-y-4">
                  {/* Subheader */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {showFeedbackHistory ? "Histórico de feedbacks anteriores" : `${displayedFeedbacks.length} feedback(s)`}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFeedbackHistory(!showFeedbackHistory)}
                      className="gap-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <History className="h-3.5 w-3.5" />
                      {showFeedbackHistory ? "Ver novos" : "Histórico"}
                    </Button>
                  </div>

                  {displayedFeedbacks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                      <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                        <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-muted-foreground text-sm font-medium">
                        {showFeedbackHistory ? "Nenhum feedback no histórico" : "Nenhum feedback novo"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayedFeedbacks.map((feedback) => {
                        const isPositiveFeedback = isPositive(feedback)
                        const severityBadge = getSeverityBadge(feedback)
                        return (
                          <div
                            key={feedback.id}
                            className={`transition-all duration-300 ${
                              fadingFeedbackId === feedback.id
                                ? "opacity-0 scale-95 translate-x-4"
                                : "opacity-100 scale-100 translate-x-0"
                            }`}
                          >
                            <article className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                              feedback.isRead
                                ? "border-border/50 bg-muted/10 opacity-70"
                                : isPositiveFeedback
                                  ? "border-green-500/30 bg-card hover:border-green-500/50"
                                  : "border-red-500/30 bg-card hover:border-red-500/50"
                            }`}>
                              {/* Card Header */}
                              <div className="flex items-center gap-3 px-4 sm:px-5 pt-4 pb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  isPositiveFeedback ? "bg-green-500" : "bg-red-500"
                                }`}>
                                  {isPositiveFeedback ? <ThumbsUp className="h-4 w-4 text-white" /> : <ThumbsDown className="h-4 w-4 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground truncate">{feedback.createdByName}</span>
                                    {!feedback.isRead && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-orange-500 rounded-md">
                                        NOVO
                                      </span>
                                    )}
                                    {feedback.isRead && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded-md">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Lido
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(feedback.callDate).toLocaleDateString("pt-BR")} as{" "}
                                    {new Date(feedback.callDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                    {" "} - EC: {feedback.ecNumber}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-white rounded-md ${
                                    isPositiveFeedback ? "bg-green-500" : "bg-red-500"
                                  }`}>
                                    {feedback.score}/100
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-white rounded-md ${severityBadge.className}`}>
                                    {severityBadge.label}
                                  </span>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="px-4 sm:px-5 pb-4 space-y-2">
                                <div className="rounded-lg bg-muted/30 border border-border/50 p-3 space-y-3">
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Detalhes</p>
                                    <p className="text-sm leading-relaxed break-words text-foreground">{feedback.details}</p>
                                  </div>
                                  {feedback.positivePoints && feedback.positivePoints.trim().length > 0 && (
                                    <div className="border-t border-border/30 pt-2">
                                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Pontos Positivos</p>
                                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground">{feedback.positivePoints}</p>
                                    </div>
                                  )}
                                  {feedback.improvementPoints && feedback.improvementPoints.trim().length > 0 && (
                                    <div className="border-t border-border/30 pt-2">
                                      <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">Pontos a Melhorar</p>
                                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground">{feedback.improvementPoints}</p>
                                    </div>
                                  )}
                                </div>

                                {!feedback.isRead && (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleMarkFeedbackAsReadFn(feedback.id)
                                    }}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Marcar como lido
                                  </Button>
                                )}
                              </div>
                            </article>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {sidebarView === "questions" && (
                <div className="space-y-4">
                  {/* Subheader */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {showQuestionsHistory
                        ? "Historico de perguntas"
                        : `${qualityQuestions.filter((q) => !q.isResolved).length} pergunta(s) em aberto`}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQuestionsHistory(!showQuestionsHistory)}
                      className="gap-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <History className="h-3.5 w-3.5" />
                      {showQuestionsHistory ? "Ver abertas" : "Historico"}
                    </Button>
                  </div>

                  {/* New Question Form - limit to 3 open questions */}
                  {!showQuestionsHistory && user && qualityQuestions.filter((q) => !q.isResolved).length < 3 && (
                    <div className="rounded-xl border border-orange-500/30 bg-card p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-semibold text-foreground">Enviar nova pergunta</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {3 - qualityQuestions.filter((q) => !q.isResolved).length} restante(s)
                        </span>
                      </div>
                      <Textarea
                        placeholder="Digite sua pergunta para a equipe de Qualidade..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (!newQuestion.trim() || !user) return
                          // Using createAdminQuestion from useAdminQuestions hook imported
                          const { createAdminQuestion } = await import("@/hooks/use-supabase-realtime")
                          await createAdminQuestion({
                            question: newQuestion.trim(),
                            authorId: user.id,
                            authorName: user.fullName || user.username || "Operador",
                          })
                          setNewQuestion("")
                          toast({
                            title: "Pergunta enviada",
                            description: "Sua pergunta foi enviada para a equipe de Qualidade.",
                          })
                        }}
                        disabled={!newQuestion.trim()}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Pergunta
                      </Button>
                    </div>
                  )}

                  {!showQuestionsHistory && user && qualityQuestions.filter((q) => !q.isResolved).length >= 3 && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                      <p className="text-sm text-amber-600 dark:text-amber-400 font-medium text-center">
                        Voce atingiu o limite de 3 perguntas em aberto. Aguarde a resposta ou confirme as existentes.
                      </p>
                    </div>
                  )}

                  {/* Questions List */}
                  {(() => {
                    const displayQuestions = showQuestionsHistory
                      ? [...qualityQuestions].filter((q) => q.isResolved).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      : [...qualityQuestions].filter((q) => !q.isResolved).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

                    if (displayQuestions.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                          <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                            <HelpCircle className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                          <p className="text-muted-foreground text-sm font-medium">
                            {showQuestionsHistory ? "Nenhuma pergunta no historico" : "Nenhuma pergunta em aberto"}
                          </p>
                          <p className="text-muted-foreground/60 text-xs mt-1">
                            {showQuestionsHistory ? "Perguntas resolvidas aparecerao aqui" : "Envie uma pergunta para a Qualidade"}
                          </p>
                        </div>
                      )
                    }

                    return displayQuestions.map((q) => (
                      <article
                        key={q.id}
                        className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                          q.answer && !q.isResolved
                            ? "border-green-500/30 bg-card hover:border-green-500/50"
                            : q.isResolved
                              ? "border-border/50 bg-muted/20 opacity-70"
                              : "border-orange-500/30 bg-card"
                        }`}
                      >
                        <div className="px-4 sm:px-5 pt-4 pb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                              <HelpCircle className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">Sua pergunta</span>
                                {!q.answer && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 bg-amber-500/10 rounded-md">
                                    <Clock className="h-3 w-3" />
                                    AGUARDANDO
                                  </span>
                                )}
                                {q.answer && !q.isResolved && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-green-500 rounded-md">
                                    RESPONDIDA
                                  </span>
                                )}
                                {q.isResolved && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded-md">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {q.wasClear ? "Esclarecido" : "Nao esclarecido"}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(q.createdAt).toLocaleDateString("pt-BR")} as{" "}
                                {new Date(q.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="px-4 sm:px-5 pb-4 space-y-3">
                          {/* Question */}
                          <div className="rounded-lg bg-muted/30 border border-border/50 p-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Pergunta</p>
                            <p className="text-sm leading-relaxed break-words text-foreground">{q.question}</p>
                          </div>

                          {/* Answer */}
                          {q.answer && (
                            <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs font-semibold text-green-600 dark:text-green-400">Resposta da Qualidade</p>
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

                          {/* Resolve buttons */}
                          {q.answer && !q.isResolved && (
                            <div className="space-y-2">
                              {reopeningQuestionId === q.id ? (
                                <div className="space-y-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                                    O que nao ficou claro? Descreva para que a Qualidade possa complementar:
                                  </p>
                                  <Textarea
                                    placeholder="Explique o que ainda ficou pendente..."
                                    value={reopenReason}
                                    onChange={(e) => setReopenReason(e.target.value)}
                                    rows={3}
                                    className="resize-none text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        if (!reopenReason.trim()) return
                                        const { markQuestionUnderstood } = await import("@/hooks/use-supabase-realtime")
                                        await markQuestionUnderstood(q.id, false)
                                        setReopeningQuestionId(null)
                                        setReopenReason("")
                                        toast({ title: "Pergunta reaberta", description: "A Qualidade recebera sua observacao e podera responder novamente." })
                                      }}
                                      disabled={!reopenReason.trim()}
                                      className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm"
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Enviar e Reabrir
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setReopeningQuestionId(null)
                                        setReopenReason("")
                                      }}
                                      className="text-sm"
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-xs font-medium text-foreground text-center">Ficou esclarecido?</p>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        const { markQuestionUnderstood } = await import("@/hooks/use-supabase-realtime")
                                        await markQuestionUnderstood(q.id, true)
                                        toast({ title: "Obrigado!", description: "Sua pergunta foi marcada como esclarecida." })
                                      }}
                                      className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm"
                                    >
                                      <ThumbsUp className="h-4 w-4 mr-2" />
                                      Sim, esclareceu
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setReopeningQuestionId(q.id)}
                                      className="flex-1 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-sm"
                                    >
                                      <ThumbsDown className="h-4 w-4 mr-2" />
                                      Nao esclareceu
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          {/* Previous answers history */}
                          {q.previousAnswers && q.previousAnswers.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Respostas anteriores</p>
                              {q.previousAnswers.map((prev, idx) => (
                                <div key={idx} className="rounded-lg bg-muted/20 border border-border/30 p-2.5 space-y-1">
                                  <p className="text-xs text-foreground">{prev.answer}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    por {prev.answeredByName} - {new Date(prev.answeredAt).toLocaleDateString("pt-BR")}
                                  </p>
                                  <div className="rounded bg-red-500/5 border border-red-500/10 px-2 py-1 mt-1">
                                    <p className="text-[10px] text-red-600 dark:text-red-400">
                                      Motivo da reabertura: {prev.reopenReason}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </article>
                    ))
                  })()}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Message Dialog */}
      <Dialog open={!!expandedMessage} onOpenChange={(open) => !open && setExpandedMessage(null)}>
        <DialogContent className="w-[96vw] max-w-4xl h-[85vh] max-h-[85vh] flex flex-col p-0 gap-0">
          <div className="flex items-center gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground">
                {expandedMessage?.createdByName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {expandedMessage && (
                  <>
                    {new Date(expandedMessage.createdAt).toLocaleDateString("pt-BR")} as{" "}
                    {new Date(expandedMessage.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </>
                )}
              </DialogDescription>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-5 sm:px-6 py-5">
              <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
                <SafeHtml
                  html={expandedMessage?.content || ""}
                  className="text-sm sm:text-base leading-relaxed break-words"
                />
                {expandedMessage?.attachment && expandedMessage.attachment.type === "image" && (
                  <div className="mt-4">
                    <img
                      src={expandedMessage.attachment.url || "/placeholder.svg"}
                      alt={expandedMessage.attachment.name}
                      className="max-w-full h-auto rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(expandedMessage.attachment!.url, "_blank")}
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">{expandedMessage.attachment.name}</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-2 px-5 sm:px-6 py-4 border-t border-border flex-shrink-0">
            {expandedMessage && !hasSeenMessage(expandedMessage) && !showHistory && (
              <Button
                size="sm"
                onClick={() => {
                  handleMarkAsSeen(expandedMessage.id)
                  setExpandedMessage(null)
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar como visto
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedMessage(null)}
              className={`text-sm font-medium ${expandedMessage && !hasSeenMessage(expandedMessage) && !showHistory ? "flex-1" : "w-full"}`}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
