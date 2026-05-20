"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useCachedChannels } from "@/hooks/use-cached-data"
import { Search, X, Phone, ExternalLink } from "lucide-react"

interface OperatorChannelsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ChannelData {
  id: string
  name: string
  description?: string
  contact?: string
}

export const OperatorChannelsModal = memo(function OperatorChannelsModal({
  open,
  onOpenChange,
}: OperatorChannelsModalProps) {
  const [search, setSearch] = useState("")

  const { channels: channelsRaw } = useCachedChannels()

  const channels = useMemo<ChannelData[]>(() => 
    channelsRaw
      .filter((c: any) => c.is_active !== false)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || "",
        contact: c.icon || "",
      }))
  , [channelsRaw])

  const filteredChannels = useMemo(() => {
    if (!search.trim()) return channels
    const query = search.toLowerCase()
    return channels.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.contact?.toLowerCase().includes(query)
    )
  }, [channels, search])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setSearch("")
  }, [onOpenChange])

  // Divide channels into two columns
  const midPoint = Math.ceil(filteredChannels.length / 2)
  const leftColumn = filteredChannels.slice(0, midPoint)
  const rightColumn = filteredChannels.slice(midPoint)

  // Helper to check if contact is a URL
  const isUrl = (text: string) => {
    return text.startsWith("http://") || text.startsWith("https://") || text.startsWith("www.")
  }

  // Helper to format contact display
  const formatContact = (contact: string) => {
    if (!contact) return null
    
    const lines = contact.split("\n").filter(line => line.trim())
    return lines.map((line, idx) => {
      const trimmedLine = line.trim()
      const isLink = isUrl(trimmedLine)
      
      return (
        <div key={idx} className="flex items-start gap-2">
          {isLink ? (
            <a 
              href={trimmedLine.startsWith("http") ? trimmedLine : `https://${trimmedLine}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-orange-600 hover:text-orange-700 hover:underline break-all flex items-center gap-1"
            >
              {trimmedLine}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          ) : (
            <span className="text-sm text-foreground font-medium">{trimmedLine}</span>
          )}
        </div>
      )
    })
  }

  // Render a single channel card
  const ChannelCard = ({ channel }: { channel: ChannelData }) => (
    <div className="mb-6">
      <h3 className="text-base font-bold text-orange-600 mb-2 border-b border-orange-200 pb-1">
        {channel.name}
      </h3>
      
      {channel.contact && (
        <div className="space-y-1 mb-2">
          {formatContact(channel.contact)}
        </div>
      )}
      
      {channel.description && (
        <div className="space-y-1">
          {channel.description.split("\n").filter(line => line.trim()).map((line, idx) => (
            <p key={idx} className="text-sm text-muted-foreground leading-relaxed">
              {line.trim()}
            </p>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col border-border bg-card overflow-hidden [&>button]:z-50">
        {/* Header com gradiente laranja */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
              <Phone className="h-5 w-5 flex-shrink-0" />
              Canais de Atendimento
            </DialogTitle>
          </DialogHeader>
          
          {/* Busca */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
            <Input
              placeholder="Buscar canal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/60 h-9 text-sm focus:bg-white/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Contador */}
        <div className="px-4 py-2 bg-orange-50 dark:bg-orange-500/10 border-b border-orange-200 dark:border-orange-500/20 text-xs text-orange-700 dark:text-orange-400 flex-shrink-0 flex items-center justify-between">
          <span>
            {filteredChannels.length === channels.length 
              ? `${channels.length} canais disponiveis`
              : `${filteredChannels.length} de ${channels.length} canais`
            }
          </span>
          <Badge className="text-xs bg-orange-500 hover:bg-orange-600 text-white">
            {channels.length}
          </Badge>
        </div>
        
        {/* Conteudo com duas colunas */}
        <ScrollArea className="flex-1 min-h-0">
          {filteredChannels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Phone className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>Nenhum canal encontrado</p>
              {search && (
                <p className="text-xs mt-1">Tente buscar por outro termo</p>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {/* Coluna Esquerda */}
                <div className="space-y-0">
                  {leftColumn.map((channel) => (
                    <ChannelCard key={channel.id} channel={channel} />
                  ))}
                </div>
                
                {/* Coluna Direita */}
                <div className="space-y-0 md:border-l md:border-border md:pl-8">
                  {rightColumn.map((channel) => (
                    <ChannelCard key={channel.id} channel={channel} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
})
