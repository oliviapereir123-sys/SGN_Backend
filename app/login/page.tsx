"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Eye, EyeOff, Loader2, Mail, Lock, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

type ProfileType = "professor" | "aluno"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [lembrar, setLembrar] = useState(false)
  const [perfil, setPerfil] = useState<ProfileType | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!perfil) {
      setError("Selecione seu perfil de acesso abaixo.")
      return
    }
    setIsLoading(true)
    setError("")
    const success = await login(perfil, { email, password })
    if (success) {
      router.push(`/dashboard/${perfil}`)
    } else {
      setError("E-mail ou senha incorrectos. Verifique as suas credenciais.")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#EEF2FF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#0F172A] rounded-2xl flex items-center justify-center mb-4">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Notas</h1>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Bem-vindo(a)!</h2>
            <p className="text-gray-500 text-sm mt-1">Acesse sua conta para continuar</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                E-mail Académico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="exemplo@escola.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Senha</Label>
                <a href="#" className="text-xs text-primary hover:underline font-medium">Esqueci a senha?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pl-10 pr-12 rounded-xl border-gray-200 focus:border-primary focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão principal */}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-semibold text-base gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />A entrar...</>
              ) : (
                "→  Entrar no Sistema"
              )}
            </Button>

            {/* Acesso por Perfil */}
            <div className="pt-2">
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <span className="relative bg-white px-3 text-xs text-gray-400 uppercase tracking-wider font-medium">
                  Acesso por Perfil
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setPerfil("professor"); setError("") }}
                  className={`h-10 rounded-xl text-sm font-medium transition-all border ${
                    perfil === "professor"
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Sou Professor
                </button>
                <button
                  type="button"
                  onClick={() => { setPerfil("aluno"); setError("") }}
                  className={`h-10 rounded-xl text-sm font-medium transition-all border ${
                    perfil === "aluno"
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Sou Aluno
                </button>
              </div>
            </div>
          </form>

          {/* Suporte */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Problemas para acessar? Entre em contacto com o{" "}
            <a href="#" className="font-semibold text-gray-600 hover:underline">suporte técnico da TI</a>.
          </p>
        </motion.div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-6 mt-6">
          {["Termos de Uso", "Política de Privacidade", "Ajuda"].map((item) => (
            <a key={item} href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{item}</a>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © 2026 Gestão de Notas · Sistema Académico. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}