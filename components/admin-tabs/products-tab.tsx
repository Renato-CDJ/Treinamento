"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Package, Loader2 } from "lucide-react"
import { useProducts, useScripts } from "@/hooks/use-supabase-admin"
import type { Product, PersonTypeOption } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { getPersonTypes } from "@/lib/store"

export function ProductsTab() {
  const { data: products, loading, create, update, remove } = useProducts()
  const { data: scripts } = useScripts()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [dialogId, setDialogId] = useState<string>("")
  const [personTypeOptions, setPersonTypeOptions] = useState<PersonTypeOption[]>([])
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    scriptId: "",
    category: "habitacional" as "habitacional" | "comercial" | "cartao" | "outros" | "boleto_pre_formatado",
    attendanceTypes: [] as ("ativo" | "receptivo")[],
    personTypes: [] as string[],
  })
  const { toast } = useToast()

  useEffect(() => {
    setPersonTypeOptions(getPersonTypes())
  }, [])

  const handleOpenDialog = (product?: any) => {
    const newDialogId = `dialog-${Date.now()}`
    setDialogId(newDialogId)

    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name || "",
        scriptId: product.details?.scriptId || "",
        category: product.category || "habitacional",
        attendanceTypes: product.details?.attendanceTypes || [],
        personTypes: product.details?.personTypes || [],
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: "",
        scriptId: "",
        category: "habitacional",
        attendanceTypes: [],
        personTypes: [],
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.scriptId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    if (formData.attendanceTypes.length === 0 || formData.personTypes.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um tipo de atendimento e um tipo de pessoa",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      if (editingProduct) {
        const { error } = await update(editingProduct.id, {
          name: formData.name,
          description: `Produto ${formData.name}`,
          category: formData.category,
          details: {
            scriptId: formData.scriptId,
            attendanceTypes: formData.attendanceTypes,
            personTypes: formData.personTypes,
          },
        })
        if (error) throw new Error(error)
        toast({
          title: "Sucesso",
          description: "Produto atualizado com sucesso",
        })
      } else {
        const { error } = await create({
          name: formData.name,
          description: `Produto ${formData.name}`,
          category: formData.category,
          price: 0,
          is_active: true,
          details: {
            scriptId: formData.scriptId,
            attendanceTypes: formData.attendanceTypes,
            personTypes: formData.personTypes,
          },
        })
        if (error) throw new Error(error)
        toast({
          title: "Sucesso",
          description: "Produto criado com sucesso",
        })
      }

      setIsDialogOpen(false)
      setFormData({
        name: "",
        scriptId: "",
        category: "habitacional",
        attendanceTypes: [],
        personTypes: [],
      })
      setEditingProduct(null)
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao salvar produto",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
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
        title: "Sucesso",
        description: "Produto excluído com sucesso",
      })
    }
  }

  const toggleAttendanceType = (type: "ativo" | "receptivo") => {
    setFormData((prev) => ({
      ...prev,
      attendanceTypes: prev.attendanceTypes.includes(type)
        ? prev.attendanceTypes.filter((t) => t !== type)
        : [...prev.attendanceTypes, type],
    }))
  }

  const togglePersonType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      personTypes: prev.personTypes.includes(type)
        ? prev.personTypes.filter((t) => t !== type)
        : [...prev.personTypes, type],
    }))
  }

  const abordagemSteps = useMemo(() => {
    // Filter steps that are "Abordagem" (approach/first screen of each product)
    return scripts.filter(
      (step) => step.title?.toLowerCase().includes("abordagem") || step.id?.toLowerCase().includes("abordagem"),
    )
  }, [scripts])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gerenciar Produtos</h2>
          <p className="text-muted-foreground mt-1">Configure os produtos e onde eles devem aparecer</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Produto
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhum produto cadastrado ainda.
                <br />
                Clique em "Adicionar Produto" para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {product.name}
                    </CardTitle>
                    <CardDescription>
                      Categoria: {(product.category || "outros").charAt(0).toUpperCase() + (product.category || "outros").slice(1)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-2">Aparece em:</p>
                  <div className="flex flex-wrap gap-2">
                    {product.details?.attendanceTypes?.map((type: string) => (
                      <Badge key={type} variant="secondary">
                        Atendimento {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Badge>
                    ))}
                    {product.details?.personTypes?.map((type: string) => (
                      <Badge key={type} variant="secondary">
                        Pessoa {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Produto" : "Adicionar Produto"}</DialogTitle>
            <DialogDescription>Configure o produto e determine onde ele deve aparecer no sistema</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor={`name-${dialogId}`}>Nome do Produto *</Label>
              <Input
                id={`name-${dialogId}`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: HABITACIONAL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`scriptId-${dialogId}`}>Script Inicial * (Abordagem)</Label>
              <Select
                value={formData.scriptId}
                onValueChange={(value) => setFormData({ ...formData, scriptId: value })}
              >
                <SelectTrigger id={`scriptId-${dialogId}`}>
                  <SelectValue placeholder="Selecione a tela de Abordagem" />
                </SelectTrigger>
                <SelectContent>
                  {abordagemSteps.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhuma tela de Abordagem encontrada
                    </SelectItem>
                  ) : (
                    abordagemSteps.map((step) => (
                      <SelectItem key={step.id} value={step.id}>
                        {step.title}
                        {step.product_id && ` (${step.product_id})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecione a tela inicial de abordagem do script. Os scripts são importados da pasta data/scripts em
                "Gerenciar Roteiros".
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`category-${dialogId}`}>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id={`category-${dialogId}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="habitacional">Habitacional</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                  <SelectItem value="boleto_pre_formatado">Boleto Pré-Formatado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Tipo de Atendimento *</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`ativo-${dialogId}`}
                    checked={formData.attendanceTypes.includes("ativo")}
                    onCheckedChange={() => toggleAttendanceType("ativo")}
                  />
                  <label htmlFor={`ativo-${dialogId}`} className="text-sm font-medium cursor-pointer">
                    Atendimento Ativo
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`receptivo-${dialogId}`}
                    checked={formData.attendanceTypes.includes("receptivo")}
                    onCheckedChange={() => toggleAttendanceType("receptivo")}
                  />
                  <label htmlFor={`receptivo-${dialogId}`} className="text-sm font-medium cursor-pointer">
                    Atendimento Receptivo
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Tipo de Pessoa *</Label>
              <div className="flex gap-4 flex-wrap">
                {personTypeOptions.map((pt) => (
                  <div key={pt.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`person-${pt.value}-${dialogId}`}
                      checked={formData.personTypes.includes(pt.value)}
                      onCheckedChange={() => togglePersonType(pt.value)}
                    />
                    <label htmlFor={`person-${pt.value}-${dialogId}`} className="text-sm font-medium cursor-pointer">
                      Pessoa {pt.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
