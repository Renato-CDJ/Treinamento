'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ColaboradorIntegracao, ColaboradorDesligamento } from '@/types/dashboard'
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
  LineChart,
  Line,
} from 'recharts'

interface DashboardChartsProps {
  integracaoData: ColaboradorIntegracao[]
  desligamentosData: ColaboradorDesligamento[]
  activeTab: 'integracao' | 'desligamentos'
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  destructive: 'hsl(var(--destructive))',
  warning: 'hsl(var(--warning))',
  info: 'hsl(var(--info))',
  muted: 'hsl(var(--muted))',
}

const CHART_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4']

export function DashboardCharts({ integracaoData, desligamentosData, activeTab }: DashboardChartsProps) {
  // Dados para gráficos de Integração
  const integracaoChartData = useMemo(() => {
    const porCarteira = integracaoData.reduce((acc, item) => {
      acc[item.carteira] = (acc[item.carteira] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const porTurno = integracaoData.reduce((acc, item) => {
      acc[item.turno] = (acc[item.turno] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const presencaStatus = {
      'Presentes (2 dias)': integracaoData.filter(d => d.dia1 === 'PRESENTE' && d.dia2 === 'PRESENTE').length,
      'Faltou 1 dia': integracaoData.filter(d => 
        (d.dia1 === 'PRESENTE' && d.dia2 !== 'PRESENTE') || 
        (d.dia1 !== 'PRESENTE' && d.dia2 === 'PRESENTE')
      ).length,
      'Não compareceu': integracaoData.filter(d => d.dia1 !== 'PRESENTE' && d.dia2 !== 'PRESENTE').length,
    }

    return {
      porCarteira: Object.entries(porCarteira).map(([name, value]) => ({ name, value })),
      porTurno: Object.entries(porTurno).map(([name, value]) => ({ name, value })),
      presenca: Object.entries(presencaStatus).map(([name, value]) => ({ name, value })),
    }
  }, [integracaoData])

  // Dados para gráficos de Desligamentos
  const desligamentosChartData = useMemo(() => {
    const porCarteira = desligamentosData.reduce((acc, item) => {
      acc[item.carteira] = (acc[item.carteira] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const porMotivo = desligamentosData.reduce((acc, item) => {
      const motivo = item.motivo.length > 20 ? item.motivo.slice(0, 20) + '...' : item.motivo
      acc[motivo] = (acc[motivo] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const porStatus = {
      'Com Aviso Prévio': desligamentosData.filter(d => d.status === 'COM AVISO PRÉVIO').length,
      'Sem Aviso Prévio': desligamentosData.filter(d => d.status === 'SEM AVISO PRÉVIO').length,
    }

    // Tempo de permanência
    const faixasPermanencia = {
      '0-90 dias': desligamentosData.filter(d => d.dias <= 90).length,
      '91-180 dias': desligamentosData.filter(d => d.dias > 90 && d.dias <= 180).length,
      '181-365 dias': desligamentosData.filter(d => d.dias > 180 && d.dias <= 365).length,
      '1-2 anos': desligamentosData.filter(d => d.dias > 365 && d.dias <= 730).length,
      '2+ anos': desligamentosData.filter(d => d.dias > 730).length,
    }

    return {
      porCarteira: Object.entries(porCarteira).map(([name, value]) => ({ name, value })),
      porMotivo: Object.entries(porMotivo).map(([name, value]) => ({ name, value })),
      porStatus: Object.entries(porStatus).map(([name, value]) => ({ name, value })),
      permanencia: Object.entries(faixasPermanencia).map(([name, value]) => ({ name, value })),
    }
  }, [desligamentosData])

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
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

  if (activeTab === 'integracao') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Gráfico de Presença */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Status de Presença</CardTitle>
            <CardDescription className="text-xs">Distribuição da presença no treinamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={integracaoChartData.presenca}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {integracaoChartData.presenca.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
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

        {/* Gráfico por Carteira */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Por Carteira</CardTitle>
            <CardDescription className="text-xs">Colaboradores por carteira de atuação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={integracaoChartData.porCarteira} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico por Turno */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Por Turno</CardTitle>
            <CardDescription className="text-xs">Distribuição por turno de trabalho</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={integracaoChartData.porTurno}>
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
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Gráfico por Status */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Status do Desligamento</CardTitle>
          <CardDescription className="text-xs">Com ou sem aviso prévio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={desligamentosChartData.porStatus}
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

      {/* Gráfico de Permanência */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Tempo de Permanência</CardTitle>
          <CardDescription className="text-xs">Faixas de tempo na empresa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={desligamentosChartData.permanencia}>
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

      {/* Gráfico por Motivo */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Por Motivo</CardTitle>
          <CardDescription className="text-xs">Principais motivos de desligamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={desligamentosChartData.porMotivo} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
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
  )
}
