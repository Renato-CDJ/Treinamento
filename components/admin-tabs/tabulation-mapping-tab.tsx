"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useScripts, useProducts, useTabulations } from "@/hooks/use-supabase-admin"
import { createClient } from "@/lib/supabase/client"
import {
  Tags,
  Loader2,
  FileText,
  ChevronRight,
  Save,
  CheckCircle,
  AlertCircle,
  Package,
  MapPin,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { SafeHtml } from "@/components/safe-html"

interface ScriptStep {
  id: string
  title: string
  content: string
  product_id: string
  product_name: string
  step_order: number
  buttons: any[]
  tabulations?: Array<{
    id: string
    name: string
    description: string
  }>
  is_active: boolean
}

interface Tabulation {
  id: string
  name: string
  description: string
  color: string
  is_active: boolean
}

export function TabulationMappingTab() {
  const { data: scripts, loading: loadingScripts, update: updateScript } = useScripts()
  const { data: products, loading: loadingProducts } = useProducts()
  const { data: tabulations, loading: loadingTabulations } = useTabulations()
  const { toast } = useToast()

  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [selectedStepId, setSelectedStepId] = useState<string>("")
  const [selectedTabulations, setSelectedTabulations] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Filter scripts by selected product
  const productScripts = useMemo(() => {
    if (!selectedProductId) return []
    return scripts
      .filter((s) => s.product_id === selectedProductId && s.is_active)
      .sort((a, b) => (a.step_order || 0) - (b.step_order || 0))
  }, [scripts, selectedProductId])

  // Get selected step
  const selectedStep = useMemo(() => {
    if (!selectedStepId) return null
    return productScripts.find((s) => s.id === selectedStepId) || null
  }, [productScripts, selectedStepId])

  // Active tabulations for selection
  const activeTabulations = useMemo(() => {
    return tabulations.filter((t) => t.is_active)
  }, [tabulations])

  // Handle product selection
  const handleProductChange = useCallback((productId: string) => {
    setSelectedProductId(productId)
    setSelectedStepId("")
    setSelectedTabulations([])
    setHasChanges(false)
  }, [])

  // Handle step selection
  const handleStepSelect = useCallback((step: ScriptStep) => {
    setSelectedStepId(step.id)
    // Load existing tabulations for this step
    const existingTabs = step.tabulations?.map((t) => t.id) || []
    setSelectedTabulations(existingTabs)
    setHasChanges(false)
  }, [])

  // Handle tabulation toggle
  const handleTabulationToggle = useCallback((tabulationId: string) => {
    setSelectedTabulations((prev) => {
      if (prev.includes(tabulationId)) {
        return prev.filter((id) => id !== tabulationId)
      }
      return [...prev, tabulationId]
    })
    setHasChanges(true)
  }, [])

  // Save tabulations for selected step
  const handleSave = async () => {
    if (!selectedStep) return

    setSaving(true)
    try {
      // Build tabulations array with full data
      const tabulationsData = selectedTabulations.map((id) => {
        const tab = tabulations.find((t) => t.id === id)
        return {
          id,
          name: tab?.name || "",
          description: tab?.description || "",
        }
      })

      const { error } = await updateScript(selectedStep.id, {
        tabulations: tabulationsData,
      })

      if (error) {
        toast({
          title: "Erro",
          description: "Nao foi possivel salvar as tabulacoes.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Sucesso",
          description: `Tabulacoes atualizadas para "${selectedStep.title}".`,
        })
        setHasChanges(false)
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao salvar tabulacoes.",
        variant: "destructive",
      })
    }
    setSaving(false)
  }

  const loading = loadingScripts || loadingProducts || loadingTabulations

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-6 w-6 text-orange-500" />
            Mapeamento de Tabulacoes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize o roteiro do operador e configure as tabulacoes recomendadas para cada tela
          </p>
        </div>
      </div>

      {/* Product Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-500" />
            Selecionar Produto
          </CardTitle>
          <CardDescription>
            Escolha um produto para visualizar e configurar as telas do roteiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedProductId} onValueChange={handleProductChange}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Selecione um produto..." />
            </SelectTrigger>
            <SelectContent>
              {products
                .filter((p) => p.is_active)
                .map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProductId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Steps List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Telas do Roteiro
              </CardTitle>
              <CardDescription>
                {productScripts.length} tela(s) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-3 space-y-1">
                  {productScripts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma tela encontrada para este produto
                      </p>
                    </div>
                  ) : (
                    productScripts.map((step, index) => {
                      const hasTabs = step.tabulations && step.tabulations.length > 0
                      const isSelected = selectedStepId === step.id

                      return (
                        <button
                          key={step.id}
                          onClick={() => handleStepSelect(step)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-all",
                            "hover:bg-muted/50 hover:border-orange-500/50",
                            isSelected
                              ? "bg-orange-500/10 border-orange-500 ring-1 ring-orange-500/30"
                              : "bg-card border-border"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {index + 1}
                                </span>
                                <span className="text-sm font-medium text-foreground truncate">
                                  {step.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {hasTabs ? (
                                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {step.tabulations?.length} tab(s)
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Sem tabulacoes
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform",
                                isSelected && "rotate-90 text-orange-500"
                              )}
                            />
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Step Preview & Tabulation Mapping */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tags className="h-4 w-4 text-purple-500" />
                    {selectedStep ? selectedStep.title : "Configurar Tabulacoes"}
                  </CardTitle>
                  <CardDescription>
                    {selectedStep
                      ? "Selecione as tabulacoes recomendadas para esta tela"
                      : "Selecione uma tela para configurar"}
                  </CardDescription>
                </div>
                {selectedStep && hasChanges && (
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    size="sm"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedStep ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Selecione uma tela do roteiro para configurar as tabulacoes recomendadas
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Step Content Preview */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Pre-visualizacao do Conteudo
                    </h4>
                    <div className="text-sm text-foreground prose prose-sm max-w-none dark:prose-invert">
                      <SafeHtml html={selectedStep.content || "Sem conteudo"} />
                    </div>
                    {selectedStep.buttons && selectedStep.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                        {selectedStep.buttons.map((btn: any, idx: number) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {btn.label || btn.text || `Botao ${idx + 1}`}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tabulations Selection */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <Tags className="h-4 w-4 text-orange-500" />
                      Tabulacoes Recomendadas
                    </h4>
                    {activeTabulations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhuma tabulacao cadastrada. Cadastre tabulacoes na aba
                        &quot;Tabulacoes&quot;.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeTabulations.map((tab) => {
                          const isChecked = selectedTabulations.includes(tab.id)
                          return (
                            <label
                              key={tab.id}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                "hover:bg-muted/50",
                                isChecked
                                  ? "bg-orange-500/10 border-orange-500/50"
                                  : "bg-card border-border"
                              )}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleTabulationToggle(tab.id)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: tab.color || "#3b82f6" }}
                                  />
                                  <span className="text-sm font-medium text-foreground">
                                    {tab.name}
                                  </span>
                                </div>
                                {tab.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {tab.description}
                                  </p>
                                )}
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Current Tabulations Summary */}
                  {selectedTabulations.length > 0 && (
                    <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                      <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Tabulacoes Selecionadas ({selectedTabulations.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTabulations.map((tabId) => {
                          const tab = tabulations.find((t) => t.id === tabId)
                          if (!tab) return null
                          return (
                            <Badge
                              key={tabId}
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: tab.color,
                                backgroundColor: `${tab.color}20`,
                              }}
                            >
                              {tab.name}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State when no product selected */}
      {!selectedProductId && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Mapeamento de Tabulacoes
              </h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Selecione um produto acima para visualizar todas as telas do roteiro e configurar
                quais tabulacoes devem ser recomendadas para o operador em cada etapa do atendimento.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
