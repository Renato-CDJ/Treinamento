'use client'

import { useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { ColaboradorIntegracao, PresencaStatus } from '@/types/dashboard'
import { mockIntegracao } from '@/data/mock-data'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { PlusIcon, PencilIcon, Trash2Icon, SearchIcon, DownloadIcon, CheckCircle2Icon, MinusCircleIcon, XCircleIcon, AlertCircleIcon, UserIcon, BriefcaseIcon, CalendarIcon, SettingsIcon, UserCheckIcon, UserXIcon, TrendingUpIcon, EyeIcon, XIcon, TableIcon, MessageSquareIcon } from 'lucide-react'
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

export function IntegracaoTable() {
  const { currentUser } = useAuth()
  const canEdit = currentUser?.role !== 'viewer'

  const [data, setData] = useState<ColaboradorIntegracao[]>(mockIntegracao)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ColaboradorIntegracao | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCarteira, setFilterCarteira] = useState('TODAS')
  const [filterTurno, setFilterTurno] = useState('TODOS')
  const [filterRegistro, setFilterRegistro] = useState('TODOS')
  const [carteirasCustom, setCarteirasCustom] = useState<string[]>([])
  const [novaCarteira, setNovaCarteira] = useState('')
  const [isCarteirasDialogOpen, setIsCarteirasDialogOpen] = useState(false)
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false)
  const [editingCarteira, setEditingCarteira] = useState<{ original: string; novo: string } | null>(null)
  const [formData, setFormData] = useState({
    colaborador: '',
    cpf: '',
    admissao: '',
    dias: 0,
    turno: 'MANHA' as const,
    registro: 'OPERADOR(A)' as const,
    carteira: 'CAIXA',
    dia1: 'vazio',
    dia2: 'vazio',
    aplicado: false,
    observacao: '',
  })

  const carteirasBase = ['CAIXA', 'BMG DIG.', 'ITAPAMA DIG.', 'MERCANTIL', 'CARREFOUR', 'ATIVO']
  const carteiras = [...carteirasBase, ...carteirasCustom]

  const calculateDias = useCallback((admissao: string): number => {
    if (!admissao) return 0
    const [dia, mes, ano] = admissao.split('/').map(Number)
    const dataAdmissao = new Date(ano, mes - 1, dia)
    const hoje = new Date()
    const diffMs = hoje.getTime() - dataAdmissao.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  }, [])

  const handleAdmissaoChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      admissao: value,
      dias: calculateDias(value)
    }))
  }, [calculateDias])

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.colaborador.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.cpf.includes(searchTerm)
      const matchesCarteira = filterCarteira === 'TODAS' || item.carteira === filterCarteira
      const matchesTurno = filterTurno === 'TODOS' || item.turno === filterTurno
      const matchesRegistro = filterRegistro === 'TODOS' || item.registro === filterRegistro
      return matchesSearch && matchesCarteira && matchesTurno && matchesRegistro
    })
  }, [data, searchTerm, filterCarteira, filterTurno, filterRegistro])

  const stats = useMemo(() => {
    const total = filteredData.length
    const presentes = filteredData.filter(d => d.dia1 === 'PRESENTE' && d.dia2 === 'PRESENTE').length
    const aplicados = filteredData.filter(d => d.aplicado === true).length
    const ausentes = total - presentes

    return {
      total,
      presentes,
      ausentes,
      aplicados,
      taxaPresenca: total > 0 ? Math.round((presentes / total) * 100) : 0
    }
  }, [filteredData])

  const chartData = useMemo(() => {
    const porCarteira = filteredData.reduce((acc, item) => {
      const existing = acc.find(a => a.name === item.carteira)
      if (existing) existing.value++
      else acc.push({ name: item.carteira, value: 1 })
      return acc
    }, [] as Array<{ name: string; value: number }>)

    const porTurno = filteredData.reduce((acc, item) => {
      const existing = acc.find(a => a.name === item.turno)
      if (existing) existing.value++
      else acc.push({ name: item.turno, value: 1 })
      return acc
    }, [] as Array<{ name: string; value: number }>)

    const presencaStatus = [
      { name: 'Presentes (2 dias)', value: filteredData.filter(d => d.dia1 === 'PRESENTE' && d.dia2 === 'PRESENTE').length },
      { name: 'Faltou 1 dia', value: filteredData.filter(d => (d.dia1 === 'PRESENTE' && d.dia2 !== 'PRESENTE') || (d.dia1 !== 'PRESENTE' && d.dia2 === 'PRESENTE')).length },
      { name: 'Não compareceu', value: filteredData.filter(d => d.dia1 !== 'PRESENTE' && d.dia2 !== 'PRESENTE').length }
    ]

    return { porCarteira, porTurno, presencaStatus }
  }, [filteredData])

  const handleAddItem = () => {
    if (!formData.colaborador || !formData.cpf || !formData.admissao) return

    const newItem: ColaboradorIntegracao = {
      id: Date.now().toString(),
      qtd: data.length + 1,
      colaborador: formData.colaborador,
      cpf: formData.cpf,
      admissao: formData.admissao,
      dias: formData.dias,
      turno: formData.turno,
      registro: formData.registro,
      carteira: formData.carteira,
      dia1: formData.dia1 === 'vazio' ? '' : (formData.dia1 as PresencaStatus),
      dia2: formData.dia2 === 'vazio' ? '' : (formData.dia2 as PresencaStatus),
      aplicado: formData.aplicado,
      observacao: formData.observacao,
      createdAt: new Date().toISOString(),
    }

    if (editingItem) {
      setData(data.map(item => item.id === editingItem.id ? { ...newItem, id: editingItem.id } : item))
      setEditingItem(null)
    } else {
      setData([...data, newItem])
    }

    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditItem = (item: ColaboradorIntegracao) => {
    setFormData({
      colaborador: item.colaborador,
      cpf: item.cpf,
      admissao: item.admissao,
      dias: item.dias,
      turno: item.turno,
      registro: item.registro,
      carteira: item.carteira,
      dia1: item.dia1 || 'vazio',
      dia2: item.dia2 || 'vazio',
      aplicado: item.aplicado,
      observacao: item.observacao || '',
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
      colaborador: '',
      cpf: '',
      admissao: '',
      dias: 0,
      turno: 'MANHA',
      registro: 'OPERADOR(A)',
      carteira: 'CAIXA',
      dia1: 'vazio',
      dia2: 'vazio',
      aplicado: false,
      observacao: '',
    })
  }

  const handleExport = () => {
    const csv = [
      ['QTD', 'COLABORADOR', 'CPF', 'ADMISSAO', 'DIAS', 'TURNO', 'REGISTRO', 'CARTEIRA', '1 DIA', '2 DIA', 'APLICADO?', 'OBSERVACAO'],
      ...filteredData.map((item, index) => [
        index + 1,
        item.colaborador,
        item.cpf,
        item.admissao,
        item.dias,
        item.turno,
        item.registro,
        item.carteira,
        item.dia1,
        item.dia2,
        item.aplicado ? 'Sim' : 'Nao',
        item.observacao || ''
      ])
    ]
    const csvContent = csv.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'integracao.csv'
    a.click()
  }

  const addCarteira = () => {
    if (novaCarteira && !carteiras.includes(novaCarteira)) {
      setCarteirasCustom([...carteirasCustom, novaCarteira])
      setNovaCarteira('')
    }
  }

  const removeCarteira = (carteira: string) => {
    setCarteirasCustom(carteirasCustom.filter(c => c !== carteira))
  }

  const startEditCarteira = (carteira: string) => {
    setEditingCarteira({ original: carteira, novo: carteira })
  }

  const saveEditCarteira = () => {
    if (editingCarteira && editingCarteira.novo && editingCarteira.novo !== editingCarteira.original) {
      setCarteirasCustom(carteirasCustom.map(c => 
        c === editingCarteira.original ? editingCarteira.novo : c
      ))
      // Atualizar colaboradores que usam essa carteira
      setData(data.map(item => 
        item.carteira === editingCarteira.original 
          ? { ...item, carteira: editingCarteira.novo }
          : item
      ))
    }
    setEditingCarteira(null)
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

  return (
    <div className="space-y-6">
      {/* Header com titulo e acoes */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserCheckIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Colaboradores em Integracao</h2>
              <p className="text-sm text-muted-foreground">
                Acompanhe os novos colaboradores no treinamento inicial de 2 dias
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTableDialogOpen(true)}
              className="gap-2"
            >
              <TableIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Ver Registrados</span>
            </Button>
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
              <>
                <Dialog open={isCarteirasDialogOpen} onOpenChange={setIsCarteirasDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <SettingsIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Carteiras</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Gerenciar Carteiras</DialogTitle>
                      <DialogDescription>
                        Adicione, edite ou remova carteiras personalizadas
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2 text-foreground">Carteiras Padrao</p>
                        <div className="flex flex-wrap gap-2">
                          {carteirasBase.map(c => (
                            <Badge key={c} variant="secondary">{c}</Badge>
                          ))}
                        </div>
                      </div>
                      {carteirasCustom.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2 text-foreground">Carteiras Personalizadas</p>
                          <div className="space-y-2">
                            {carteirasCustom.map(c => (
                              <div key={c} className="flex items-center gap-2">
                                {editingCarteira?.original === c ? (
                                  <>
                                    <Input
                                      value={editingCarteira.novo}
                                      onChange={(e) => setEditingCarteira({ ...editingCarteira, novo: e.target.value })}
                                      className="flex-1 h-8"
                                    />
                                    <Button size="sm" variant="ghost" onClick={saveEditCarteira} className="h-8 w-8 p-0">
                                      <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingCarteira(null)} className="h-8 w-8 p-0">
                                      <XIcon className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Badge variant="outline" className="flex-1 justify-center">{c}</Badge>
                                    <Button size="sm" variant="ghost" onClick={() => startEditCarteira(c)} className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-500/20">
                                      <PencilIcon className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => removeCarteira(c)} className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-500/20">
                                      <Trash2Icon className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nova carteira..."
                          value={novaCarteira}
                          onChange={(e) => setNovaCarteira(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addCarteira()}
                        />
                        <Button size="sm" onClick={addCarteira}>Adicionar</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <PlusIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Adicionar</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingItem ? 'Editar Colaborador' : 'Adicionar Novo Colaborador'}</DialogTitle>
                      <DialogDescription>
                        Preencha as informacoes do colaborador em integracao
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="colaborador">Nome do Colaborador *</Label>
                        <Input
                          id="colaborador"
                          placeholder="Nome completo"
                          value={formData.colaborador}
                          onChange={(e) => setFormData({...formData, colaborador: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          placeholder="000.000.000-00"
                          value={formData.cpf}
                          onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admissao">Data de Admissao (DD/MM/AAAA) *</Label>
                        <Input
                          id="admissao"
                          placeholder="DD/MM/AAAA"
                          value={formData.admissao}
                          onChange={(e) => handleAdmissaoChange(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dias">Dias de Treinamento</Label>
                        <Input
                          id="dias"
                          type="number"
                          value={formData.dias}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="turno">Turno</Label>
                        <Select value={formData.turno} onValueChange={(value) => setFormData({...formData, turno: value as any})}>
                          <SelectTrigger id="turno">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MANHA">Manha</SelectItem>
                            <SelectItem value="TARDE">Tarde</SelectItem>
                            <SelectItem value="NOITE">Noite</SelectItem>
                            <SelectItem value="MADRUGADA">Madrugada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="registro">Registro</Label>
                        <Select value={formData.registro} onValueChange={(value) => setFormData({...formData, registro: value as any})}>
                          <SelectTrigger id="registro">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPERADOR(A)">Operador(a)</SelectItem>
                            <SelectItem value="NEGOCIADOR">Negociador</SelectItem>
                            <SelectItem value="INTEGRAL">Integral</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Label htmlFor="dia1">1 Dia</Label>
                        <Select value={formData.dia1} onValueChange={(value) => setFormData({...formData, dia1: value})}>
                          <SelectTrigger id="dia1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vazio">Em Branco</SelectItem>
                            <SelectItem value="PRESENTE">Presente</SelectItem>
                            <SelectItem value="FALTOU">Faltou</SelectItem>
                            <SelectItem value="NAO COMPARECEU">Nao Compareceu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dia2">2 Dia</Label>
                        <Select value={formData.dia2} onValueChange={(value) => setFormData({...formData, dia2: value})}>
                          <SelectTrigger id="dia2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vazio">Em Branco</SelectItem>
                            <SelectItem value="PRESENTE">Presente</SelectItem>
                            <SelectItem value="FALTOU">Faltou</SelectItem>
                            <SelectItem value="NAO COMPARECEU">Nao Compareceu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aplicado">Treinamento Aplicado?</Label>
                        <Select value={formData.aplicado ? 'sim' : 'nao'} onValueChange={(value) => setFormData({...formData, aplicado: value === 'sim'})}>
                          <SelectTrigger id="aplicado">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nao">Nao</SelectItem>
                            <SelectItem value="sim">Sim</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="observacao">Observacao</Label>
                        <Textarea
                          id="observacao"
                          placeholder="Adicione uma observacao sobre o colaborador..."
                          value={formData.observacao}
                          onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                          className="min-h-20"
                        />
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
                        {editingItem ? 'Atualizar' : 'Adicionar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dialog para visualizar tabela completa */}
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TableIcon className="h-5 w-5" />
              Colaboradores Registrados em Integracao
            </DialogTitle>
            <DialogDescription>
              Lista completa de todos os colaboradores em treinamento
            </DialogDescription>
          </DialogHeader>
          
          {/* Filters inside dialog */}
          <div className="flex flex-col sm:flex-row gap-3 py-2">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF..."
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
            <Select value={filterTurno} onValueChange={setFilterTurno}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os Turnos</SelectItem>
                <SelectItem value="MANHA">Manha</SelectItem>
                <SelectItem value="TARDE">Tarde</SelectItem>
                <SelectItem value="NOITE">Noite</SelectItem>
                <SelectItem value="MADRUGADA">Madrugada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="w-12 text-center">QTD</TableHead>
                  <TableHead className="min-w-40">NOME DO COLABORADOR</TableHead>
                  <TableHead className="min-w-32">CPF</TableHead>
                  <TableHead className="min-w-28">ADMISSAO</TableHead>
                  <TableHead className="min-w-20 text-center">DIAS</TableHead>
                  <TableHead className="min-w-28">TURNO</TableHead>
                  <TableHead className="min-w-28">REGISTRO</TableHead>
                  <TableHead className="min-w-24">CARTEIRA</TableHead>
                  <TableHead className="min-w-24">1 DIA</TableHead>
                  <TableHead className="min-w-24">2 DIA</TableHead>
                  <TableHead className="min-w-24">APLICADO?</TableHead>
                  <TableHead className="min-w-40">OBSERVACAO</TableHead>
                  {canEdit && <TableHead className="w-16 text-center">ACOES</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={item.id} className="border-b border-border hover:bg-muted/50">
                    <TableCell className="text-center text-sm font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium text-foreground whitespace-nowrap">{item.colaborador}</TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{item.cpf}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{item.admissao}</TableCell>
                    <TableCell className="text-center text-sm">{item.dias}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{item.turno}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{item.registro}</TableCell>
                    <TableCell className="text-sm"><Badge variant="outline">{item.carteira}</Badge></TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {item.dia1 ? (
                        <div className="flex items-center gap-1">
                          {item.dia1 === 'PRESENTE' && <CheckCircle2Icon className="h-4 w-4 text-green-600" />}
                          {item.dia1 === 'FALTOU' && <MinusCircleIcon className="h-4 w-4 text-yellow-600" />}
                          {item.dia1 === 'NAO COMPARECEU' && <XCircleIcon className="h-4 w-4 text-red-600" />}
                          <span className="text-xs">{item.dia1}</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {item.dia2 ? (
                        <div className="flex items-center gap-1">
                          {item.dia2 === 'PRESENTE' && <CheckCircle2Icon className="h-4 w-4 text-green-600" />}
                          {item.dia2 === 'FALTOU' && <MinusCircleIcon className="h-4 w-4 text-yellow-600" />}
                          {item.dia2 === 'NAO COMPARECEU' && <XCircleIcon className="h-4 w-4 text-red-600" />}
                          <span className="text-xs">{item.dia2}</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {item.aplicado ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">Sim</Badge>
                      ) : (
                        <Badge variant="secondary">Nao</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm max-w-40">
                      {item.observacao ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MessageSquareIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate text-xs">{item.observacao}</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">-</span>}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleEditItem(item)
                              setIsTableDialogOpen(false)
                            }}
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
                                  <AlertCircleIcon className="h-5 w-5" />
                                  Confirmar Exclusao
                                </DialogTitle>
                              </DialogHeader>
                              <p className="text-sm text-foreground">
                                Tem certeza que deseja remover <strong>{item.colaborador}</strong>?
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
          
          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum colaborador encontrado</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Total: <span className="font-medium text-foreground">{filteredData.length}</span> colaboradores
            </p>
            <Button variant="outline" onClick={() => setIsTableDialogOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total em Integracao</p>
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Presentes (2 DIAS)</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.presentes}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{((stats.presentes / stats.total) * 100).toFixed(0)}% do total</p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <CheckCircle2Icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ausentes / FALTOU</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.ausentes}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{((stats.ausentes / stats.total) * 100).toFixed(0)}% do total</p>
              </div>
              <div className="p-2.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                <UserXIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aplicados</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.aplicados}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Aptos para operacao</p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <CheckCircle2Icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Taxa de Presenca</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.taxaPresenca}%</p>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  <span className={stats.taxaPresenca >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                    {stats.taxaPresenca >= 70 ? 'Meta atingida' : 'Abaixo da meta'}
                  </span>
                </div>
              </div>
              <div className={`p-2.5 rounded-lg ${stats.taxaPresenca >= 70 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                <TrendingUpIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Status de Presenca</CardTitle>
            <CardDescription className="text-xs">Distribuicao da presenca no treinamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.presencaStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" />
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
            <CardTitle className="text-sm font-semibold">Por Carteira</CardTitle>
            <CardDescription className="text-xs">Colaboradores por carteira de atuacao</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.porCarteira} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Por Turno</CardTitle>
            <CardDescription className="text-xs">Distribuicao por turno de trabalho</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.porTurno}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
