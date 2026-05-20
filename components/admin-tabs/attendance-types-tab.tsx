"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Settings2, AlertCircle } from "lucide-react"
import {
  getAttendanceTypes,
  createAttendanceType,
  updateAttendanceType,
  deleteAttendanceType,
  getPersonTypes,
  createPersonType,
  updatePersonType,
  deletePersonType,
  getProducts,
} from "@/lib/store"
import type { AttendanceTypeOption, PersonTypeOption } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AttendanceTypesTab() {
  const [attendanceTypes, setAttendanceTypes] = useState<AttendanceTypeOption[]>([])
  const [personTypes, setPersonTypes] = useState<PersonTypeOption[]>([])
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false)
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false)
  const [editingAttendance, setEditingAttendance] = useState<AttendanceTypeOption | null>(null)
  const [editingPerson, setEditingPerson] = useState<PersonTypeOption | null>(null)
  const [attendanceFormData, setAttendanceFormData] = useState({
    value: "",
    label: "",
  })
  const [personFormData, setPersonFormData] = useState({
    value: "",
    label: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadData()
    const handleStoreUpdate = () => loadData()
    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [])

  const loadData = () => {
    setAttendanceTypes(getAttendanceTypes())
    setPersonTypes(getPersonTypes())
  }

  // Attendance Type Handlers
  const handleOpenAttendanceDialog = (option?: AttendanceTypeOption) => {
    if (option) {
      setEditingAttendance(option)
      setAttendanceFormData({
        value: option.value,
        label: option.label,
      })
    } else {
      setEditingAttendance(null)
      setAttendanceFormData({
        value: "",
        label: "",
      })
    }
    setIsAttendanceDialogOpen(true)
  }

  const handleSaveAttendance = () => {
    if (!attendanceFormData.value.trim() || !attendanceFormData.label.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    // Check for duplicate values
    const existingTypes = getAttendanceTypes()
    const isDuplicate = existingTypes.some(
      (t) => t.value === attendanceFormData.value && t.id !== editingAttendance?.id,
    )

    if (isDuplicate) {
      toast({
        title: "Erro",
        description: "Já existe um tipo de atendimento com este valor",
        variant: "destructive",
      })
      return
    }

    if (editingAttendance) {
      updateAttendanceType({
        ...editingAttendance,
        ...attendanceFormData,
      })
      toast({
        title: "Sucesso",
        description: "Tipo de atendimento atualizado com sucesso",
      })
    } else {
      createAttendanceType(attendanceFormData as Omit<AttendanceTypeOption, "id" | "createdAt">)
      toast({
        title: "Sucesso",
        description: "Tipo de atendimento criado com sucesso",
      })
    }

    setIsAttendanceDialogOpen(false)
    loadData()
  }

  const handleDeleteAttendance = (id: string) => {
    // Check if any products use this attendance type
    const products = getProducts()
    const usedInProducts = products.filter((p) =>
      p.attendanceTypes?.some((t) => {
        const attendanceType = attendanceTypes.find((at) => at.id === id)
        return attendanceType && t === attendanceType.value
      }),
    )

    if (usedInProducts.length > 0) {
      toast({
        title: "Não é possível excluir",
        description: `Este tipo de atendimento está sendo usado em ${usedInProducts.length} produto(s)`,
        variant: "destructive",
      })
      return
    }

    if (confirm("Tem certeza que deseja excluir este tipo de atendimento?")) {
      deleteAttendanceType(id)
      toast({
        title: "Sucesso",
        description: "Tipo de atendimento excluído com sucesso",
      })
      loadData()
    }
  }

  // Person Type Handlers
  const handleOpenPersonDialog = (option?: PersonTypeOption) => {
    if (option) {
      setEditingPerson(option)
      setPersonFormData({
        value: option.value,
        label: option.label,
      })
    } else {
      setEditingPerson(null)
      setPersonFormData({
        value: "",
        label: "",
      })
    }
    setIsPersonDialogOpen(true)
  }

  const handleSavePerson = () => {
    if (!personFormData.value.trim() || !personFormData.label.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    // Check for duplicate values
    const existingTypes = getPersonTypes()
    const isDuplicate = existingTypes.some((t) => t.value === personFormData.value && t.id !== editingPerson?.id)

    if (isDuplicate) {
      toast({
        title: "Erro",
        description: "Já existe um tipo de pessoa com este valor",
        variant: "destructive",
      })
      return
    }

    if (editingPerson) {
      updatePersonType({
        ...editingPerson,
        ...personFormData,
      })
      toast({
        title: "Sucesso",
        description: "Tipo de pessoa atualizado com sucesso",
      })
    } else {
      createPersonType(personFormData as Omit<PersonTypeOption, "id" | "createdAt">)
      toast({
        title: "Sucesso",
        description: "Tipo de pessoa criado com sucesso",
      })
    }

    setIsPersonDialogOpen(false)
    loadData()
  }

  const handleDeletePerson = (id: string) => {
    // Check if any products use this person type
    const products = getProducts()
    const usedInProducts = products.filter((p) =>
      p.personTypes?.some((t) => {
        const personType = personTypes.find((pt) => pt.id === id)
        return personType && t === personType.value
      }),
    )

    if (usedInProducts.length > 0) {
      toast({
        title: "Não é possível excluir",
        description: `Este tipo de pessoa está sendo usado em ${usedInProducts.length} produto(s)`,
        variant: "destructive",
      })
      return
    }

    if (confirm("Tem certeza que deseja excluir este tipo de pessoa?")) {
      deletePersonType(id)
      toast({
        title: "Sucesso",
        description: "Tipo de pessoa excluído com sucesso",
      })
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Configurar Atendimento</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie os tipos de atendimento e tipos de pessoa disponíveis no sistema
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          As opções configuradas aqui serão usadas na tela de Configuração de Atendimento e no cadastro de produtos.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="attendance">Tipos de Atendimento</TabsTrigger>
          <TabsTrigger value="person">Tipos de Pessoa</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Tipos de Atendimento</h3>
              <p className="text-sm text-muted-foreground">Configure as opções de tipo de atendimento</p>
            </div>
            <Button onClick={() => handleOpenAttendanceDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Tipo
            </Button>
          </div>

          <div className="grid gap-4">
            {attendanceTypes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Settings2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Nenhum tipo de atendimento cadastrado ainda.
                    <br />
                    Clique em "Adicionar Tipo" para começar.
                  </p>
                </CardContent>
              </Card>
            ) : (
              attendanceTypes.map((type) => (
                <Card key={type.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          <Badge variant="secondary">{type.value}</Badge>
                          {type.label}
                        </CardTitle>
                        <CardDescription>Criado em {new Date(type.createdAt).toLocaleDateString()}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenAttendanceDialog(type)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteAttendance(type.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="person" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Tipos de Pessoa</h3>
              <p className="text-sm text-muted-foreground">Configure as opções de tipo de pessoa</p>
            </div>
            <Button onClick={() => handleOpenPersonDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Tipo
            </Button>
          </div>

          <div className="grid gap-4">
            {personTypes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Settings2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Nenhum tipo de pessoa cadastrado ainda.
                    <br />
                    Clique em "Adicionar Tipo" para começar.
                  </p>
                </CardContent>
              </Card>
            ) : (
              personTypes.map((type) => (
                <Card key={type.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          <Badge variant="secondary">{type.value}</Badge>
                          {type.label}
                        </CardTitle>
                        <CardDescription>Criado em {new Date(type.createdAt).toLocaleDateString()}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenPersonDialog(type)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeletePerson(type.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Attendance Type Dialog */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAttendance ? "Editar Tipo de Atendimento" : "Adicionar Tipo de Atendimento"}
            </DialogTitle>
            <DialogDescription>Configure o tipo de atendimento que será exibido no sistema</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="att-value">Valor (usado internamente) *</Label>
              <Input
                id="att-value"
                value={attendanceFormData.value}
                onChange={(e) => setAttendanceFormData({ ...attendanceFormData, value: e.target.value })}
                placeholder="Ex: ativo"
              />
              <p className="text-xs text-muted-foreground">Use apenas letras minúsculas sem espaços</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="att-label">Rótulo (exibido para o usuário) *</Label>
              <Input
                id="att-label"
                value={attendanceFormData.label}
                onChange={(e) => setAttendanceFormData({ ...attendanceFormData, label: e.target.value })}
                placeholder="Ex: Ativo"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAttendanceDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAttendance}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Person Type Dialog */}
      <Dialog open={isPersonDialogOpen} onOpenChange={setIsPersonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPerson ? "Editar Tipo de Pessoa" : "Adicionar Tipo de Pessoa"}</DialogTitle>
            <DialogDescription>Configure o tipo de pessoa que será exibido no sistema</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="per-value">Valor (usado internamente) *</Label>
              <Input
                id="per-value"
                value={personFormData.value}
                onChange={(e) => setPersonFormData({ ...personFormData, value: e.target.value })}
                placeholder="Ex: fisica"
              />
              <p className="text-xs text-muted-foreground">Use apenas letras minúsculas sem espaços</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="per-label">Rótulo (exibido para o usuário) *</Label>
              <Input
                id="per-label"
                value={personFormData.label}
                onChange={(e) => setPersonFormData({ ...personFormData, label: e.target.value })}
                placeholder="Ex: Física"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPersonDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePerson}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
