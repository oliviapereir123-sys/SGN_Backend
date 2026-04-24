"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Eye, EyeOff, Loader2, ArrowLeft, User, Lock, BookOpen, AlertCircle, Mail, Hash } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function AlunoLoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [identificador, setIdentificador] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  // Detecta automaticamente se é número ou email
  const isEmail = identificador.includes("@")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const credentials = isEmail
      ? { email: identificador, password }
      : { numeroAluno: identificador, password }

    const success = await login("aluno", credentials)

    if (success) {
      router.push("/dashboard/aluno")
    } else {
      setError("Número de aluno, email ou senha incorrectos")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
            className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
            transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
            className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Instituto Politécnico</h2>
                <p className="text-white/70">do Maiombe</p>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4">Portal do Aluno</h1>
            <p className="text-white/80 text-lg mb-8 max-w-md">
              Aceda às suas notas, horários, materiais de estudo e muito mais através do nosso sistema integrado.
            </p>

            <div className="space-y-4">
              {[
                { icon: BookOpen, text: "Consulte suas notas e avaliações" },
                { icon: User, text: "Atualize seus dados pessoais" },
                { icon: GraduationCap, text: "Acompanhe seu progresso académico" },
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-white/90">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-white/10 rounded-xl border border-white/20">
              <p className="text-sm font-semibold mb-2">Conta Demo:</p>
              <p className="text-sm text-white/80">Número: 2024010001</p>
              <p className="text-sm text-white/80">ou Email: joao.silva@aluno.ipMaiombe.ao</p>
              <p className="text-sm text-white/80">Senha: aluno123</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>

          <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Área do Aluno</h1>
              <p className="text-muted-foreground mt-2">Insira suas credenciais para continuar</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="identificador">
                  Número de Aluno ou Email
                </Label>
                <div className="relative">
                  {/* Ícone muda dinamicamente conforme o utilizador escreve */}
                  {isEmail
                    ? <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    : <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  }
                  <Input
                    id="identificador"
                    type="text"
                    placeholder="Ex: 2024010001 ou joao@email.com"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    required
                    className="h-12 pl-11"
                    autoComplete="username"
                  />
                </div>
                {/* Indicador subtil do modo detectado */}
                {identificador.length > 0 && (
                  <p className="text-xs text-muted-foreground pl-1">
                    {isEmail ? "✉ A entrar com email" : "# A entrar com número de aluno"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pl-11 pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-muted-foreground">Lembrar-me</span>
                </label>
                <Link href="#" className="text-primary hover:underline">
                  Esqueci a senha
                </Link>
              </div>

              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />A entrar...
                  </>
                ) : (
                  "Iniciar Sessão"
                )}
              </Button>
            </form>

            <div className="lg:hidden mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-sm font-semibold mb-2 text-primary">Conta Demo:</p>
              <p className="text-sm text-muted-foreground">Número: 2024010001</p>
              <p className="text-sm text-muted-foreground">ou Email: joao.silva@aluno.ipMaiombe.ao</p>
              <p className="text-sm text-muted-foreground">Senha: aluno123</p>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Primeira vez?{" "}
              <Link href="#" className="text-primary hover:underline">
                Ative sua conta
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}