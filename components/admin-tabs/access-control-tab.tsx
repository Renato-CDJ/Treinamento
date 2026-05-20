"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { getUsersFromSupabase, updateUserInStorage } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import type { User, AdminPermissions, AdminType } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Shield, Edit2, Save, X, Plus, Trash2, UserPlus, Eye, EyeOff, Key } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
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

export function AccessControlTab() {
  const [adminUsers, setAdminUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editedName, setEditedName] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [newFullName, setNewFullName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newAdminType, setNewAdminType] = useState<AdminType>("supervisao")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [editingPasswordUser, setEditingPasswordUser] = useState<string | null>(null)
  const [editedPassword, setEditedPassword] = useState("")
  const [showEditedPassword, setShowEditedPassword] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const adminTypeLabels: Record<AdminType, string> = {
    master: "Master (Acesso Total)",
    monitoria: "Monitoria (Acesso Total)",
    supervisao: "Supervisao (Limitado)",
  }

  const availableTabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "central-qualidade", label: "Central da Qualidade" },
    { id: "scripts", label: "Roteiros" },
    { id: "products", label: "Produtos" },
    { id: "operators", label: "Operadores" },
    { id: "tabulations", label: "Tabulacoes" },
    { id: "situations", label: "Situacoes" },
    { id: "channels", label: "Canais" },
    { id: "messages-quiz", label: "Recados e Quiz" },
    { id: "feedback", label: "Feedback" },
    { id: "presentations", label: "Apresentacoes" },
    { id: "settings", label: "Configuracoes" },
  ]

  useEffect(() => {
    loadAdminUsers()
  }, [])

  const loadAdminUsers = async () => {
    setLoading(true)
    const allUsers = await getUsersFromSupabase()
    const admins = allUsers
      .filter(u => u.role === "admin")
      .sort((a, b) => {
        const typeOrder = { master: 0, monitoria: 1, supervisao: 2 }
        const typeA = typeOrder[a.adminType || "supervisao"] || 2
        const typeB = typeOrder[b.adminType || "supervisao"] || 2
        if (typeA !== typeB) return typeA - typeB
        return a.username.localeCompare(b.username)
      })
    setAdminUsers(admins)
    setLoading(false)
  }

  const handleEditName = useCallback((user: User) => {
    setEditingUser(user.id)
    setEditedName(user.fullName)
  }, [])

  const handleSaveName = useCallback(
    async (user: User) => {
      if (!editedName.trim()) {
        toast({
          title: "Erro",
          description: "O nome não pode estar vazio",
          variant: "destructive",
        })
        return
      }

      await updateUserInStorage(user.id, { fullName: editedName.trim() })
      setEditingUser(null)
      loadAdminUsers()

      toast({
        title: "Nome atualizado",
        description: `Nome do usuário ${user.username} foi atualizado com sucesso`,
      })
    },
    [editedName, toast],
  )

  const handleCancelEdit = useCallback(() => {
    setEditingUser(null)
    setEditedName("")
  }, [])

  const handleEditPassword = useCallback((user: User) => {
    setEditingPasswordUser(user.id)
    setEditedPassword("")
    setShowEditedPassword(false)
  }, [])

  const handleSavePassword = useCallback(
    async (user: User) => {
      if (!editedPassword.trim()) {
        toast({
          title: "Erro",
          description: "A senha não pode estar vazia",
          variant: "destructive",
        })
        return
      }

      if (editedPassword.length < 4) {
        toast({
          title: "Erro",
          description: "A senha deve ter pelo menos 4 caracteres",
          variant: "destructive",
        })
        return
      }

      await updateUserInStorage(user.id, { password: editedPassword.trim() })
      setEditingPasswordUser(null)
      setEditedPassword("")
      setShowEditedPassword(false)
      loadAdminUsers()

      toast({
        title: "Senha atualizada",
        description: `Senha do usuário ${user.username} foi atualizada com sucesso`,
      })
    },
    [editedPassword, toast],
  )

  const handleCancelPasswordEdit = useCallback(() => {
    setEditingPasswordUser(null)
    setEditedPassword("")
    setShowEditedPassword(false)
  }, [])

  const handleTabToggle = useCallback(
    async (user: User, tabId: string) => {
      const currentTabs = user.allowedTabs || []
      const isEnabled = currentTabs.includes(tabId)
      const updatedTabs = isEnabled
        ? currentTabs.filter((t) => t !== tabId)
        : [...currentTabs, tabId]

      await updateUserInStorage(user.id, { allowedTabs: updatedTabs })
      loadAdminUsers()

      const tabLabel = availableTabs.find((t) => t.id === tabId)?.label || tabId
      toast({
        title: "Permissao atualizada",
        description: `${tabLabel} foi ${!isEnabled ? "habilitada" : "desabilitada"} para ${user.fullName}`,
      })
    },
    [toast, availableTabs],
  )

  const handleAdminTypeChange = useCallback(
    async (user: User, newType: AdminType) => {
      // If changing to supervisao, set default allowed tabs
      const allowedTabs = newType === "supervisao" 
        ? ["dashboard", "central-qualidade"] 
        : []

      await updateUserInStorage(user.id, { adminType: newType, allowedTabs })
      loadAdminUsers()
      toast({
        title: "Tipo atualizado",
        description: `${user.fullName} agora e ${adminTypeLabels[newType]}`,
      })
    },
    [toast, adminTypeLabels],
  )

  const handleCreateUser = useCallback(async () => {
    if (!newUsername.trim() || !newFullName.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatorios",
        variant: "destructive",
      })
      return
    }

    if (newPassword && newPassword.length < 4) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 4 caracteres",
        variant: "destructive",
      })
      return
    }

    try {
      const supabase = createClient()
      
      // Check if username already exists (case insensitive)
      const { data: existingUsers } = await supabase
        .from("users")
        .select("id")
        .ilike("username", newUsername.trim())
        .limit(1)

      if (existingUsers && existingUsers.length > 0) {
        toast({
          title: "Erro",
          description: "Nome de usuario ja existe",
          variant: "destructive",
        })
        return
      }

      const allowedTabs = newAdminType === "supervisao" 
        ? ["dashboard", "central-qualidade"] 
        : []

      // Create user in Supabase
      const { error } = await supabase.from("users").insert({
        username: newUsername.trim(),
        name: newFullName.trim(),
        email: `${newUsername.trim().toLowerCase()}@rcp.com`,
        password: newPassword.trim() || "rcp@$",
        role: "admin",
        admin_type: newAdminType,
        allowed_tabs: allowedTabs,
        is_active: true,
        is_online: false,
      })

      if (error) throw error

      setShowCreateForm(false)
      setNewUsername("")
      setNewFullName("")
      setNewPassword("")
      setNewAdminType("supervisao")
      setShowNewPassword(false)
      loadAdminUsers()

      toast({
        title: "Usuario criado",
        description: `Usuario ${newUsername} foi criado com sucesso`,
      })
    } catch (error) {
      console.error("Erro ao criar usuario:", error)
      toast({ title: "Erro", description: "Erro ao criar usuario", variant: "destructive" })
    }
  }, [newUsername, newFullName, newPassword, newAdminType, toast])

  const handleDeleteUser = useCallback(async () => {
    if (!userToDelete) return

    // Prevent deleting master admin
    if (userToDelete.adminType === "master") {
      toast({
        title: "Erro",
        description: "Nao e possivel excluir o usuario master",
        variant: "destructive",
      })
      setUserToDelete(null)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from("users").delete().eq("id", userToDelete.id)
      if (error) throw error

      setUserToDelete(null)
      loadAdminUsers()

      toast({
        title: "Usuario excluido",
        description: `Usuario ${userToDelete.username} foi excluido com sucesso`,
      })
    } catch (error) {
      console.error("Erro ao excluir usuario:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir usuario",
        variant: "destructive",
      })
    }
  }, [userToDelete, toast])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Controle de Acesso</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie nomes, senhas e permissoes dos usuarios administradores
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuario
        </Button>
      </div>

      {showCreateForm && (
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Criar Novo Usuario Administrador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-username">Nome de Usuario *</Label>
                <Input
                  id="new-username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ex: Supervisor31"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-fullname">Nome Completo *</Label>
                <Input
                  id="new-fullname"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Ex: Joao da Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-admin-type">Tipo de Admin *</Label>
                <Select value={newAdminType} onValueChange={(v) => setNewAdminType(v as AdminType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monitoria">Monitoria (Acesso Total)</SelectItem>
                    <SelectItem value="supervisao">Supervisao (Limitado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Senha de Acesso</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Padrao: rcp@$"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewUsername("")
                  setNewFullName("")
                  setNewPassword("")
                  setNewAdminType("supervisao")
                  setShowNewPassword(false)
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateUser}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Usuario
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-4 pr-4">
          {adminUsers.map((user) => (
            <Card key={user.id} className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                      <span className="text-foreground font-semibold break-words">{user.username}</span>
                      {editingUser === user.id ? (
                        <div className="flex items-center gap-2 ml-2">
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="h-8 max-w-xs"
                            placeholder="Nome completo"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveName(user)}
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditName(user)}
                          className="h-8 w-8 p-0 ml-2 flex-shrink-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1 break-words flex items-center gap-2 text-muted-foreground">
                      {user.fullName}
                      <Badge 
                        variant="secondary" 
                        className={
                          user.adminType === "master" 
                            ? "bg-slate-800 text-slate-100 dark:bg-slate-700 dark:text-slate-200"
                            : user.adminType === "monitoria"
                            ? "bg-slate-600 text-slate-100 dark:bg-slate-600 dark:text-slate-200"
                            : "bg-slate-400 text-slate-900 dark:bg-slate-500 dark:text-slate-100"
                        }
                      >
                        {user.adminType === "master" ? "Master" : user.adminType === "monitoria" ? "Monitoria" : "Supervisao"}
                      </Badge>
                    </CardDescription>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {editingPasswordUser === user.id ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Input
                              type={showEditedPassword ? "text" : "password"}
                              value={editedPassword}
                              onChange={(e) => setEditedPassword(e.target.value)}
                              className="h-8 w-48 pr-10"
                              placeholder="Nova senha"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                              onClick={() => setShowEditedPassword(!showEditedPassword)}
                            >
                              {showEditedPassword ? (
                                <EyeOff className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <Eye className="h-3 w-3 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSavePassword(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelPasswordEdit} className="h-8 w-8 p-0">
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPassword(user)}
                          className="h-7 text-xs gap-1"
                        >
                          <Key className="h-3 w-3" />
                          {user.password ? "Alterar Senha" : "Definir Senha"}
                        </Button>
                      )}
                      {user.password && (
                        <span className="text-xs text-muted-foreground italic">Senha personalizada</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        user.isOnline
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {user.isOnline ? "Online" : "Offline"}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setUserToDelete(user)}
                      className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Admin Type Selector */}
                  {user.adminType !== "master" && (
                    <div className="flex items-center gap-4 p-3 rounded-md bg-muted/40">
                      <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Tipo de Admin:</Label>
                      <Select 
                        value={user.adminType || "supervisao"} 
                        onValueChange={(v) => handleAdminTypeChange(user, v as AdminType)}
                      >
                        <SelectTrigger className="w-[220px] bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monitoria">Monitoria (Acesso Total)</SelectItem>
                          <SelectItem value="supervisao">Supervisao (Limitado)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Tab Permissions - Only for Supervisao */}
                  {user.adminType === "supervisao" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground">Abas Permitidas</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {availableTabs.map((tab) => {
                          const isEnabled = (user.allowedTabs || []).includes(tab.id)
                          return (
                            <div
                              key={tab.id}
                              className={`flex items-center justify-between p-2.5 rounded-md border transition-colors min-w-0 ${
                                isEnabled 
                                  ? "bg-primary/5 border-primary/30" 
                                  : "bg-muted/30 border-border/50 hover:bg-muted/50"
                              }`}
                            >
                              <Label htmlFor={`${user.id}-${tab.id}`} className="text-sm cursor-pointer flex-1 break-words">
                                {tab.label}
                              </Label>
                              <Switch
                                id={`${user.id}-${tab.id}`}
                                checked={isEnabled}
                                onCheckedChange={() => handleTabToggle(user, tab.id)}
                                className="flex-shrink-0"
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Full access message for Master/Monitoria */}
                  {(user.adminType === "master" || user.adminType === "monitoria") && (
                    <div className="p-3 rounded-md bg-muted/40 border-l-2 border-primary/50">
                      <p className="text-sm text-muted-foreground">
                        Este usuario tem acesso total ao painel administrativo.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {adminUsers.length === 0 && (
            <Card className="border-2 border-dashed border-orange-500/30">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">Nenhum usuário administrador encontrado</p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.username}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
