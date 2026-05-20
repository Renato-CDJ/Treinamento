"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { QualityCenterHeader } from "./quality-center-header"
import { QualityCenterSidebar } from "./quality-center-sidebar"
import { QualityCenterFeed } from "./quality-center-feed"
import { QualityCenterOnlineUsers } from "./quality-center-online-users"
import { QualityCenterAdminPanel } from "./quality-center-admin-panel"
import { useAllUsers, useAdminQuestions } from "@/hooks/use-supabase-realtime"

// Verifica se o usuario pode acessar o painel admin
// Admins com role "admin" podem acessar - master, monitoria e supervisao
function canAccessAdminPanel(user: any): boolean {
  if (!user || user.role !== "admin") return false
  // Todos os admins podem acessar o painel (master, monitoria, supervisao)
  return true
}

export function QualityCenterLayout() {
  const { user } = useAuth()
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [activeView, setActiveView] = useState("feed")
  
  const { users: allUsers } = useAllUsers()
  const { questions: adminQuestions } = useAdminQuestions()

  const onlineUsers = allUsers.filter((u) => u.role === "operator" && u.isOnline)
  const pendingQuestions = adminQuestions.length

  const isAdmin = user?.role === "admin"
  const hasAdminAccess = canAccessAdminPanel(user)

  return (
    <div className="min-h-screen bg-background">
      <QualityCenterHeader 
        pendingQuestions={pendingQuestions} 
        showAdminPanel={showAdminPanel}
        onToggleAdminPanel={() => setShowAdminPanel(!showAdminPanel)}
      />
      
      <div className="flex">
        <QualityCenterSidebar 
          isAdmin={isAdmin} 
          showAdminPanel={showAdminPanel}
          onShowAdminPanel={() => setShowAdminPanel(true)}
          activeView={activeView}
          onViewChange={(view) => {
            setActiveView(view)
            setShowAdminPanel(false)
          }}
          pendingQuestions={pendingQuestions}
        />
        
        {showAdminPanel && hasAdminAccess ? (
          <main className="flex-1 overflow-auto">
            <QualityCenterAdminPanel pendingQuestions={pendingQuestions} />
          </main>
        ) : (
          <>
            <main className="flex-1 max-w-2xl mx-auto px-4 py-6">
              <QualityCenterFeed />
            </main>
            
            <aside className="hidden lg:block w-80 shrink-0 p-4 pr-6">
              <div className="sticky top-20">
                <QualityCenterOnlineUsers users={onlineUsers} />
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  )
}
