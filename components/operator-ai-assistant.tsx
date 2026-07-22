"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Bot, Send, X, Sparkles, UserRound, AlertCircle, MessageSquareText } from "lucide-react"
import type { ScriptStep } from "@/lib/types"
import {
  buildKnowledgeBase,
  searchKnowledge,
  isConfident,
  type KnowledgeCategory,
} from "@/lib/operator-ai-search"

interface OperatorAiAssistantProps {
  productName: string
  allSteps: ScriptStep[]
}

interface Source {
  title: string
  categoryLabel: string
  category: KnowledgeCategory
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  /** Fonte principal da resposta (para exibir o "de onde veio"). */
  source?: Source
  /** Outras sugestoes relacionadas. */
  related?: Source[]
  /** Indica resposta de fallback (buscar especialista). */
  needsSpecialist?: boolean
}

const CATEGORY_COLORS: Record<KnowledgeCategory, string> = {
  roteiro: "bg-primary/15 text-primary",
  situacao: "bg-blue-500/15 text-blue-500",
  tabulacao: "bg-emerald-500/15 text-emerald-500",
  canal: "bg-sky-500/15 text-sky-500",
  codigo: "bg-amber-500/15 text-amber-500",
  guia: "bg-indigo-500/15 text-indigo-500",
  fraseologia: "bg-teal-500/15 text-teal-500",
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function OperatorAiAssistant({ productName, allSteps }: OperatorAiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isThinking, setIsThinking] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Base de conhecimento montada a partir do roteiro atual + dados em cache.
  const knowledgeBase = useMemo(() => buildKnowledgeBase(allSteps), [allSteps])

  // Mensagem de boas-vindas ao abrir pela primeira vez.
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: createId(),
          role: "assistant",
          content:
            `Ola! Sou seu assistente do roteiro${productName ? ` de "${productName}"` : ""}. ` +
            "Pergunte qualquer coisa sobre o script, situacoes de atendimento, tabulacoes, canais ou codigos de resultado e eu busco a resposta para voce.",
        },
      ])
    }
  }, [isOpen, messages.length, productName])

  // Scroll automatico para a ultima mensagem.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isThinking])

  // Foco no input ao abrir.
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 150)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const handleSend = useCallback(() => {
    const question = input.trim()
    if (!question || isThinking) return

    const userMessage: ChatMessage = { id: createId(), role: "user", content: question }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsThinking(true)

    // Pequeno atraso para dar sensacao de processamento (busca e sincrona).
    setTimeout(() => {
      const results = searchKnowledge(question, knowledgeBase, 4)
      let answer: ChatMessage

      if (isConfident(results)) {
        const best = results[0]
        const related = results
          .slice(1, 3)
          .filter((r) => r.score >= 3)
          .map((r) => ({
            title: r.doc.title,
            categoryLabel: r.doc.categoryLabel,
            category: r.doc.category,
          }))

        answer = {
          id: createId(),
          role: "assistant",
          content: best.doc.body || best.doc.title,
          source: {
            title: best.doc.title,
            categoryLabel: best.doc.categoryLabel,
            category: best.doc.category,
          },
          related: related.length > 0 ? related : undefined,
        }
      } else {
        answer = {
          id: createId(),
          role: "assistant",
          needsSpecialist: true,
          content:
            "Nao consegui localizar essa informacao no roteiro e nos materiais disponiveis. " +
            "Recomendo buscar ajuda de um especialista ou do seu supervisor para garantir a orientacao correta.",
        }
      }

      setMessages((prev) => [...prev, answer])
      setIsThinking(false)
    }, 350)
  }, [input, isThinking, knowledgeBase])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Evita enviar durante composicao de IME (CJK) e no Safari (keyCode 229).
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  return (
    <>
      {/* Botao flutuante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          aria-label="Abrir assistente de roteiro"
        >
          <span className="relative flex h-6 w-6 items-center justify-center">
            <Bot className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </span>
          <span className="hidden text-sm font-semibold sm:inline">Assistente</span>
        </button>
      )}

      {/* Painel de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[min(600px,calc(100dvh-3rem))] w-[min(400px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Cabecalho */}
          <div className="flex items-center justify-between gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight">Assistente do Roteiro</p>
                <p className="truncate text-xs text-primary-foreground/80">
                  {productName || "Produto selecionado"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-primary-foreground/15 focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
              aria-label="Fechar assistente"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mensagens */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    msg.role === "user"
                      ? "bg-muted text-muted-foreground"
                      : msg.needsSpecialist
                        ? "bg-amber-500/15 text-amber-500"
                        : "bg-primary/15 text-primary"
                  }`}
                >
                  {msg.role === "user" ? (
                    <UserRound className="h-4 w-4" />
                  ) : msg.needsSpecialist ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-tr-sm bg-primary text-primary-foreground"
                      : msg.needsSpecialist
                        ? "rounded-tl-sm border border-amber-500/30 bg-amber-500/10 text-foreground"
                        : "rounded-tl-sm bg-muted text-foreground"
                  }`}
                >
                  {msg.source && (
                    <span
                      className={`mb-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${CATEGORY_COLORS[msg.source.category]}`}
                    >
                      <MessageSquareText className="h-3 w-3" />
                      {msg.source.categoryLabel}
                    </span>
                  )}
                  {msg.source && (
                    <p className="mb-1 text-[13px] font-bold text-foreground">{msg.source.title}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                  {msg.related && msg.related.length > 0 && (
                    <div className="mt-2.5 border-t border-border/60 pt-2">
                      <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                        Tambem relacionado:
                      </p>
                      <ul className="space-y-1">
                        {msg.related.map((r, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span
                              className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${CATEGORY_COLORS[r.category].split(" ")[0]}`}
                            />
                            <span className="truncate">{r.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
                </div>
              </div>
            )}
          </div>

          {/* Sugestoes rapidas (apenas antes de perguntar) */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {["Como abordar o cliente?", "Qual tabulacao usar?", "Cliente nao atende"].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Entrada */}
          <div className="border-t border-border bg-card p-3">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Faca uma pergunta sobre o atendimento..."
                rows={1}
                className="max-h-24 flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Enviar pergunta"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 px-1 text-center text-[11px] text-muted-foreground">
              As respostas sao baseadas no roteiro e materiais cadastrados.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
