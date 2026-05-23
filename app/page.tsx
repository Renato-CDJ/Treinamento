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
        viewBox="20 -30 660 190"
        className="w-full max-w-[520px] h-auto overflow-visible"
        role="img" 
        aria-label="Roteiro"
      >
        <defs>
          {/* Filtro de sombra e brilho para efeito 3D */}
          <filter id="orangeFX" x="-15%" y="-30%" width="130%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="rgba(255,87,34,0.5)"/>
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(255,140,0,0.3)"/>
          </filter>

          {/* Mascara de brilho varrendo */}
          <mask id="shineMask">
            <rect x="0" y="-30" width="700" height="190" fill="white"/>
            <rect 
              x="-200" 
              y="-30" 
              width="160" 
              height="190" 
              fill="url(#shineHighlight)"
              style={{ animation: "sweep 4.5s linear infinite" }}
            />
          </mask>

          <linearGradient id="shineHighlight" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0"    stopColor="black" stopOpacity="0"/>
            <stop offset="0.4"  stopColor="white" stopOpacity="0.7"/>
            <stop offset="0.55" stopColor="white" stopOpacity="1"/>
            <stop offset="1"    stopColor="black" stopOpacity="0"/>
          </linearGradient>

          {/* Gradiente da barra: transparente → laranja → branco (pico) → laranja → transparente */}
          <linearGradient id="barLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#ff6600" stopOpacity="0"/>
            <stop offset="25%"  stopColor="#ff6600" stopOpacity="1"/>
            <stop offset="50%"  stopColor="#ffcc88" stopOpacity="1"/>
            <stop offset="75%"  stopColor="#ff6600" stopOpacity="1"/>
            <stop offset="100%" stopColor="#ff6600" stopOpacity="0"/>
          </linearGradient>

          {/* Glow da barra */}
          <filter id="barGlow" x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Sombra do texto */}
        <text 
          x="350" 
          y="100" 
          textAnchor="middle" 
          fontSize="145" 
          fontWeight="800"
          fontFamily="'Arial Black', 'Helvetica Neue', sans-serif"
          letterSpacing="-2"
          fill="rgba(0,0,0,0.3)"
          transform="translate(2, 4)"
        >
          Roteiro
        </text>

        {/* Texto principal laranja com mascara de brilho */}
        <g mask="url(#shineMask)">
          <text 
            x="350" 
            y="100" 
            textAnchor="middle" 
            fontSize="145" 
            fontWeight="800"
            fontFamily="'Arial Black', 'Helvetica Neue', sans-serif"
            letterSpacing="-2"
            fill="#ff6600"
            filter="url(#orangeFX)"
          >
            Roteiro
          </text>
        </g>

        {/* Barra fina laranja afilada nas pontas com animação de encolher/esticar */}
        <g
          filter="url(#barGlow)"
          style={{
            animation: "barStretch 2.8s ease-in-out infinite",
            transformOrigin: "350px 125px",
          }}
        >
          {/* Linha principal */}
          <line x1="100" y1="125" x2="600" y2="125" stroke="url(#barLineGrad)" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Brilho central mais intenso */}
          <ellipse cx="350" cy="125" rx="80" ry="1.5" fill="#ffcc88" opacity="0.9"/>
        </g>

        <style>
          {`
            @keyframes sweep {
              0%   { transform: translateX(-200px) skewX(-18deg); }
              100% { transform: translateX(900px)  skewX(-18deg); }
            }
            @keyframes barStretch {
              0%   { transform: scaleX(0.45); opacity: 0.6; }
              50%  { transform: scaleX(1);    opacity: 1;   }
              100% { transform: scaleX(0.45); opacity: 0.6; }
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
    <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 overflow-x-hidden relative">
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

        {/* Crédito - canto inferior direito */}
        <div className="absolute bottom-4 right-5 select-none" aria-label="Desenvolvido por Renato Calixto">
          <span
            className="text-zinc-400 dark:text-zinc-600 text-xs font-mono overflow-hidden whitespace-nowrap inline-block"
            style={{ animation: "typeCredit 6s ease-in-out infinite" }}
          >
            Desenvolvido por: Renato Calixto
          </span>
          <style>{`
            @keyframes typeCredit {
              0%   { width: 0ch;   opacity: 0;   }
              5%   { opacity: 1;                 }
              55%  { width: 33ch;  opacity: 1;   }
              75%  { width: 33ch;  opacity: 1;   }
              90%  { width: 0ch;   opacity: 0;   }
              100% { width: 0ch;   opacity: 0;   }
            }
          `}</style>
        </div>
    </div>
  )
}
