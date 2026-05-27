"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, CheckCircle2, Info, CreditCard, Building2, Home, AlertTriangle } from "lucide-react"
import { getMaxPromiseDate, getNextBusinessDay } from "@/lib/business-days"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type ProductType = "cartao" | "comercial" | "habitacional"
type ProductCategory = "habitacional" | "comercial" | "cartao" | "outros" | "boleto_pre_formatado"

interface PromiseCalendarInlineProps {
  productCategory?: ProductCategory
}

export function PromiseCalendarInline({ productCategory }: PromiseCalendarInlineProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductType | "">("")
  const [selectedDate, setSelectedDate] = useState<Date>()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  useEffect(() => {
    if (productCategory === "comercial") {
      setSelectedProduct("comercial")
      setSelectedDate(undefined)
    } else if (productCategory === "habitacional") {
      setSelectedProduct("habitacional")
      setSelectedDate(undefined)
    } else if (productCategory === "cartao") {
      setSelectedProduct("cartao")
      setSelectedDate(undefined)
    } else if (productCategory === "outros") {
      setSelectedProduct("")
      setSelectedDate(undefined)
    }
  }, [productCategory])

  const handleProductSelect = (value: ProductType) => {
    if (!productCategory || productCategory === "outros") {
      setSelectedProduct(value)
      setSelectedDate(undefined)
    }
  }

  const maxDate = selectedProduct ? getMaxPromiseDate(selectedProduct) : undefined

  const isDateInRange = (date: Date) => {
    if (!selectedProduct) return false

    const dateTime = new Date(date)
    dateTime.setHours(0, 0, 0, 0)
    const todayTime = new Date(today)
    todayTime.setHours(0, 0, 0, 0)

    // Data anterior a hoje não está disponível
    if (dateTime < todayTime) return false

    // Todas as datas dentro do intervalo são mostradas como disponíveis
    // (incluindo sábados, domingos e feriados para melhor visualização)
    if (maxDate) {
      const maxDateTime = new Date(maxDate)
      maxDateTime.setHours(0, 0, 0, 0)
      if (dateTime > maxDateTime) return false
    }

    return true
  }

  // Função para ajustar data quando cliente quer pagar no sábado
  // Move automaticamente para o próximo dia útil
  const adjustDateIfSaturday = (date: Date): Date => {
    if (isSaturday(date)) {
      return getNextBusinessDay(date)
    }
    return date
  }

  const productOptions = [
    {
      value: "cartao" as ProductType,
      name: "Cartao",
      deadline: "D+6 (6 dias corridos)",
      icon: CreditCard,
    },
    {
      value: "comercial" as ProductType,
      name: "Comercial",
      deadline: "D+9 (9 dias corridos)",
      icon: Building2,
    },
    {
      value: "habitacional" as ProductType,
      name: "Habitacional",
      deadline: "D+9 (9 dias corridos)",
      icon: Home,
    },
  ]

  if (productCategory === "boleto_pre_formatado") {
    return (
      <Card className="border border-border bg-card">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <div className="p-1 rounded-md bg-orange-500/20">
              <CalendarIcon className="h-3.5 w-3.5 text-orange-500" />
            </div>
            Calendario de Promessas
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-2 bg-muted rounded-lg border border-dashed border-border">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <p className="text-xs font-medium text-muted-foreground">
              De acordo com a data do boleto, nao pode ser alterado em hipotese alguma.
            </p>
            <span className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground border border-border">
              Boleto Pre-Formatado
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (productCategory === "outros") {
    return (
      <Card className="border border-border bg-card">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <div className="p-1 rounded-md bg-orange-500/20">
              <CalendarIcon className="h-3.5 w-3.5 text-orange-500" />
            </div>
            Calendario de Promessas
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-2 bg-muted rounded-lg border border-dashed border-border">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <p className="text-xs font-medium text-muted-foreground">
              O produto selecionado nao possui datas de promessa disponiveis.
            </p>
            <span className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground border border-border">
              Outros
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
          <div className="p-1 rounded-md bg-orange-500/20">
            <CalendarIcon className="h-3.5 w-3.5 text-orange-500" />
          </div>
          Calendario de Promessas
          {productCategory !== undefined && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400 cursor-default ml-auto">
                    <Info className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs bg-popover border-border text-popover-foreground">
                  Tipo selecionado automaticamente:{" "}
                  {productCategory === "comercial"
                    ? "Comercial"
                    : productCategory === "habitacional"
                      ? "Habitacional"
                      : "Cartao"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        {!productCategory && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Selecione o tipo de produto e escolha uma data disponivel
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3 px-3 pb-3">
        {!productCategory && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-orange-500" />
              Tipo de Produto
            </label>
            <TooltipProvider delayDuration={200}>
              <div className="flex gap-2 justify-center">
                {productOptions.map((product) => {
                  const Icon = product.icon
                  const isSelected = selectedProduct === product.value
                  return (
                    <Tooltip key={product.value}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleProductSelect(product.value)}
                          className={`flex-1 p-3 rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
                            isSelected
                              ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                              : "bg-secondary hover:bg-muted text-foreground border border-border hover:border-orange-500/50"
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${isSelected ? "text-white" : "text-muted-foreground"}`} />
                          <p className={`font-bold text-[10px] text-center leading-tight`}>
                            {product.name}
                          </p>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-orange-500 text-white border-orange-600">
                        <p className="text-xs font-bold">Prazo: {product.deadline}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </TooltipProvider>
          </div>
        )}

        {!selectedProduct ? (
          <div className="space-y-3">
            {/* Current Date Calendar */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-secondary rounded-md">
                <CalendarIcon className="h-3 w-3 text-orange-500" />
                <p className="text-[10px] font-bold text-foreground uppercase tracking-wide">Data Atual</p>
              </div>
              <div className="flex justify-center bg-muted rounded-lg border border-border p-2">
                <Calendar
                  mode="single"
                  selected={today}
                  disabled={(date) => date.getTime() !== today.getTime()}
                  className="mx-auto !bg-transparent"
                  classNames={{
                    day_today: "bg-orange-500 text-white font-bold",
                    months: "flex flex-col",
                    month: "space-y-2",
                    caption: "flex justify-center pt-1 relative items-center text-foreground",
                    caption_label: "text-xs font-bold",
                    nav: "space-x-1 flex items-center",
                    nav_button:
                      "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-muted rounded-md transition-colors text-foreground",
                    table: "w-full border-collapse",
                    head_cell: "text-muted-foreground rounded-md w-8 font-bold text-[10px]",
                    cell: "h-8 w-8 text-center text-xs p-0 relative",
                    day: "h-8 w-8 p-0 font-medium text-xs text-muted-foreground hover:bg-muted rounded-md transition-colors",
                  }}
                />
              </div>
            </div>

            {/* Info Message */}
            <div className="flex items-start gap-2 p-3 bg-secondary rounded-lg border border-border">
              <Info className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Selecione um tipo de produto acima para visualizar as datas disponiveis
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Available Dates Calendar */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 rounded-md">
                <CalendarIcon className="h-3 w-3 text-emerald-400" />
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Datas Disponiveis</p>
              </div>
              <div className="flex justify-center bg-muted rounded-lg border border-border p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => !isDateInRange(date)}
                  className="mx-auto !bg-transparent"
                  modifiers={{
                    available: (date) => isDateInRange(date) && date.getTime() !== today.getTime(),
                  }}
                  modifiersClassNames={{
                    available:
                      "bg-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/30 border border-emerald-500/50",
                  }}
                  classNames={{
                    day_today: "bg-orange-500 text-white font-bold",
                    day_selected:
                      "bg-emerald-500 text-white font-bold hover:bg-emerald-600",
                    day_disabled: "text-muted-foreground opacity-30 line-through cursor-not-allowed",
                    months: "flex flex-col",
                    month: "space-y-2",
                    caption: "flex justify-center pt-1 relative items-center text-foreground",
                    caption_label: "text-xs font-bold",
                    nav: "space-x-1 flex items-center",
                    nav_button:
                      "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-muted rounded-md transition-colors text-foreground",
                    table: "w-full border-collapse",
                    head_cell: "text-muted-foreground rounded-md w-8 font-bold text-[10px]",
                    cell: "h-8 w-8 text-center text-xs p-0 relative",
                    day: "h-8 w-8 p-0 font-medium text-xs text-muted-foreground hover:bg-muted rounded-md transition-colors",
                  }}
                />
              </div>
            </div>

            {/* Selected Date Display */}
            {selectedDate && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Data Selecionada</p>
                  <p className="text-xs font-bold text-foreground">
                    {selectedDate.toLocaleDateString("pt-BR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}


          </div>
        )}
      </CardContent>
    </Card>
  )
}
