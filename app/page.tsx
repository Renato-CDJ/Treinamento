'use client'

import { useState } from 'react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { UserSelector } from '@/components/user-selector'
import { ThemeToggle } from '@/components/theme-toggle'
import { IntegracaoTable } from '@/components/integracao-table'
import { DesligamentosTable } from '@/components/desligamentos-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  UsersIcon, 
  UserMinusIcon, 
  ShieldIcon, 
  PencilIcon, 
  EyeIcon,
  HeadphonesIcon,
  LayoutDashboardIcon,
  SparklesIcon,
} from 'lucide-react'

function DashboardContent() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('integracao')

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const roleInfo = {
    admin: { 
      label: 'Administrador', 
      icon: ShieldIcon, 
      description: 'Acesso total ao sistema',
      color: 'text-emerald-600 dark:text-emerald-400'
    },
    editor: { 
      label: 'Editor', 
      icon: PencilIcon, 
      description: 'Pode editar e adicionar',
      color: 'text-blue-600 dark:text-blue-400'
    },
    viewer: { 
      label: 'Visitante', 
      icon: EyeIcon, 
      description: 'Apenas visualização',
      color: 'text-gray-600 dark:text-gray-400'
    },
  }

  const currentRole = roleInfo[currentUser.role]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
                <HeadphonesIcon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                  Dashboard Qualidade
                  <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-normal">
                    Call Center
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Gestao de Integracao e Desligamentos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserSelector />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Welcome Banner */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-card border ${
                currentUser.role === 'admin' ? 'border-emerald-200 dark:border-emerald-500/30' :
                currentUser.role === 'editor' ? 'border-blue-200 dark:border-blue-500/30' :
                'border-gray-200 dark:border-gray-500/30'
              }`}>
                <currentRole.icon className={`h-5 w-5 ${currentRole.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Bem-vindo(a), <span className="font-semibold">{currentUser.name.split(' ')[0]}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentRole.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  currentUser.role === 'admin' 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' 
                    : currentUser.role === 'editor'
                    ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'
                    : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30'
                }`}
              >
                <currentRole.icon className="h-3 w-3 mr-1" />
                {currentRole.label}
              </Badge>
              <span className="text-xs text-muted-foreground hidden md:inline">
                {currentUser.role === 'admin' && 'Visualizar, Editar, Adicionar, Excluir'}
                {currentUser.role === 'editor' && 'Visualizar, Editar, Adicionar'}
                {currentUser.role === 'viewer' && 'Visualizar e Filtrar'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50 p-1 h-auto">
              <TabsTrigger 
                value="integracao" 
                className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2 px-4 py-2.5"
              >
                <UsersIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Integracao</span>
                <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-xs">34</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="desligamentos" 
                className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2 px-4 py-2.5"
              >
                <UserMinusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Desligamentos</span>
                <Badge variant="secondary" className="ml-1 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 text-xs">8</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="integracao" className="mt-6 animate-fade-in">
            <IntegracaoTable />
          </TabsContent>

          <TabsContent value="desligamentos" className="mt-6 animate-fade-in">
            <DesligamentosTable />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <LayoutDashboardIcon className="h-4 w-4" />
              <span>Dashboard Qualidade - Call Center</span>
            </div>
            <p>Desenvolvido para gestao da area de Qualidade - 2026</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function Dashboard() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardContent />
      </AuthProvider>
    </ThemeProvider>
  )
}
