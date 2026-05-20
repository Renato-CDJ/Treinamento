"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { QualityCenterLayout } from "@/components/quality-center/quality-center-layout"

export default function QualityCenterPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated && mounted) {
      router.push("/")
    }
  }, [isLoading, isAuthenticated, router, mounted])

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return <QualityCenterLayout />
}
