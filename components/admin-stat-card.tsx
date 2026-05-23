"use client"

import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AdminStatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  variant?: "default" | "success" | "warning" | "danger" | "info"
  className?: string
}

const variantStyles = {
  default: {
    icon: "text-orange-500/30",
    iconBg: "bg-orange-500/10",
    value: "text-foreground",
  },
  success: {
    icon: "text-emerald-500/30",
    iconBg: "bg-emerald-500/10",
    value: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    icon: "text-amber-500/30",
    iconBg: "bg-amber-500/10",
    value: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    icon: "text-red-500/30",
    iconBg: "bg-red-500/10",
    value: "text-red-600 dark:text-red-400",
  },
  info: {
    icon: "text-blue-500/30",
    iconBg: "bg-blue-500/10",
    value: "text-blue-600 dark:text-blue-400",
  },
}

export function AdminStatCard({ icon: Icon, label, value, trend, variant = "default", className }: AdminStatCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card className={cn("border-border/60 shadow-sm hover:shadow-md transition-shadow", className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={cn("text-2xl font-bold", styles.value)}>{value}</p>
            {trend && (
              <p className={cn(
                "text-xs font-medium",
                trend.positive ? "text-emerald-500" : "text-red-500"
              )}>
                {trend.positive ? "+" : ""}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", styles.iconBg)}>
            <Icon className={cn("h-6 w-6", styles.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
