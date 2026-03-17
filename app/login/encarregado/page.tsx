"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Lock, Mail, Heart, ArrowLeft, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function EncarregadoLoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const success = await login("encarregado", { email, password })
    if (success) {
      router.push("/dashboard/encarregado")
    } else {
      setError("Email ou senha incorrectos. Verifique as suas credenciais.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-primary/5 to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-xl border-border/50">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Portal do Encarregado</CardTitle>
              <CardDescription>Aceda ao desempenho do seu educando</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.ao"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "A autenticar..." : "Entrar"}
                </Button>
              </form>

              {/* Demo credentials */}
              <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border/50">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Credenciais de demonstração
                </p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Email:</span> <span className="font-mono font-medium">maria.silva@email.ao</span></p>
                  <p><span className="text-muted-foreground">Senha:</span> <span className="font-mono font-medium">enc123</span></p>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  É professor?{" "}
                  <Link href="/login/professor" className="text-primary hover:underline">
                    Entrar como professor
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mt-6 text-muted-foreground">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">IPM — Mayombe</p>
              <p className="text-xs">Sistema de Gestão Escolar</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
