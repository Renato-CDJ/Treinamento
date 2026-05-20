"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  useQualityPosts,
  createQualityPostSupabase,
  likePostSupabase,
  voteOnQuizSupabase,
  deleteQualityPostSupabase,
  editQualityPostSupabase,
} from "@/hooks/use-supabase-realtime"
import type { QualityPost } from "@/lib/types"
import { Send, HelpCircle, Heart, Share2, Megaphone, MoreHorizontal, Bookmark, AtSign, Users, Shield, Archive, Clock, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function QualityCenterFeed() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [showArchived, setShowArchived] = useState(false)
  const { posts: allPosts, activePosts, archivedPosts, refetch } = useQualityPosts(showArchived)
  const [newPostContent, setNewPostContent] = useState("")
  const [isQuestionToAdmin, setIsQuestionToAdmin] = useState(false)
  const [mentionType, setMentionType] = useState<"all" | "qualidade" | "supervisao">("qualidade")
  
  // Edit/Delete states
  const [editingPost, setEditingPost] = useState<QualityPost | null>(null)
  const [editContent, setEditContent] = useState("")
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const MAX_DAILY_POSTS = 3

  // Count user's posts today
  const userPostsToday = useMemo(() => {
    if (!user || user.role !== "operator") return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return allPosts.filter((p) => {
      const postDate = new Date(p.createdAt)
      postDate.setHours(0, 0, 0, 0)
      return p.authorId === user.id && postDate.getTime() === today.getTime()
    }).length
  }, [allPosts, user])

  const canPost = user?.role !== "operator" || userPostsToday < MAX_DAILY_POSTS
  const remainingPosts = MAX_DAILY_POSTS - userPostsToday

  // Filter posts based on user role and visibility
  const posts = allPosts.filter((p) => {
    // Admins can see all posts
    if (user?.role === "admin") return true
    
    // If post is a question, only admins can see it (already filtered above)
    if (p.type === "pergunta") return false
    
    // If post is for admins only, operators can't see it (unless they are the author)
    if (p.recipients?.includes("admins") && !p.sendToAll) {
      return p.authorId === user?.id
    }
    
    return true
  })

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return

    const isOperator = user.role === "operator"
    
    // Check daily limit for operators
    if (isOperator && !canPost) {
      toast({
        title: "Limite diario atingido",
        description: "Voce ja fez 3 publicacoes hoje. Tente novamente amanha.",
        variant: "destructive",
      })
      return
    }
    const postType = isOperator ? "pergunta" : (isQuestionToAdmin ? "pergunta" : "comunicado")

    // Determine recipients based on mention type
    const sendToAll = mentionType === "all"
    let recipients: string[] = []
    let recipientNames: string[] = []
    
    if (mentionType === "qualidade") {
      recipients = ["qualidade"]
      recipientNames = ["Qualidade"]
    } else if (mentionType === "supervisao") {
      recipients = ["supervisao"]
      recipientNames = ["Supervisao"]
    }

    await createQualityPostSupabase({
      type: postType,
      content: newPostContent.trim(),
      authorId: user.id,
      authorName: user.fullName || user.username,
      sendToAll: sendToAll,
      recipients: recipients,
      recipientNames: recipientNames,
    })

    setNewPostContent("")
    setIsQuestionToAdmin(false)
    setMentionType("all")
    refetch() // Atualizar lista apos criar
    toast({
      title: isQuestionToAdmin || isOperator ? "Pergunta enviada" : "Publicacao criada",
      description: !sendToAll 
        ? "Sua mensagem foi enviada para os administradores" 
        : (isQuestionToAdmin || isOperator ? "Sua pergunta foi enviada para o admin" : "Sua publicacao foi criada com sucesso"),
    })
  }

  const handleLike = async (postId: string) => {
    if (!user) return
    await likePostSupabase(postId, user.id)
    refetch() // Atualizar lista apos like
  }

  const handleVote = async (postId: string, optionId: string) => {
    if (!user) return
    await voteOnQuizSupabase(postId, optionId, user.id)
    refetch() // Atualizar lista apos voto
  }

  const handleEditPost = (post: QualityPost) => {
    setEditingPost(post)
    setEditContent(post.content)
  }

  const handleSaveEdit = async () => {
    if (!editingPost || !editContent.trim()) return
    
    setIsSaving(true)
    try {
      await editQualityPostSupabase(editingPost.id, editContent.trim())
      toast({
        title: "Publicacao atualizada",
        description: "Sua publicacao foi editada com sucesso.",
      })
      setEditingPost(null)
      setEditContent("")
      refetch() // Atualizar lista apos editar
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao editar publicacao",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePost = async () => {
    if (!deletingPostId) return
    
    setIsDeleting(true)
    try {
      await deleteQualityPostSupabase(deletingPostId)
      toast({
        title: "Publicacao excluida",
        description: "Sua publicacao foi removida com sucesso.",
      })
      setDeletingPostId(null)
      refetch() // Atualizar lista apos excluir
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir publicacao",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const canEditOrDelete = (post: QualityPost) => {
    if (!user) return false
    // Admin pode editar/excluir qualquer post
    if (user.role === "admin") return true
    // Usuario pode editar/excluir apenas seus proprios posts
    return post.authorId === user.id
  }

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500", 
      "bg-orange-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-cyan-500",
      "bg-yellow-500",
      "bg-red-500",
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const getPostTypeBadge = (type: QualityPost["type"]) => {
    switch (type) {
      case "comunicado":
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600 border-0 text-xs font-medium">Comunicado</Badge>
      case "quiz":
        return <Badge className="bg-amber-500 text-white hover:bg-amber-600 border-0 text-xs font-medium">Quiz</Badge>
      case "recado":
        return <Badge className="bg-green-500 text-white hover:bg-green-600 border-0 text-xs font-medium">Aviso</Badge>
      case "pergunta":
        return <Badge className="bg-purple-500 text-white hover:bg-purple-600 border-0 text-xs font-medium">Pergunta</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Create Post - Only for operators */}
      {user?.role === "operator" && (
        <Card className={cn("bg-card border-border/50", !canPost && "opacity-75")}>
          <CardContent className="p-4">
            {/* Daily limit indicator */}
            <div className="flex items-center justify-between mb-3 text-sm">
              <span className="text-muted-foreground">Publicacoes hoje:</span>
              <span className={cn(
                "font-medium",
                remainingPosts > 0 ? "text-green-500" : "text-red-500"
              )}>
                {userPostsToday}/{MAX_DAILY_POSTS} ({remainingPosts > 0 ? `${remainingPosts} restantes` : "limite atingido"})
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className={cn(getAvatarColor(user?.fullName || ""), "text-white font-medium")}>
                  {getInitials(user?.fullName || "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder={canPost ? "Compartilhe algo com a equipe..." : "Voce atingiu o limite de 3 publicacoes diarias"}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  disabled={!canPost}
                  className="min-h-[80px] resize-none bg-muted/30 border-border/50 focus:border-orange-500/50 disabled:opacity-50"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "border-border/50",
                            mentionType === "qualidade" && "bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-400",
                            mentionType === "supervisao" && "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400"
                          )}
                        >
                          <AtSign className="h-4 w-4 mr-2" />
                          Mencionar
                          {mentionType === "qualidade" && <span className="ml-1 text-xs">(Qualidade)</span>}
                          {mentionType === "supervisao" && <span className="ml-1 text-xs">(Supervisao)</span>}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-52">
                        <DropdownMenuItem 
                          onClick={() => setMentionType("qualidade")}
                          className={cn(mentionType === "qualidade" && "bg-orange-100 dark:bg-orange-900/30")}
                        >
                          <Shield className="h-4 w-4 mr-2 text-orange-500" />
                          <span>Qualidade</span>
                          {mentionType === "qualidade" && <span className="ml-auto text-orange-500">&#10003;</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setMentionType("supervisao")}
                          className={cn(mentionType === "supervisao" && "bg-blue-100 dark:bg-blue-900/30")}
                        >
                          <Users className="h-4 w-4 mr-2 text-blue-500" />
                          <span>Supervisao</span>
                          {mentionType === "supervisao" && <span className="ml-auto text-blue-500">&#10003;</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setMentionType("all")}
                          className={cn(mentionType === "all" && "bg-green-100 dark:bg-green-900/30")}
                        >
                          <Users className="h-4 w-4 mr-2 text-green-500" />
                          <span>Todos podem ver</span>
                          {mentionType === "all" && <span className="ml-auto text-green-500">&#10003;</span>}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant={isQuestionToAdmin ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsQuestionToAdmin(!isQuestionToAdmin)}
                      className={isQuestionToAdmin ? "bg-purple-500 hover:bg-purple-600 border-0" : "border-border/50"}
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Pergunta para Admin
                    </Button>
                  </div>
                  <Button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || !canPost}
                    className="bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-400"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Publicar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={!showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived(false)}
            className={!showArchived ? "bg-orange-500 hover:bg-orange-600 text-white" : "border-border/50"}
          >
            <Clock className="h-4 w-4 mr-2" />
            Recentes (24h)
            {activePosts.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-white/20 text-inherit">
                {activePosts.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived(true)}
            className={showArchived ? "bg-orange-500 hover:bg-orange-600 text-white" : "border-border/50"}
          >
            <Archive className="h-4 w-4 mr-2" />
            Arquivados
            {archivedPosts.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-white/20 text-inherit">
                {archivedPosts.length}
              </Badge>
            )}
          </Button>
        </div>
        {showArchived && (
          <p className="text-xs text-muted-foreground">
            Posts com mais de 24h ficam salvos localmente
          </p>
        )}
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                {showArchived ? (
                  <Archive className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <Megaphone className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <p className="text-foreground font-medium">
                {showArchived ? "Nenhum post arquivado" : "Nenhuma publicacao ainda"}
              </p>
              <p className="text-sm text-muted-foreground">
                {showArchived 
                  ? "Posts com mais de 24h aparecerao aqui" 
                  : "Seja o primeiro a publicar!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => {
            const isLiked = post.likes.includes(user?.id || "")
            return (
              <Card key={post.id} className="bg-card border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  {/* Post Header */}
                  <div className="flex items-start justify-between p-4 pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className={cn(getAvatarColor(post.authorName), "text-white font-semibold")}>
                          {getInitials(post.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{post.authorName}</span>
                          {getPostTypeBadge(post.type)}
                          {post.isArchived && (
                            <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50 bg-amber-500/10">
                              <Archive className="h-3 w-3 mr-1" />
                              Arquivado
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs text-muted-foreground border-border/50">
                            Todos
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: false, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEditOrDelete(post) && (
                          <>
                            <DropdownMenuItem onClick={() => handleEditPost(post)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar publicacao
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingPostId(post.id)}
                              className="text-red-500 focus:text-red-500"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir publicacao
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem>
                          <Bookmark className="h-4 w-4 mr-2" />
                          Salvar publicacao
                        </DropdownMenuItem>
                        <DropdownMenuItem>Copiar link</DropdownMenuItem>
                        {!canEditOrDelete(post) && (
                          <DropdownMenuItem className="text-red-500 focus:text-red-500">Denunciar</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Post Content */}
                  <div className="px-4 pb-3">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  </div>

                  {/* Quiz Options */}
                  {post.type === "quiz" && post.quizOptions && (
                    <div className="px-4 pb-3 space-y-2">
                      {post.quizOptions.map((option) => {
                        const totalVotes = post.quizOptions!.reduce((sum, o) => sum + o.votes.length, 0)
                        const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0
                        const hasVoted = option.votes.includes(user?.id || "")

                        return (
                          <button
                            key={option.id}
                            onClick={() => handleVote(post.id, option.id)}
                            className="w-full text-left"
                          >
                            <div className="relative rounded-lg border border-border/50 p-3 overflow-hidden hover:border-orange-500/50 transition-colors bg-muted/20">
                              <div
                                className="absolute inset-y-0 left-0 bg-orange-500/20 transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                              <div className="relative flex items-center justify-between">
                                <span className={`text-sm ${hasVoted ? "font-semibold text-orange-500" : "text-foreground"}`}>
                                  {option.text}
                                </span>
                                <span className="text-sm text-muted-foreground">{percentage}%</span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                      <p className="text-xs text-muted-foreground pt-1">
                        {post.quizOptions.reduce((sum, o) => sum + o.votes.length, 0)} votos no total
                      </p>
                    </div>
                  )}

                  {/* Likes Count */}
                  {post.likes.length > 0 && (
                    <div className="px-4 pb-2">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4 fill-orange-500 text-orange-500" />
                          {post.likes.length} curtida{post.likes.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center border-t border-border/50 px-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={`flex-1 h-11 gap-2 rounded-none ${isLiked ? "text-orange-500 hover:text-orange-600" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Heart className={`h-5 w-5 ${isLiked ? "fill-orange-500" : ""}`} />
                      <span className="font-medium">Curtir</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 h-11 gap-2 rounded-none text-muted-foreground hover:text-foreground"
                    >
                      <Share2 className="h-5 w-5" />
                      <span className="font-medium">Compartilhar</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-11 w-11 rounded-none text-muted-foreground hover:text-foreground"
                    >
                      <Bookmark className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar publicacao</DialogTitle>
            <DialogDescription>
              Faca as alteracoes necessarias no conteudo da publicacao.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Conteudo da publicacao..."
              className="min-h-[150px] resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(null)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={!editContent.trim() || isSaving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSaving ? "Salvando..." : "Salvar alteracoes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPostId} onOpenChange={(open) => !open && setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir publicacao?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. A publicacao sera permanentemente removida do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
