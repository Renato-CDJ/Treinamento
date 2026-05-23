"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminPageHeaderProps {
  icon: LucideIcon
  title: string
  description: string
  children?: React.ReactNode
  className?: string
}

export function AdminPageHeader({ icon: Icon, title, description, children, className }: AdminPageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h2>
        </div>
        <p className="text-sm text-muted-foreground pl-[52px]">{description}</p>
      </div>
      {children && (
        <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}
