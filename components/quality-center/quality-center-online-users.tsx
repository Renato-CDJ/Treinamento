"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TrendingUp, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/types"

interface QualityCenterOnlineUsersProps {
  users: User[]
}

export function QualityCenterOnlineUsers({ users }: QualityCenterOnlineUsersProps) {
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
      "bg-yellow-500",
      "bg-red-500",
    ]
    const index = (name?.charCodeAt(0) || 0) % colors.length
    return colors[index]
  }

  // Mock data for most active users
  const mostActiveUsers = [
    { name: "Maria Silva", department: "RH", posts: 28 },
    { name: "Joao Santos", department: "ADM", posts: 24 },
    { name: "Ana Costa", department: "Financeiro", posts: 19 },
  ]

  // Mock statistics
  const stats = {
    publications: 156,
    interactions: "1.2k",
    engagement: "89%",
    collaborators: 248,
  }

  return (
    <div className="space-y-4">
      {/* Most Active Users */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            Mais Ativos
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {mostActiveUsers.map((user, index) => (
            <div key={user.name} className="flex items-center gap-3">
              <span className="text-sm font-bold text-orange-500 w-4">{index + 1}</span>
              <Avatar className="h-9 w-9">
                <AvatarFallback className={cn(getAvatarColor(user.name), "text-white text-xs font-medium")}>
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.department}</p>
              </div>
              <span className="text-sm text-orange-500 font-semibold">{user.posts} posts</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Monthly Statistics */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-semibold text-foreground">Estatisticas do Mes</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{stats.publications}</p>
              <p className="text-xs text-muted-foreground">Publicacoes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{stats.interactions}</p>
              <p className="text-xs text-muted-foreground">Interacoes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{stats.engagement}</p>
              <p className="text-xs text-muted-foreground">Engajamento</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{stats.collaborators}</p>
              <p className="text-xs text-muted-foreground">Colaboradores</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Online Team */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-green-500" />
            Equipe Online
          </CardTitle>
          <p className="text-xs text-muted-foreground">{users.length} colaboradores ativos agora</p>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuario online</p>
          ) : (
            <div className="flex items-center -space-x-2">
              {users.slice(0, 5).map((user) => (
                <Avatar 
                  key={user.id} 
                  className="h-9 w-9 border-2 border-background"
                >
                  <AvatarFallback className={cn(getAvatarColor(user.fullName || ""), "text-white text-xs font-medium")}>
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {users.length > 5 && (
                <div className="h-9 w-9 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">+{users.length - 5}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
