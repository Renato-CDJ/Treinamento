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
    <Card className="w-full max-w-md mx-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 shadow-2xl shadow-zinc-300/30 dark:shadow-black/40 overflow-hidden relative rounded-3xl">
      {/* Efeito de brilho sutil no topo */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
      
      {/* Header com botoes de tema e ADM */}
      <div className="flex items-center justify-between px-5 pt-5">
        {/* Botao tema - esquerda */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title="Alternar tema"
          className="h-9 w-9 rounded-xl text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {theme === "dark" ? (
            <Sun className="h-[18px] w-[18px] transition-transform duration-300 rotate-0 hover:rotate-90" />
          ) : (
            <Moon className="h-[18px] w-[18px] transition-transform duration-300" />
          )}
        </Button>

        {/* Botao ADM - direita (apenas na tela principal) */}
        {loginMode === "main" && (
          <button
            onClick={() => setLoginMode("admin")}
            className="group flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-orange-500 dark:text-zinc-500 dark:hover:text-orange-400 bg-zinc-100/50 hover:bg-orange-50 dark:bg-zinc-800/50 dark:hover:bg-orange-950/30 border border-transparent hover:border-orange-200/50 dark:hover:border-orange-800/30 rounded-xl transition-all duration-300"
          >
            <ShieldCheck className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
            ADM
          </button>
        )}

        {/* Placeholder para manter alinhamento quando no modo admin */}
        {loginMode === "admin" && <div className="w-16" />}
      </div>

      <CardContent className="pt-6 pb-10 px-8">
        {/* Logo com efeito de glow */}
        <div className="flex justify-center mb-10">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-3 bg-gradient-to-br from-orange-400/20 to-orange-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden ring-2 ring-zinc-200/50 dark:ring-zinc-700/50 shadow-xl transition-all duration-500 group-hover:ring-orange-300/50 dark:group-hover:ring-orange-600/30 group-hover:shadow-orange-500/20 group-hover:scale-[1.02]">
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
        </div>

        {/* Tela principal - Operador */}
        {loginMode === "main" && (
          <div className="space-y-6">
            {/* Botao principal de Operador */}
            <Button
              onClick={handleOperatorAccess}
              disabled={isLoading}
              className="group relative w-full h-14 text-base font-semibold bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-500 hover:to-orange-500 text-white transition-all duration-500 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 active:shadow-md flex items-center justify-center gap-3 rounded-2xl overflow-hidden"
            >
              {/* Efeito de brilho no hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              
              {isLoading ? (
                <span className="relative flex items-center gap-3">
                  <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <span className="relative flex items-center gap-3">
                  <LogIn className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  Entrar como Operador
                </span>
              )}
            </Button>

            {/* Erro */}
            {error && (
              <Alert
                variant="destructive"
                className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Formulario de login ADM */}
        {loginMode === "admin" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header com voltar e badge */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="group flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 bg-transparent hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 rounded-xl transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                Voltar
              </button>
              <div className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-300/30 dark:border-orange-600/30 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/10 to-orange-400/0 animate-pulse" />
                <ShieldCheck className="relative h-4 w-4 text-orange-500 dark:text-orange-400" />
                <span className="relative text-sm font-bold tracking-wide text-orange-600 dark:text-orange-400">
                  ADM
                </span>
              </div>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-5">
              {/* Usuario */}
              <div className="space-y-2.5">
                <label htmlFor="email" className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 tracking-wide">
                  Usuario
                </label>
                <div className="relative flex items-stretch group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-700/50 transition-all duration-300 group-focus-within:bg-orange-100 dark:group-focus-within:bg-orange-900/30">
                      <Mail className="h-4 w-4 text-zinc-400 transition-colors duration-300 group-focus-within:text-orange-500" />
                    </div>
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
                    className="h-14 pl-14 pr-4 flex-1 min-w-0 text-sm font-medium bg-zinc-50/80 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 dark:focus:border-orange-500 dark:focus:ring-orange-500/10 rounded-l-2xl rounded-r-none border-r-0 transition-all duration-300"
                  />
                  <div className="h-14 px-3 sm:px-4 flex items-center bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-800/80 border-2 border-l-0 border-zinc-200 dark:border-zinc-700 rounded-r-2xl shrink-0 transition-all duration-300 group-focus-within:border-orange-400 dark:group-focus-within:border-orange-500 group-focus-within:from-orange-50 group-focus-within:to-orange-50/50 dark:group-focus-within:from-orange-950/30 dark:group-focus-within:to-orange-950/20">
                    <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap transition-colors duration-300 group-focus-within:text-orange-600 dark:group-focus-within:text-orange-400">@gruporoveri.com</span>
                  </div>
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2.5">
                <label htmlFor="password" className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 tracking-wide">
                  Senha
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-700/50 transition-all duration-300 group-focus-within:bg-orange-100 dark:group-focus-within:bg-orange-900/30">
                      <Lock className="h-4 w-4 text-zinc-400 transition-colors duration-300 group-focus-within:text-orange-500" />
                    </div>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="h-14 pl-14 text-sm font-medium bg-zinc-50/80 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 dark:focus:border-orange-500 dark:focus:ring-orange-500/10 rounded-2xl transition-all duration-300"
                  />
                </div>
              </div>

              {/* Erro */}
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Botao Entrar */}
              <Button
                type="submit"
                className="group relative w-full h-14 text-base font-semibold bg-gradient-to-r from-zinc-800 via-zinc-900 to-zinc-800 hover:from-zinc-900 hover:via-zinc-800 hover:to-zinc-900 dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-100 dark:hover:from-white dark:hover:via-zinc-100 dark:hover:to-white dark:text-zinc-900 text-white transition-all duration-500 shadow-lg shadow-zinc-400/20 dark:shadow-zinc-900/30 hover:shadow-xl hover:shadow-zinc-500/30 dark:hover:shadow-zinc-800/40 rounded-2xl flex items-center justify-center gap-2.5 overflow-hidden active:scale-[0.98]"
                disabled={isLoading}
              >
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                {/* Borda sutil brilhante */}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 dark:ring-black/10" />
                
                {isLoading ? (
                  <span className="relative flex items-center gap-2.5">
                    <span className="h-5 w-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  <span className="relative flex items-center gap-2.5">
                    <LogIn className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    Entrar
                  </span>
                )}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
