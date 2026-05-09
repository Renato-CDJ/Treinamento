'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { User, UserRole } from '@/types/dashboard'
import { mockUsers } from '@/data/mock-data'

interface AuthContextType {
  currentUser: User | null
  login: (email: string) => boolean
  logout: () => void
  hasPermission: (requiredRole: UserRole[]) => boolean
  switchUser: (userId: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const roleHierarchy: Record<UserRole, number> = {
  admin: 3,
  editor: 2,
  viewer: 1,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(mockUsers[0]) // Default admin

  const login = (email: string): boolean => {
    const user = mockUsers.find((u) => u.email === email)
    if (user) {
      setCurrentUser(user)
      return true
    }
    return false
  }

  const logout = () => {
    setCurrentUser(null)
  }

  const hasPermission = (requiredRoles: UserRole[]): boolean => {
    if (!currentUser) return false
    return requiredRoles.some(
      (role) => roleHierarchy[currentUser.role] >= roleHierarchy[role]
    )
  }

  const switchUser = (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId)
    if (user) {
      setCurrentUser(user)
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, hasPermission, switchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
