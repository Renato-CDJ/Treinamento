"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"

// Componente animado para o titulo "Roteiro" com efeito de shimmer elegante
function AnimatedTitle() {
  return (
    <div className="relative cursor-default select-none py-6">
      <h1 className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4">
        <span 
          className="inline-block bg-gradient-to-r from-orange-600 via-amber-400 via-orange-500 to-orange-600 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer"
          style={{
            animation: "shimmer 3s ease-in-out infinite",
          }}
        >
          Roteiro
        </span>
      </h1>
      
      {/* Linha de luz que passa por baixo do texto */}
      <div 
        className="absolute bottom-2 left-0 right-0 h-[2px] overflow-hidden"
        style={{ opacity: 0.6 }}
      >
        <div 
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-orange-400 to-transparent"
          style={{
            animation: "slideLight 2.5s ease-in-out infinite",
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0%, 100% {
            backgroundPosition: 0% 50%;
          }
          50% {
            backgroundPosition: 100% 50%;
          }
        }
        @keyframes slideLight {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  )
}

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/operator")
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange-500 border-t-transparent mx-auto mb-3"></div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 overflow-x-hidden">
        <div className="w-full max-w-md px-2 sm:px-0">
          {/* Titulo */}
          <div className="mb-8 sm:mb-10 text-center">
            <AnimatedTitle />
            
<p className="text-zinc-600 dark:text-zinc-300 text-lg font-semibold tracking-wide">
              Sistema de Atendimento
            </p>
          </div>

          {/* Formulario */}
          <LoginForm />
        </div>
    </div>
  )
}
