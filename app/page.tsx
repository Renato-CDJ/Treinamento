"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"

// Componente animado para o titulo "Roteiro" com efeito de hover impactante
function AnimatedTitle() {
  return (
    <div className="relative cursor-default select-none py-8">
      <h1 className="relative text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight mb-4 group">
        <span 
          className="inline-block bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 bg-clip-text text-transparent bg-[length:200%_100%] transition-all duration-500 ease-out group-hover:scale-110 group-hover:drop-shadow-[0_0_25px_rgba(249,115,22,0.5)]"
          style={{
            animation: "shimmer 4s ease-in-out infinite",
          }}
        >
          Roteiro
        </span>
      </h1>
      
      {/* Linha de luz animada abaixo do titulo */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-[3px] overflow-hidden rounded-full"
        style={{ opacity: 0.7 }}
      >
        <div 
          className="h-full w-full bg-gradient-to-r from-transparent via-orange-500 to-transparent"
          style={{
            animation: "pulse 2s ease-in-out infinite",
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
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scaleX(0.8);
          }
          50% {
            opacity: 1;
            transform: scaleX(1.2);
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
            
<p className="text-zinc-600 dark:text-zinc-300 text-xl sm:text-2xl font-semibold tracking-wide">
              Sistema de Atendimento
            </p>
          </div>

          {/* Formulario */}
          <LoginForm />
        </div>
    </div>
  )
}
