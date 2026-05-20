"use server"
import { getUsers } from "@/lib/auth-context"
import type { User, LoginSession } from "@/lib/types"

// Tipos
interface AuthResult {
  success: boolean
  user?: Omit<User, "password">
  error?: string
}

const ADMIN_DEFAULT_PASSWORDS = ["rcp@$", "#qualidade@$"]

export async function authenticateUser(username: string, password?: string): Promise<AuthResult> {
  try {
    const users = getUsers()
    const normalizedUsername = username.toLowerCase().trim()

    const user = users.find((u) => u.username.toLowerCase() === normalizedUsername)

    if (!user) {
      return { success: false, error: "Usuário não encontrado" }
    }

    if (user.role === "admin") {
      if (!password) {
        return { success: false, error: "Senha obrigatória para administradores" }
      }

      // Verifica senha individual ou senhas padrão
      const validPassword = user.password ? password === user.password : ADMIN_DEFAULT_PASSWORDS.includes(password)

      if (!validPassword) {
        return { success: false, error: "Senha incorreta" }
      }
    }

    const session: LoginSession = {
      id: `session-${Date.now()}`,
      loginAt: new Date(),
    }

    const updatedUser = {
      ...user,
      lastLoginAt: new Date(),
      isOnline: true,
      loginSessions: [...(user.loginSessions || []), session],
    }

    // Remove senha antes de retornar
    const { password: _, ...userWithoutPassword } = updatedUser

    return { success: true, user: userWithoutPassword }
  } catch (error) {
    console.error("Erro na autenticação:", error)
    return { success: false, error: "Erro ao autenticar" }
  }
}
