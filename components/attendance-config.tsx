"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCachedProducts } from "@/hooks/use-cached-data"
import { getAttendanceTypes, getPersonTypes } from "@/lib/store"
import type { AttendanceConfig as AttendanceConfigType } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Phone, PhoneIncoming, User, Building2, Package, Play, RotateCcw, Check, ChevronRight } from "lucide-react"

interface AttendanceConfigProps {
  onStart: (config: AttendanceConfigType) => void
}

const getAttendanceIcon = (value: string) => {
  switch (value) {
    case "ativo":
      return Phone
    case "receptivo":
      return PhoneIncoming
    default:
      return Phone
  }
}

const getPersonIcon = (value: string) => {
  switch (value) {
    case "fisica":
      return User
    case "juridica":
      return Building2
    default:
      return User
  }
}

export function AttendanceConfig({ onStart }: AttendanceConfigProps) {
  const { products: productsData } = useCachedProducts()
  const [attendanceType, setAttendanceType] = useState<string | null>(null)
  const [personType, setPersonType] = useState<string | null>(null)
  const [product, setProduct] = useState<string>("")

  // Map products from Supabase to component format
  const products = useMemo(() => {
    return productsData
      .filter((p: any) => p.is_active)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        isActive: p.is_active,
        description: p.details?.description || "",
        attendanceTypes: p.details?.attendanceTypes || [],
        personTypes: p.details?.personTypes || [],
        scriptId: p.details?.scriptId || "",
      }))
  }, [productsData])

  // These are still from localStorage for now (UI config)
  const attendanceTypes = getAttendanceTypes()
  const personTypes = getPersonTypes()

  const isReceptivo = attendanceType === "receptivo"

  const filteredProducts = products.filter((p) => {
    if (!attendanceType) return false
    const matchesAttendance = p.attendanceTypes?.includes(attendanceType as any) ?? false
    // Para receptivo, não filtra por tipo de pessoa
    if (isReceptivo) return matchesAttendance
    if (!personType) return false
    const matchesPerson = p.personTypes?.includes(personType as any) ?? false
    return matchesAttendance && matchesPerson
  })

  const canSelectProduct = isReceptivo ? attendanceType !== null : attendanceType !== null && personType !== null

  const handleStart = () => {
    if (!attendanceType || !product) {
      alert("Por favor, complete todas as seleções antes de iniciar")
      return
    }
    if (!isReceptivo && !personType) {
      alert("Por favor, selecione o tipo de pessoa")
      return
    }

    onStart({
      attendanceType: attendanceType as any,
      personType: isReceptivo ? ("fisica" as any) : (personType as any),
      product,
    })
  }

  const handleReset = () => {
    setAttendanceType(null)
    setPersonType(null)
    setProduct("")
  }

  // Calculate progress steps
  const currentStep = !attendanceType ? 1 : (!isReceptivo && !personType) ? 2 : !product ? 3 : 4
  const totalSteps = isReceptivo ? 2 : 3

  return (
    <div className="max-w-3xl mx-auto px-4 max-h-[calc(100vh-12rem)] flex flex-col">
      <TooltipProvider>
        {/* Progress Indicator - mais compacto */}
        <div className="flex items-center justify-center gap-1.5 mb-4 shrink-0">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNum = i + 1
            const isCompleted = currentStep > stepNum
            const isActive = currentStep === stepNum
            return (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300
                    ${isCompleted 
                      ? "bg-primary text-primary-foreground" 
                      : isActive 
                        ? "bg-primary/20 text-primary border-2 border-primary" 
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
                </div>
                {i < totalSteps - 1 && (
                  <ChevronRight className={`w-4 h-4 ${isCompleted ? "text-primary" : "text-muted-foreground/50"}`} />
                )}
              </div>
            )
          })}
        </div>

        <Card className="relative border border-border/50 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden flex-1 min-h-0">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
          
          <CardContent className="relative z-10 p-4 md:p-6 space-y-5 overflow-y-auto max-h-full">
            {/* Tipo de atendimento */}
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  Tipo de Atendimento
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                {attendanceTypes.map((type) => {
                  const Icon = getAttendanceIcon(type.value)
                  const isSelected = attendanceType === type.value
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setAttendanceType(type.value)
                        setPersonType(null)
                        setProduct("")
                      }}
                      className={`
                        group relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                        ${isSelected
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                          : "bg-secondary/50 hover:bg-secondary text-foreground border border-border hover:border-primary/50"
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{type.label}</span>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-foreground rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tipo de Pessoa - Oculto para Receptivo */}
            {attendanceType && !isReceptivo && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                    Tipo de Pessoa
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  {personTypes.map((type) => {
                    const Icon = getPersonIcon(type.value)
                    const isSelected = personType === type.value
                    return (
                      <button
                        key={type.id}
                        onClick={() => setPersonType(type.value)}
                        className={`
                          group relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                          ${isSelected
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                            : "bg-secondary/50 hover:bg-secondary text-foreground border border-border hover:border-primary/50"
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{type.label}</span>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-foreground rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-primary" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Seleção de Produto */}
            {canSelectProduct && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                    Selecione o Produto
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground bg-secondary/30 rounded-lg border border-dashed border-border">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">Nenhum produto disponivel</p>
                    <p className="text-xs mt-1">Entre em contato com o administrador.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {filteredProducts.map((prod) => {
                      const isSelected = product === prod.id
                      return (
                        <Tooltip key={prod.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setProduct(prod.id)}
                              className={`
                                group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                ${isSelected
                                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                                  : "bg-secondary/50 hover:bg-secondary text-foreground border border-border hover:border-primary/50"
                                }
                              `}
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span className="uppercase text-xs">{prod.name}</span>
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-foreground rounded-full flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-primary" />
                                </div>
                              )}
                            </button>
                          </TooltipTrigger>
                          {prod.description && (
                            <TooltipContent side="top" className="max-w-xs">
                              <p>{prod.description}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TooltipProvider>

      {/* Action Buttons - mais compactos */}
      <div className="flex justify-center gap-3 mt-4 shrink-0">
        <Button
          size="default"
          onClick={handleStart}
          disabled={!attendanceType || (!isReceptivo && !personType) || !product}
          className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Play className="w-4 h-4" />
            Iniciar Atendimento
          </span>
        </Button>
        <Button
          size="default"
          variant="outline"
          onClick={handleReset}
          className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-border hover:border-muted-foreground/50 hover:bg-secondary/50 transition-all duration-300 rounded-lg"
        >
          <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-180 duration-500" />
          Limpar
        </Button>
      </div>
    </div>
  )
}
