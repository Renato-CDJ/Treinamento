"use client"

import type React from "react"
import { useState, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, Mail, Lock, Sun, Moon, ShieldCheck, LogIn, ArrowLeft } from "lucide-react"
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
        // Validar email
        if (!email.trim()) {
          setError("Usuario e obrigatorio")
          setIsLoading(false)
          return
        }

        // Senha e obrigatoria para admins
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
        
        // Login bem sucedido - redirecionar para admin
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
      // Login como operador padrao (sem necessidade de credenciais)
      loginAsOperator(DEFAULT_OPERATOR)
      
      // Redirecionar para a pagina do operador
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
    <Card className="w-full max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-200/50 dark:shadow-black/30 overflow-hidden relative">
      {/* Header com botoes de tema e ADM */}
      <div className="flex items-center justify-between px-4 pt-4">
        {/* Botao tema - esquerda */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title="Alternar tema"
          className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Botao ADM - direita (apenas na tela principal) */}
        {loginMode === "main" && (
          <button
            onClick={() => setLoginMode("admin")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            ADM
          </button>
        )}

        {/* Placeholder para manter alinhamento quando no modo admin */}
        {loginMode === "admin" && <div className="w-16" />}
      </div>

      <CardContent className="pt-4 pb-8 px-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-orange-100 dark:ring-orange-950/50 shadow-lg">
            <Image
              src="/images/grupo_roveri_logo.jpg"
              alt="Grupo Roveri"
              width={80}
              height={80}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>

        {/* Tela principal - Operador */}
        {loginMode === "main" && (
          <div className="space-y-6">
            {/* Botao principal de Operador */}
            <Button
              onClick={handleOperatorAccess}
              disabled={isLoading}
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all duration-300 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 rounded-xl"
            >
              {isLoading ? (
                <span className="flex items-center gap-3">
                  <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Entrar como Operador
                </>
              )}
            </Button>

            {/* Erro */}
            {error && (
              <Alert
                variant="destructive"
                className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300"
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
                className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  ADM
                </span>
              </div>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-5">
              {/* Usuario */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Usuario
                </label>
                <div className="relative flex items-stretch">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
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
                    className="h-12 pl-10 pr-4 flex-1 min-w-0 text-sm bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-300/30 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20 rounded-l-xl rounded-r-none border-r-0 transition-all"
                  />
                  <div className="h-12 px-2 sm:px-3 flex items-center bg-zinc-100 dark:bg-zinc-800 border border-l-0 border-zinc-200 dark:border-zinc-700 rounded-r-xl shrink-0">
                    <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">@gruporoveri.com</span>
                  </div>
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="h-12 pl-10 text-sm bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-300/30 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20 rounded-xl transition-all"
                  />
                </div>
              </div>

              {/* Erro */}
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Botao Entrar */}
              <Button
                type="submit"
                className="w-full h-12 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-200 dark:hover:bg-zinc-100 dark:text-zinc-900 text-white transition-all duration-200 shadow-md hover:shadow-lg rounded-xl flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
