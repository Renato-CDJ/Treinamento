"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, FileText, Loader2 } from "lucide-react"
import { useContracts } from "@/hooks/use-supabase-admin"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"

// Contratos padrão registrados no código
const DEFAULT_CONTRACTS = [
  {
    id: "default_cdc",
    name: "CRÉDITO DIRETO CAIXA - CDC",
    description: "O Crédito Direto Caixa (CDC) é uma modalidade de empréstimo pessoal oferecida pela Caixa Econômica Federal. Ele funciona como um crédito pré-aprovado, que pode ser contratado de forma rápida e simples, com o valor liberado diretamente na conta do cliente.",
    is_active: true,
    is_default: true,
  },
  {
    id: "default_cred_senior",
    name: "CRED SENIOR",
    description: "O Cred Sênior da Caixa é uma linha de crédito pessoal voltada para aposentados e pensionistas do INSS, oferecida pela Caixa Econômica Federal. Ele funciona como um empréstimo consignado, com parcelas descontadas diretamente do benefício, garantindo juros mais baixos e prazos mais longos.",
    is_active: true,
    is_default: true,
  },
  {
    id: "default_renegociacao",
    name: "RENEGOCIAÇÃO DE DÍVIDAS",
    description: "A renegociação de dívidas da Caixa é um serviço oferecido pela Caixa Econômica Federal para clientes que estão com dificuldades em pagar seus empréstimos, financiamentos ou outros contratos ativos. O objetivo é reorganizar o débito e facilitar o pagamento, evitando que a dívida cresça ainda mais com juros e encargos.",
    is_active: true,
    is_default: true,
  },
  {
    id: "default_consignacao",
    name: "CONSIGNAÇÃO CAIXA",
    description: "A \"consignação Caixa\" geralmente se refere ao empréstimo consignado oferecido pela Caixa Econômica Federal, uma modalidade de crédito em que as parcelas são descontadas diretamente do salário, aposentadoria ou pensão do cliente.",
    is_active: true,
    is_default: true,
  },
  {
    id: "default_microcredito",
    name: "MICROCRÉDITO GIRO",
    description: "O microcrédito é uma modalidade de empréstimo de pequeno valor, voltada para microempreendedores individuais (MEIs), trabalhadores informais e pessoas de baixa renda que têm dificuldade em acessar crédito tradicional. Ele serve para financiar atividades produtivas, como compra de equipamentos, estoque ou capital de giro.",
    is_active: true,
    is_default: true,
  },
  {
    id: "default_girocaixa_facil",
    name: "GIROCAIXA FÁCIL",
    description: "O GiroCaixa Fácil é uma linha de crédito da Caixa Econômica Federal destinada a empresas com faturamento anual de até R$ 50 milhões, voltada para financiar capital de giro. Ele oferece limite de até R$ 2 milhões, com prazos flexíveis e contratação simplificada. É um empréstimo empresarial.",
    is_active: true,
    is_default: true,
  },
  {
    id: "default_fies",
    name: "FIES",
    description: "O FIES (Fundo de Financiamento Estudantil) é um programa do governo federal que oferece financiamento das mensalidades em instituições privadas de ensino superior para estudantes que não têm condições de arcar com os custos. Ele é administrado pelo Ministério da Educação (MEC) e operado por bancos como a Caixa Econômica Federal.",
    is_active: true,
    is_default: true,
  },
  {
    id: "default_construcard",
    name: "CONSTRUCARD",
    description: "É um tipo de empréstimo oferecido pela Caixa Econômica Federal, mas com uma característica especial: ele é voltado exclusivamente para compra de materiais de construção e reforma em lojas credenciadas. (Não ofertamos o envio do boleto)",
    is_active: true,
    is_default: true,
  },
  {
    id: "default_cheque_especial",
    name: "CHEQUE ESPECIAL CAIXA",
    description: "O Cheque Especial é uma modalidade de crédito automático vinculada à conta corrente. Ele funciona como um \"limite extra\" que o banco disponibiliza para o cliente usar quando o saldo da conta não é suficiente para cobrir saques, pagamentos ou transferências. (Não ofertamos o envio do boleto)",
    is_active: true,
    is_default: true,
  },
  {
    id: "default_cheque_especial_empresa",
    name: "CHEQUE ESPECIAL EMPRESA CAIXA",
    description: "O Cheque Especial é uma modalidade de crédito automático vinculada à conta corrente. Ele funciona como um \"limite extra\" que o banco disponibiliza para o cliente usar quando o saldo da conta não é suficiente para cobrir saques, pagamentos ou transferências. (Não ofertamos o envio do boleto)",
    is_active: true,
    is_default: true,
  },
  {
    id: "default_financiamento_habitacional",
    name: "FINANCIAMENTO HABITACIONAL",
    description: "Um financiamento habitacional é um tipo de crédito que os clientes utilizam para comprar um imóvel (casa, apartamento ou terreno) pagando em parcelas mensais.",
    is_active: true,
    is_default: true,
  },
  {
    id: "default_procred_360",
    name: "GIROCAIXA PROCRED 360 e MICROGIRO PROCRED 360",
    description: "Programa ProCred 360, que é uma linha de capital de giro voltada exclusivamente para MEI e Microempresas com faturamento anual de até R$ 360 mil. A emissão de 2ª via de boleto é feita pelo SIFEC.",
    is_active: true,
    is_default: true,
  },
]

export function InitialGuideTab() {
  const { data: dbContracts, loading, create, update, remove } = useContracts()
  
  // Combina contratos padrão com contratos do banco de dados
  const allContracts = [...DEFAULT_CONTRACTS, ...dbContracts]
  const [showDialog, setShowDialog] = useState(false)
  const [editingContract, setEditingContract] = useState<any | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  })
  const { toast } = useToast()

  const handleOpenDialog = (contract?: any) => {
    if (contract) {
      setEditingContract(contract)
      setFormData({
        name: contract.name || "",
        description: contract.description || "",
        isActive: contract.is_active ?? true,
      })
    } else {
      setEditingContract(null)
      setFormData({ name: "", description: "", isActive: true })
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      if (editingContract) {
        const { error } = await update(editingContract.id, {
          name: formData.name,
          description: formData.description,
          is_active: formData.isActive,
        })
        if (error) throw new Error(error)
        toast({
          title: "Sucesso",
          description: "Contrato atualizado com sucesso",
        })
      } else {
        const { error } = await create({
          name: formData.name,
          description: formData.description,
          is_active: formData.isActive,
        })
        if (error) throw new Error(error)
        toast({
          title: "Sucesso",
          description: "Contrato adicionado com sucesso",
        })
      }
      setShowDialog(false)
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao salvar contrato",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await remove(id)
    if (error) {
      toast({
        title: "Erro",
        description: error,
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Sucesso",
      description: "Contrato removido com sucesso",
    })
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Guia Inicial</h1>
          <p className="text-muted-foreground mt-1">Gerencie os contratos e informações para operadores</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Contrato
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contratos Disponíveis
          </CardTitle>
          <CardDescription>Lista de contratos e suas descrições para os operadores</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {allContracts.map((contract: any) => (
                <Card key={contract.id} className={`border-2 ${contract.is_default ? "border-orange-200 dark:border-orange-900" : ""}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-semibold">{contract.name}</h3>
                          {contract.is_default && (
                            <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                              Padrão
                            </span>
                          )}
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              contract.is_active
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {contract.is_active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.description}</p>
                      </div>
                      {!contract.is_default && (
                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="icon" onClick={() => handleOpenDialog(contract)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setDeleteConfirm(contract.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingContract ? "Editar Contrato" : "Adicionar Contrato"}</DialogTitle>
            <DialogDescription>Preencha as informações do contrato para os operadores</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Contrato *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: CRÉDITO DIRETO CAIXA - CDC"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição detalhada do contrato..."
                rows={6}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Contrato Ativo</Label>
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
              {editingContract ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
