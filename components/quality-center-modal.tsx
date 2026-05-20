"use client"

import { useState, useMemo, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RichTextEditorWYSIWYG } from "@/components/rich-text-editor-wysiwyg"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Search,
  Moon,
  Sun,
  Home,
  Users,
  Shield,
  ThumbsUp,
  MessageCircle,
  Send,
  HelpCircle,
  MessageSquare,
  ClipboardList,
  Plus,
  Trash2,
  CalendarIcon,
  Award,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  BookOpen,
  Check,
  X,
  Paintbrush,
} from "lucide-react"
import { useTheme } from "next-themes"
import { 
  useQualityPosts, 
  useAdminQuestions, 
  useAllUsers,
  createQualityPostSupabase,
  likePostSupabase,
  voteOnQuizSupabase,
  createFeedbackSupabase,
  answerAdminQuestion,
  answerAdminQuestionSecond,
  deleteQualityPostSupabase,
  editQualityPostSupabase,
} from "@/hooks/use-supabase-realtime"
import { containsProfanity, getProfanityWarning } from "@/lib/profanity-filter"
import { useToast } from "@/hooks/use-toast"
import type { QualityPost } from "@/lib/types"

interface QualityCenterModalProps {
  isOpen: boolean
  onClose: () => void
}

// Verifica se o usuario pode acessar o painel admin
// Admins com role "admin" podem acessar - master, monitoria e supervisao
function canAccessAdminPanel(user: any): boolean {
  if (!user || user.role !== "admin") return false
  // Todos os admins podem acessar o painel (master, monitoria, supervisao)
  return true
}

// Paleta de cores para posts
const colorPalette = [
  { name: "Padrao", value: "", class: "bg-card" },
  { name: "Laranja", value: "bg-gradient-to-br from-orange-500 to-orange-600", class: "bg-gradient-to-br from-orange-500 to-orange-600" },
  { name: "Azul", value: "bg-gradient-to-br from-blue-500 to-blue-600", class: "bg-gradient-to-br from-blue-500 to-blue-600" },
  { name: "Verde", value: "bg-gradient-to-br from-green-500 to-green-600", class: "bg-gradient-to-br from-green-500 to-green-600" },
  { name: "Roxo", value: "bg-gradient-to-br from-purple-500 to-purple-600", class: "bg-gradient-to-br from-purple-500 to-purple-600" },
  { name: "Rosa", value: "bg-gradient-to-br from-pink-500 to-pink-600", class: "bg-gradient-to-br from-pink-500 to-pink-600" },
]

export function QualityCenterModal({ isOpen, onClose }: QualityCenterModalProps) {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [activeView, setActiveView] = useState("inicio")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
  
  const { posts, loading: postsLoading } = useQualityPosts()
  const { users: allUsers } = useAllUsers()

  const hasAdminAccess = canAccessAdminPanel(user)
  
  // Filter posts by date if set
  const filteredPosts = useMemo(() => {
    let filtered = posts
    
    if (filterDate) {
      filtered = filtered.filter(post => {
        const postDate = new Date(post.createdAt)
        return postDate.toDateString() === filterDate.toDateString()
      })
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(post => 
        post.content.toLowerCase().includes(query) ||
        post.authorName.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [posts, filterDate, searchQuery])

  const getInitials = useCallback((name: string | undefined | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }, [])

  const formatTimeAgo = useCallback((date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "agora"
    if (diffMins < 60) return `${diffMins}min atras`
    if (diffHours < 24) return `${diffHours}h atras`
    if (diffDays < 7) return `${diffDays}d atras`
    return format(new Date(date), "dd 'de' MMM", { locale: ptBR })
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!max-w-[90vw] w-[90vw] !max-h-[90vh] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-background">
        {/* Header */}
        <DialogHeader className="border-b px-6 py-3 flex-shrink-0 bg-card">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
                <Award className="h-5 w-5 text-white" />
              </div>
              <span className="text-foreground">Central da Qualidade</span>
            </DialogTitle>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar publicacoes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-muted/50 border-border text-sm"
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 gap-2 text-sm",
                      filterDate && "bg-orange-500/10 border-orange-500/50 text-orange-600"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {filterDate ? format(filterDate, "dd/MM/yyyy", { locale: ptBR }) : "Filtrar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={filterDate}
                    onSelect={setFilterDate}
                    locale={ptBR}
                    initialFocus
                  />
                  {filterDate && (
                    <div className="p-2 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-muted-foreground"
                        onClick={() => setFilterDate(undefined)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Limpar filtro
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="text-xs font-medium bg-muted">
                  {getInitials(user?.fullName || user?.username)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-52 bg-card border-r border-border p-3 shrink-0 flex flex-col">
            <nav className="space-y-0.5 flex-1">
              <SidebarButton
                icon={<Home className="h-5 w-5" />}
                label="Inicio"
                active={activeView === "inicio"}
                onClick={() => setActiveView("inicio")}
              />

              <SidebarButton
                icon={<BookOpen className="h-5 w-5" />}
                label="Treinamentos"
                active={activeView === "treinamentos"}
                onClick={() => setActiveView("treinamentos")}
              />

              {/* Filtros */}
              <div className="my-3 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">Filtros</p>
                <SidebarButton
                  icon={<Megaphone className="h-5 w-5" />}
                  label="Comunicados"
                  active={activeView === "filter-comunicado"}
                  onClick={() => setActiveView("filter-comunicado")}
                />
                <SidebarButton
                  icon={<MessageCircle className="h-5 w-5" />}
                  label="Recados"
                  active={activeView === "filter-recado"}
                  onClick={() => setActiveView("filter-recado")}
                />
                <SidebarButton
                  icon={<HelpCircle className="h-5 w-5" />}
                  label="Quiz"
                  active={activeView === "filter-quiz"}
                  onClick={() => setActiveView("filter-quiz")}
                />
              </div>

              {/* Painel Admin - apenas monitoria e admin principal */}
              {hasAdminAccess && (
                <>
                  <div className="my-3 border-t border-border" />
                  <SidebarButton
                    icon={<Shield className="h-5 w-5" />}
                    label="Painel Admin"
                    active={activeView === "admin"}
                    onClick={() => setActiveView("admin")}
                    highlight
                  />
                </>
              )}
            </nav>

            {/* User Info Card */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="text-sm font-medium bg-background">
                    {getInitials(user?.fullName || user?.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                {activeView === "inicio" && (
                  <FeedView
                    posts={filteredPosts}
                    user={user}
                    getInitials={getInitials}
                    formatTimeAgo={formatTimeAgo}
                    allUsers={allUsers}
                    loading={postsLoading}
                  />
                )}
                {activeView === "admin" && hasAdminAccess && (
                  <AdminPanelView user={user} getInitials={getInitials} formatTimeAgo={formatTimeAgo} />
                )}
                {activeView === "filter-comunicado" && (
                  <FilteredFeedView
                    posts={filteredPosts.filter(p => p.type === "comunicado")}
                    user={user}
                    title="Comunicados"
                    icon={<Megaphone className="h-5 w-5 text-orange-500" />}
                    getInitials={getInitials}
                    formatTimeAgo={formatTimeAgo}
                  />
                )}
                {activeView === "filter-recado" && (
                  <FilteredFeedView
                    posts={filteredPosts.filter(p => p.type === "recado")}
                    user={user}
                    title="Recados"
                    icon={<MessageCircle className="h-5 w-5 text-blue-500" />}
                    getInitials={getInitials}
                    formatTimeAgo={formatTimeAgo}
                  />
                )}
                {activeView === "filter-quiz" && (
                  <FilteredFeedView
                    posts={filteredPosts.filter(p => p.type === "quiz")}
                    user={user}
                    title="Quizzes"
                    icon={<HelpCircle className="h-5 w-5 text-purple-500" />}
                    getInitials={getInitials}
                    formatTimeAgo={formatTimeAgo}
                  />
                )}
                {activeView === "treinamentos" && (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                    <div className="p-6 bg-muted rounded-full mb-4">
                      <BookOpen className="h-12 w-12" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Treinamentos</h3>
                    <p className="text-sm">Esta funcionalidade estara disponivel em breve</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Sidebar Button Component
function SidebarButton({
  icon,
  label,
  active,
  onClick,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  highlight?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-all duration-200 text-sm",
        active
          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        highlight && !active && "text-orange-500 dark:text-orange-400 font-medium"
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  )
}

// Filtered Feed View Component
function FilteredFeedView({
  posts,
  user,
  title,
  icon,
  getInitials,
  formatTimeAgo,
}: {
  posts: QualityPost[]
  user: any
  title: string
  icon: React.ReactNode
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
}) {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xl font-bold">{title}</h2>
        <Badge variant="secondary" className="ml-2">{posts.length}</Badge>
      </div>
      
      {posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-3">
            {icon}
          </div>
          <p>Nenhum {title.toLowerCase().slice(0, -1)} encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              user={user} 
              getInitials={getInitials} 
              formatTimeAgo={formatTimeAgo} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Post Card Component
function PostCard({
  post,
  user,
  getInitials,
  formatTimeAgo,
}: {
  post: QualityPost
  user: any
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
}) {
  const hasLiked = post.likes?.includes(user?.id || "")
  const isQuiz = post.type === "quiz"
  const userVote = post.quizOptions?.find(opt => opt.votes?.includes(user?.id || ""))

  const handleLike = async () => {
    if (!user) return
    await likePostSupabase(post.id, user.id)
  }

  const handleVote = async (optionId: string) => {
    if (!user || userVote) return
    await voteOnQuizSupabase(post.id, optionId, user.id)
  }

  const getTypeBadge = () => {
    const badges: Record<string, { label: string; className: string }> = {
      comunicado: { label: "Comunicado", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
      quiz: { label: "Quiz", className: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
      recado: { label: "Recado", className: "bg-green-500/10 text-green-600 border-green-500/30" },
    }
    return badges[post.type] || badges.comunicado
  }

  const badge = getTypeBadge()

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarFallback className="text-sm bg-muted">
              {getInitials(post.authorName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{post.authorName}</span>
              <Badge variant="outline" className={cn("text-xs", badge.className)}>
                {badge.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatTimeAgo(new Date(post.createdAt))}
            </p>
          </div>
        </div>

        {/* Content */}
        <div 
          className={cn(
            "rounded-lg p-4 mb-3",
            post.backgroundColor || "bg-muted/30",
            post.backgroundColor?.includes("gradient") && "text-white"
          )}
        >
          <div 
            className={cn(
              "prose prose-sm max-w-none",
              post.backgroundColor?.includes("gradient") ? "prose-invert" : "dark:prose-invert"
            )}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Quiz Options */}
        {isQuiz && post.quizOptions && (
          <div className="space-y-2 mb-3">
            {post.quizOptions.map((option) => {
              const voteCount = option.votes?.length || 0
              const totalVotes = post.quizOptions?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0
              const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
              const hasVoted = option.votes?.includes(user?.id || "")

              return (
                <button
                  key={option.id}
                  onClick={() => handleVote(option.id)}
                  disabled={!!userVote}
                  className={cn(
                    "w-full p-3 rounded-lg border transition-all text-left relative overflow-hidden",
                    hasVoted && "border-orange-500 bg-orange-500/10",
                    !userVote && "hover:border-orange-500/50 cursor-pointer",
                    userVote && !hasVoted && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {userVote && (
                    <div 
                      className="absolute inset-0 bg-orange-500/20 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                  <div className="relative flex items-center justify-between">
                    <span className="font-medium text-sm">{option.text}</span>
                    {userVote && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{percentage}%</span>
                        {hasVoted && <Check className="h-4 w-4 text-orange-500" />}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn("gap-2", hasLiked && "text-orange-500")}
          >
            <ThumbsUp className={cn("h-4 w-4", hasLiked && "fill-current")} />
            <span>{post.likes?.length || 0}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Feed View Component
function FeedView({
  posts,
  user,
  getInitials,
  formatTimeAgo,
  allUsers = [],
  loading,
}: {
  posts: QualityPost[]
  user: any
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
  allUsers?: any[]
  loading?: boolean
}) {
  // Filter out question type posts for non-admins
  const visiblePosts = useMemo(() => {
    return posts.filter(p => {
      if (user?.role === "admin") return true
      if (p.type === "pergunta") return false
      return true
    })
  }, [posts, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {visiblePosts.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Megaphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">Nenhuma publicacao ainda</p>
            <p className="text-sm text-muted-foreground">Aguarde novos comunicados</p>
          </CardContent>
        </Card>
      ) : (
        visiblePosts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            user={user} 
            getInitials={getInitials} 
            formatTimeAgo={formatTimeAgo} 
          />
        ))
      )}
    </div>
  )
}

// Admin Panel View Component
function AdminPanelView({
  user,
  getInitials,
  formatTimeAgo,
}: {
  user: any
  getInitials: (name: string) => string
  formatTimeAgo: (date: Date) => string
}) {
  const [activeTab, setActiveTab] = useState<"publicar" | "quiz">("publicar")
  const { toast } = useToast()
  const { users: allUsers } = useAllUsers()
  const operators = useMemo(() => allUsers.filter(u => u.role === "operator"), [allUsers])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500/20 rounded-lg">
          <Shield className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground">Publique comunicados, recados e quizzes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "publicar" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("publicar")}
          className={activeTab === "publicar" ? "bg-orange-500 hover:bg-orange-600" : ""}
        >
          <Send className="h-4 w-4 mr-2" />
          Publicar
        </Button>
        <Button
          variant={activeTab === "quiz" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("quiz")}
          className={activeTab === "quiz" ? "bg-purple-500 hover:bg-purple-600" : ""}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Quiz
        </Button>
      </div>

      {/* Content */}
      {activeTab === "publicar" && (
        <PublicarTab user={user} operators={operators} />
      )}
      {activeTab === "quiz" && (
        <QuizTab user={user} />
      )}
    </div>
  )
}

// Publicar Tab Component
function PublicarTab({ user, operators }: { user: any; operators: any[] }) {
  const [type, setType] = useState<"comunicado" | "recado">("comunicado")
  const [content, setContent] = useState("")
  const [backgroundColor, setBackgroundColor] = useState("")
  const [sendToAll, setSendToAll] = useState(true)
  const [isPublishing, setIsPublishing] = useState(false)
  const { toast } = useToast()

  const handlePublish = async () => {
    if (!content.trim() || !user) return

    if (containsProfanity(content)) {
      toast({ title: "Erro", description: getProfanityWarning(), variant: "destructive" })
      return
    }

    setIsPublishing(true)
    
    const result = await createQualityPostSupabase({
      type,
      content,
      authorId: user.id,
      authorName: user.fullName || user.username || "Admin",
      sendToAll,
      backgroundColor: backgroundColor || undefined,
    })

    setIsPublishing(false)

    if (result) {
      toast({ title: "Sucesso", description: `${type === "comunicado" ? "Comunicado" : "Recado"} publicado!` })
      setContent("")
      setBackgroundColor("")
    } else {
      toast({ title: "Erro", description: "Falha ao publicar", variant: "destructive" })
    }
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          {type === "comunicado" ? (
            <Megaphone className="h-4 w-4 text-orange-500" />
          ) : (
            <MessageCircle className="h-4 w-4 text-blue-500" />
          )}
          {type === "comunicado" ? "Novo Comunicado" : "Novo Recado"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">Tipo de Publicacao</Label>
          <Select value={type} onValueChange={(v) => setType(v as "comunicado" | "recado")}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comunicado">Comunicado</SelectItem>
              <SelectItem value="recado">Recado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Conteudo</Label>
          <RichTextEditorWYSIWYG
            value={content}
            onChange={setContent}
            placeholder="Digite o conteudo..."
          />
        </div>

        {/* Cor de Fundo */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <Paintbrush className="h-4 w-4" />
            Cor de Fundo
          </Label>
          <div className="flex gap-2 flex-wrap">
            {colorPalette.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setBackgroundColor(color.value)}
                className={cn(
                  "h-8 w-8 rounded-md border-2 transition-all",
                  backgroundColor === color.value 
                    ? "border-orange-500 ring-2 ring-orange-500/30" 
                    : "border-border hover:border-orange-500/50",
                  color.class
                )}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Destinatarios */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
          <Checkbox 
            id="sendToAll" 
            checked={sendToAll} 
            onCheckedChange={(checked) => setSendToAll(checked as boolean)}
            className="data-[state=checked]:bg-orange-500"
          />
          <label htmlFor="sendToAll" className="text-sm cursor-pointer flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Enviar para todos os operadores
          </label>
        </div>

        <Button
          onClick={handlePublish}
          disabled={!content.trim() || isPublishing}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {isPublishing ? (
            <>
              <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Publicar
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// Quiz Tab Component
function QuizTab({ user }: { user: any }) {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const { toast } = useToast()

  const addOption = () => setOptions([...options, ""])
  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
    if (correctOptionIndex === index) {
      setCorrectOptionIndex(null)
    } else if (correctOptionIndex !== null && correctOptionIndex > index) {
      setCorrectOptionIndex(correctOptionIndex - 1)
    }
  }
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handlePublish = async () => {
    if (!question.trim() || options.filter((o) => o.trim()).length < 2 || !user || correctOptionIndex === null) return

    setIsPublishing(true)

    const timestamp = Date.now()
    const quizOptions = options
      .filter((o) => o.trim())
      .map((text, i) => ({
        id: `opt-${timestamp}-${i}`,
        text,
        votes: [],
        isCorrect: i === correctOptionIndex
      }))

    const result = await createQualityPostSupabase({
      type: "quiz",
      content: question,
      authorId: user.id,
      authorName: user.fullName || user.username || "Admin",
      quizOptions,
    })

    setIsPublishing(false)

    if (result) {
      toast({ title: "Quiz publicado!", description: "Seu quiz foi enviado com sucesso." })
      setQuestion("")
      setOptions(["", ""])
      setCorrectOptionIndex(null)
    } else {
      toast({ title: "Erro", description: "Falha ao publicar quiz", variant: "destructive" })
    }
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-purple-500" />
          Novo Quiz
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">Pergunta do Quiz</Label>
          <Textarea
            placeholder="Digite a pergunta..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Opcoes (clique no circulo para marcar a correta)</Label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setCorrectOptionIndex(index)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  correctOptionIndex === index 
                    ? "border-green-500 bg-green-500 text-white" 
                    : "border-muted-foreground/30 hover:border-green-500/50"
                )}
              >
                {correctOptionIndex === index && <Check className="h-4 w-4" />}
              </button>
              <Input
                placeholder={`Opcao ${index + 1}`}
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className={cn(correctOptionIndex === index && "border-green-500/50 bg-green-500/5")}
              />
              {options.length > 2 && (
                <Button variant="ghost" size="icon" onClick={() => removeOption(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          {options.length < 5 && (
            <Button variant="outline" size="sm" onClick={addOption} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Opcao
            </Button>
          )}
          {correctOptionIndex === null && options.some(o => o.trim()) && (
            <p className="text-sm text-amber-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Selecione qual e a resposta correta
            </p>
          )}
        </div>

        <Button
          onClick={handlePublish}
          disabled={!question.trim() || options.filter((o) => o.trim()).length < 2 || correctOptionIndex === null || isPublishing}
          className="w-full bg-purple-500 hover:bg-purple-600"
        >
          {isPublishing ? (
            <>
              <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Publicar Quiz
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
