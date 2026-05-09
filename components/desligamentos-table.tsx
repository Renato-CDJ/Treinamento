'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { ColaboradorDesligamento } from '@/types/dashboard'
import { mockDesligamentos } from '@/data/mock-data'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  PlusIcon, 
  SearchIcon, 
  DownloadIcon, 
  PencilIcon, 
  Trash2Icon, 
  AlertTriangleIcon, 
  CheckIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  BriefcaseIcon,
  FilterXIcon,
  FileTextIcon,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

export function DesligamentosTable() {
  const { currentUser } = useAuth()
  const canEdit = currentUser?.role !== 'viewer'

  const [data, setData] = useState<ColaboradorDesligamento[]>(mockDesligamentos)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ColaboradorDesligamento | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCarteira, setFilterCarteira] = useState('TODAS')
  const [filterStatus, setFilterStatus] = useState('TODOS')
  const [filterMotivo, setFilterMotivo] = useState('TODOS')
  const [formData, setFormData] = useState({
    nome: '',
    carteira: 'CAIXA',
    admissao: '',
    dias: 0,
    motivo: '',
    status: 'COM AVISO PRÉVIO' as const,
    dataDesligamento: '',
  })

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCarteira = filterCarteira === 'TODAS' || item.carteira === filterCarteira
      const matchesStatus = filterStatus === 'TODOS' || item.status === filterStatus
      const matchesMotivo = filterMotivo === 'TODOS' || item.motivo === filterMotivo
      return matchesSearch && matchesCarteira && matchesStatus && matchesMotivo
    })
  }, [data, searchTerm, filterCarteira, filterStatus, filterMotivo])

  const stats = useMemo(() => {
    const total = filteredData.length
    const comAviso = filteredData.filter(d => d.status === 'COM AVISO PRÉVIO').length
    const semAviso = total - comAviso
    const mediaDias = total > 0 ? Math.round(filteredData.reduce((acc, d) => acc + d.dias, 0) / total) : 0

    return { total, comAviso, semAviso, mediaDias }
  }, [filteredData])

  const chartData = useMemo(() => {
    const porMotivo = filteredData.reduce((acc, item) => {
      const motivo = item.motivo.length > 25 ? item.motivo.slice(0, 25) + '...' : item.motivo
      const existing = acc.find(a => a.name === motivo)
      if (existing) existing.value++
      else acc.push({ name: motivo, value: 1 })
      return acc
    }, [] as Array<{ name: string; value: number }>)

    const faixasTempo = [
      { name: '0-90 dias', value: filteredData.filter(d => d.dias <= 90).length },
      { name: '91-180 dias', value: filteredData.filter(d => d.dias > 90 && d.dias <= 180).length },
      { name: '181-365 dias', value: filteredData.filter(d => d.dias > 180 && d.dias <= 365).length },
      { name: '1-2 anos', value: filteredData.filter(d => d.dias > 365 && d.dias <= 730).length },
      { name: '2+ anos', value: filteredData.filter(d => d.dias > 730).length },
    ]

    const porStatus = [
      { name: 'Com Aviso Prévio', value: filteredData.filter(d => d.status === 'COM AVISO PRÉVIO').length },
      { name: 'Sem Aviso Prévio', value: filteredData.filter(d => d.status === 'SEM AVISO PRÉVIO').length },
    ]

    return { porMotivo, faixasTempo, porStatus }
  }, [filteredData])

  const handleAddItem = () => {
    if (!formData.nome || !formData.admissao || !formData.dataDesligamento) return

    const [diaAdm, mesAdm, anoAdm] = formData.admissao.split('/').map(Number)
    const [diaDesl, mesDesl, anoDesl] = formData.dataDesligamento.split('/').map(Number)
    const dataAdmissao = new Date(anoAdm, mesAdm - 1, diaAdm)
    const dataDesligamento = new Date(anoDesl, mesDesl - 1, diaDesl)
    const dias = Math.floor((dataDesligamento.getTime() - dataAdmissao.getTime()) / (1000 * 60 * 60 * 24))

    const newItem: ColaboradorDesligamento = {
      id: Date.now().toString(),
      nome: formData.nome,
      carteira: formData.carteira,
      admissao: formData.admissao,
      dias: Math.max(0, dias),
      motivo: formData.motivo,
      status: formData.status,
      dataDesligamento: formData.dataDesligamento,
    }

    if (editingItem) {
      setData(data.map(item => item.id === editingItem.id ? newItem : item))
      setEditingItem(null)
    } else {
      setData([...data, newItem])
    }

    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditItem = (item: ColaboradorDesligamento) => {
    setFormData({
      nome: item.nome,
      carteira: item.carteira,
      admissao: item.admissao,
      dias: item.dias,
      motivo: item.motivo,
      status: item.status,
      dataDesligamento: item.dataDesligamento,
    })
    setEditingItem(item)
    setIsAddDialogOpen(true)
  }

  const handleDeleteItem = (id: string) => {
    setData(data.filter(item => item.id !== id))
    setDeleteConfirm(null)
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      carteira: 'CAIXA',
      admissao: '',
      dias: 0,
      motivo: '',
      status: 'COM AVISO PRÉVIO',
      dataDesligamento: '',
    })
  }

  const handleExport = () => {
    const csv = [
      ['QTD', 'NOME DO OPERADOR', 'CARTEIRA', 'ADMISSÃO', 'DIAS', 'MOTIVO', 'STATUS', 'DATA DO DESLIGAMENTO'],
      ...filteredData.map((item, index) => [
        index + 1,
        item.nome,
        item.carteira,
        item.admissao,
        item.dias,
        item.motivo,
        item.status,
        item.dataDesligamento,
      ])
    ]
    const csvContent = csv.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'desligamentos.csv'
    a.click()
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">
            Quantidade: <span className="font-semibold text-foreground">{payload[0].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  const motivos = Array.from(new Set(data.map(d => d.motivo)))
  const carteiras = Array.from(new Set(data.map(d => d.carteira)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-500/20">
              <UserIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Registro de Desligamentos</h2>
              <p className="text-sm text-muted-foreground">
                Controle completo dos colaboradores desligados
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
            >
              <DownloadIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            {canEdit && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <PlusIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Adicionar</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? 'Editar Desligamento' : 'Adicionar Novo Desligamento'}</DialogTitle>
                    <DialogDescription>
                      Registre as informações do colaborador desligado
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome do Operador *</Label>
                      <Input
                        id="nome"
                        placeholder="Nome completo"
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carteira">Carteira</Label>
                      <Select value={formData.carteira} onValueChange={(value) => setFormData({...formData, carteira: value})}>
                        <SelectTrigger id="carteira">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {carteiras.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admissao">Data de Admissão (DD/MM/AAAA) *</Label>
                      <Input
                        id="admissao"
                        placeholder="DD/MM/AAAA"
                        value={formData.admissao}
                        onChange={(e) => setFormData({...formData, admissao: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataDesligamento">Data de Desligamento (DD/MM/AAAA) *</Label>
                      <Input
                        id="dataDesligamento"
                        placeholder="DD/MM/AAAA"
                        value={formData.dataDesligamento}
                        onChange={(e) => setFormData({...formData, dataDesligamento: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="motivo">Motivo do Desligamento *</Label>
                      <Textarea
                        id="motivo"
                        placeholder="Descreva o motivo do desligamento"
                        value={formData.motivo}
                        onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                        className="min-h-20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COM AVISO PRÉVIO">Com Aviso Prévio</SelectItem>
                          <SelectItem value="SEM AVISO PRÉVIO">Sem Aviso Prévio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setIsAddDialogOpen(false)
                      resetForm()
                      setEditingItem(null)
                    }}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddItem}>
                      {editingItem ? 'Atualizar' : 'Registrar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Desligados</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Colaboradores</p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <UserIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Com Aviso Prévio</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.comAviso}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{((stats.comAviso / stats.total) * 100).toFixed(0)}% do total</p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <CheckIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sem Aviso Prévio</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.semAviso}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{((stats.semAviso / stats.total) * 100).toFixed(0)}% do total</p>
              </div>
              <div className="p-2.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                <AlertTriangleIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Média Permanência</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.mediaDias}d</p>
                <p className="text-xs text-muted-foreground mt-0.5">dias em média</p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <CalendarIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Status do Desligamento</CardTitle>
            <CardDescription className="text-xs">Com ou sem aviso prévio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.porStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(value) => <span className="text-foreground text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Tempo de Permanência</CardTitle>
            <CardDescription className="text-xs">Faixas de tempo na empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.faixasTempo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Por Motivo</CardTitle>
            <CardDescription className="text-xs">Principais motivos de desligamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.porMotivo} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCarteira} onValueChange={setFilterCarteira}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas as Carteiras</SelectItem>
              {carteiras.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos Status</SelectItem>
              <SelectItem value="COM AVISO PRÉVIO">Com Aviso Prévio</SelectItem>
              <SelectItem value="SEM AVISO PRÉVIO">Sem Aviso Prévio</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterMotivo} onValueChange={setFilterMotivo}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos Motivos</SelectItem>
              {motivos.map(m => (
                <SelectItem key={m} value={m}>{m.slice(0, 30)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="w-12 text-center">QTD</TableHead>
                <TableHead className="min-w-40">NOME DO OPERADOR</TableHead>
                <TableHead className="min-w-24">CARTEIRA</TableHead>
                <TableHead className="min-w-28">ADMISSÃO</TableHead>
                <TableHead className="min-w-20 text-center">DIAS</TableHead>
                <TableHead className="min-w-40">MOTIVO</TableHead>
                <TableHead className="min-w-28">STATUS</TableHead>
                <TableHead className="min-w-28">DATA DESLIGAMENTO</TableHead>
                {canEdit && <TableHead className="w-16 text-center">AÇÕES</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={item.id} className="border-b border-border hover:bg-muted/50">
                  <TableCell className="text-center text-sm font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium text-foreground whitespace-nowrap">{item.nome}</TableCell>
                  <TableCell className="text-sm"><Badge variant="outline">{item.carteira}</Badge></TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{item.admissao}</TableCell>
                  <TableCell className="text-center text-sm">{item.dias}</TableCell>
                  <TableCell className="text-sm">{item.motivo}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {item.status === 'COM AVISO PRÉVIO' ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                        Com Aviso
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        Sem Aviso
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{item.dataDesligamento}</TableCell>
                  {canEdit && (
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                          className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Dialog open={deleteConfirm === item.id} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(item.id)}
                              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangleIcon className="h-5 w-5" />
                                Confirmar Exclusão
                              </DialogTitle>
                            </DialogHeader>
                            <p className="text-sm text-foreground">
                              Tem certeza que deseja remover <strong>{item.nome}</strong>?
                            </p>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
                              <Button variant="destructive" onClick={() => handleDeleteItem(item.id)}>Remover</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {filteredData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum registro encontrado</p>
        </div>
      )}
    </div>
  )
}
