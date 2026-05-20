"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Home, BookOpen, Megaphone, FileText, HelpCircle, Shield, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface QualityCenterSidebarProps {
  isAdmin: boolean
  showAdminPanel: boolean
  onShowAdminPanel: () => void
  activeView?: string
  onViewChange?: (view: string) => void
  pendingQuestions?: number
}

// Verifica se o usuario pode acessar o painel admin
// Admins com role "admin" podem acessar - master, monitoria e supervisao
function canAccessAdminPanel(user: any): boolean {
  if (!user || user.role !== "admin") return false
  // Todos os admins podem acessar o painel (master, monitoria, supervisao)
  return true
}

export function QualityCenterSidebar({ 
  isAdmin, 
  showAdminPanel, 
  onShowAdminPanel,
  activeView = "feed",
  onViewChange,
  pendingQuestions = 0
}: QualityCenterSidebarProps) {
  const { user } = useAuth()

  const isOperator = user?.role === "operator"
  const hasAdminAccess = canAccessAdminPanel(user)

  const mainMenuItems = [
    { id: "feed", icon: Home, label: "Inicio", adminOnly: false },
    { id: "treinamentos", icon: BookOpen, label: "Treinamentos", adminOnly: false },
  ].filter(item => !item.adminOnly || !isOperator)

  const filterItems = [
    { id: "comunicados", icon: Megaphone, label: "Comunicados", badge: 3 },
    { id: "recados", icon: MessageCircle, label: "Recados", badge: 0 },
    { id: "feedback", icon: FileText, label: "Feedback", badge: 0 },
    { id: "quiz", icon: HelpCircle, label: "Quiz", badge: 0 },
  ]

  const handleItemClick = (id: string) => {
    if (onViewChange) {
      onViewChange(id)
    }
  }

  const getInitials = (name?: string) =>
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
    ]
    const index = (name?.charCodeAt(0) || 0) % colors.length
    return colors[index]
  }

  return (
    <aside className="hidden md:flex flex-col w-52 min-h-[calc(100vh-56px)] bg-card border-r border-border/50">
      <nav className="flex-1 p-3 space-y-1">
        {/* Main Menu */}
        {mainMenuItems.map((item) => {
          const isActive = !showAdminPanel && activeView === item.id
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => handleItemClick(item.id)}
              className={cn(
                "w-full justify-start gap-3 h-10 px-3 font-medium transition-all",
                isActive 
                  ? "bg-orange-500 text-white hover:bg-orange-600 hover:text-white" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-white")} />
              <span className="text-sm">{item.label}</span>
            </Button>
          )
        })}

        {/* Filters Section */}
        <div className="pt-4 pb-2">
          <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filtros</span>
        </div>
        
        {filterItems.map((item) => {
          const isActive = !showAdminPanel && activeView === item.id
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => handleItemClick(item.id)}
              className={cn(
                "w-full justify-start gap-3 h-10 px-3 font-medium transition-all",
                isActive 
                  ? "bg-orange-500 text-white hover:bg-orange-600 hover:text-white" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-white")} />
              <span className="flex-1 text-left text-sm">{item.label}</span>
              {item.badge > 0 && (
                <Badge className="bg-orange-500 text-white hover:bg-orange-500 text-xs h-5 min-w-[20px] flex items-center justify-center rounded-full">
                  {item.badge}
                </Badge>
              )}
            </Button>
          )
        })}

        {/* Admin Panel Button - apenas monitoria e admin principal */}
        {hasAdminAccess && (
          <>
            <div className="pt-4" />
            <Button
              variant="ghost"
              onClick={onShowAdminPanel}
              className={cn(
                "w-full justify-start gap-3 h-10 px-3 font-medium transition-all",
                showAdminPanel 
                  ? "bg-orange-500 text-white hover:bg-orange-600 hover:text-white" 
                  : "text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
              )}
            >
              <Shield className={cn("h-5 w-5", showAdminPanel && "text-white")} />
              <span className="flex-1 text-left text-sm">Painel Admin</span>
              {pendingQuestions > 0 && (
                <Badge className="bg-red-500 text-white hover:bg-red-500 text-xs h-5 min-w-[20px] flex items-center justify-center rounded-full">
                  {pendingQuestions}
                </Badge>
              )}
            </Button>
          </>
        )}
      </nav>

      {/* User Info at Bottom */}
      <div className="p-3 border-t border-border/50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30">
          <Avatar className="h-9 w-9">
            <AvatarFallback className={cn(getAvatarColor(user?.fullName || ""), "text-white text-sm font-medium")}>
              {getInitials(user?.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.fullName || user?.username}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role === "admin" ? "Admin" : "Operador"}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
