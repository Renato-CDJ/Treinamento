"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Circle, UserMinus, ArrowRightLeft, Users2, Search, ChevronDown, ChevronUp, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getAllUsers,
  getAdminUsers,
  getSupervisorTeams,
  assignOperatorToSupervisor,
  removeOperatorFromSupervisor,
  moveOperatorToSupervisor,
  isUserOnline,
} from "@/lib/store"
import type { User, SupervisorTeam } from "@/lib/types"

export function SupervisionTab() {
  const [supervisors, setSupervisors] = useState<User[]>([])
  const [operators, setOperators] = useState<User[]>([])
  const [teams, setTeams] = useState<SupervisorTeam[]>([])
  const [expandedSupervisor, setExpandedSupervisor] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOperator, setSelectedOperator] = useState<User | null>(null)
  const [actionType, setActionType] = useState<"move" | "remove" | null>(null)
  const [targetSupervisorId, setTargetSupervisorId] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedSupervisorForAssign, setSelectedSupervisorForAssign] = useState<string>("")
  const [selectedOperatorIds, setSelectedOperatorIds] = useState<string[]>([])
  const [operatorSearchTerm, setOperatorSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadData()
    // Aumentado de 3s para 30s - dados de supervisão não precisam de atualização tão frequente
    const interval = setInterval(loadData, 30000)

    const handleStoreUpdate = () => {
      loadData()
    }

    window.addEventListener("store-updated", handleStoreUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener("store-updated", handleStoreUpdate)
    }
  }, [])

  const loadData = () => {
    const adminUsers = getAdminUsers()
    setSupervisors(adminUsers)

    const allUsers = getAllUsers()
    const operatorUsers = allUsers.filter((u) => u.role === "operator")
    setOperators(operatorUsers)

    const teamData = getSupervisorTeams()
    setTeams(teamData)
  }

  const getOperatorsBySupervisor = (supervisorId: string): User[] => {
    const team = teams.find((t) => t.supervisorId === supervisorId)
    if (!team) return []

    return operators.filter((op) => team.operatorIds.includes(op.id))
  }

  const getUnassignedOperators = (): User[] => {
    const assignedIds = new Set(teams.flatMap((t) => t.operatorIds))
    return operators.filter((op) => !assignedIds.has(op.id))
  }

  const handleOpenBulkAssignDialog = () => {
    setSelectedSupervisorForAssign("")
    setSelectedOperatorIds([])
    setOperatorSearchTerm("")
    setIsAssignDialogOpen(true)
  }

  const toggleOperatorSelection = (operatorId: string) => {
    setSelectedOperatorIds((prev) =>
      prev.includes(operatorId) ? prev.filter((id) => id !== operatorId) : [...prev, operatorId],
    )
  }

  const toggleAllFilteredOperators = (filteredOps: User[]) => {
    const allSelected = filteredOps.every((op) => selectedOperatorIds.includes(op.id))
    if (allSelected) {
      setSelectedOperatorIds((prev) => prev.filter((id) => !filteredOps.find((op) => op.id === id)))
    } else {
      const newIds = filteredOps.map((op) => op.id)
      setSelectedOperatorIds((prev) => [...new Set([...prev, ...newIds])])
    }
  }

  const handleAssignOperators = () => {
    if (selectedOperatorIds.length === 0 || !selectedSupervisorForAssign) return

    selectedOperatorIds.forEach((operatorId) => {
      assignOperatorToSupervisor(selectedSupervisorForAssign, operatorId)
    })

    loadData()
    setIsAssignDialogOpen(false)

    toast({
      title: "Operadores Vinculados",
      description: `${selectedOperatorIds.length} operador${selectedOperatorIds.length > 1 ? "es foram vinculados" : " foi vinculado"} ao supervisor com sucesso`,
    })
  }

  const handleRemoveClick = (operator: User, supervisorId: string) => {
    setSelectedOperator(operator)
    setTargetSupervisorId(supervisorId)
    setActionType("remove")
    setIsDialogOpen(true)
  }

  const handleMoveClick = (operator: User) => {
    setSelectedOperator(operator)
    setTargetSupervisorId("")
    setActionType("move")
    setIsDialogOpen(true)
  }

  const handleConfirmAction = () => {
    if (!selectedOperator) return

    if (actionType === "remove") {
      removeOperatorFromSupervisor(targetSupervisorId, selectedOperator.id)
      toast({
        title: "Operador Removido",
        description: "O operador foi removido da equipe",
      })
    } else if (actionType === "move" && targetSupervisorId) {
      moveOperatorToSupervisor(selectedOperator.id, targetSupervisorId)
      toast({
        title: "Operador Transferido",
        description: "O operador foi transferido para outra equipe",
      })
    }

    loadData()
    setIsDialogOpen(false)
    setSelectedOperator(null)
    setActionType(null)
  }

  const filteredSupervisors = supervisors.filter(
    (supervisor) =>
      supervisor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supervisor.username.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const unassignedOperators = getUnassignedOperators()
  const totalOnlineOperators = operators.filter((op) => isUserOnline(op.id)).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Supervisão</h2>
          <p className="text-muted-foreground mt-2">Gerencie equipes de operadores vinculados aos supervisores</p>

          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{operators.length}</p>
                <p className="text-xs text-muted-foreground">Total Operadores</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Circle className="h-4 w-4 text-green-500 fill-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{totalOnlineOperators}</p>
                <p className="text-xs text-muted-foreground">Online Agora</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <UserPlus className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{unassignedOperators.length}</p>
                <p className="text-xs text-muted-foreground">Sem Equipe</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users2 className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{supervisors.length}</p>
                <p className="text-xs text-muted-foreground">Supervisores</p>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleOpenBulkAssignDialog} size="lg" className="gap-2 shadow-lg">
          <UserPlus className="h-5 w-5" />
          Vincular Operadores
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar supervisor por nome ou usuário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      <div className="grid gap-4">
        {filteredSupervisors.map((supervisor) => {
          const teamOperators = getOperatorsBySupervisor(supervisor.id)
          const isExpanded = expandedSupervisor === supervisor.id
          const onlineCount = teamOperators.filter((op) => isUserOnline(op.id)).length

          return (
            <Card key={supervisor.id} className="overflow-hidden border-2 transition-all hover:border-primary/50">
              <CardHeader
                className="cursor-pointer bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 transition-all"
                onClick={() => setExpandedSupervisor(isExpanded ? null : supervisor.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl flex items-center gap-3 flex-wrap">
                        <span className="truncate">{supervisor.fullName}</span>
                        <Badge variant="secondary" className="gap-1.5 font-normal">
                          <Users2 className="h-3.5 w-3.5" />
                          {teamOperators.length} {teamOperators.length === 1 ? "operador" : "operadores"}
                        </Badge>
                        {onlineCount > 0 && (
                          <Badge variant="outline" className="gap-1.5 text-green-600 border-green-600 font-normal">
                            <Circle className="h-2.5 w-2.5 fill-current" />
                            {onlineCount} online
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1.5 text-sm">@{supervisor.username}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-6">
                  {teamOperators.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Users2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium mb-1">Nenhum operador vinculado</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Este supervisor ainda não possui operadores em sua equipe
                      </p>
                      <Button onClick={handleOpenBulkAssignDialog} variant="outline" className="gap-2 bg-transparent">
                        <UserPlus className="h-4 w-4" />
                        Vincular Operadores
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teamOperators.map((operator) => {
                        const online = isUserOnline(operator.id)
                        return (
                          <div
                            key={operator.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Circle
                                className={`h-3 w-3 flex-shrink-0 ${online ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"}`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{operator.fullName}</p>
                                <p className="text-sm text-muted-foreground">@{operator.username}</p>
                              </div>
                              <Badge
                                variant="outline"
                                className={`flex-shrink-0 ${online ? "text-green-600 border-green-600" : "text-gray-600 border-gray-600"}`}
                              >
                                {online ? "Online" : "Offline"}
                              </Badge>
                            </div>
                            <div className="flex gap-2 ml-4 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveClick(operator)}
                                className="gap-2"
                              >
                                <ArrowRightLeft className="h-4 w-4" />
                                Trocar Equipe
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveClick(operator, supervisor.id)}
                                className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <UserMinus className="h-4 w-4" />
                                Remover
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}

        {filteredSupervisors.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Users2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-1">Nenhum supervisor encontrado</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "Tente ajustar sua busca" : "Adicione supervisores em Controle de Acesso"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">Vincular Operadores</DialogTitle>
            <DialogDescription>
              Selecione um ou mais operadores sem equipe para vincular a um supervisor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="space-y-2">
              <label className="text-sm font-medium">Supervisor</label>
              <Select value={selectedSupervisorForAssign} onValueChange={setSelectedSupervisorForAssign}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione o supervisor responsável" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map((sup) => (
                    <SelectItem key={sup.id} value={sup.id}>
                      <div className="flex items-center gap-2">
                        <Users2 className="h-4 w-4" />
                        {sup.fullName}
                        <span className="text-muted-foreground">
                          ({getOperatorsBySupervisor(sup.id).length} operadores)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSupervisorForAssign && (
              <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Operadores Disponíveis ({unassignedOperators.length})</label>
                  {selectedOperatorIds.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <UserPlus className="h-3 w-3" />
                      {selectedOperatorIds.length} selecionado{selectedOperatorIds.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar operador..."
                    value={operatorSearchTerm}
                    onChange={(e) => setOperatorSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {unassignedOperators.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-8 border-2 border-dashed rounded-lg">
                    <div className="text-center">
                      <Users2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm font-medium">Todos os operadores já estão vinculados</p>
                      <p className="text-xs text-muted-foreground mt-1">Não há operadores disponíveis para vincular</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto border rounded-lg">
                    <div className="p-3 space-y-1">
                      {(() => {
                        const filteredOps = unassignedOperators.filter(
                          (op) =>
                            op.fullName.toLowerCase().includes(operatorSearchTerm.toLowerCase()) ||
                            op.username.toLowerCase().includes(operatorSearchTerm.toLowerCase()),
                        )

                        if (filteredOps.length === 0) {
                          return (
                            <div className="text-center py-8 text-muted-foreground">
                              <p className="text-sm">Nenhum operador encontrado</p>
                            </div>
                          )
                        }

                        return (
                          <>
                            {filteredOps.length > 1 && (
                              <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 mb-2">
                                <Checkbox
                                  id="select-all"
                                  checked={filteredOps.every((op) => selectedOperatorIds.includes(op.id))}
                                  onCheckedChange={() => toggleAllFilteredOperators(filteredOps)}
                                />
                                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer flex-1">
                                  Selecionar todos ({filteredOps.length})
                                </label>
                              </div>
                            )}
                            {filteredOps.map((op) => {
                              const online = isUserOnline(op.id)
                              return (
                                <div
                                  key={op.id}
                                  className="flex items-center gap-3 p-3 rounded-md hover:bg-accent cursor-pointer transition-colors"
                                  onClick={() => toggleOperatorSelection(op.id)}
                                >
                                  <Checkbox
                                    id={`op-${op.id}`}
                                    checked={selectedOperatorIds.includes(op.id)}
                                    onCheckedChange={() => toggleOperatorSelection(op.id)}
                                  />
                                  <Circle
                                    className={`h-2.5 w-2.5 flex-shrink-0 ${online ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"}`}
                                  />
                                  <label htmlFor={`op-${op.id}`} className="flex-1 cursor-pointer">
                                    <p className="text-sm font-medium">{op.fullName}</p>
                                    <p className="text-xs text-muted-foreground">@{op.username}</p>
                                  </label>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${online ? "text-green-600 border-green-600" : "text-gray-600"}`}
                                  >
                                    {online ? "Online" : "Offline"}
                                  </Badge>
                                </div>
                              )
                            })}
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssignOperators}
              disabled={!selectedSupervisorForAssign || selectedOperatorIds.length === 0}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Vincular {selectedOperatorIds.length > 0 && `(${selectedOperatorIds.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
