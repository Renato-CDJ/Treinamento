"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Save, X, ChevronRight, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useSituations } from "@/hooks/use-supabase-admin"
import { useToast } from "@/hooks/use-toast"

interface Situation {
  id: string
  name: string
  description: string
  color: string
  isActive?: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export function SituationsTab() {
  const { data: situations, loading, create, update, remove } = useSituations()
  const [editingItem, setEditingItem] = useState<Partial<Situation> | null>(null)
  const mappedSituations = useMemo(
    () => (situations || []).map((s: any) => ({
      ...s,
      isActive: s.is_active,
    })),
    [situations],
  )
  const [isCreating, setIsCreating] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleEdit = (item: Situation) => {
    setEditingItem({ ...item })
    setIsCreating(false)
  }

  const handleCreate = () => {
    setEditingItem({
      name: "",
      description: "",
      color: "#6b7280",
      is_active: true,
    })
    setIsCreating(true)
  }

  const handleSave = async () => {
    if (!editingItem || !editingItem.name) return

    setSaving(true)
    try {
      if (isCreating) {
        const { error } = await create({
          name: editingItem.name,
          description: editingItem.description || "",
          color: editingItem.color || "#6b7280",
          is_active: editingItem.is_active !== false,
        })
        if (error) throw new Error(error)
        toast({
          title: "Situacao criada",
          description: "A nova situacao foi criada com sucesso.",
        })
      } else if (editingItem.id) {
        const { error } = await update(editingItem.id, {
          name: editingItem.name,
          description: editingItem.description,
          color: editingItem.color,
          is_active: editingItem.is_active,
        })
        if (error) throw new Error(error)
        toast({
          title: "Situacao atualizada",
          description: "As alteracoes foram salvas com sucesso.",
        })
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao salvar situacao",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
      setEditingItem(null)
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta situacao?")) {
      const { error } = await remove(id)
      if (error) {
        toast({
          title: "Erro",
          description: error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Situacao excluida",
        description: "A situacao foi removida com sucesso.",
      })
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
    setIsCreating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Situações de Atendimento</h2>
          <p className="text-muted-foreground mt-1">Configure as situações que podem ocorrer durante o atendimento</p>
        </div>
        <Button
          onClick={handleCreate}
          disabled={!!editingItem}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Situação
        </Button>
      </div>

      {editingItem ? (
        <Card>
          <CardHeader>
            <CardTitle>{isCreating ? "Criar Nova Situação" : "Editar Situação"}</CardTitle>
            <CardDescription>Configure os detalhes da situação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Título da Situação</Label>
              <Input
                id="name"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                placeholder="Ex: EM CASOS DE FALÊNCIA/CONCORDATA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                placeholder="Descreva o que fazer nesta situação"
                rows={5}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Status Ativo</Label>
                <p className="text-sm text-muted-foreground">Permitir que operadores vejam esta situação</p>
              </div>
              <Switch
                id="active"
                checked={editingItem.isActive}
                onCheckedChange={(checked) => setEditingItem({ ...editingItem, isActive: checked })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mappedSituations.map((situation) => (
            <Card
              key={situation.id}
              className="cursor-pointer hover:shadow-md transition-all bg-card hover:bg-accent/50"
              onClick={() => setExpandedId(expandedId === situation.id ? null : situation.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex items-center gap-3">
                    <CardTitle className="text-base font-bold uppercase text-foreground">{situation.name}</CardTitle>
                    {situation.isActive && (
                      <Badge
                        variant="outline"
                        className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400"
                      >
                        Ativo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(situation)
                      }}
                      className="hover:bg-accent"
                    >
                      <Edit className="h-4 w-4 text-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(situation.id)
                      }}
                      className="hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <ChevronRight
                      className={`h-5 w-5 text-orange-500 dark:text-orange-400 transition-transform ${
                        expandedId === situation.id ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </div>
              </CardHeader>
              {expandedId === situation.id && (
                <CardContent className="pt-0 pb-4">
                  <div className="pl-4 border-l-2 border-orange-500 dark:border-orange-400">
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{situation.description}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
