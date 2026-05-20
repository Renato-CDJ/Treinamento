"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"

// Componente animado para o titulo "Roteiro" com efeito de revelacao
function AnimatedTitle() {
  const letters = "Roteiro".split("")
  
  return (
    <div className="relative cursor-default select-none py-8">
      <h1 className="relative text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight mb-4">
        <span className="relative inline-flex overflow-hidden">
          {/* Texto base - invisivel inicialmente, revelado pela animacao */}
          {letters.map((letter, index) => (
            <span
              key={index}
              className="relative inline-block"
              style={{
                animation: `revealLetter 0.6s ease-out ${index * 0.12}s forwards`,
                opacity: 0,
                transform: "translateY(20px)",
              }}
            >
              <span className="bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(249,115,22,0.3)]">
                {letter}
              </span>
            </span>
          ))}
          
          {/* Barra escura que passa revelando o texto */}
          <span
            className="absolute inset-y-0 w-[120%] bg-gradient-to-r from-transparent via-zinc-900/90 dark:via-zinc-100/90 to-transparent pointer-events-none"
            style={{
              animation: "sweepReveal 1.2s ease-in-out forwards",
              left: "-120%",
            }}
          />
        </span>
      </h1>
      
      {/* Linha de luz animada abaixo do titulo */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-40 h-[3px] overflow-hidden rounded-full"
        style={{ 
          opacity: 0,
          animation: "fadeIn 0.5s ease-out 1s forwards"
        }}
      >
        <div 
          className="h-full w-full bg-gradient-to-r from-transparent via-orange-500 to-transparent"
          style={{
            animation: "pulse 2.5s ease-in-out 1.2s infinite",
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes revealLetter {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        @keyframes sweepReveal {
          0% {
            left: -120%;
          }
          100% {
            left: 120%;
          }
        }
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 0.7;
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
