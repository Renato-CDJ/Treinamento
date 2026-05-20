"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
}[] = [
  { id: "operator-view", label: "Visualizar Roteiro", icon: FileText, permission: "scripts", onlyForSupervisaoOrMonitoria: true },
  { id: "scripts", label: "Roteiros", icon: FileText, permission: "scripts", hideForSupervisao: true },
  { id: "script-library", label: "Biblioteca de Roteiros", icon: BookOpen, permission: "scripts", hideForSupervisao: true },
  { id: "products", label: "Produtos", icon: Package, permission: "products" },
  { id: "campaigns", label: "Campanhas", icon: Megaphone, permission: "products" },
  { id: "initial-guide", label: "Guia Inicial", icon: BookOpen, permission: "dashboard" },
  { id: "attendance-config", label: "Configurar Atendimento", icon: Settings2, permission: "attendanceConfig" },
  { id: "tabulations", label: "Tabulacoes", icon: Tags, permission: "tabulations" },
  { id: "tabulation-mapping", label: "Mapear Tabulacoes", icon: MapPin, permission: "tabulations" },
  { id: "situations", label: "Situacoes", icon: AlertCircle, permission: "situations" },
  { id: "channels", label: "Canais", icon: Radio, permission: "channels" },
  { id: "word-cloud", label: "Nuvem de Palavras", icon: Cloud, permission: "notes" },
  { id: "operators", label: "Operadores", icon: Users, permission: "operators" },
  { id: "presentations", label: "Apresentacoes", icon: Presentation, permission: "messagesQuiz" },
  { id: "result-codes", label: "Codigos de Resultado", icon: ListChecks, permission: "tabulations" },
  { id: "settings", label: "Configuracoes", icon: Settings, permission: "settings" },
]

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

  // Only master, gestao and monitoria can see access control
  const canSeeAccessControl = user?.adminType === "master" || user?.adminType === "gestao" || user?.adminType === "monitoria"

  return (
    <div className="flex flex-col h-full bg-card border-r border-orange-500/30 dark:border-orange-500/40">
      {/* Header */}
      <div className="p-4 border-b border-orange-500/30 dark:border-orange-500/40">
        <h2 className="text-lg font-bold text-foreground">Painel Admin</h2>
        {user && <p className="text-sm text-muted-foreground mt-1">{user.fullName}</p>}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  activeTab === item.id &&
                    "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black font-semibold border-0",
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            )
          })}

          {canSeeAccessControl && (
            <Button
              variant={activeTab === "access-control" ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                activeTab === "access-control" &&
                  "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-white dark:to-gray-100 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-black font-semibold border-0",
              )}
              onClick={() => onTabChange("access-control")}
            >
              <Shield className="h-4 w-4" />
              Controle de Acesso
            </Button>
          )}

          <div className="my-4 border-t border-orange-500/20" />

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30"
            onClick={() => setShowQualityModal(true)}
          >
            <Award className="h-4 w-4" />
            Central da Qualidade
          </Button>
        </nav>

        <QualityCenterModal isOpen={showQualityModal} onClose={() => setShowQualityModal(false)} />
      </ScrollArea>

      <div className="p-3 border-t border-orange-500/30 dark:border-orange-500/40 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-2 border-orange-500/30 dark:border-orange-500/40 hover:scale-105 transition-all shadow-sm hover:shadow-md bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-500/20 dark:hover:to-orange-500/20 text-foreground dark:text-white"
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-4 w-4 text-orange-500" />
              Tema Claro
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-amber-600" />
              Tema Escuro
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-black dark:text-white hover:bg-orange-500/20 dark:hover:bg-orange-500/30 border-0"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
