"use client"

import type React from "react"
import { useState, useEffect, useRef, memo, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, Reply, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { sendChatMessage, markChatMessageAsRead, getChatSettings, getAllChatMessages } from "@/lib/store"
import type { ChatMessage } from "@/lib/types"

interface OperatorChatModalProps {
  isOpen: boolean
  onClose: () => void
}

export const OperatorChatModal = memo(function OperatorChatModal({ isOpen, onClose }: OperatorChatModalProps) {
  const { user } = useAuth()
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [chatEnabled, setChatEnabled] = useState(true)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load messages with polling
  const loadAllMessages = () => {
    const msgs = getAllChatMessages()
    setAllMessages(msgs)
  }

  useEffect(() => {
    loadAllMessages()
    // Polling a cada 30 segundos para mensagens de chat
    const interval = setInterval(loadAllMessages, 30000)
    return () => clearInterval(interval)
  }, [])

  // Filter messages for this operator
  const messages = useMemo(() => {
    if (!user) return []
    return allMessages.filter(
      (m) => m.senderId === user.id || (m.recipientId === user.id || !m.recipientId)
    )
  }, [allMessages, user])

  const unreadCount = useMemo(() => {
    if (!user) return 0
    return messages.filter((m) => !m.isRead && m.senderId !== user.id).length
  }, [messages, user])

  useEffect(() => {
    if (isOpen && user) {
      const settings = getChatSettings()
      setChatEnabled(settings.isEnabled)
    }
  }, [isOpen, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const markMessagesAsRead = () => {
    if (!user || !messages) return
    messages.forEach((msg) => {
      if (!msg.isRead && msg.senderId !== user.id) {
        markChatMessageAsRead(msg.id)
      }
    })
  }

  const handleSend = async () => {
    if (!user || !newMessage.trim() || !chatEnabled) return

    const replyToData = replyingTo
      ? {
          messageId: replyingTo.id,
          content: replyingTo.content.substring(0, 100),
          senderName: replyingTo.senderName,
        }
      : undefined

    await sendChatMessage(user.id, user.fullName, user.role, newMessage.trim(), undefined, undefined, replyToData)
    setNewMessage("")
    setReplyingTo(null)
    loadAllMessages()
    markMessagesAsRead()
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message)
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-500 dark:bg-gradient-to-r dark:from-primary dark:via-accent dark:to-primary dark:bg-clip-text dark:text-transparent">
              Chat
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!chatEnabled && (
                <Badge variant="destructive" className="text-xs">
                  Chat Desabilitado
                </Badge>
              )}
              {unreadCount > 0 && <Badge className="text-xs">{unreadCount} Novas Mensagens</Badge>}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 py-4 px-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Nenhuma mensagem ainda. Inicie uma conversa!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.senderId === user.id
              return (
                <div key={msg.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} group px-2`}>
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] ${isOwnMessage ? "items-end" : "items-start"} flex flex-col gap-1`}
                  >
                    <div
                      className={`rounded-lg p-4 sm:p-5 md:p-6 overflow-hidden border-2 w-full ${
                        isOwnMessage
                          ? "bg-gradient-to-br from-muted/30 to-muted/20 border-orange-500/20 dark:border-primary/20 text-foreground dark:text-white shadow-sm"
                          : "bg-gradient-to-br from-muted/30 to-muted/20 border-orange-500/20 dark:border-primary/20 text-foreground dark:text-white shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base break-words">{msg.senderName}</span>
                        <Badge
                          className={
                            msg.senderRole === "admin"
                              ? "bg-orange-500 dark:bg-primary text-white flex-shrink-0"
                              : "bg-orange-500/80 dark:bg-primary/80 text-white flex-shrink-0"
                          }
                        >
                          {msg.senderRole === "admin" ? "ADM" : "OP"}
                        </Badge>
                      </div>
                      {msg.replyTo && (
                        <div className="mb-2 p-2 rounded border-l-2 bg-muted/50 border-orange-500/50 dark:border-primary/50 overflow-hidden">
                          <p className="text-xs font-semibold mb-1 break-words overflow-wrap-anywhere">
                            {msg.replyTo.senderName}
                          </p>
                          <p className="text-xs opacity-80 line-clamp-2 break-words overflow-wrap-anywhere">
                            {msg.replyTo.content}
                          </p>
                        </div>
                      )}
                      <p className="text-base sm:text-lg md:text-xl whitespace-pre-wrap break-words overflow-wrap-anywhere hyphens-auto leading-relaxed">
                        {msg.content}
                      </p>
                      {msg.attachment && msg.attachment.type === "image" && (
                        <div className="mt-2 overflow-hidden">
                          <img
                            src={msg.attachment.url || "/placeholder.svg"}
                            alt={msg.attachment.name}
                            className="rounded-lg max-w-full max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(msg.attachment!.url, "_blank")}
                          />
                        </div>
                      )}
                      <span className="text-xs sm:text-sm opacity-70 mt-1 block">
                        {new Date(msg.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReply(msg)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs sm:text-sm flex-shrink-0"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Responder
                    </Button>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t pt-4 space-y-2 px-2">
          {!chatEnabled && (
            <p className="text-sm text-destructive">O chat está temporariamente desabilitado pelos administradores.</p>
          )}
          {replyingTo && (
            <div className="bg-gradient-to-br from-muted/30 to-muted/20 border-2 border-orange-500/20 dark:border-primary/20 p-3 rounded-lg flex items-start justify-between gap-2 shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Reply className="h-3 w-3 text-orange-500 dark:text-primary" />
                  <p className="text-xs font-semibold">Respondendo a {replyingTo.senderName}</p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 break-words">{replyingTo.content}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCancelReply} className="h-6 w-6 flex-shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={chatEnabled ? "Digite sua mensagem... (Shift+Enter para nova linha)" : "Chat desabilitado"}
              disabled={!chatEnabled}
              className="resize-none"
              rows={3}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || !chatEnabled}
              className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-primary dark:hover:bg-primary/90"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
