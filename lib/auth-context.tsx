"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

const API_BASE    = process.env.NEXT_PUBLIC_API_URL || "http://localhost/sgn/backend/api"
const STORAGE_KEY = "sgn_ipm_user"
const TOKEN_KEY   = "sgn_ipm_token"

type UserType = "aluno" | "professor" | "admin" | "encarregado" | null

export interface User {
  id: number
  type: UserType
  nome: string
  email?: string
  numeroAluno?: string  // aluno
  turmaId?: number      // aluno
  turma?: string        // aluno (nome)
  curso?: string        // aluno
  ano?: number          // aluno
  departamento?: string // professor
  alunoId?: number      // encarregado
  alunoNome?: string    // encarregado
  alunoNumero?: string  // encarregado
  parentesco?: string   // encarregado
  foto?: string
}

interface LoginCredentials {
  email?: string
  numeroAluno?: string
  password: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (type: UserType, credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function normalizeUser(type: UserType, raw: Record<string, unknown>): User {
  const base: User = {
    id:   Number(raw.id),
    type,
    nome: raw.nome as string,
    email: raw.email as string | undefined,
    foto: (raw.foto as string | undefined) || "/placeholder-user.jpg",
  }
  if (type === "aluno") {
    base.numeroAluno = raw.numero as string
    base.turmaId     = raw.turma_id ? Number(raw.turma_id) : undefined
    base.turma       = raw.turma    as string | undefined
    base.curso       = raw.curso    as string | undefined
    base.ano         = raw.ano      ? Number(raw.ano) : undefined
  }
  if (type === "professor") {
    base.departamento = raw.departamento as string | undefined
  }
  if (type === "encarregado") {
    base.alunoId     = raw.aluno_id     ? Number(raw.aluno_id) : undefined
    base.parentesco  = raw.parentesco   as string | undefined
    base.alunoNome   = raw.aluno_nome   as string | undefined
    base.alunoNumero = raw.aluno_numero as string | undefined
  }
  return base
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null)
  const [token,     setToken]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // Restaurar sessão do localStorage ao iniciar
  useEffect(() => {
    try {
      const storedUser  = localStorage.getItem(STORAGE_KEY)
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser))
        setToken(storedToken)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(TOKEN_KEY)
    }
  }, [])

  const login = async (type: UserType, credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const body: Record<string, string> = { type: type!, password: credentials.password }
      if (type === "aluno" && credentials.numeroAluno) {
        body.numeroAluno = credentials.numeroAluno
      } else if (credentials.email) {
        body.email = credentials.email
      }

      const res  = await fetch(`${API_BASE}/auth/login.php`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || "Credenciais inválidas")
        return false
      }

      const userData = normalizeUser(type, data.user)
      const jwt      = data.token as string

      setUser(userData)
      setToken(jwt)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
      localStorage.setItem(TOKEN_KEY,   jwt)
      return true
    } catch {
      setError("Não foi possível ligar ao servidor. Verifique a ligação.")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setError(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!user && !!token,
      isLoading, error,
      login, logout,
      clearError: () => setError(null),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
