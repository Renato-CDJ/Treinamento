"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"

// Componente animado para o titulo "Roteiro" com efeito cromado e brilho varrendo (inspirado no Grupo Roveri)
function AnimatedTitle() {
  return (
    <div className="relative cursor-default select-none py-4 w-full flex justify-center">
      <svg 
        viewBox="0 0 600 120" 
        className="w-full max-w-[500px] h-auto overflow-visible"
        role="img" 
        aria-label="Roteiro"
      >
        <defs>
          {/* Gradiente cromado para as letras */}
          <linearGradient id="chromeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dcdcdc"/>
            <stop offset="10%" stopColor="#ffffff"/>
            <stop offset="22%" stopColor="#bdbdbd"/>
            <stop offset="35%" stopColor="#f5f5f5"/>
            <stop offset="50%" stopColor="#a8a8a8"/>
            <stop offset="65%" stopColor="#ffffff"/>
            <stop offset="78%" stopColor="#cfcfcf"/>
            <stop offset="100%" stopColor="#b0b0b0"/>
          </linearGradient>

          {/* Gradiente laranja para barras decorativas */}
          <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffb300"/>
            <stop offset="50%" stopColor="#ff8f00"/>
            <stop offset="100%" stopColor="#ff6d00"/>
          </linearGradient>

          {/* Gradiente do brilho que varre */}
          <linearGradient id="shineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="white" stopOpacity="0"/>
            <stop offset="0.4" stopColor="white" stopOpacity="0.4"/>
            <stop offset="0.5" stopColor="white" stopOpacity="0.8"/>
            <stop offset="0.6" stopColor="white" stopOpacity="0.4"/>
            <stop offset="1" stopColor="white" stopOpacity="0"/>
          </linearGradient>

          {/* Clip path para o texto */}
          <clipPath id="textClip">
            <text 
              x="300" 
              y="85" 
              textAnchor="middle" 
              fontSize="95" 
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="4"
            >
              ROTEIRO
            </text>
          </clipPath>

          {/* Filtro de sombra para efeito 3D */}
          <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="rgba(0,0,0,0.5)"/>
          </filter>

          {/* Filtro para as barras */}
          <filter id="barFX" x="-15%" y="-25%" width="130%" height="150%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.4)"/>
          </filter>
        </defs>

        {/* Sombra do texto */}
        <text 
          x="300" 
          y="85" 
          textAnchor="middle" 
          fontSize="95" 
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="4"
          fill="rgba(0,0,0,0.3)"
          transform="translate(3, 5)"
        >
          ROTEIRO
        </text>

        {/* Texto principal com gradiente cromado */}
        <text 
          x="300" 
          y="85" 
          textAnchor="middle" 
          fontSize="95" 
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="4"
          fill="url(#chromeGrad)"
          stroke="rgba(80,80,80,0.4)"
          strokeWidth="0.5"
          paintOrder="stroke fill"
        >
          ROTEIRO
        </text>

        {/* Brilho varrendo (sweep shine) */}
        <g clipPath="url(#textClip)">
          <rect 
            x="-200" 
            y="0" 
            width="200" 
            height="120" 
            fill="url(#shineGrad)"
            transform="skewX(-20)"
            style={{
              animation: "sweepShine 3.5s ease-in-out infinite",
            }}
          />
        </g>

        {/* Barras laranjas decorativas abaixo */}
        <g filter="url(#barFX)">
          <rect 
            x="150" 
            y="100" 
            width="300" 
            height="5" 
            rx="2.5"
            fill="url(#barGrad)"
          />
        </g>

        <style>
          {`
            @keyframes sweepShine {
              0% { transform: translateX(-200px) skewX(-20deg); }
              100% { transform: translateX(800px) skewX(-20deg); }
            }
          `}
        </style>
      </svg>
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
          <div className="mb-6 sm:mb-8 text-center">
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
