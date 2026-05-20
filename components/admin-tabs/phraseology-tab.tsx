"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Save, X, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Phraseology {
  id: string
  title: string
  content: string
  category?: string
  createdAt: Date
}

export function PhraseologyTab() {
  const [phraseologies, setPhraseologies] = useState<Phraseology[]>([])
  const [editingItem, setEditingItem] = useState<Phraseology | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadPhraseologies()
    const handleStoreUpdate = () => {
      loadPhraseologies()
    }
    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [])

  const loadPhraseologies = () => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("callcenter_phraseologies")
    if (stored) {
      setPhraseologies(JSON.parse(stored))
    }
  }

  const savePhraseologies = (data: Phraseology[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem("callcenter_phraseologies", JSON.stringify(data))
    localStorage.setItem("callcenter_last_update", Date.now().toString())
    window.dispatchEvent(new CustomEvent("store-updated"))
  }

  const handleImportPhraseology = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        let importedCount = 0
        const newPhraseologies: Phraseology[] = []

        // Check for direct phraseology format
        if (data.fraseologias) {
          Object.entries(data.fraseologias).forEach(([key, value]: [string, any]) => {
            newPhraseologies.push({
              id: `phrase-${Date.now()}-${importedCount}`,
              title: value.title || key,
              content: value.content || value.text || "",
              category: value.category || "Geral",
              createdAt: new Date(),
            })
            importedCount++
          })
        }
        // Check for nested format in marcas
        else if (data.marcas) {
          Object.entries(data.marcas).forEach(([productName, productData]: [string, any]) => {
            Object.entries(productData).forEach(([key, value]: [string, any]) => {
              if (value.title?.toLowerCase().includes("fraseologia")) {
                newPhraseologies.push({
                  id: `phrase-${Date.now()}-${importedCount}`,
                  title: value.title,
                  content: value.content || value.text || "",
                  category: productName,
                  createdAt: new Date(),
                })
                importedCount++
              }
            })
          })
        }

        if (importedCount > 0) {
          const updatedPhraseologies = [...phraseologies, ...newPhraseologies]
          setPhraseologies(updatedPhraseologies)
          savePhraseologies(updatedPhraseologies)
          toast({
            title: "Fraseologias importadas com sucesso!",
            description: `${importedCount} fraseologia(s) foram importadas.`,
          })
        } else {
          throw new Error("Nenhuma fraseologia foi encontrada no arquivo")
        }
      } catch (error) {
        console.error("[v0] Import error:", error)
        toast({
          title: "Erro ao importar",
          description: "O arquivo não contém fraseologias válidas.",
          variant: "destructive",
        })
      }
    }
    input.click()
  }

  const handleEdit = (item: Phraseology) => {
    setEditingItem({ ...item })
    setIsCreating(false)
  }

  const handleCreate = () => {
    const newItem: Phraseology = {
      id: `phrase-${Date.now()}`,
      title: "",
      content: "",
      category: "Geral",
      createdAt: new Date(),
    }
    setEditingItem(newItem)
    setIsCreating(true)
  }

  const handleSave = () => {
    if (!editingItem) return

    if (isCreating) {
      const newPhraseologies = [...phraseologies, editingItem]
      setPhraseologies(newPhraseologies)
      savePhraseologies(newPhraseologies)
      toast({
        title: "Fraseologia criada",
        description: "A nova fraseologia foi criada com sucesso.",
      })
    } else {
      const updatedPhraseologies = phraseologies.map((p) => (p.id === editingItem.id ? editingItem : p))
      setPhraseologies(updatedPhraseologies)
      savePhraseologies(updatedPhraseologies)
      toast({
        title: "Fraseologia atualizada",
        description: "As alterações foram salvas com sucesso.",
      })
    }

    setEditingItem(null)
    setIsCreating(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta fraseologia?")) {
      const updatedPhraseologies = phraseologies.filter((p) => p.id !== id)
      setPhraseologies(updatedPhraseologies)
      savePhraseologies(updatedPhraseologies)
      toast({
        title: "Fraseologia excluída",
        description: "A fraseologia foi removida com sucesso.",
      })
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
    setIsCreating(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gerenciar Fraseologias</h2>
          <p className="text-muted-foreground mt-1">Crie e edite frases prontas para atendimento</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleImportPhraseology}
            disabled={!!editingItem}
            className="border-orange-500 text-orange-500 hover:bg-orange-50 bg-transparent"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar Fraseologia JSON
          </Button>
          <Button onClick={handleCreate} disabled={!!editingItem} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Nova Fraseologia
          </Button>
        </div>
      </div>

      {editingItem ? (
        <Card className="border-orange-200">
          <CardHeader className="bg-orange-50 dark:bg-orange-950">
            <CardTitle>{isCreating ? "Criar Nova Fraseologia" : "Editar Fraseologia"}</CardTitle>
            <CardDescription>Configure a fraseologia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                placeholder="Ex: Saudação Inicial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={editingItem.category || ""}
                onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                placeholder="Ex: Habitacional, Geral"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea
                id="content"
                value={editingItem.content}
                onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                placeholder="Digite o texto da fraseologia"
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
                <Save className="h-4 w-4 mr-2" />
                Salvar Fraseologia
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {phraseologies.map((phrase) => (
            <Card key={phrase.id} className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {phrase.category && (
                        <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                          {phrase.category}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl">{phrase.title}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">{phrase.content}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(phrase)} title="Editar">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(phrase.id)} title="Excluir">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
          {phraseologies.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>Nenhuma fraseologia cadastrada ainda.</p>
                <p className="text-sm mt-1">Clique em "Nova Fraseologia" ou importe um arquivo JSON.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
