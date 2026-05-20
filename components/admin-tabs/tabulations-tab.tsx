"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTabulations } from "@/hooks/use-supabase-admin"
import {
  Tags,
  Plus,
  Trash2,
  Edit,
  Search,
  Loader2,
  Palette,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Tabulation {
  id: string
  name: string
  description: string
  color: string
  category: "before" | "after"
  is_active: boolean
  created_at: string
  updated_at: string
}

const COLORS = [
  { name: "Vermelho", value: "#ef4444" },
  { name: "Laranja", value: "#f97316" },
  { name: "Amarelo", value: "#eab308" },
  { name: "Verde", value: "#22c55e" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Roxo", value: "#8b5cf6" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Cinza", value: "#6b7280" },
]

export function TabulationsTab() {
  const { data: tabulations, loading, create, update, remove } = useTabulations()
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTabulation, setEditingTabulation] = useState<Tabulation | null>(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formColor, setFormColor] = useState("#3b82f6")
  const [formCategory, setFormCategory] = useState<"before" | "after">("before")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const filteredTabulations = useMemo(() => {
    return tabulations
      .filter((t) => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            t.name.toLowerCase().includes(query) ||
            t.description?.toLowerCase().includes(query)
          )
        }
        return true
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [tabulations, searchQuery])

  const activeCount = tabulations.filter((t) => t.is_active).length

  const resetForm = () => {
    setFormName("")
    setFormDescription("")
    setFormColor("#3b82f6")
    setFormCategory("before")
    setEditingTabulation(null)
  }

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast({ title: "Erro", description: "O nome e obrigatorio.", variant: "destructive" })
      return
    }

    setSaving(true)
    const { error } = await create({
      name: formName.trim(),
      description: formDescription.trim(),
      color: formColor,
      category: formCategory,
      is_active: true,
    })

    if (error) {
      toast({ title: "Erro", description: error, variant: "destructive" })
    } else {
      toast({ title: "Sucesso", description: "Tabulacao criada com sucesso." })
      resetForm()
      setShowCreateDialog(false)
    }
    setSaving(false)
  }

  const handleUpdate = async () => {
    if (!editingTabulation) return
    if (!formName.trim()) {
      toast({ title: "Erro", description: "O nome e obrigatorio.", variant: "destructive" })
      return
    }

    setSaving(true)
    const { error } = await update(editingTabulation.id, {
      name: formName.trim(),
      description: formDescription.trim(),
      color: formColor,
      category: formCategory,
    })

    if (error) {
      toast({ title: "Erro", description: error, variant: "destructive" })
    } else {
      toast({ title: "Sucesso", description: "Tabulacao atualizada." })
      resetForm()
      setEditingTabulation(null)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tabulacao?")) return

    const { error } = await remove(id)
    if (error) {
      toast({ title: "Erro", description: error, variant: "destructive" })
    } else {
      toast({ title: "Sucesso", description: "Tabulacao excluida." })
    }
  }

  const handleToggleActive = async (tabulation: Tabulation) => {
    await update(tabulation.id, { is_active: !tabulation.is_active })
  }

  const startEdit = (tabulation: Tabulation) => {
    setEditingTabulation(tabulation)
    setFormName(tabulation.name)
    setFormDescription(tabulation.description || "")
    setFormColor(tabulation.color || "#3b82f6")
    setFormCategory(tabulation.category || "before")
  }

  const cancelEdit = () => {
    resetForm()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  const formFields = (isEdit: boolean) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Nome da Tabulacao</Label>
        <Input
          placeholder="Ex: Sem Interesse"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Descricao</Label>
        <Textarea
          placeholder="Descricao da tabulacao..."
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Categoria</Label>
        <Select value={formCategory} onValueChange={(value: "before" | "after") => setFormCategory(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="before">Antes da confirmacao de dados (CPF)</SelectItem>
            <SelectItem value="after">Depois da confirmacao de dados (CPF)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Cor
        </Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                formColor === color.value
                  ? "border-foreground scale-110"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: color.value }}
              onClick={() => setFormColor(color.value)}
              title={color.name}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {isEdit ? (
          <>
            <Button variant="outline" onClick={cancelEdit}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Alteracoes
            </Button>
          </>
        ) : (
          <Button
            onClick={handleCreate}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Criar Tabulacao
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tags className="h-6 w-6 text-orange-500" />
            Tabulacoes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as tabulacoes disponiveis para classificacao de atendimentos
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => {
                resetForm()
                setShowCreateDialog(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Tabulacao
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Tabulacao</DialogTitle>
              <DialogDescription>
                Adicione uma nova tabulacao para classificar atendimentos
              </DialogDescription>
            </DialogHeader>
            {formFields(false)}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{tabulations.length}</p>
              </div>
              <Tags className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-green-500">{activeCount}</p>
              </div>
              <Tags className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar tabulacao..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit Form (inline) */}
      {editingTabulation && (
        <Card className="border-orange-500/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit className="h-4 w-4 text-orange-500" />
              Editando: {editingTabulation.name}
            </CardTitle>
            <CardDescription>Altere os dados da tabulacao abaixo</CardDescription>
          </CardHeader>
          <CardContent>{formFields(true)}</CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredTabulations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <Tags className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                {tabulations.length === 0
                  ? "Nenhuma tabulacao cadastrada"
                  : "Nenhum resultado para a pesquisa"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-xs font-semibold w-[50px]">Cor</TableHead>
                    <TableHead className="text-xs font-semibold min-w-[150px]">Nome</TableHead>
                    <TableHead className="text-xs font-semibold min-w-[150px]">
                      Categoria
                    </TableHead>
                    <TableHead className="text-xs font-semibold min-w-[200px]">
                      Descricao
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-center min-w-[80px]">
                      Ativo
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right min-w-[100px] pr-4">
                      Acoes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTabulations.map((tabulation) => (
                    <TableRow key={tabulation.id} className="hover:bg-muted/20">
                      <TableCell className="py-3">
                        <div
                          className="w-6 h-6 rounded-full border border-border"
                          style={{ backgroundColor: tabulation.color || "#3b82f6" }}
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm font-medium text-foreground">
                          {tabulation.name}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant={tabulation.category === "before" ? "outline" : "secondary"}>
                          {tabulation.category === "before" ? "Antes do CPF" : "Depois do CPF"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm text-muted-foreground line-clamp-2">
                          {tabulation.description || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Switch
                          checked={tabulation.is_active}
                          onCheckedChange={() => handleToggleActive(tabulation)}
                        />
                      </TableCell>
                      <TableCell className="py-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(tabulation)}
                            className="h-8 w-8 hover:text-orange-500"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(tabulation.id)}
                            className="h-8 w-8 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
