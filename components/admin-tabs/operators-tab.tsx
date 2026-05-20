"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UserX, Plus, Edit, Trash2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  forceLogoutUser,
  getCurrentUser,
} from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"
import * as XLSX from "xlsx"

// Dominio padrao para emails de operadores
const EMAIL_DOMAIN = "@gruporoveri.com"

export function OperatorsTab() {
  const [operators, setOperators] = useState<User[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingOperator, setEditingOperator] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
  })
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadOperators = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "operator")
      .order("created_at", { ascending: false })

    if (!error && data) {
      const ops: User[] = data.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        fullName: u.name,
        isOnline: u.is_online || false,
        role: u.role,
        createdAt: u.created_at ? new Date(u.created_at) : new Date(),
        loginSessions: [],
        permissions: {
          dashboard: true,
          scripts: true,
          products: true,
          attendanceConfig: false,
          tabulations: false,
          situations: false,
          channels: false,
          notes: true,
          operators: false,
          messagesQuiz: false,
          chat: true,
          settings: false,
        },
      }))
      setOperators(ops)
    }
  }

  useEffect(() => {
    loadOperators()

    // Polling ao invés de realtime - a cada 60 segundos
    const interval = setInterval(loadOperators, 60000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const handleOpenDialog = () => {
    setFormData({ fullName: "", email: "" })
    setIsEditMode(false)
    setEditingOperator(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (operator: User) => {
    setFormData({
      fullName: operator.fullName,
      email: operator.email || operator.username,
    })
    setIsEditMode(true)
    setEditingOperator(operator)
    setIsDialogOpen(true)
  }

  const handleDelete = async (operatorId: string) => {
    if (confirm("Tem certeza que deseja excluir este operador?")) {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("users").delete().eq("id", operatorId)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Operador excluido com sucesso",
        })
      } catch (error: any) {
        toast({
          title: "Erro",
          description: "Erro ao excluir operador: " + error.message,
          variant: "destructive",
        })
      }
    }
  }

  const handleForceLogout = (operatorId: string) => {
    const currentUser = getCurrentUser()

    if (currentUser && currentUser.id === operatorId) {
      if (!confirm("Você está prestes a fazer logout de sua própria sessão. Deseja continuar?")) {
        return
      }
    }

    forceLogoutUser(operatorId)

    if (currentUser && currentUser.id === operatorId) {
      window.location.href = "/"
    }

    toast({
      title: "Sucesso",
      description: "Operador deslogado com sucesso",
    })
  }

  // Funcao para gerar email a partir do nome
  const generateEmailFromName = (name: string): string => {
    const parts = name.trim().toLowerCase().split(/\s+/)
    if (parts.length >= 2) {
      // nome.sobrenome@gruporoveri.com
      return `${parts[0]}.${parts[parts.length - 1]}${EMAIL_DOMAIN}`
    }
    return `${parts[0]}${EMAIL_DOMAIN}`
  }

  const handleSave = async () => {
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    // Garantir que o email tenha o dominio correto
    let email = formData.email.trim().toLowerCase()
    if (!email.includes("@")) {
      email = `${email}${EMAIL_DOMAIN}`
    }

    const supabase = createClient()

    try {
      if (isEditMode && editingOperator) {
        // Update in Supabase
        const { error } = await supabase
          .from("users")
          .update({
            name: formData.fullName.trim(),
            email: email,
            username: email.split("@")[0], // username = parte antes do @
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingOperator.id)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Operador atualizado com sucesso",
        })
      } else {
        // Check if email exists
        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .ilike("email", email)
          .limit(1)

        if (existing && existing.length > 0) {
          toast({
            title: "Erro",
            description: `Email "${email}" ja existe no sistema`,
            variant: "destructive",
          })
          return
        }

        // Insert into Supabase
        const { error } = await supabase.from("users").insert({
          username: email.split("@")[0],
          name: formData.fullName.trim(),
          email: email,
          password: "", // Operadores nao precisam de senha
          role: "operator",
          is_active: true,
          is_online: false,
          allowed_tabs: ["dashboard", "scripts", "products", "notes", "chat"],
        })

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Operador adicionado com sucesso",
        })
      }

      setIsDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar operador: " + error.message,
        variant: "destructive",
      })
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls") && !fileName.endsWith(".csv")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV",
        variant: "destructive",
      })
      return
    }

    try {
      const supabase = createClient()
      let rows: string[][] = []

      if (fileName.endsWith(".csv")) {
        const text = await file.text()
        rows = text.split("\n").map((line) => line.split(",").map((cell) => cell.trim()))
      } else {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array" })

        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
        rows = data.map((row) => row.map((cell) => String(cell || "").trim()))
      }

      let nameColumnIndex = -1
      let emailColumnIndex = -1

      if (rows.length > 0) {
        const headerRow = rows[0].map((cell) => cell.toLowerCase())

        // Buscar coluna de nome
        nameColumnIndex = headerRow.findIndex((cell) => 
          cell.includes("nome completo") || cell === "nome" || cell === "name"
        )

        // Buscar coluna de email (ou usuario para conversao)
        emailColumnIndex = headerRow.findIndex((cell) => 
          cell.includes("email") || 
          cell.includes("e-mail") ||
          cell.includes("usuario") || 
          cell.includes("usuário") || 
          cell === "usuario"
        )

        if (nameColumnIndex !== -1 && emailColumnIndex !== -1) {
          rows = rows.slice(1)
        } else {
          nameColumnIndex = 0
          emailColumnIndex = 1
        }
      }

      rows = rows.filter(
        (row) =>
          row.length > Math.max(nameColumnIndex, emailColumnIndex) &&
          row[nameColumnIndex]?.trim() &&
          row[emailColumnIndex]?.trim(),
      )

      if (rows.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhum dado válido encontrado no arquivo",
          variant: "destructive",
        })
        return
      }

      let importedCount = 0
      let skippedCount = 0
      const errors: string[] = []

      for (let index = 0; index < rows.length; index++) {
        const row = rows[index]
        const fullName = row[nameColumnIndex]?.trim()
        let emailOrUsername = row[emailColumnIndex]?.trim()

        if (!fullName || !emailOrUsername) {
          errors.push(`Linha ${index + 2}: Dados incompletos`)
          skippedCount++
          continue
        }

        // Converter username para email se nao tiver @
        let email = emailOrUsername.toLowerCase()
        if (!email.includes("@")) {
          email = `${email.replace(/\s+/g, ".")}${EMAIL_DOMAIN}`
        }

        // Check if email already exists
        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .ilike("email", email)
          .limit(1)

        if (existing && existing.length > 0) {
          errors.push(`Linha ${index + 2}: Email "${email}" já existe`)
          skippedCount++
          continue
        }

        try {
          // Insert into Supabase
          const { error } = await supabase.from("users").insert({
            username: email.split("@")[0],
            name: fullName,
            email: email,
            password: "", // Operadores nao precisam de senha
            role: "operator",
            is_active: true,
            is_online: false,
            allowed_tabs: ["dashboard", "scripts", "products", "notes", "chat"],
          })

          if (error) throw error

          importedCount++
        } catch (insertError: any) {
          errors.push(`Linha ${index + 2}: Erro ao inserir - ${insertError.message}`)
          skippedCount++
          continue
        }
      }

      if (importedCount > 0) {
        toast({
          title: "Importação Concluída",
          description: `${importedCount} operador(es) importado(s) com sucesso${skippedCount > 0 ? `. ${skippedCount} ignorado(s)` : ""}`,
        })
      }

      if (errors.length > 0 && errors.length <= 5) {
        setTimeout(() => {
          toast({
            title: "Avisos",
            description: errors.join("\n"),
            variant: "destructive",
          })
        }, 500)
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar o arquivo. Verifique o formato.",
        variant: "destructive",
      })
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gerenciar Operadores</h2>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie os operadores do sistema ({operators.length} operadores)
          </p>
        </div>
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="outline" onClick={handleImportClick} className="gap-2 bg-transparent">
            <Upload className="h-4 w-4" />
            Importar Usuários
          </Button>
          <Button onClick={handleOpenDialog} className="gap-2">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Operador
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {operators.map((operator) => {
          return (
            <Card key={operator.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">{operator.fullName}</CardTitle>
                    <CardDescription className="mt-1">{operator.email || operator.username}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(operator)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleForceLogout(operator.id)}>
                      <UserX className="h-4 w-4 mr-2" />
                      Deslogar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(operator.id)}>
                      <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Operador" : "Adicionar Operador"}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Edite as informações do operador."
                : "Adicione um novo operador ao sistema. O email será usado para login."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => {
                  const name = e.target.value
                  setFormData({ 
                    ...formData, 
                    fullName: name,
                    // Auto-gerar email se estiver vazio
                    email: formData.email || (name.length > 3 ? generateEmailFromName(name) : "")
                  })
                }}
                placeholder="Nome do operador"
              />
              <p className="text-xs text-muted-foreground">O primeiro nome será exibido na abordagem do script</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={`nome.sobrenome${EMAIL_DOMAIN}`}
              />
              <p className="text-xs text-muted-foreground">
                Email para login. Dominio padrao: {EMAIL_DOMAIN}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{isEditMode ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
