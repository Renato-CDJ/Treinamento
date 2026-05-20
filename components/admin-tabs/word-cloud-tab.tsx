"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Loader2,
  Cloud,
  Type,
  CheckCircle2,
  Search
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useWordCloud } from "@/hooks/use-supabase-admin"
import { useToast } from "@/hooks/use-toast"

interface WordCloudItem {
  id: string
  word: string
  description: string
  is_active?: boolean
  created_at: string
  updated_at: string
}

export function WordCloudTab() {
  const { data: words, loading, create, update, remove } = useWordCloud()
  const { toast } = useToast()
  const [editingItem, setEditingItem] = useState<Partial<WordCloudItem> | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const mappedWords = useMemo(
    () => (words || []).map((w: any) => ({
      id: w.id,
      word: w.word,
      description: w.description || "",
      is_active: w.is_active !== false,
      created_at: w.created_at,
      updated_at: w.updated_at,
    })),
    [words],
  )

  const filteredWords = useMemo(() => {
    if (!searchTerm) return mappedWords
    const term = searchTerm.toLowerCase()
    return mappedWords.filter(w => 
      w.word.toLowerCase().includes(term) || 
      w.description.toLowerCase().includes(term)
    )
  }, [mappedWords, searchTerm])

  const activeCount = useMemo(
    () => mappedWords.filter(w => w.is_active).length,
    [mappedWords]
  )

  const handleEdit = (item: WordCloudItem) => {
    setEditingItem({ ...item })
    setIsCreating(false)
  }

  const handleCreate = () => {
    setEditingItem({
      word: "",
      description: "",
      is_active: true,
    })
    setIsCreating(true)
  }

  const handleSave = async () => {
    if (!editingItem || !editingItem.word) return

    setSaving(true)
    try {
      if (isCreating) {
        const { error } = await create({
          word: editingItem.word,
          description: editingItem.description || "",
          is_active: editingItem.is_active !== false,
        })
        if (error) throw new Error(error)
        toast({
          title: "Palavra criada",
          description: "A nova palavra foi adicionada a nuvem.",
        })
      } else if (editingItem.id) {
        const { error } = await update(editingItem.id, {
          word: editingItem.word,
          description: editingItem.description,
          is_active: editingItem.is_active,
        })
        if (error) throw new Error(error)
        toast({
          title: "Palavra atualizada",
          description: "As alteracoes foram salvas com sucesso.",
        })
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao salvar palavra",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
      setEditingItem(null)
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta palavra?")) {
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
        title: "Palavra excluida",
        description: "A palavra foi removida da nuvem.",
      })
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
    setIsCreating(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Carregando palavras...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Nuvem de Palavras</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie as palavras e seus significados para os operadores
          </p>
        </div>
        <Button
          onClick={handleCreate}
          disabled={!!editingItem}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Palavra
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Cloud className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mappedWords.length}</p>
                <p className="text-xs text-muted-foreground">Total de Palavras</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Palavras Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 col-span-2 sm:col-span-1">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                <X className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">{mappedWords.length - activeCount}</p>
                <p className="text-xs text-muted-foreground">Palavras Inativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form de Edicao/Criacao */}
      {editingItem && (
        <Card className="border-primary/30 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                {isCreating ? (
                  <Plus className="h-5 w-5 text-primary" />
                ) : (
                  <Edit className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">{isCreating ? "Adicionar Nova Palavra" : "Editar Palavra"}</CardTitle>
                <CardDescription>Configure a palavra e sua descricao</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="word" className="text-sm font-medium">Palavra</Label>
              <Input
                id="word"
                value={editingItem.word}
                onChange={(e) => setEditingItem({ ...editingItem, word: e.target.value })}
                placeholder="Ex: CDC, Renegociacao, Cobranca"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Descricao / Significado</Label>
              <Textarea
                id="description"
                value={editingItem.description || ""}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                placeholder="Descreva o significado ou explicacao da palavra..."
                rows={4}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Esta descricao sera exibida quando o operador clicar na palavra.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button 
                onClick={handleSave} 
                disabled={saving || !editingItem.word}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? "Salvando..." : "Salvar Palavra"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Busca */}
      {!editingItem && mappedWords.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar palavras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Lista de Palavras */}
      {!editingItem && (
        <>
          {mappedWords.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Cloud className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">Nenhuma palavra cadastrada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comece adicionando palavras a nuvem
                </p>
                <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Palavra
                </Button>
              </CardContent>
            </Card>
          ) : filteredWords.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">Nenhum resultado</h3>
                <p className="text-sm text-muted-foreground">
                  Nenhuma palavra encontrada para "{searchTerm}"
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredWords.map((word) => (
                <Card 
                  key={word.id} 
                  className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                    word.is_active 
                      ? "border-border hover:border-primary/30" 
                      : "border-border/50 bg-muted/30"
                  }`}
                >
                  {/* Status indicator */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    word.is_active ? "bg-primary" : "bg-muted-foreground/30"
                  }`} />
                  
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${
                        word.is_active 
                          ? "bg-primary/10" 
                          : "bg-muted"
                      }`}>
                        <Type className={`h-5 w-5 ${
                          word.is_active ? "text-primary" : "text-muted-foreground"
                        }`} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className={`font-semibold text-base leading-tight ${
                              !word.is_active && "text-muted-foreground"
                            }`}>
                              {word.word}
                            </h3>
                            {word.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {word.description}
                              </p>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                              onClick={() => handleEdit(word)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(word.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
