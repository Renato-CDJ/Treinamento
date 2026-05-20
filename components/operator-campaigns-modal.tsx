"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Megaphone, Search, ChevronDown, ChevronUp, X, Loader2 } from "lucide-react"
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
      <DialogContent className="w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-white/20">
              <Megaphone className="h-5 w-5" />
            </div>
            Campanhas Ativas
          </DialogTitle>
        </DialogHeader>

        {/* Busca */}
        <div className="px-6 py-3 border-b bg-muted/30">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, sistema ou complemento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>

        {/* Conteudo */}
        <ScrollArea className="flex-1 max-h-[calc(90vh-180px)]">
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Nenhuma campanha encontrada com essa busca."
                    : "Nenhuma campanha disponivel no momento."}
                </p>
              </div>
            ) : (
              filteredCampaigns.map((campaign) => {
                const isExpanded = expandedCampaign === campaign.id
                return (
                  <Card
                    key={campaign.id}
                    className={cn(
                      "transition-all duration-200 cursor-pointer border-2",
                      isExpanded
                        ? "border-orange-500/50 shadow-lg"
                        : "border-transparent hover:border-orange-500/30"
                    )}
                    onClick={() => toggleExpand(campaign.id)}
                  >
                    <CardHeader className="p-4 pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold flex items-center gap-2 flex-wrap">
                            <Megaphone className="h-4 w-4 text-orange-500 shrink-0" />
                            <span className="truncate">{campaign.name}</span>
                          </CardTitle>
                          {/* Info Cards */}
                          <div className="flex flex-wrap items-stretch gap-2 mt-3">
                            {campaign.delay_range && (
                              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg px-3 py-2">
                                <div className="w-1.5 h-8 rounded-full bg-blue-500" />
                                <div className="flex flex-col">
                                  <span className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">Faixa de atraso</span>
                                  <span className="text-sm font-medium text-foreground">{campaign.delay_range}</span>
                                </div>
                              </div>
                            )}
                            {campaign.complement && (
                              <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-lg px-3 py-2">
                                <div className="w-1.5 h-8 rounded-full bg-purple-500" />
                                <div className="flex flex-col">
                                  <span className="text-[10px] uppercase tracking-wide text-purple-600 dark:text-purple-400 font-semibold">Complemento</span>
                                  <span className="text-sm font-medium text-foreground">{campaign.complement}</span>
                                </div>
                              </div>
                            )}
                            {campaign.system_site && (
                              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg px-3 py-2">
                                <div className="w-1.5 h-8 rounded-full bg-emerald-500" />
                                <div className="flex flex-col">
                                  <span className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">Sistema/Site</span>
                                  <span className="text-sm font-medium font-mono text-foreground">{campaign.system_site}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(campaign.id)
                          }}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="p-4 pt-0 space-y-4">
                        {/* Como funciona */}
                        {campaign.how_it_works && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-orange-500" />
                              Como funciona?
                            </h4>
                            <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3 border">
                              {campaign.how_it_works}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Em caso positivo */}
                          {campaign.positive_case && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                Em caso positivo
                              </h4>
                              <div className="text-sm text-foreground whitespace-pre-wrap bg-green-50 dark:bg-green-500/10 rounded-lg p-3 border border-green-200 dark:border-green-500/30">
                                {campaign.positive_case}
                              </div>
                            </div>
                          )}

                          {/* Em caso negativo */}
                          {campaign.negative_case && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                Em caso negativo
                              </h4>
                              <div className="text-sm text-foreground whitespace-pre-wrap bg-red-50 dark:bg-red-500/10 rounded-lg p-3 border border-red-200 dark:border-red-500/30">
                                {campaign.negative_case}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-muted/30 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {filteredCampaigns.length} campanha(s) disponivel(is)
          </span>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
