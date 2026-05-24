"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Megaphone, Search, ChevronDown, ChevronUp, Loader2, Info, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Campaign {
  id: string
  name: string
  how_it_works: string
  positive_case: string
  negative_case: string
  delay_range: string
  complement: string
  system_site: string
  is_active: boolean
}

interface OperatorCampaignsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OperatorCampaignsModal({ isOpen, onClose }: OperatorCampaignsModalProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async () => {
    if (!isOpen) return
    
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (!error && data) {
      setCampaigns(data)
    }
    setLoading(false)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      fetchCampaigns()
    }
  }, [isOpen, fetchCampaigns])

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      campaign.name?.toLowerCase().includes(query) ||
      campaign.system_site?.toLowerCase().includes(query) ||
      campaign.complement?.toLowerCase().includes(query) ||
      campaign.delay_range?.toLowerCase().includes(query)
    )
  })

  const toggleExpand = (id: string) => {
    setExpandedCampaign((prev) => (prev === id ? null : id))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl border-0 shadow-2xl [&>button]:z-50">
        {/* Header elegante */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white overflow-hidden flex-shrink-0">
          {/* Decoracao de fundo */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-4 text-white">
                <div className="p-3 bg-gradient-to-br from-purple-400 to-fuchsia-500 rounded-xl shadow-lg">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <span className="block">Campanhas Ativas</span>
                  <span className="text-sm font-normal text-slate-400 mt-1 block">
                    Consulte as campanhas disponiveis e suas orientacoes
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {/* Barra de busca */}
            <div className="flex items-center gap-3 mt-5">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar campanha por nome, sistema ou complemento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-purple-400/50 focus-visible:border-purple-400/50 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Resultados:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-semibold text-sm">
              <span>{filteredCampaigns.length}</span>
              <span className="text-xs opacity-80">campanhas</span>
            </div>
          </div>
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearchQuery("")}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              Limpar busca
            </Button>
          )}
        </div>

        {/* Conteudo */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 bg-gradient-to-b from-background to-muted/20 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-4" />
                <p className="text-muted-foreground">Carregando campanhas...</p>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Megaphone className="h-8 w-8 text-purple-500" />
                </div>
                <p className="font-medium text-foreground">Nenhuma campanha encontrada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Tente buscar por outro termo" : "Nenhuma campanha disponivel no momento"}
                </p>
              </div>
            ) : (
              filteredCampaigns.map((campaign) => {
                const isExpanded = expandedCampaign === campaign.id
                return (
                  <button
                    key={campaign.id}
                    className={cn(
                      "w-full text-left rounded-xl border transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400",
                      isExpanded
                        ? "bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/20 border-purple-300 dark:border-purple-700 shadow-lg"
                        : "bg-gradient-to-br from-purple-50/80 to-fuchsia-50/50 dark:from-purple-950/20 dark:to-fuchsia-950/10 border-purple-200/60 dark:border-purple-800/40 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md"
                    )}
                    onClick={() => toggleExpand(campaign.id)}
                  >
                    {/* Header do card */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={cn(
                            "p-2 rounded-lg transition-transform",
                            isExpanded ? "bg-purple-500 text-white scale-110" : "bg-purple-100 dark:bg-purple-900/40"
                          )}>
                            <Megaphone className={cn(
                              "w-4 h-4",
                              isExpanded ? "text-white" : "text-purple-600 dark:text-purple-400"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground leading-tight">
                              {campaign.name}
                            </h3>
                            
                            {/* Info badges */}
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              {campaign.delay_range && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  {campaign.delay_range}
                                </span>
                              )}
                              {campaign.complement && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                  {campaign.complement}
                                </span>
                              )}
                              {campaign.system_site && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-mono">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {campaign.system_site}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={cn(
                          "p-2 rounded-lg transition-all",
                          isExpanded ? "bg-purple-500 text-white" : "bg-purple-100 dark:bg-purple-900/40"
                        )}>
                          {isExpanded ? (
                            <ChevronUp className={cn("h-4 w-4", isExpanded ? "text-white" : "text-purple-600 dark:text-purple-400")} />
                          ) : (
                            <ChevronDown className={cn("h-4 w-4", isExpanded ? "text-white" : "text-purple-600 dark:text-purple-400")} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Conteudo expandido */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                        {/* Como funciona */}
                        {campaign.how_it_works && (
                          <div className="rounded-xl bg-card border p-4">
                            <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2 mb-2">
                              <Info className="w-4 h-4" />
                              Como funciona?
                            </h4>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                              {campaign.how_it_works}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Em caso positivo */}
                          {campaign.positive_case && (
                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4">
                              <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Em caso positivo
                              </h4>
                              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                {campaign.positive_case}
                              </p>
                            </div>
                          )}

                          {/* Em caso negativo */}
                          {campaign.negative_case && (
                            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
                              <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
                                <span className="w-4 h-4 rounded-full border-2 border-red-500 flex items-center justify-center text-xs">!</span>
                                Em caso negativo
                              </h4>
                              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                {campaign.negative_case}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gradient-to-r from-muted/50 to-muted/30 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-500 shadow-sm" />
            <span className="font-medium">Clique em uma campanha para ver detalhes</span>
          </div>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="rounded-xl"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
