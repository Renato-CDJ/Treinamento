"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { useAvailableQualityQuizzes, useQualityQuizAttempts } from "@/hooks/use-supabase-admin"
import { useToast } from "@/hooks/use-toast"
import {
  Brain,
  CheckCircle2,
  XCircle,
  Trophy,
  Star,
  Zap,
  Clock,
  ChevronRight,
  Sparkles,
  Target,
  Award,
  TrendingUp,
  PartyPopper,
} from "lucide-react"
import confetti from "canvas-confetti"

interface OperatorQuizModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OperatorQuizModal({ open, onOpenChange }: OperatorQuizModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { data: availableQuizzes, loading, refetch } = useAvailableQualityQuizzes(user?.id)
  const { data: myAttempts, submitAttempt } = useQualityQuizAttempts(user?.id)

  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; pointsEarned: number } | null>(null)
  const [startTime, setStartTime] = useState<number>(0)

  // Calculate stats
  const totalPoints = useMemo(() => {
    return myAttempts.reduce((acc: number, a: any) => acc + (a.points_earned || 0), 0)
  }, [myAttempts])

  const accuracy = useMemo(() => {
    if (myAttempts.length === 0) return 0
    const correct = myAttempts.filter((a: any) => a.is_correct).length
    return Math.round((correct / myAttempts.length) * 100)
  }, [myAttempts])

  const streak = useMemo(() => {
    let count = 0
    const sortedAttempts = [...myAttempts].sort(
      (a: any, b: any) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime()
    )
    for (const attempt of sortedAttempts) {
      if (attempt.is_correct) count++
      else break
    }
    return count
  }, [myAttempts])

  const handleSelectQuiz = (quiz: any) => {
    setSelectedQuiz(quiz)
    setSelectedAnswer("")
    setShowResult(false)
    setLastResult(null)
    setStartTime(Date.now())
  }

  const handleSubmitAnswer = async () => {
    if (!selectedQuiz || !selectedAnswer || !user) return

    setIsSubmitting(true)
    const timeSpent = Math.round((Date.now() - startTime) / 1000)
    const isCorrect = selectedAnswer === selectedQuiz.correct_answer
    const pointsEarned = isCorrect ? selectedQuiz.points : 0

    const { error } = await submitAttempt({
      quiz_id: selectedQuiz.id,
      operator_id: user.id,
      operator_name: user.fullName,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      points_earned: pointsEarned,
      time_spent: timeSpent,
    })

    if (error) {
      toast({
        title: "Erro",
        description: error,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    setLastResult({ isCorrect, pointsEarned })
    setShowResult(true)
    setIsSubmitting(false)

    // Trigger confetti for correct answers
    if (isCorrect) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
      })
    }

    // Refresh available quizzes
    refetch()
  }

  const handleBackToList = () => {
    setSelectedQuiz(null)
    setSelectedAnswer("")
    setShowResult(false)
    setLastResult(null)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white text-xl">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Brain className="h-6 w-6" />
              </div>
              Quiz da Qualidade
            </DialogTitle>
          </DialogHeader>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center gap-1 text-amber-300 mb-1">
                <Star className="h-4 w-4" />
                <span className="text-xl font-bold">{totalPoints}</span>
              </div>
              <p className="text-xs text-white/70">Pontos</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center gap-1 text-emerald-300 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xl font-bold">{accuracy}%</span>
              </div>
              <p className="text-xs text-white/70">Precisao</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center gap-1 text-orange-300 mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-xl font-bold">{streak}</span>
              </div>
              <p className="text-xs text-white/70">Sequencia</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {!selectedQuiz ? (
              // Quiz List
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                      <p className="text-sm text-muted-foreground">Carregando quizzes...</p>
                    </div>
                  </div>
                ) : availableQuizzes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <Trophy className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Tudo respondido!</h3>
                    <p className="text-muted-foreground">
                      Voce ja respondeu todos os quizzes disponiveis. Volte mais tarde para novos desafios.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 text-emerald-500" />
                      <h3 className="font-semibold text-foreground">
                        {availableQuizzes.length} quiz{availableQuizzes.length > 1 ? "zes" : ""} disponivel
                      </h3>
                    </div>
                    {availableQuizzes.map((quiz: any) => (
                      <Card
                        key={quiz.id}
                        className="cursor-pointer hover:shadow-lg hover:border-emerald-500/50 transition-all duration-300 group"
                        onClick={() => handleSelectQuiz(quiz)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-foreground truncate">{quiz.title}</h4>
                                {getDifficultyBadge(quiz.difficulty)}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">{quiz.question}</p>
                              <div className="flex items-center gap-3 mt-3">
                                <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                  <Star className="h-3 w-3 mr-1" />
                                  {quiz.points} pts
                                </Badge>
                                {quiz.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {quiz.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                              <ChevronRight className="h-5 w-5 text-emerald-500 group-hover:text-white" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            ) : !showResult ? (
              // Quiz Question
              <div className="space-y-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToList}
                  className="mb-2"
                >
                  <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                  Voltar
                </Button>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-semibold text-lg text-foreground">{selectedQuiz.title}</h3>
                    {getDifficultyBadge(selectedQuiz.difficulty)}
                  </div>
                  <div className="bg-gradient-to-br from-muted/50 to-muted/30 p-5 rounded-xl border">
                    <p className="text-foreground text-base leading-relaxed">{selectedQuiz.question}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedQuiz.options.map((option: any) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedAnswer(option.id)}
                      disabled={isSubmitting}
                      className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all duration-200 ${
                        selectedAnswer === option.id
                          ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                          : "border-border hover:border-emerald-500/50 hover:bg-muted/50"
                      }`}
                    >
                      <span
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                          selectedAnswer === option.id
                            ? "bg-emerald-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {option.label}
                      </span>
                      <span className="flex-1 text-left text-foreground">{option.text}</span>
                      {selectedAnswer === option.id && (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">{selectedQuiz.points} pontos</span>
                  </div>
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswer || isSubmitting}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      "Confirmar Resposta"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              // Result
              <div className="text-center py-8 space-y-6">
                {lastResult?.isCorrect ? (
                  <>
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
                        <CheckCircle2 className="h-12 w-12 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center shadow-lg animate-bounce">
                        <PartyPopper className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">Parabens!</h3>
                      <p className="text-muted-foreground">Voce acertou a resposta!</p>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-6 py-3 rounded-full">
                      <Star className="h-5 w-5 text-amber-500" />
                      <span className="text-xl font-bold">+{lastResult.pointsEarned} pontos</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto shadow-xl shadow-red-500/30">
                      <XCircle className="h-12 w-12 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">Quase la!</h3>
                      <p className="text-muted-foreground">Nao foi dessa vez, mas continue tentando!</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-2">Resposta correta:</p>
                      <p className="font-semibold text-foreground">
                        {selectedQuiz.options.find((o: any) => o.id === selectedQuiz.correct_answer)?.label}
                        {" - "}
                        {selectedQuiz.options.find((o: any) => o.id === selectedQuiz.correct_answer)?.text}
                      </p>
                    </div>
                  </>
                )}

                <Button
                  onClick={handleBackToList}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8"
                >
                  {availableQuizzes.length > 0 ? "Proximo Quiz" : "Voltar"}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
