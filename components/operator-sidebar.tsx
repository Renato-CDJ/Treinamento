"use client"

import type React from "react"
import { useState, useMemo, useCallback, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, CalendarIcon, Maximize2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PromiseCalendarInline } from "@/components/promise-calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ScriptStep } from "@/lib/types"

interface OperatorSidebarProps {
  isOpen: boolean
  productCategory?: "habitacional" | "comercial" | "cartao" | "outros"
  currentStep?: ScriptStep | null
}

// Tipo para item generico
interface ListItemData {
  id: string
  name: string
  description?: string
  color?: string
  contact?: string
}

// Modal de detalhe
const DetailModal = memo(function DetailModal({
  open,
  onClose,
  title,
  description,
  icon,
  color,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: React.ReactNode
  color?: string
}) {
  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border border-border bg-card">
        {/* Header com gradiente laranja */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
          <DialogHeader>
            <DialogTitle className="text-white text-base font-bold flex items-center justify-center gap-2 text-center">
              {color && (
                <div 
                  className="w-3 h-3 rounded-full ring-2 ring-white/30 flex-shrink-0" 
                  style={{ backgroundColor: color }} 
                />
              )}
              {icon}
              <span className="truncate">{title}</span>
            </DialogTitle>
          </DialogHeader>
        </div>
        
        {/* Conteudo */}
        <div className="p-4">
          {description ? (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center">
              Sem descricao disponivel
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
})

// Componente de tabulacao recomendada
const RecommendedTabulation = memo(function RecommendedTabulation({
  currentStep,
  onExpand,
}: {
  currentStep?: ScriptStep | null
  onExpand: (tab: { name: string; description: string }) => void
}) {
  if (!currentStep?.tabulations?.length) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center bg-muted/30">
        <CheckCircle2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">
          Nenhuma tabulacao recomendada para esta tela
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {currentStep.tabulations.map((tabulation, index) => (
        <button
          key={tabulation.id || index}
          onClick={() => onExpand({ name: tabulation.name, description: tabulation.description })}
          className="w-full text-left p-3 rounded-lg border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 transition-colors group"
        >
          <div className="flex items-start gap-2">
            <div className="p-1 rounded-md bg-orange-500/20 flex-shrink-0 mt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground line-clamp-1">
                {tabulation.name}
              </h4>
              {tabulation.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {tabulation.description}
                </p>
              )}
            </div>
            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        </button>
      ))}
    </div>
  )
})

export const OperatorSidebar = memo(function OperatorSidebar({ 
  isOpen, 
  productCategory, 
  currentStep 
}: OperatorSidebarProps) {
  const [activeSection, setActiveSection] = useState<"calendar" | "checkTabulation">("calendar")
  
  // Estado para modais - apenas um ativo por vez
  const [modalState, setModalState] = useState<{
    type: "detail" | null
    item?: ListItemData | null
    title?: string
  }>({ type: null })

  // Estado de selecao
  const [selectedIds, setSelectedIds] = useState({
    tabulation: "",
  })





  const handleCloseModal = useCallback(() => {
    setModalState({ type: null })
  }, [])

  const handleExpandTabulation = useCallback((tab: { name: string; description: string }) => {
    setModalState({
      type: "detail",
      item: { id: "recommended", name: tab.name, description: tab.description },
      title: tab.name,
    })
  }, [])

  if (!isOpen) return null

  return (
    <aside className="w-full md:w-[300px] lg:w-[340px] max-w-full border-l border-border bg-sidebar flex flex-col h-full shrink-0">
      {/* Tabs estilizadas */}
      <div className="border-b border-border p-2 flex gap-2 bg-sidebar">
        {[
          { id: "calendar" as const, icon: CalendarIcon, label: "Calendario" },
          { id: "checkTabulation" as const, icon: CheckCircle2, label: "Tabulacao", badge: currentStep?.tabulations?.length },
        ].map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeSection === id
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
            {badge && badge > 0 && activeSection !== id && (
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Conteudo */}
      <ScrollArea className="flex-1 min-h-0 bg-sidebar">
        <div className="p-3">
          {activeSection === "calendar" && (
            <div className="space-y-4">
              <PromiseCalendarInline productCategory={productCategory} />
              
              {/* Tabulacao recomendada inline */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1 rounded-md bg-orange-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Tabulacao Recomendada
                  </span>
                </div>
                <RecommendedTabulation 
                  currentStep={currentStep} 
                  onExpand={handleExpandTabulation}
                />
              </div>
            </div>
          )}

          {activeSection === "checkTabulation" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-md bg-orange-500/20">
                  <CheckCircle2 className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Tabulacao Recomendada</h3>
                  <p className="text-[10px] text-muted-foreground">De acordo com a sua tela atual</p>
                </div>
              </div>
              <RecommendedTabulation 
                currentStep={currentStep} 
                onExpand={handleExpandTabulation}
              />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Modal de detalhe */}
      <DetailModal
        open={modalState.type === "detail"}
        onClose={handleCloseModal}
        title={modalState.item?.name || ""}
        description={modalState.item?.description || modalState.item?.contact}
        color={modalState.item?.color}
      />


    </aside>
  )
})
