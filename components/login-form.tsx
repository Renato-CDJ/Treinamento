"use client"

import type React from "react"
import { useState, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, Mail, Lock, Sun, Moon, ShieldCheck, LogIn, ArrowLeft, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTheme } from "next-themes"
import Image from "next/image"

// Usuario operador padrao registrado no codigo (sem necessidade de banco de dados)
const DEFAULT_OPERATOR = {
  id: "default-operator-001",
  username: "operador",
  fullName: "Operador",
  email: "operador@gruporoveri.com",
  role: "operator" as const,
  isActive: true,
  isOnline: true,
}

type LoginMode = "main" | "admin"

export const LoginForm = memo(function LoginForm() {
  const [loginMode, setLoginMode] = useState<LoginMode>("main")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { theme, setTheme } = useTheme()
  const { login, loginAsOperator } = useAuth()

  const handleAdminSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError("")
      setIsLoading(true)

      try {
        if (!email.trim()) {
          setError("Usuario e obrigatorio")
          setIsLoading(false)
          return
        }

        if (!password) {
          setError("Senha obrigatoria para administradores")
          setIsLoading(false)
          return
        }
        
        const result = await login(email.trim(), password)
        
        if (!result.success) {
          setError(result.error || "Erro ao fazer login")
          setIsLoading(false)
          return
        }
        
        window.location.href = "/admin"
      } catch (err) {
        setError("Erro ao fazer login")
        setIsLoading(false)
      }
    },
    [email, password, login],
  )

  const handleOperatorAccess = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      loginAsOperator(DEFAULT_OPERATOR)
      window.location.href = "/operator"
    } catch (err) {
      setError("Erro ao acessar como operador")
      setIsLoading(false)
    }
  }, [loginAsOperator])

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  const handleBack = useCallback(() => {
    setLoginMode("main")
    setEmail("")
    setPassword("")
    setError("")
  }, [])

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card principal com glassmorphism */}
      <div className="relative">
        {/* Glow effect sutil */}
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-orange-400/10 to-orange-500/20 rounded-3xl blur-xl opacity-60 dark:opacity-40" />
        
        {/* Card */}
        <div className="relative bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-700/50 rounded-3xl shadow-2xl shadow-zinc-300/30 dark:shadow-black/40 overflow-hidden">
          {/* Header com controles */}
          <div className="flex items-center justify-between px-6 pt-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title="Alternar tema"
              className="h-10 w-10 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 transition-all duration-200"
            >
              {theme === "dark" ? (
                <Sun className="h-4.5 w-4.5" />
              ) : (
                <Moon className="h-4.5 w-4.5" />
              )}
            </Button>

            {loginMode === "main" && (
              <button
                onClick={() => setLoginMode("admin")}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 rounded-xl transition-all duration-200"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Administrador
              </button>
            )}

            {loginMode === "admin" && <div className="w-24" />}
          </div>

          {/* Conteudo */}
          <div className="px-8 pb-10 pt-8">
            {/* Logo com efeito de destaque */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-br from-orange-400/30 to-orange-600/30 rounded-3xl blur-lg" />
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden ring-2 ring-orange-200/50 dark:ring-orange-700/30 shadow-xl">
                  <Image
                    src="/images/grupo_roveri_logo.jpg"
                    alt="Grupo Roveri"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
              </div>
              <h1 className="mt-6 text-xl font-bold text-zinc-800 dark:text-zinc-100">
                Bem-vindo
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Sistema de Treinamento
              </p>
            </div>

            {/* Tela principal - Operador */}
            {loginMode === "main" && (
              <div className="space-y-5">
                {/* Botao principal estilizado */}
                <Button
                  onClick={handleOperatorAccess}
                  disabled={isLoading}
                  className="group w-full h-14 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 rounded-2xl border-0"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-3">
                      <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Entrando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <LogIn className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                      Entrar como Operador
                      <Sparkles className="h-4 w-4 opacity-70" />
                    </span>
                  )}
                </Button>

                {/* Divisor sutil */}
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent" />
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">ou</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent" />
                </div>

                {/* Texto informativo */}
                <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
                  Acesse com suas credenciais de administrador clicando no botao acima
                </p>

                {/* Erro */}
                {error && (
                  <Alert
                    variant="destructive"
                    className="bg-red-50/80 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Formulario de login ADM */}
            {loginMode === "admin" && (
              <div className="space-y-6">
                {/* Header com voltar e badge */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors group"
                  >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    Voltar
                  </button>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200/80 dark:border-amber-800/50 rounded-xl">
                    <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      Admin
                    </span>
                  </div>
                </div>

                <form onSubmit={handleAdminSubmit} className="space-y-5">
                  {/* Usuario */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      Usuario
                    </label>
                    <div className="relative flex items-stretch">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Mail className="h-4 w-4 text-zinc-400" />
                      </div>
                      <Input
                        id="email"
                        type="text"
                        placeholder="seu.usuario"
                        value={email}
                        onChange={(e) => {
                          const value = e.target.value.split("@")[0]
                          setEmail(value)
                          setError("")
                        }}
                        required
                        autoComplete="username"
                        disabled={isLoading}
                        className="h-12 pl-11 pr-4 flex-1 min-w-0 text-sm bg-zinc-50/80 dark:bg-zinc-800/60 border-zinc-200/80 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 dark:focus:border-orange-500/60 dark:focus:ring-orange-500/20 rounded-l-xl rounded-r-none border-r-0 transition-all"
                      />
                      <div className="h-12 px-3 flex items-center bg-zinc-100/80 dark:bg-zinc-800/80 border border-l-0 border-zinc-200/80 dark:border-zinc-700/60 rounded-r-xl shrink-0">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap font-medium">@gruporoveri.com</span>
                      </div>
                    </div>
                  </div>

                  {/* Senha */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        disabled={isLoading}
                        className="h-12 pl-11 text-sm bg-zinc-50/80 dark:bg-zinc-800/60 border-zinc-200/80 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 dark:focus:border-orange-500/60 dark:focus:ring-orange-500/20 rounded-xl transition-all"
                      />
                    </div>
                  </div>

                  {/* Erro */}
                  {error && (
                    <Alert
                      variant="destructive"
                      className="bg-red-50/80 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Botao Entrar */}
                  <Button
                    type="submit"
                    className="group w-full h-12 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white transition-all duration-200 shadow-lg hover:shadow-xl rounded-xl flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        Entrando...
                      </span>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        Entrar
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer discreto */}
      <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-6">
        Grupo Roveri - Sistema de Treinamento
      </p>
    </div>
  )
})
