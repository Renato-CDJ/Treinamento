"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus, Package } from "lucide-react"
import { getProducts, updateProduct, deleteProduct, createProduct } from "@/lib/store"
import type { Product } from "@/lib/types"

export default function SettingsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Form state for creating/editing products
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "habitacional" as "habitacional" | "comercial" | "cartao" | "outros",
    scriptId: "",
    isActive: true,
    attendanceTypes: [] as ("ativo" | "receptivo")[],
    personTypes: [] as ("fisica" | "juridica")[],
  })

  useEffect(() => {
    loadProducts()

    const handleStoreUpdate = () => {
      loadProducts()
    }

    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [])

  const loadProducts = () => {
    setProducts(getProducts())
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsCreating(false)
    setFormData({
      name: product.name,
      description: product.description || "",
      category: product.category,
      scriptId: product.scriptId,
      isActive: product.isActive,
      attendanceTypes: product.attendanceTypes || [],
      personTypes: product.personTypes || [],
    })
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingProduct(null)
    setFormData({
      name: "",
      description: "",
      category: "habitacional",
      scriptId: "",
      isActive: true,
      attendanceTypes: [],
      personTypes: [],
    })
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert("Por favor, insira o nome do produto")
      return
    }

    if (editingProduct) {
      // Update existing product
      const updatedProduct: Product = {
        ...editingProduct,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        scriptId: formData.scriptId,
        isActive: formData.isActive,
        attendanceTypes: formData.attendanceTypes,
        personTypes: formData.personTypes,
      }
      updateProduct(updatedProduct)
    } else if (isCreating) {
      // Create new product
      createProduct({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        scriptId: formData.scriptId,
        isActive: formData.isActive,
        attendanceTypes: formData.attendanceTypes,
        personTypes: formData.personTypes,
      })
    }

    setEditingProduct(null)
    setIsCreating(false)
    loadProducts()
  }

  const handleDelete = (productId: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProduct(productId)
      loadProducts()
    }
  }

  const handleCancel = () => {
    setEditingProduct(null)
    setIsCreating(false)
  }

  const toggleAttendanceType = (type: "ativo" | "receptivo") => {
    setFormData((prev) => ({
      ...prev,
      attendanceTypes: prev.attendanceTypes.includes(type)
        ? prev.attendanceTypes.filter((t) => t !== type)
        : [...prev.attendanceTypes, type],
    }))
  }

  const togglePersonType = (type: "fisica" | "juridica") => {
    setFormData((prev) => ({
      ...prev,
      personTypes: prev.personTypes.includes(type)
        ? prev.personTypes.filter((t) => t !== type)
        : [...prev.personTypes, type],
    }))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie produtos e suas descrições</p>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Produtos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          {/* Product List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gerenciar Produtos</CardTitle>
                  <CardDescription>Configure produtos e suas mensagens de hover</CardDescription>
                </div>
                <Button onClick={handleCreate} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="h-4 w-4" />
                  Novo Produto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg text-foreground">{product.name}</h3>
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      {product.description && (
                        <p className="text-sm text-muted-foreground italic">"{product.description}"</p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {product.attendanceTypes?.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type === "ativo" ? "Ativo" : "Receptivo"}
                          </Badge>
                        ))}
                        {product.personTypes?.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type === "fisica" ? "Física" : "Jurídica"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                        className="hover:bg-accent"
                      >
                        <Pencil className="h-4 w-4 text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        className="hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}

                {products.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum produto cadastrado</p>
                    <p className="text-sm">Clique em "Novo Produto" para começar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit/Create Form */}
          {(editingProduct || isCreating) && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle>{isCreating ? "Criar Novo Produto" : "Editar Produto"}</CardTitle>
                <CardDescription>
                  {isCreating ? "Preencha os dados do novo produto" : "Atualize as informações do produto"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: HABITACIONAL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (Mensagem de Hover)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Financiamento Habitacional para aquisição de imóveis residenciais"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta mensagem aparecerá quando o operador passar o mouse sobre o produto
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scriptId">ID do Script Inicial</Label>
                  <Input
                    id="scriptId"
                    value={formData.scriptId}
                    onChange={(e) => setFormData({ ...formData, scriptId: e.target.value })}
                    placeholder="Ex: step-1"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Tipos de Atendimento</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.attendanceTypes.includes("ativo")}
                        onCheckedChange={() => toggleAttendanceType("ativo")}
                      />
                      <Label>Ativo</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.attendanceTypes.includes("receptivo")}
                        onCheckedChange={() => toggleAttendanceType("receptivo")}
                      />
                      <Label>Receptivo</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Tipos de Pessoa</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.personTypes.includes("fisica")}
                        onCheckedChange={() => togglePersonType("fisica")}
                      />
                      <Label>Física</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.personTypes.includes("juridica")}
                        onCheckedChange={() => togglePersonType("juridica")}
                      />
                      <Label>Jurídica</Label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label>Produto Ativo</Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSave} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                    Salvar
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="flex-1 bg-transparent">
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
