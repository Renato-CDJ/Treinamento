"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"

// Componente animado para o titulo "Roteiro" com efeito laranja e brilho varrendo diagonal
function AnimatedTitle() {
  return (
    <div className="relative cursor-default select-none py-6 w-full flex justify-center">
      <svg 
        viewBox="0 0 700 140" 
        className="w-full max-w-[650px] h-auto overflow-visible"
        role="img" 
        aria-label="Roteiro"
      >
        <defs>
          {/* Gradiente laranja metalico para o texto */}
          <linearGradient id="orangeMetalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffcc80"/>
            <stop offset="15%" stopColor="#ff9800"/>
            <stop offset="30%" stopColor="#ffb74d"/>
            <stop offset="50%" stopColor="#ff6d00"/>
            <stop offset="70%" stopColor="#ff9800"/>
            <stop offset="85%" stopColor="#ffcc80"/>
            <stop offset="100%" stopColor="#ff8f00"/>
          </linearGradient>

          {/* Gradiente do brilho diagonal que varre */}
          <linearGradient id="sweepShine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="white" stopOpacity="0"/>
            <stop offset="0.3" stopColor="white" stopOpacity="0"/>
            <stop offset="0.48" stopColor="white" stopOpacity="0.7"/>
            <stop offset="0.5" stopColor="white" stopOpacity="1"/>
            <stop offset="0.52" stopColor="white" stopOpacity="0.7"/>
            <stop offset="0.7" stopColor="white" stopOpacity="0"/>
            <stop offset="1" stopColor="white" stopOpacity="0"/>
          </linearGradient>

          {/* Filtro de sombra laranja para efeito glow */}
          <filter id="orangeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgba(255,152,0,0.5)"/>
          </filter>

          {/* Clip path do texto para o brilho */}
          <clipPath id="textClip">
            <text 
              x="350" 
              y="100" 
              textAnchor="middle" 
              fontSize="120" 
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="8"
            >
              ROTEIRO
            </text>
          </clipPath>
        </defs>

        {/* Sombra do texto */}
        <text 
          x="350" 
          y="100" 
          textAnchor="middle" 
          fontSize="120" 
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="8"
          fill="rgba(0,0,0,0.35)"
          transform="translate(4, 6)"
        >
          ROTEIRO
        </text>

        {/* Texto principal laranja metalico */}
        <text 
          x="350" 
          y="100" 
          textAnchor="middle" 
          fontSize="120" 
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="8"
          fill="url(#orangeMetalGrad)"
          stroke="rgba(255,200,128,0.4)"
          strokeWidth="1"
          paintOrder="stroke fill"
          filter="url(#orangeGlow)"
        >
          ROTEIRO
        </text>

        {/* Barra de brilho diagonal varrendo sobre o texto */}
        <g clipPath="url(#textClip)">
          <rect 
            x="-100" 
            y="-20" 
            width="120" 
            height="200" 
            fill="url(#sweepShine)"
            style={{
              transform: "skewX(-20deg)",
              animation: "sweepAnim 3s ease-in-out infinite",
            }}
          />
        </g>

        {/* Linha de destaque laranja abaixo */}
        <rect 
          x="175" 
          y="118" 
          width="350" 
          height="4" 
          rx="2"
          fill="url(#orangeMetalGrad)"
          opacity="0.8"
        />

        <style>
          {`
            @keyframes sweepAnim {
              0% { transform: translateX(-150px) skewX(-20deg); }
              100% { transform: translateX(850px) skewX(-20deg); }
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
