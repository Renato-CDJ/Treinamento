"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface BackButtonProps {
  onClick?: () => void
  label?: string
  className?: string
}

export function BackButton({ onClick, label = "Voltar", className = "" }: BackButtonProps) {
  const router = useRouter()

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (onClick) {
          onClick()
        } else {
          router.back()
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [onClick, router])

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.back()
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={`fixed top-4 left-4 z-50 shadow-lg ${className}`}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
      <span className="ml-2 text-xs text-muted-foreground">(ESC)</span>
    </Button>
  )
}
