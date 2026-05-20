"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Loader2,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  Headphones,
  CheckCircle2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useChannels } from "@/hooks/use-supabase-admin"
import { useToast } from "@/hooks/use-toast"

interface Channel {
  id: string
  name: string
  description: string
  icon: string
  contact?: string
  isActive?: boolean
  is_active?: boolean
  created_at: string
  updated_at: string
}

function getChannelIcon(contact: string | undefined): React.ElementType {
  if (!contact) return Headphones
  const lower = contact.toLowerCase()
  if (lower.includes("wa.me") || lower.includes("whatsapp")) return MessageCircle
  if (lower.includes("@") || lower.includes("mail")) return Mail
  if (lower.includes("http") || lower.includes("www")) return Globe
  if (/^\+?\d/.test(contact) || lower.includes("tel")) return Phone
  return Headphones
}

export function ChannelsTab() {
  const { data: channels, loading, create, update, remove } = useChannels()
  const { toast } = useToast()
  const [editingItem, setEditingItem] = useState<Partial<Channel> | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const mappedChannels = useMemo(
    () => (channels || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description || "",
      icon: c.icon || "phone",
      contact: c.icon || "",
      isActive: c.is_active,
      created_at: c.created_at,
      updated_at: c.updated_at,
    })),
    [channels],
  )

  const activeCount = useMemo(
    () => mappedChannels.filter(c => c.isActive).length,
    [mappedChannels]
  )

  const handleEdit = (item: Channel) => {
    setEditingItem({ ...item, contact: item.icon })
    setIsCreating(false)
  }

  const handleCreate = () => {
    setEditingItem({
      name: "",
      description: "",
      icon: "phone",
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
          icon: editingItem.contact || editingItem.icon || "phone",
          is_active: editingItem.is_active !== false,
        })
        if (error) throw new Error(error)
        toast({
          title: "Canal criado",
          description: "O novo canal foi criado com sucesso.",
        })
      } else if (editingItem.id) {
        const { error } = await update(editingItem.id, {
          name: editingItem.name,
          description: editingItem.description,
          icon: editingItem.contact || editingItem.icon || "phone",
          is_active: editingItem.is_active,
        })
        if (error) throw new Error(error)
        toast({
          title: "Canal atualizado",
          description: "As alteracoes foram salvas com sucesso.",
        })
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao salvar canal",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
      setEditingItem(null)
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este canal?")) {
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
        title: "Canal excluido",
        description: "O canal foi removido com sucesso.",
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
        <p className="text-sm text-muted-foreground">Carregando canais...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Canais de Atendimento</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os canais disponiveis para os operadores
          </p>
        </div>
        <Button
          onClick={handleCreate}
          disabled={!!editingItem}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Canal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Headphones className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mappedChannels.length}</p>
                <p className="text-xs text-muted-foreground">Total de Canais</p>
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
                <p className="text-xs text-muted-foreground">Canais Ativos</p>
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
                <p className="text-2xl font-bold text-muted-foreground">{mappedChannels.length - activeCount}</p>
                <p className="text-xs text-muted-foreground">Canais Inativos</p>
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
                <CardTitle className="text-lg">{isCreating ? "Criar Novo Canal" : "Editar Canal"}</CardTitle>
                <CardDescription>Configure os detalhes do canal de atendimento</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nome do Canal</Label>
              <Input
                id="name"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                placeholder="Ex: WhatsApp Suporte, Central de Atendimento"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact" className="text-sm font-medium">Numero ou Link</Label>
              <Textarea
                id="contact"
                value={editingItem.contact || ""}
                onChange={(e) => setEditingItem({ ...editingItem, contact: e.target.value })}
                placeholder="Ex: (11) 98765-4321 ou https://wa.me/5511987654321"
                rows={3}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Pode ser um numero de telefone, link do WhatsApp, e-mail ou URL.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="space-y-0.5">
                <Label htmlFor="active" className="text-sm font-medium">Canal Ativo</Label>
                <p className="text-xs text-muted-foreground">Exibir este canal para os operadores</p>
              </div>
              <Switch
                id="active"
                checked={editingItem.isActive ?? editingItem.is_active ?? true}
                onCheckedChange={(checked) => setEditingItem({ ...editingItem, isActive: checked, is_active: checked })}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button 
                onClick={handleSave} 
                disabled={saving || !editingItem.name}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? "Salvando..." : "Salvar Canal"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Canais */}
      {!editingItem && (
        <>
          {mappedChannels.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Headphones className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">Nenhum canal cadastrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comece adicionando um canal de atendimento
                </p>
                <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Canal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mappedChannels.map((channel) => {
                const IconComponent = getChannelIcon(channel.contact)
                
                return (
                  <Card 
                    key={channel.id} 
                    className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                      channel.isActive 
                        ? "border-border hover:border-primary/30" 
                        : "border-border/50 bg-muted/30"
                    }`}
                  >
                    {/* Status indicator */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      channel.isActive ? "bg-green-500" : "bg-muted-foreground/30"
                    }`} />
                    
                    <CardContent className="pt-5">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${
                          channel.isActive 
                            ? "bg-primary/10" 
                            : "bg-muted"
                        }`}>
                          <IconComponent className={`h-6 w-6 ${
                            channel.isActive ? "text-primary" : "text-muted-foreground"
                          }`} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className={`font-medium text-sm leading-tight line-clamp-2 ${
                                !channel.isActive && "text-muted-foreground"
                              }`}>
                                {channel.name}
                              </h3>
                              <Badge 
                                variant="outline" 
                                className={`mt-1.5 text-[10px] px-1.5 py-0 h-5 ${
                                  channel.isActive 
                                    ? "text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800" 
                                    : "text-muted-foreground border-muted"
                                }`}
                              >
                                {channel.isActive ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                onClick={() => handleEdit(channel)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleDelete(channel.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          

                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
