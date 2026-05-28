"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import {
  Search,
  Sun,
  Moon,
  LogOut,
  Circle,
  PanelRightClose,
  PanelRightOpen,
  Eye,
  EyeOff,
  Home,
  Hash,
  Filter,
  Bell,
  FileText,
  ListChecks,
  AlertCircle,
  Radio,
  Megaphone,
  Cloud,
  Brain,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCachedProducts, useCachedMessages } from "@/hooks/use-cached-data"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { QualityCenterModal } from "@/components/quality-center-modal"
import { OperatorInitialGuideModal } from "@/components/operator-initial-guide-modal"
import { OperatorResultCodesModal } from "@/components/operator-result-codes-modal"
import { OperatorSituationsModal } from "@/components/operator-situations-modal"
import { OperatorChannelsModal } from "@/components/operator-channels-modal"
import { OperatorCampaignsModal } from "@/components/operator-campaigns-modal"
import { OperatorWordCloudModal } from "@/components/operator-word-cloud-modal"
import { OperatorQuizModal } from "@/components/operator-quiz-modal"

interface OperatorHeaderProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
  isSidebarOpen?: boolean
  onToggleSidebar?: () => void
  showControls?: boolean
  onToggleControls?: () => void
  isSessionActive?: boolean
  onBackToStart?: () => void
  onProductSelect?: (productId: string) => void
  onOpenChat?: () => void
}

export const OperatorHeader = memo(function OperatorHeader({
  searchQuery = "",
  onSearchChange,
  isSidebarOpen = true,
  onToggleSidebar,
  showControls = true,
  onToggleControls,
  isSessionActive = false,
  onBackToStart,
  onProductSelect,
}: OperatorHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  
  // Use cached data from Supabase
  const { products: productsData } = useCachedProducts()
  const { messages: messagesData } = useCachedMessages()
  
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [selectedAttendanceTypes, setSelectedAttendanceTypes] = useState<string[]>([])
  const [selectedPersonTypes, setSelectedPersonTypes] = useState<string[]>([])
  const [showMessagesModal, setShowMessagesModal] = useState(false)
  const [showInitialGuideModal, setShowInitialGuideModal] = useState(false)
  const [showResultCodesModal, setShowResultCodesModal] = useState(false)
  const [showSituationsModal, setShowSituationsModal] = useState(false)
  const [showChannelsModal, setShowChannelsModal] = useState(false)
  const [showCampaignsModal, setShowCampaignsModal] = useState(false)
  const [showWordCloudModal, setShowWordCloudModal] = useState(false)
  const [showQuizModal, setShowQuizModal] = useState(false)

  // Map products from Supabase
  const products = useMemo(() => productsData
    .filter((p: any) => p.is_active)
    .map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      isActive: p.is_active,
      attendanceTypes: p.details?.attendanceTypes || [],
      personTypes: p.details?.personTypes || [],
      scriptId: p.details?.scriptId || "",
    })), [productsData])

  // Calculate unseen messages count
  const unseenMessagesCount = useMemo(() => {
    if (!user) return 0
    return messagesData.filter((m: any) => m.is_active && (!m.seen_by || !m.seen_by.includes(user.id))).length
  }, [messagesData, user])

  // Total badge count for header notification
  const totalBadgeCount = unseenMessagesCount

  const handleLogout = useCallback(() => {
    logout()
    router.push("/")
  }, [logout, router])

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  const handleSearchInput = useCallback((value: string) => {
    setShowProductSearch(value.length > 0)
  }, [])

  const handleProductSelect = useCallback(
    (productId: string) => {
      setShowProductSearch(false)
      onSearchChange?.("")
      onProductSelect?.(productId)
      setSelectedAttendanceTypes([])
      setSelectedPersonTypes([])
    },
    [onSearchChange, onProductSelect],
  )

  const toggleAttendanceType = useCallback((type: string) => {
    setSelectedAttendanceTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }, [])

  const togglePersonType = useCallback((type: string) => {
    setSelectedPersonTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedAttendanceTypes.length === 0 && selectedPersonTypes.length === 0) {
        return false
      }

      const matchesAttendance =
        selectedAttendanceTypes.length === 0 ||
        (product.attendanceTypes && product.attendanceTypes.some((type: string) => selectedAttendanceTypes.includes(type)))

      const matchesPerson =
        selectedPersonTypes.length === 0 ||
        (product.personTypes && product.personTypes.some((type: string) => selectedPersonTypes.includes(type)))

      return matchesAttendance && matchesPerson
    })
  }, [products, selectedAttendanceTypes, selectedPersonTypes])

  const hasFiltersSelected = selectedAttendanceTypes.length > 0 || selectedPersonTypes.length > 0

  return (
    <>
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-3 md:px-4 py-3">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              {user && (
                <div className="text-xs md:text-sm font-semibold text-foreground whitespace-nowrap hidden sm:block">
                  {user.fullName}
                </div>
              )}
              <div className="flex-1 max-w-md relative">
                <Popover open={showProductSearch} onOpenChange={setShowProductSearch}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Pesquisar produtos..."
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        className="pl-9 text-sm focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[90vw] max-w-[650px] p-0 border-border shadow-lg" align="start">
                    <Command className="bg-popover">
                      <CommandList className="max-h-[500px]">
                        <div className="p-4 border-b bg-muted/30 space-y-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Filter className="h-4 w-4 text-primary" />
                            <span>Filtrar Produtos</span>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Tipo de Atendimento
                              </div>
                              <div className="space-y-2.5">
                                <div className="flex items-center gap-2.5 group">
                                  <Checkbox
                                    id="ativo"
                                    checked={selectedAttendanceTypes.includes("ativo")}
                                    onCheckedChange={() => toggleAttendanceType("ativo")}
                                    className="data-[state=checked]:bg-chart-2 data-[state=checked]:border-chart-2"
                                  />
                                  <Label
                                    htmlFor="ativo"
                                    className="text-sm font-medium cursor-pointer group-hover:text-foreground transition-colors"
                                  >
                                    Ativo
                                  </Label>
                                </div>
                                <div className="flex items-center gap-2.5 group">
                                  <Checkbox
                                    id="receptivo"
                                    checked={selectedAttendanceTypes.includes("receptivo")}
                                    onCheckedChange={() => toggleAttendanceType("receptivo")}
                                    className="data-[state=checked]:bg-chart-2 data-[state=checked]:border-chart-2"
                                  />
                                  <Label
                                    htmlFor="receptivo"
                                    className="text-sm font-medium cursor-pointer group-hover:text-foreground transition-colors"
                                  >
                                    Receptivo
                                  </Label>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Tipo de Pessoa
                              </div>
                              <div className="space-y-2.5">
                                <div className="flex items-center gap-2.5 group">
                                  <Checkbox
                                    id="fisica"
                                    checked={selectedPersonTypes.includes("fisica")}
                                    onCheckedChange={() => togglePersonType("fisica")}
                                    className="data-[state=checked]:bg-chart-3 data-[state=checked]:border-chart-3"
                                  />
                                  <Label
                                    htmlFor="fisica"
                                    className="text-sm font-medium cursor-pointer group-hover:text-foreground transition-colors"
                                  >
                                    Física
                                  </Label>
                                </div>
                                <div className="flex items-center gap-2.5 group">
                                  <Checkbox
                                    id="juridica"
                                    checked={selectedPersonTypes.includes("juridica")}
                                    onCheckedChange={() => togglePersonType("juridica")}
                                    className="data-[state=checked]:bg-chart-3 data-[state=checked]:border-chart-3"
                                  />
                                  <Label
                                    htmlFor="juridica"
                                    className="text-sm font-medium cursor-pointer group-hover:text-foreground transition-colors"
                                  >
                                    Jurídica
                                  </Label>
                                </div>
                              </div>
                            </div>
                          </div>

                          {hasFiltersSelected && (
                            <div className="flex items-center gap-2 pt-2">
                              <Badge variant="secondary" className="text-xs">
                                {filteredProducts.length} produto(s) encontrado(s)
                              </Badge>
                            </div>
                          )}
                        </div>

                        {!hasFiltersSelected ? (
                          <div className="py-12 text-center">
                            <Filter className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground font-medium">
                              Selecione os filtros acima para ver os produtos
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              Escolha pelo menos um tipo de atendimento ou pessoa
                            </p>
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <CommandEmpty className="py-12 text-center">
                            <div className="text-sm text-muted-foreground">
                              Nenhum produto encontrado com os filtros selecionados.
                            </div>
                          </CommandEmpty>
                        ) : (
                          <CommandGroup
                            heading="Produtos Disponíveis"
                            className="p-2 [&_[cmdk-group-heading]]:bg-transparent [&_[cmdk-group-heading]]:text-foreground"
                          >
                            {filteredProducts.map((product) => (
                              <CommandItem
                                key={product.id}
                                onSelect={() => handleProductSelect(product.id)}
                                className="cursor-pointer rounded-lg p-3 mb-1.5 hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className="flex-shrink-0">
                                    <div className="h-8 w-8 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                      <Hash className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-foreground leading-tight">
                                      {product.name}
                                    </div>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                onClick={() => setShowInitialGuideModal(true)}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
                title="Contratos"
              >
                <div className="h-9 w-9 bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 text-white rounded-lg shadow-md flex items-center justify-center transition-colors">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-[9px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Contratos</span>
              </button>

              <button
                onClick={() => setShowSituationsModal(true)}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
                title="Situacoes"
              >
                <div className="h-9 w-9 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-lg shadow-md flex items-center justify-center transition-colors">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <span className="text-[9px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Situacoes</span>
              </button>

              <button
                onClick={() => setShowChannelsModal(true)}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
                title="Canais"
              >
                <div className="h-9 w-9 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg shadow-md flex items-center justify-center transition-colors">
                  <Radio className="h-4 w-4" />
                </div>
                <span className="text-[9px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Canais</span>
              </button>

              <button
                onClick={() => setShowCampaignsModal(true)}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
                title="Campanhas"
              >
                <div className="h-9 w-9 bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white rounded-lg shadow-md flex items-center justify-center transition-colors">
                  <Megaphone className="h-4 w-4" />
                </div>
                <span className="text-[9px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Campanhas</span>
              </button>

              <button
                onClick={() => setShowWordCloudModal(true)}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
                title="Dúvidas"
              >
                <div className="h-9 w-9 bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white rounded-lg shadow-md flex items-center justify-center transition-colors">
                  <Cloud className="h-4 w-4" />
                </div>
                <span className="text-[9px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Dúvidas</span>
              </button>

              <button
                onClick={() => setShowQuizModal(true)}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
                title="Quiz da Qualidade"
              >
                <div className="h-9 w-9 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg shadow-md flex items-center justify-center transition-colors">
                  <Brain className="h-4 w-4" />
                </div>
                <span className="text-[9px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Quiz</span>
              </button>

              <button
                onClick={() => setShowResultCodesModal(true)}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
                title="Codigos de Resultado"
              >
                <div className="h-9 w-9 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg shadow-md flex items-center justify-center transition-colors">
                  <ListChecks className="h-4 w-4" />
                </div>
                <span className="text-[9px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Tabulações</span>
              </button>

              <button
                onClick={() => setShowMessagesModal(true)}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group relative"
                title="Central da Qualidade"
              >
                <div className="h-9 w-9 bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-lg shadow-md flex items-center justify-center transition-colors relative">
                  <Bell className="h-4 w-4" />
                  {totalBadgeCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {totalBadgeCount}
                    </Badge>
                  )}
                </div>
                <span className="text-[9px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Qualidade</span>
              </button>

              <button
                onClick={onBackToStart}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
                title="Voltar ao Inicio"
              >
                <div className="h-9 w-9 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg shadow-md flex items-center justify-center transition-colors">
                  <Home className="h-4 w-4" />
                </div>
                <span className="text-[9px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Inicio</span>
              </button>

              {isSessionActive && onToggleControls && (
                <button
                  onClick={onToggleControls}
                  className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
                  title={showControls ? "Ocultar Controles" : "Exibir Controles"}
                >
                  <div className="h-9 w-9 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-lg shadow-md flex items-center justify-center transition-colors">
                    {showControls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </div>
                  <span className="text-[9px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Controles</span>
                </button>
              )}

              {isSessionActive && onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
                  title={isSidebarOpen ? "Ocultar Painel" : "Exibir Painel"}
                >
                  <div className="h-9 w-9 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white rounded-lg shadow-md flex items-center justify-center transition-colors">
                    {isSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                  </div>
                  <span className="text-[9px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Painel</span>
                </button>
              )}

              <button
                onClick={toggleTheme}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
                title="Alternar tema"
              >
                <div className="h-9 w-9 border-2 shadow-md bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg flex items-center justify-center transition-colors">
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5 text-orange-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                <span className="text-[9px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Tema</span>
              </button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3 text-black dark:text-white hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-all"
              >
                <LogOut className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline text-xs md:text-sm font-medium">Sair</span>
              </Button>

              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md border border-green-500/20">
                <Circle className="h-3 w-3 fill-current" />
                <span className="text-sm font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <QualityCenterModal isOpen={showMessagesModal} onClose={() => setShowMessagesModal(false)} />
      <OperatorInitialGuideModal open={showInitialGuideModal} onOpenChange={setShowInitialGuideModal} />
      <OperatorResultCodesModal open={showResultCodesModal} onOpenChange={setShowResultCodesModal} />
      <OperatorSituationsModal open={showSituationsModal} onOpenChange={setShowSituationsModal} />
      <OperatorChannelsModal open={showChannelsModal} onOpenChange={setShowChannelsModal} />
      <OperatorCampaignsModal isOpen={showCampaignsModal} onClose={() => setShowCampaignsModal(false)} />
      <OperatorWordCloudModal open={showWordCloudModal} onOpenChange={setShowWordCloudModal} />
      <OperatorQuizModal open={showQuizModal} onOpenChange={setShowQuizModal} />
    </>
  )
})
