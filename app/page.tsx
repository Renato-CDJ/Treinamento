"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"

// Componente animado para o titulo "Roteiro" com efeito laranja e brilho varrendo
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
          {/* Gradiente laranja para o texto */}
          <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff5722"/>
            <stop offset="25%" stopColor="#ff7043"/>
            <stop offset="50%" stopColor="#ff9800"/>
            <stop offset="75%" stopColor="#ff7043"/>
            <stop offset="100%" stopColor="#ff5722"/>
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
            <stop offset="0.45" stopColor="white" stopOpacity="0.75"/>
            <stop offset="0.55" stopColor="white" stopOpacity="0.95"/>
            <stop offset="1" stopColor="white" stopOpacity="0"/>
          </linearGradient>

          {/* Filtro de sombra e brilho para efeito 3D */}
          <filter id="orangeFX" x="-15%" y="-25%" width="130%" height="150%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="rgba(255,87,34,0.4)"/>
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(255,255,255,0.2)"/>
          </filter>

          {/* Filtro para as barras */}
          <filter id="barFX" x="-15%" y="-25%" width="130%" height="150%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.4)"/>
          </filter>

          {/* Mascara de brilho varrendo - exatamente como no original */}
          <mask id="shineMask">
            <rect width="100%" height="100%" fill="white"/>
            <rect 
              className="shine-rect" 
              x="-200" 
              y="0" 
              width="150" 
              height="120" 
              fill="url(#shineHighlight)"
              style={{
                animation: "sweep 4.5s linear infinite",
              }}
            />
          </mask>

          <linearGradient id="shineHighlight" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="black" stopOpacity="0"/>
            <stop offset="0.45" stopColor="white" stopOpacity="0.85"/>
            <stop offset="0.55" stopColor="white" stopOpacity="1"/>
            <stop offset="1" stopColor="black" stopOpacity="0"/>
          </linearGradient>
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
          fill="rgba(0,0,0,0.25)"
          transform="translate(3, 6)"
        >
          ROTEIRO
        </text>

        {/* Texto principal laranja com mascara de brilho */}
        <g mask="url(#shineMask)">
          <text 
            x="300" 
            y="85" 
            textAnchor="middle" 
            fontSize="95" 
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="4"
            fill="url(#orangeGrad)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
            paintOrder="stroke fill"
            filter="url(#orangeFX)"
          >
            ROTEIRO
          </text>
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
            @keyframes sweep {
              0% { transform: translateX(-200px) skewX(-18deg); }
              100% { transform: translateX(800px) skewX(-18deg); }
            }
            .shine-rect {
              transform-origin: center;
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
