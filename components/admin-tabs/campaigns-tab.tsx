"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Plus, Pencil, Trash2, Loader2, Megaphone, Eye, ChevronDown, ChevronUp, Search } from "lucide-react"
import { useCampaigns } from "@/hooks/use-supabase-admin"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface CampaignFormData {
  name: string
  how_it_works: string
  positive_case: string
  negative_case: string
  delay_range: string
  complement: string
  system_site: string
}

const initialFormData: CampaignFormData = {
  name: "",
  how_it_works: "",
  positive_case: "",
  negative_case: "",
  delay_range: "",
  complement: "",
  system_site: "",
}

export function CampaignsTab() {
  const { data: campaigns, loading, create, update, remove } = useCampaigns()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null)
  const [viewingCampaign, setViewingCampaign] = useState<any | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleOpenDialog = (campaign?: any) => {
    if (campaign) {
      setEditingCampaign(campaign)
      setFormData({
        name: campaign.name || "",
        how_it_works: campaign.how_it_works || "",
        positive_case: campaign.positive_case || "",
        negative_case: campaign.negative_case || "",
        delay_range: campaign.delay_range || "",
        complement: campaign.complement || "",
        system_site: campaign.system_site || "",
      })
    } else {
      setEditingCampaign(null)
      setFormData(initialFormData)
    }
    setIsDialogOpen(true)
  }

  const handleViewCampaign = (campaign: any) => {
    setViewingCampaign(campaign)
    setIsViewDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da campanha e obrigatorio",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      if (editingCampaign) {
        const { error } = await update(editingCampaign.id, {
          name: formData.name,
          how_it_works: formData.how_it_works,
          positive_case: formData.positive_case,
          negative_case: formData.negative_case,
          delay_range: formData.delay_range,
          complement: formData.complement,
          system_site: formData.system_site,
        })
        if (error) throw new Error(error)
        toast({
          title: "Sucesso",
          description: "Campanha atualizada com sucesso",
        })
      } else {
        const { error } = await create({
          name: formData.name,
          how_it_works: formData.how_it_works,
          positive_case: formData.positive_case,
          negative_case: formData.negative_case,
          delay_range: formData.delay_range,
          complement: formData.complement,
          system_site: formData.system_site,
          is_active: true,
        })
        if (error) throw new Error(error)
        toast({
          title: "Sucesso",
          description: "Campanha criada com sucesso",
        })
      }

      setIsDialogOpen(false)
      setFormData(initialFormData)
      setEditingCampaign(null)
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao salvar campanha",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta campanha?")) {
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
        description: "Campanha excluida com sucesso",
      })
    }
  }

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      campaign.name?.toLowerCase().includes(query) ||
      campaign.system_site?.toLowerCase().includes(query) ||
      campaign.complement?.toLowerCase().includes(query)
    )
  })

  const truncateText = (text: string, maxLength: number = 80) => {
    if (!text) return "-"
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <Megaphone className="h-6 w-6" />
            </div>
            Gerenciar Campanhas
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure as campanhas e suas instrucoes para os operadores
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar campanhas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabela de Campanhas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Campanhas Cadastradas</CardTitle>
          <CardDescription>
            {filteredCampaigns.length} campanha(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {searchQuery ? "Nenhuma campanha encontrada com essa busca." : "Nenhuma campanha cadastrada ainda."}
                <br />
                {!searchQuery && 'Clique em "Nova Campanha" para comecar.'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead className="min-w-[180px] font-semibold">Campanha</TableHead>
                      <TableHead className="min-w-[120px] font-semibold">Faixa de Atraso</TableHead>
                      <TableHead className="min-w-[120px] font-semibold">Complemento</TableHead>
                      <TableHead className="min-w-[100px] font-semibold">Sistema/Site</TableHead>
                      <TableHead className="w-[100px] text-right font-semibold">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => {
                      const isExpanded = expandedRows.has(campaign.id)
                      return (
                        <>
                          <TableRow
                            key={campaign.id}
                            className={cn(
                              "cursor-pointer transition-colors",
                              isExpanded && "bg-orange-50/50 dark:bg-orange-500/5"
                            )}
                            onClick={() => toggleRowExpansion(campaign.id)}
                          >
                            <TableCell className="py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleRowExpansion(campaign.id)
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={campaign.is_active !== false ? "default" : "secondary"}
                                  className={cn(
                                    "shrink-0",
                                    campaign.is_active !== false &&
                                      "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                  )}
                                >
                                  {campaign.is_active !== false ? "Ativa" : "Inativa"}
                                </Badge>
                                <span className="font-medium">{campaign.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="text-sm text-muted-foreground">
                                {campaign.delay_range || "-"}
                              </span>
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="text-sm text-muted-foreground">
                                {campaign.complement || "-"}
                              </span>
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge variant="outline" className="font-mono text-xs">
                                {campaign.system_site || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleViewCampaign(campaign)
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Visualizar</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleOpenDialog(campaign)
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Editar</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDelete(campaign.id)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Excluir</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${campaign.id}-expanded`} className="bg-muted/30 hover:bg-muted/30">
                              <TableCell colSpan={6} className="p-0">
                                <div className="p-4 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Como funciona */}
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                                        Como funciona?
                                      </h4>
                                      <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background/50 rounded-lg p-3 border">
                                        {campaign.how_it_works || "Sem informacao"}
                                      </p>
                                    </div>

                                    {/* Em caso positivo */}
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                        Em caso positivo
                                      </h4>
                                      <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background/50 rounded-lg p-3 border border-green-200 dark:border-green-500/30">
                                        {campaign.positive_case || "Sem informacao"}
                                      </p>
                                    </div>

                                    {/* Em caso negativo */}
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                        Em caso negativo
                                      </h4>
                                      <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background/50 rounded-lg p-3 border border-red-200 dark:border-red-500/30">
                                        {campaign.negative_case || "Sem informacao"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criacao/Edicao */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-orange-500" />
              {editingCampaign ? "Editar Campanha" : "Nova Campanha"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informacoes da campanha. Os operadores poderao visualizar essas instrucoes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Campanha *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: SINEB - 224,225 e 226"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="system_site">Sistema/Site</Label>
                <Input
                  id="system_site"
                  value={formData.system_site}
                  onChange={(e) => setFormData({ ...formData, system_site: e.target.value })}
                  placeholder="Ex: SINEB, SIATC"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delay_range">Faixa de Atraso</Label>
                <Input
                  id="delay_range"
                  value={formData.delay_range}
                  onChange={(e) => setFormData({ ...formData, delay_range: e.target.value })}
                  placeholder="Ex: Atraso a partir de 361 dias"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  placeholder="Ex: Comercial, Cartao de credito"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="how_it_works">Como funciona?</Label>
              <Textarea
                id="how_it_works"
                value={formData.how_it_works}
                onChange={(e) => setFormData({ ...formData, how_it_works: e.target.value })}
                placeholder="Descreva como a campanha funciona..."
                className="min-h-[120px] resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="positive_case" className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Em caso positivo
                </Label>
                <Textarea
                  id="positive_case"
                  value={formData.positive_case}
                  onChange={(e) => setFormData({ ...formData, positive_case: e.target.value })}
                  placeholder="Instrucoes quando o cliente aceita..."
                  className="min-h-[150px] resize-y border-green-200 dark:border-green-500/30 focus-visible:ring-green-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="negative_case" className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Em caso negativo
                </Label>
                <Textarea
                  id="negative_case"
                  value={formData.negative_case}
                  onChange={(e) => setFormData({ ...formData, negative_case: e.target.value })}
                  placeholder="Instrucoes quando o cliente recusa..."
                  className="min-h-[150px] resize-y border-red-200 dark:border-red-500/30 focus-visible:ring-red-500/50"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualizacao */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-orange-500" />
              {viewingCampaign?.name}
            </DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              {viewingCampaign?.system_site && (
                <Badge variant="outline" className="font-mono">
                  {viewingCampaign.system_site}
                </Badge>
              )}
              {viewingCampaign?.delay_range && (
                <Badge variant="secondary">{viewingCampaign.delay_range}</Badge>
              )}
              {viewingCampaign?.complement && (
                <Badge variant="secondary">{viewingCampaign.complement}</Badge>
              )}
            </div>
          </DialogHeader>

          {viewingCampaign && (
            <div className="space-y-6 py-4">
              {/* Como funciona */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  Como funciona?
                </h4>
                <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-4 border">
                  {viewingCampaign.how_it_works || "Sem informacao"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Em caso positivo */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Em caso positivo
                  </h4>
                  <div className="text-sm text-foreground whitespace-pre-wrap bg-green-50 dark:bg-green-500/10 rounded-lg p-4 border border-green-200 dark:border-green-500/30 min-h-[150px]">
                    {viewingCampaign.positive_case || "Sem informacao"}
                  </div>
                </div>

                {/* Em caso negativo */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Em caso negativo
                  </h4>
                  <div className="text-sm text-foreground whitespace-pre-wrap bg-red-50 dark:bg-red-500/10 rounded-lg p-4 border border-red-200 dark:border-red-500/30 min-h-[150px]">
                    {viewingCampaign.negative_case || "Sem informacao"}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false)
                handleOpenDialog(viewingCampaign)
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
