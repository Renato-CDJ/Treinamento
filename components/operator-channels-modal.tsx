"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useCachedChannels } from "@/hooks/use-cached-data"
import { Search, Phone, Info, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface OperatorChannelsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ChannelData {
  id: string
  name: string
  description?: string
}

export const OperatorChannelsModal = memo(function OperatorChannelsModal({
  open,
  onOpenChange,
}: OperatorChannelsModalProps) {
  const [search, setSearch] = useState("")

  // State para modal de detalhes
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null)

  const { channels: channelsRaw } = useCachedChannels()

  const channels = useMemo<ChannelData[]>(() => 
    channelsRaw
      .filter((c: any) => c.is_active !== false)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || "",
      }))
  , [channelsRaw])

  const filteredChannels = useMemo(() => {
    if (!search.trim()) return channels
    const query = search.toLowerCase()
    return channels.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    )
  }, [channels, search])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setSearch("")
    setSelectedChannel(null)
  }, [onOpenChange])

  // Divide channels into two columns
  const midPoint = Math.ceil(filteredChannels.length / 2)
  const leftColumn = filteredChannels.slice(0, midPoint)
  const rightColumn = filteredChannels.slice(midPoint)

  // Render a single channel card - Design elegante
  const ChannelCard = ({ channel }: { channel: ChannelData }) => (
    <button
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all duration-200 group",
        "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400",
        "bg-gradient-to-br from-cyan-50/80 to-teal-50/50 dark:from-cyan-950/20 dark:to-teal-950/10",
        "border-cyan-200/60 dark:border-cyan-800/40 hover:border-cyan-300 dark:hover:border-cyan-700"
      )}
      onClick={() => setSelectedChannel(channel)}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 transition-transform group-hover:scale-110">
          <Phone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-foreground/80 transition-colors leading-tight">
            {channel.name}
          </h3>
          
          {channel.description && (
            <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm">
              {channel.description.split("\n")[0]}
            </p>
          )}
        </div>
        <div className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all bg-cyan-100 dark:bg-cyan-900/40">
          <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
        </div>
      </div>
    </button>
  )

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl border-0 shadow-2xl [&>button]:z-50">
        {/* Header elegante */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white overflow-hidden flex-shrink-0">
          {/* Decoracao de fundo */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-4 text-white">
                <div className="p-3 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl shadow-lg">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <span className="block">Canais de Atendimento</span>
                  <span className="text-sm font-normal text-slate-400 mt-1 block">
                    Consulte os canais disponiveis para atendimento
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {/* Barra de busca */}
            <div className="flex items-center gap-3 mt-5">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar canal por nome ou descricao..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-cyan-400/50 focus-visible:border-cyan-400/50 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Contador de resultados */}
        <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Resultados:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 font-semibold text-sm">
              <span>{filteredChannels.length}</span>
              <span className="text-xs opacity-80">canais</span>
            </div>
          </div>
          {search && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearch("")}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              Limpar busca
            </Button>
          )}
        </div>
        
        {/* Conteudo em duas colunas */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 bg-gradient-to-b from-background to-muted/20">
            {filteredChannels.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                  <Phone className="h-8 w-8 text-cyan-500" />
                </div>
                <p className="font-medium text-foreground">Nenhum canal encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search ? "Tente buscar por outro termo" : "Nenhum canal disponivel no momento"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coluna Esquerda */}
                <div className="space-y-3">
                  {leftColumn.map((channel) => (
                    <ChannelCard key={channel.id} channel={channel} />
                  ))}
                </div>
                
                {/* Coluna Direita */}
                <div className="space-y-3">
                  {rightColumn.map((channel) => (
                    <ChannelCard key={channel.id} channel={channel} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>

    {/* Modal de detalhes do canal */}
    {selectedChannel && (
      <Dialog open={!!selectedChannel} onOpenChange={() => setSelectedChannel(null)}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          {/* Header com gradiente */}
          <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-cyan-500 via-teal-500 to-cyan-600">
            {/* Decoracao de fundo */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-30 bg-teal-300" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-20 bg-cyan-300" />
            </div>
            
            <div className="relative">
              {/* Badge de categoria */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm mb-4">
                <Phone className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Canal de Atendimento
                </span>
              </div>
              
              {/* Titulo */}
              <h3 className="text-xl font-bold text-white leading-tight pr-8">
                {selectedChannel.name}
              </h3>
            </div>
          </div>
          
          {/* Conteudo */}
          <div className="px-6 py-6 bg-card">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl flex-shrink-0 bg-cyan-100 dark:bg-cyan-900/30">
                <Info className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Descricao / Orientacoes
                </h4>
                {selectedChannel.description ? (
                  <div className="space-y-2">
                    {selectedChannel.description.split("\n").filter(line => line.trim()).map((line, idx) => (
                      <p key={idx} className="text-foreground leading-relaxed">
                        {line.trim()}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground leading-relaxed">
                    Este canal nao possui descricao detalhada.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-cyan-500" />
              <span>Clique fora para fechar</span>
            </div>
            <Button 
              onClick={() => setSelectedChannel(null)}
              className="px-6 rounded-xl font-semibold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  )
})
