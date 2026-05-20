"use client"

import type React from "react"
import { useState, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, Mail, Lock, Sun, Moon, ShieldCheck, User, ArrowLeft } from "lucide-react"
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

type LoginMode = "selection" | "admin" | "operator"

export const LoginForm = memo(function LoginForm() {
  const [loginMode, setLoginMode] = useState<LoginMode>("selection")
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
    setLoginMode("selection")
    setEmail("")
    setPassword("")
    setError("")
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
      {/* Botao tema */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title="Alternar tema"
          className="h-9 w-9 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>

      <CardContent className="pt-8 pb-8 px-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-zinc-100 dark:ring-zinc-800">
            <Image
              src="/images/grupo_roveri_logo.jpg"
              alt="Grupo Roveri"
              width={64}
              height={64}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>

        {/* Selecao de modo de login */}
        {loginMode === "selection" && (
          <div className="space-y-4">
            <p className="text-center text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Selecione o tipo de acesso
            </p>
            
            {/* Botao ADM */}
            <Button
              onClick={() => setLoginMode("admin")}
              className="w-full h-14 text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3"
            >
              <ShieldCheck className="h-5 w-5" />
              ADM
            </Button>

            {/* Botao Operador */}
            <Button
              onClick={handleOperatorAccess}
              disabled={isLoading}
              variant="outline"
              className="w-full h-14 text-sm font-semibold border-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 dark:text-orange-400 dark:border-orange-500 transition-all duration-200 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <>
                  <User className="h-5 w-5" />
                  Operador
                </>
              )}
            </Button>
          </div>
        )}

        {/* Formulario de login ADM */}
        {loginMode === "admin" && (
          <div className="space-y-4">
            {/* Botao voltar */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="flex items-center justify-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Acesso ADM
              </span>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              {/* Usuario */}
              <div className="space-y-2">
                <label htmlFor="email" className="sr-only">
                  Usuario
                </label>
                <div className="relative flex items-stretch">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 z-10" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="Usuario"
                    value={email}
                    onChange={(e) => {
                      const value = e.target.value.split("@")[0]
                      setEmail(value)
                      setError("")
                    }}
                    required
                    autoComplete="username"
                    disabled={isLoading}
                    className="h-12 pl-10 pr-4 flex-1 min-w-0 text-sm bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded-r-none border-r-0"
                  />
                  <div className="h-12 px-2 sm:px-3 flex items-center bg-zinc-100 dark:bg-zinc-800 border border-l-0 border-zinc-200 dark:border-zinc-700 rounded-r-md shrink-0">
                    <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">@gruporoveri.com</span>
                  </div>
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <label htmlFor="password" className="sr-only">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="h-12 pl-10 text-sm bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
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
                className="w-full h-12 text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white transition-all duration-200 shadow-sm hover:shadow-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Erro geral (para modo selecao) */}
        {loginMode === "selection" && error && (
          <Alert
            variant="destructive"
            className="mt-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
})
