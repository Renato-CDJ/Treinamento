"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Tags,
  AlertCircle,
  Radio,
  Cloud,
  Users,
  Settings,
  LogOut,
  Package,
  Sun,
  Moon,
  Settings2,
  Shield,
  Presentation,
  BookOpen,
  ListChecks,
  Award,
  Megaphone,
  MapPin,
  ChevronRight,
  Sparkles,
  Brain,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { QualityCenterModal } from "@/components/quality-center-modal"

interface AdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const menuItems: {
  id: string
  label: string
  icon: typeof FileText
  permission: string
  hideForSupervisao?: boolean
  hideForMonitoria?: boolean
  onlyForSupervisao?: boolean
  onlyForSupervisaoOrMonitoria?: boolean
  category?: string
}[] = [
  { id: "operator-view", label: "Visualizar Roteiro", icon: FileText, permission: "scripts", onlyForSupervisaoOrMonitoria: true, category: "conteudo" },
  { id: "scripts", label: "Roteiros", icon: FileText, permission: "scripts", hideForSupervisao: true, category: "conteudo" },
  { id: "script-library", label: "Biblioteca de Roteiros", icon: BookOpen, permission: "scripts", hideForSupervisao: true, category: "conteudo" },
  { id: "products", label: "Produtos", icon: Package, permission: "products", category: "conteudo" },
  { id: "campaigns", label: "Campanhas", icon: Megaphone, permission: "products", category: "conteudo" },
  { id: "initial-guide", label: "Guia Inicial", icon: BookOpen, permission: "dashboard", category: "conteudo" },
  { id: "attendance-config", label: "Configurar Atendimento", icon: Settings2, permission: "attendanceConfig", category: "config" },
  { id: "tabulations", label: "Tabulacoes", icon: Tags, permission: "tabulations", category: "config" },
  { id: "tabulation-mapping", label: "Mapear Tabulacoes", icon: MapPin, permission: "tabulations", category: "config" },
  { id: "situations", label: "Situacoes", icon: AlertCircle, permission: "situations", category: "config" },
  { id: "channels", label: "Canais", icon: Radio, permission: "channels", category: "config" },
  { id: "word-cloud", label: "Nuvem de Palavras", icon: Cloud, permission: "notes", category: "ferramentas" },
  { id: "operators", label: "Operadores", icon: Users, permission: "operators", category: "usuarios" },
  { id: "presentations", label: "Apresentacoes", icon: Presentation, permission: "messagesQuiz", category: "ferramentas" },
  { id: "quality-quiz", label: "Quiz da Qualidade", icon: Brain, permission: "messagesQuiz", category: "ferramentas" },
  { id: "result-codes", label: "Codigos de Resultado", icon: ListChecks, permission: "tabulations", category: "config" },
  { id: "settings", label: "Configuracoes", icon: Settings, permission: "settings", category: "sistema" },
]

const categoryLabels: Record<string, string> = {
  conteudo: "Conteudo",
  config: "Configuracoes",
  ferramentas: "Ferramentas",
  usuarios: "Usuarios",
  sistema: "Sistema",
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [showQualityModal, setShowQualityModal] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const hasPermission = (permission: string, tabId: string) => {
    if (!user) return false
    
    // Master admin and Monitoria have all permissions
    if (user.adminType === "master" || user.adminType === "monitoria") return true
    
    // Supervisao has limited permissions - only allowed tabs
    if (user.adminType === "supervisao") {
      // operator-view is always visible for supervisao
      if (tabId === "operator-view") return true
      
      const allowedTabs = user.allowedTabs || []
      // Map tab IDs to allowed tab names
      const tabMapping: Record<string, string> = {
        "dashboard": "dashboard",
        "central-qualidade": "central-qualidade",
      }
      return allowedTabs.includes(tabMapping[tabId] || tabId)
    }

    // For other admin users, check permissions object
    const permissions = user.permissions || {}
    return permissions[permission as keyof typeof permissions] !== false
  }

  const visibleMenuItems = menuItems.filter((item) => {
    // Check basic permission
    if (!hasPermission(item.permission, item.id)) return false
    
    // Check supervisao-specific visibility
    const isSupervisao = user?.adminType === "supervisao"
    
    // Hide items marked as hideForSupervisao when user is supervisao
    if (item.hideForSupervisao && isSupervisao) return false
    
    // Only show items marked as onlyForSupervisao when user is supervisao
    if (item.onlyForSupervisao && !isSupervisao) return false
    
    // Only show items marked as onlyForSupervisaoOrMonitoria when user is supervisao or monitoria
    const isMonitoria = user?.adminType === "monitoria"
    if (item.onlyForSupervisaoOrMonitoria && !isSupervisao && !isMonitoria) return false
    
    return true
  })

  // Group items by category
  const groupedItems = visibleMenuItems.reduce((acc, item) => {
    const category = item.category || "outros"
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, typeof visibleMenuItems>)

  // Only master, gestao and monitoria can see access control
  const canSeeAccessControl = user?.adminType === "master" || user?.adminType === "gestao" || user?.adminType === "monitoria"

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  // Get admin type badge
  const getAdminTypeBadge = (adminType?: string) => {
    switch (adminType) {
      case "master": return "Master"
      case "gestao": return "Gestao"
      case "supervisao": return "Supervisao"
      case "monitoria": return "Monitoria"
      default: return "Admin"
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-card to-card/95 dark:from-card dark:to-card/98">
      {/* Header with Logo and User */}
      <div className="p-4 pb-3">
        {/* Logo Section */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground tracking-tight">Painel Admin</h2>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Sistema de Gestao</p>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-500/5 to-amber-500/5 dark:from-orange-500/10 dark:to-amber-500/10 border border-orange-500/10 dark:border-orange-500/20">
            <Avatar className="h-10 w-10 border-2 border-orange-500/30 shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-semibold">
                {getUserInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.fullName}</p>
              <p className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">{getAdminTypeBadge(user.adminType)}</p>
            </div>
          </div>
        )}
      </div>

      <Separator className="bg-border/50" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-4">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                {categoryLabels[category] || category}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-10 px-3 rounded-lg transition-all duration-200 group",
                        isActive
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/25 dark:shadow-orange-500/15"
                          : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => onTabChange(item.id)}
                    >
                      <div className={cn(
                        "flex items-center justify-center h-7 w-7 rounded-md transition-colors",
                        isActive 
                          ? "bg-white/20" 
                          : "bg-muted/60 group-hover:bg-orange-500/10"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          isActive ? "text-white" : "text-muted-foreground group-hover:text-orange-500"
                        )} />
                      </div>
                      <span className="flex-1 text-left text-[13px] font-medium truncate">{item.label}</span>
                      {isActive && <ChevronRight className="h-4 w-4 text-white/70" />}
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}

          {canSeeAccessControl && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Seguranca
              </p>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10 px-3 rounded-lg transition-all duration-200 group",
                  activeTab === "access-control"
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/25 dark:shadow-orange-500/15"
                    : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onTabChange("access-control")}
              >
                <div className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-md transition-colors",
                  activeTab === "access-control"
                    ? "bg-white/20" 
                    : "bg-muted/60 group-hover:bg-orange-500/10"
                )}>
                  <Shield className={cn(
                    "h-4 w-4",
                    activeTab === "access-control" ? "text-white" : "text-muted-foreground group-hover:text-orange-500"
                  )} />
                </div>
                <span className="flex-1 text-left text-[13px] font-medium">Controle de Acesso</span>
                {activeTab === "access-control" && <ChevronRight className="h-4 w-4 text-white/70" />}
              </Button>
            </div>
          )}

          <Separator className="my-3 bg-border/50" />

          {/* Quality Center - Special Button */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 px-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/15 hover:to-indigo-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:border-blue-500/30 transition-all duration-200 group"
            onClick={() => setShowQualityModal(true)}
          >
            <div className="flex items-center justify-center h-7 w-7 rounded-md bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <Award className="h-4 w-4 text-blue-500" />
            </div>
            <span className="flex-1 text-left text-[13px] font-semibold">Central da Qualidade</span>
          </Button>
        </nav>

        <QualityCenterModal isOpen={showQualityModal} onClose={() => setShowQualityModal(false)} />
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-3 space-y-2 border-t border-border/50">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 px-3 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-200 group"
          onClick={toggleTheme}
        >
          <div className="flex items-center justify-center h-7 w-7 rounded-md bg-muted/60 group-hover:bg-amber-500/10 transition-colors">
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-slate-500 group-hover:text-amber-600" />
            )}
          </div>
          <span className="text-[13px] font-medium">
            {theme === "dark" ? "Tema Claro" : "Tema Escuro"}
          </span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 px-3 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all duration-200 group"
          onClick={handleLogout}
        >
          <div className="flex items-center justify-center h-7 w-7 rounded-md bg-muted/60 group-hover:bg-red-500/10 transition-colors">
            <LogOut className="h-4 w-4 group-hover:text-red-500" />
          </div>
          <span className="text-[13px] font-medium">Sair</span>
        </Button>
      </div>
    </div>
  )
}
