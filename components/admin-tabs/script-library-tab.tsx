"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Library,
  Search,
  Loader2,
  Upload,
  Check,
  FileJson,
  Package,
  ChevronDown,
  ChevronRight,
  Eye,
  Info,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAutoLoadScripts, AUTO_LOAD_SCRIPTS } from "@/lib/auto-load-scripts"
import { useProducts, importScriptsFromJson } from "@/hooks/use-supabase-admin"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ScriptInfo {
  name: string
  productId: string
  stepsCount: number
  data: any
}

export function ScriptLibraryTab() {
  const { data: products, loading: productsLoading } = useProducts()
  const [searchQuery, setSearchQuery] = useState("")
  const [importing, setImporting] = useState<string | null>(null)
  const [expandedScript, setExpandedScript] = useState<string | null>(null)
  const [previewScript, setPreviewScript] = useState<ScriptInfo | null>(null)
  const { toast } = useToast()

  // Parse scripts from auto-load
  const availableScripts: ScriptInfo[] = useMemo(() => {
    const scripts: ScriptInfo[] = []
    
    AUTO_LOAD_SCRIPTS.forEach((scriptData: any) => {
      if (scriptData.marcas) {
        Object.entries(scriptData.marcas).forEach(([productName, steps]: [string, any]) => {
          const stepsCount = Object.keys(steps).length
          const productId = `prod-${productName.toLowerCase().replace(/\s+/g, "-")}`
          
          scripts.push({
            name: productName,
            productId,
            stepsCount,
            data: { marcas: { [productName]: steps } },
          })
        })
      }
    })
    
    return scripts
  }, [])

  const filteredScripts = useMemo(() => {
    if (!searchQuery) return availableScripts
    const query = searchQuery.toLowerCase()
    return availableScripts.filter((s) =>
      s.name.toLowerCase().includes(query)
    )
  }, [availableScripts, searchQuery])

  const isImported = (productId: string): boolean => {
    return products.some((p) => p.id === productId)
  }

  const getImportedProduct = (productId: string) => {
    return products.find((p) => p.id === productId)
  }

  const handleImport = async (script: ScriptInfo) => {
    setImporting(script.productId)
    
    try {
      const result = await importScriptsFromJson(script.data)

      if (result.stepCount > 0) {
        toast({
          title: "Script importado com sucesso!",
          description: `${result.productCount} produto(s) e ${result.stepCount} tela(s) de "${script.name}" foram importados.`,
        })
      } else {
        throw new Error("Nenhuma tela foi importada")
      }
    } catch (error: any) {
      toast({
        title: "Erro ao importar",
        description: error?.message || `Nao foi possivel importar o script "${script.name}".`,
        variant: "destructive",
      })
    } finally {
      setImporting(null)
    }
  }

  const handleImportAll = async () => {
    const scriptsToImport = availableScripts.filter((s) => !isImported(s.productId))
    
    if (scriptsToImport.length === 0) {
      toast({
        title: "Nada para importar",
        description: "Todos os scripts ja foram importados.",
      })
      return
    }

    setImporting("all")
    let totalProducts = 0
    let totalSteps = 0
    let errors = 0

    for (const script of scriptsToImport) {
      try {
        const result = await importScriptsFromJson(script.data)
        totalProducts += result.productCount
        totalSteps += result.stepCount
      } catch (error) {
        errors++
      }
    }

    if (totalSteps > 0) {
      toast({
        title: "Importacao concluida!",
        description: `${totalProducts} produto(s) e ${totalSteps} tela(s) foram importados.${errors > 0 ? ` ${errors} erro(s) encontrado(s).` : ""}`,
      })
    } else {
      toast({
        title: "Erro na importacao",
        description: "Nenhum script foi importado.",
        variant: "destructive",
      })
    }

    setImporting(null)
  }

  const toggleExpand = (scriptId: string) => {
    setExpandedScript(expandedScript === scriptId ? null : scriptId)
  }

  const getScriptSteps = (script: ScriptInfo): { id: string; title: string }[] => {
    const steps: { id: string; title: string }[] = []
    if (script.data.marcas) {
      const productSteps = script.data.marcas[script.name]
      if (productSteps) {
        Object.entries(productSteps).forEach(([stepId, stepData]: [string, any]) => {
          steps.push({
            id: stepId,
            title: stepData.title || stepId,
          })
        })
      }
    }
    return steps
  }

  const importedCount = availableScripts.filter((s) => isImported(s.productId)).length
  const pendingCount = availableScripts.length - importedCount

  if (productsLoading) {
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
            <Library className="h-6 w-6 text-orange-500" />
            Biblioteca de Roteiros
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize e importe os roteiros disponiveis no codigo (pasta data/scripts)
          </p>
        </div>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white"
          onClick={handleImportAll}
          disabled={importing !== null || pendingCount === 0}
        >
          {importing === "all" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          Importar Todos ({pendingCount})
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Scripts carregados de data/scripts
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Os roteiros listados abaixo estao disponiveis nos arquivos JSON da pasta{" "}
                <code className="bg-muted px-1 rounded">data/scripts</code>. Importe-os para
                disponibiliza-los na aba &quot;Produtos&quot; e permitir configuracao pelo painel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total na Biblioteca</p>
                <p className="text-2xl font-bold text-foreground">{availableScripts.length}</p>
              </div>
              <FileJson className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ja Importados</p>
                <p className="text-2xl font-bold text-green-500">{importedCount}</p>
              </div>
              <Check className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
              </div>
              <Package className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar roteiro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Scripts List */}
      <Card>
        <CardContent className="pt-6">
          {filteredScripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <Library className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                {availableScripts.length === 0
                  ? "Nenhum roteiro encontrado na pasta data/scripts"
                  : "Nenhum resultado para a pesquisa"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredScripts.map((script) => {
                const imported = isImported(script.productId)
                const isExpanded = expandedScript === script.productId
                const steps = getScriptSteps(script)

                return (
                  <div
                    key={script.productId}
                    className={`rounded-lg border transition-colors ${
                      imported
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-border hover:border-orange-500/30"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleExpand(script.productId)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <div className="p-2 bg-orange-500/10 rounded-lg">
                            <FileJson className="h-5 w-5 text-orange-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{script.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {script.stepsCount} tela(s) disponivel(is)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {imported ? (
                            <Badge
                              variant="outline"
                              className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Importado
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                              onClick={() => handleImport(script)}
                              disabled={importing !== null}
                            >
                              {importing === script.productId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-1" />
                                  Importar
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewScript(script)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded steps list */}
                    {isExpanded && steps.length > 0 && (
                      <div className="border-t border-border/50 px-4 py-3 bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Telas do Roteiro:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {steps.map((step, idx) => (
                            <div
                              key={step.id}
                              className="text-xs bg-background px-2 py-1.5 rounded border border-border"
                            >
                              <span className="text-muted-foreground">{idx + 1}.</span>{" "}
                              <span className="text-foreground">{step.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewScript} onOpenChange={() => setPreviewScript(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-orange-500" />
              {previewScript?.name}
            </DialogTitle>
            <DialogDescription>
              Visualizacao do conteudo do arquivo JSON
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] rounded-md border bg-muted/30 p-4">
            <pre className="text-xs text-foreground whitespace-pre-wrap">
              {previewScript ? JSON.stringify(previewScript.data, null, 2) : ""}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
