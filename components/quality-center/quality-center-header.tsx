"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Bell, Moon, Sun, LogOut, User, Settings, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface QualityCenterHeaderProps {
  pendingQuestions: number
  showAdminPanel: boolean
  onToggleAdminPanel: () => void
}

export function QualityCenterHeader({ pendingQuestions, showAdminPanel, onToggleAdminPanel }: QualityCenterHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)

  const initials = user?.fullName
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

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border/50">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-orange-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Q</span>
          </div>
          <span className="text-lg font-bold text-foreground hidden sm:inline">Central da Qualidade</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pesquisar publicacoes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 bg-muted/50 border-border/50 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Filter by Date */}
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 gap-2 border-border/50 text-muted-foreground hover:text-foreground"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Filtrar data</span>
          </Button>

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <Popover open={showNotifications} onOpenChange={setShowNotifications}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-5 w-5" />
                {pendingQuestions > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {pendingQuestions > 9 ? "9+" : pendingQuestions}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Notificacoes</h4>
                  {pendingQuestions > 0 && (
                    <span className="text-xs text-muted-foreground">{pendingQuestions} pendente(s)</span>
                  )}
                </div>
                {pendingQuestions === 0 ? (
                  <div className="py-6 text-center">
                    <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma notificacao</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <p className="text-sm font-medium text-orange-500">Perguntas pendentes</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Voce tem {pendingQuestions} pergunta(s) de operadores aguardando resposta
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full ml-1">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={cn(getAvatarColor(user?.fullName || ""), "text-white text-sm font-semibold")}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground">{user?.role === "admin" ? "Administrador" : "Operador"}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(user?.role === "admin" ? "/admin" : "/operator")}>
                <User className="mr-2 h-4 w-4" />
                Voltar ao Painel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
