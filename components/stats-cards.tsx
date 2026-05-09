'use client'

import { Card, CardContent } from '@/components/ui/card'
import { 
  UsersIcon, 
  UserCheckIcon, 
  UserXIcon, 
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  CalendarIcon,
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'default' | 'success' | 'danger' | 'warning' | 'info'
}

const colorClasses = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  danger: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
}

function StatCard({ title, value, subtitle, icon, trend, trendValue, color = 'default' }: StatCardProps) {
  return (
    <Card className="bg-card border-border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${
                trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 
                trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
              }`}>
                {trend === 'up' && <TrendingUpIcon className="h-3 w-3" />}
                {trend === 'down' && <TrendingDownIcon className="h-3 w-3" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface IntegracaoStatsProps {
  total: number
  presentes: number
  aplicados: number
  taxaPresenca: number
}

export function IntegracaoStats({ total, presentes, aplicados, taxaPresenca }: IntegracaoStatsProps) {
  const ausentes = total - presentes

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <StatCard
        title="Total em Integração"
        value={total}
        subtitle="Colaboradores"
        icon={<UsersIcon className="h-5 w-5" />}
        color="info"
      />
      <StatCard
        title="Presentes (2 dias)"
        value={presentes}
        subtitle={`${((presentes / total) * 100).toFixed(0)}% do total`}
        icon={<UserCheckIcon className="h-5 w-5" />}
        color="success"
      />
      <StatCard
        title="Ausentes / Faltou"
        value={ausentes}
        subtitle={`${((ausentes / total) * 100).toFixed(0)}% do total`}
        icon={<UserXIcon className="h-5 w-5" />}
        color="danger"
      />
      <StatCard
        title="Aplicados"
        value={aplicados}
        subtitle="Aptos para operação"
        icon={<CheckCircle2Icon className="h-5 w-5" />}
        color="success"
      />
      <StatCard
        title="Taxa de Presença"
        value={`${taxaPresenca}%`}
        subtitle="Média geral"
        icon={<TrendingUpIcon className="h-5 w-5" />}
        trend={taxaPresenca >= 70 ? 'up' : 'down'}
        trendValue={taxaPresenca >= 70 ? 'Meta atingida' : 'Abaixo da meta'}
        color={taxaPresenca >= 70 ? 'success' : 'warning'}
      />
    </div>
  )
}

interface DesligamentosStatsProps {
  total: number
  comAviso: number
  semAviso: number
  mediaDias: number
}

export function DesligamentosStats({ total, comAviso, semAviso, mediaDias }: DesligamentosStatsProps) {
  const formatDias = (dias: number) => {
    if (dias >= 365) {
      const anos = Math.floor(dias / 365)
      const meses = Math.floor((dias % 365) / 30)
      return `${anos}a ${meses}m`
    }
    if (dias >= 30) {
      const meses = Math.floor(dias / 30)
      return `${meses} meses`
    }
    return `${dias} dias`
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Desligados"
        value={total}
        subtitle="Colaboradores"
        icon={<UsersIcon className="h-5 w-5" />}
        color="info"
      />
      <StatCard
        title="Com Aviso Prévio"
        value={comAviso}
        subtitle={`${((comAviso / total) * 100).toFixed(0)}% do total`}
        icon={<CheckCircle2Icon className="h-5 w-5" />}
        color="success"
      />
      <StatCard
        title="Sem Aviso Prévio"
        value={semAviso}
        subtitle={`${((semAviso / total) * 100).toFixed(0)}% do total`}
        icon={<AlertTriangleIcon className="h-5 w-5" />}
        color="danger"
      />
      <StatCard
        title="Média Permanência"
        value={formatDias(mediaDias)}
        subtitle={`${mediaDias} dias em média`}
        icon={<ClockIcon className="h-5 w-5" />}
        color="warning"
      />
    </div>
  )
}
