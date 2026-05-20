"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { ScriptCard } from "@/components/script-card"
import { AttendanceConfig } from "@/components/attendance-config"
import { OperatorSidebar } from "@/components/operator-sidebar"
import { useAuth } from "@/lib/auth-context"
import { getFirstScriptStep, getScriptsByProductId } from "@/hooks/use-supabase-admin"
import { createClient } from "@/lib/supabase/client"
import type { ScriptStep, AttendanceConfig as AttendanceConfigType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Eye, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

const mapScriptRowToStep = (step: any): ScriptStep => ({
  id: step.id,
  title: step.title,
  content: step.content,
  productId: step.product_id,
  productName: step.product_name,
  order: step.step_order ?? 0,
  buttons: step.buttons || [],
  tabulations: step.tabulations || [],
  alert: step.alert,
  isActive: step.is_active,
  createdAt: step.created_at ? new Date(step.created_at) : new Date(),
  updatedAt: step.updated_at ? new Date(step.updated_at) : new Date(),
})

export const SupervisorOperatorView = memo(function SupervisorOperatorView() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<ScriptStep | null>(null)
  const [stepHistory, setStepHistory] = useState<string[]>([])
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [showConfig, setShowConfig] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [attendanceConfig, setAttendanceConfig] = useState<AttendanceConfigType | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentProductId, setCurrentProductId] = useState<string | null>(null)
  const [currentProductName, setCurrentProductName] = useState<string>("")
  const [currentProductCategory, setCurrentProductCategory] = useState<
    "habitacional" | "comercial" | "cartao" | "outros" | undefined
  >(undefined)
  const [allSteps, setAllSteps] = useState<ScriptStep[]>([])

  // Load all steps when product changes
  useEffect(() => {
    async function loadSteps() {
      if (!currentProductId) {
        setAllSteps([])
        return
      }
      const steps = await getScriptsByProductId(currentProductId)
      const mappedSteps = steps.map(mapScriptRowToStep)
      setAllSteps(mappedSteps)
    }
    loadSteps()
  }, [currentProductId])

  const handleBackToStart = useCallback(() => {
    setIsSessionActive(false)
    setCurrentStep(null)
    setShowConfig(true)
    setAttendanceConfig(null)
    setSearchQuery("")
    setStepHistory([])
    setCurrentProductId(null)
    setCurrentProductName("")
    setCurrentProductCategory(undefined)
    setAllSteps([])
  }, [])

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)

      if (query.trim() && isSessionActive && allSteps.length > 0) {
        const foundStep = allSteps.find((step) => step.title.toLowerCase().includes(query.toLowerCase()))

        if (foundStep) {
          setCurrentStep(foundStep)
        }
      }
    },
    [isSessionActive, allSteps],
  )

  const handleSearchStep = useCallback(
    (stepId: string) => {
      const step = allSteps.find((s) => s.id === stepId)
      if (step) {
        setStepHistory((prev) => [...prev, step.id])
        setCurrentStep(step)
        setSearchQuery("")
      }
    },
    [allSteps],
  )

  const handleStartAttendance = useCallback(async (config: AttendanceConfigType) => {
    setAttendanceConfig(config)

    const supabase = createClient()
    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", config.product)
      .single()

    if (product) {
      setCurrentProductId(product.id)
      setCurrentProductName(product.name)
      setCurrentProductCategory(product.category)
      
      const firstStep = await getFirstScriptStep(product.id)

      if (firstStep) {
        const mappedStep = mapScriptRowToStep(firstStep)
        setCurrentStep(mappedStep)
        setStepHistory([mappedStep.id])
        setIsSessionActive(true)
        setShowConfig(false)
      } else {
        alert("Erro: Script nao encontrado para este produto. Entre em contato com o administrador.")
      }
    } else {
      alert("Erro: Produto nao encontrado. Entre em contato com o administrador.")
    }
  }, [])

  const handleButtonClick = useCallback(
    async (nextStepId: string | null, buttonLabel?: string) => {
      const supabase = createClient()
      
      if (buttonLabel && buttonLabel.toUpperCase().includes("FINALIZAR")) {
        if (currentProductId) {
          const firstStep = await getFirstScriptStep(currentProductId)
          if (firstStep) {
            const mappedStep = mapScriptRowToStep(firstStep)
            setCurrentStep(mappedStep)
            setStepHistory([mappedStep.id])
            setSearchQuery("")
            return
          }
        }
        handleBackToStart()
        return
      }

      if (!currentProductId) {
        alert("Erro: Produto nao identificado. Por favor, reinicie o atendimento.")
        handleBackToStart()
        return
      }

      if (nextStepId) {
        const { data: nextStepData } = await supabase
          .from("scripts")
          .select("*")
          .eq("id", nextStepId)
          .single()

        if (nextStepData) {
          const nextStep = mapScriptRowToStep(nextStepData)
          setStepHistory((prev) => [...prev, nextStep.id])
          setCurrentStep(nextStep)
          setSearchQuery("")
        } else {
          alert(`Proxima tela nao encontrada. ID: ${nextStepId}. Por favor, contate o administrador.`)
        }
      } else {
        alert(
          "Fim do roteiro atingido. Clique em 'Voltar ao Inicio' para iniciar um novo atendimento ou contate o administrador para configurar o proximo passo.",
        )
      }
    },
    [currentProductId, handleBackToStart],
  )

  const handleGoBack = useCallback(async () => {
    if (stepHistory.length > 1 && currentProductId) {
      const newHistory = [...stepHistory]
      newHistory.pop()
      
      const previousStepId = newHistory[newHistory.length - 1]
      const supabase = createClient()
      
      const { data: previousStepData } = await supabase
        .from("scripts")
        .select("*")
        .eq("id", previousStepId)
        .single()

      if (previousStepData) {
        const previousStep = mapScriptRowToStep(previousStepData)
        setCurrentStep(previousStep)
        setStepHistory(newHistory)
        setSearchQuery("")
      }
    }
  }, [currentProductId, stepHistory])

  if (!user) return null

  const operatorFirstName = user.fullName.split(" ")[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Visualizar Roteiro</h2>
            <p className="text-sm text-muted-foreground">
              Visualize o roteiro como o operador ve durante o atendimento
            </p>
          </div>
        </div>
        {isSessionActive && (
          <Button
            variant="outline"
            onClick={handleBackToStart}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Inicio
          </Button>
        )}
      </div>

      {/* Search bar when in session */}
      {isSessionActive && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tela do roteiro..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex gap-6">
        <div className="flex-1">
          {showConfig && !isSessionActive ? (
            <div className="space-y-6">
              <AttendanceConfig onStart={handleStartAttendance} />
            </div>
          ) : currentStep ? (
            <div className="w-full">
              <ScriptCard
                step={currentStep}
                onButtonClick={handleButtonClick}
                onGoBack={handleGoBack}
                canGoBack={stepHistory.length > 1}
                operatorName={operatorFirstName}
                customerFirstName="[Nome do cliente]"
                searchQuery={searchQuery}
                showControls={false}
                productName={currentProductName}
                onSearchStep={handleSearchStep}
                allSteps={allSteps}
              />
            </div>
          ) : null}
        </div>

        {/* Sidebar when in session */}
        {isSessionActive && (
          <div className="w-[420px] flex-shrink-0">
            <div className="sticky top-4 border rounded-lg overflow-hidden h-[calc(100vh-200px)]">
              <OperatorSidebar 
                isOpen={isSidebarOpen} 
                productCategory={currentProductCategory} 
                currentStep={currentStep} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
