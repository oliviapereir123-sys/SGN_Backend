"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiFetch, getNotasAluno, type NotaAluno } from "@/lib/api"
import {
  TrendingUp, Clock, Bell, BookOpen, Calendar,
  Award, ChevronRight, Loader2, AlertCircle
} from "lucide-react"
import Link from "next/link"
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts"

// ─── Lógica de situação corrigida: 3 estados conforme regras do IPM ────────────
function getStatus(media: number | null): { label: string; className: string } {
  if (media === null) return { label: "—", className: "bg-muted text-muted-foreground" }
  if (media >= 10) return { label: "Aprovado",   className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400" }
  if (media >= 7)  return { label: "Recurso",    className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400" }
  return            { label: "Reprovado",  className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400" }
}

interface AlunoStats {
  taxa_freq: number | null
  evolucao: { trimestre: string; media: number }[]
}

export default function AlunoDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [notas, setNotas] = useState<NotaAluno[]>([])
  const [stats, setStats] = useState<AlunoStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "aluno") router.push("/login/aluno")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      getNotasAluno(user.id),
      apiFetch<{ success: boolean } & AlunoStats>(`/aluno/stats.php?alunoId=${user.id}`).catch(() => null),
    ])
      .then(([notasRes, statsRes]) => {
        setNotas(notasRes.data || [])
        if (statsRes?.success) setStats(statsRes)
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  if (!isAuthenticated || user?.type !== "aluno") return null

  const mediaGeral = notas.length > 0
    ? notas.filter((n) => n.media !== null).reduce((s, n) => s + Number(n.media), 0) /
      (notas.filter((n) => n.media !== null).length || 1)
    : null
  const pendentes = notas.filter((n) => n.media === null).length

  // Gráfico: usar dados reais da API ou ocultar
  const evolucaoData = stats?.evolucao ?? []

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

              {/* Hero Card — mensagem genérica, sem afirmações falsas */}
              <Card className="bg-primary text-white border-0 overflow-hidden relative">
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold">Olá, {user.nome.split(" ")[0]}! 👋</h2>
                      <p className="text-white/80 mt-1 text-sm max-w-lg">
                        Bem-vindo ao seu painel académico. Consulte as suas notas e acompanhe o seu progresso.
                      </p>
                      <div className="flex gap-3 mt-4">
                        <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2" asChild>
                          <Link href="/dashboard/aluno/boletim">
                            <BookOpen className="w-4 h-4" />Ver Meu Boletim
                          </Link>
                        </Button>
                        {/*
                        <Button size="sm" variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10 gap-2" asChild>
                          <Link href="/dashboard/aluno/perfil">Meu Perfil</Link>
                        </Button> */}
                      </div>
                    </div>
                    <Award className="w-24 h-24 text-white/20 flex-shrink-0" />
                  </div>
                </CardContent>
                <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
                <div className="absolute -right-4 top-8 w-24 h-24 rounded-full bg-white/5" />
              </Card>

              {/* Stats — apenas dados reais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Média Global</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <p className="text-3xl font-bold">
                            {mediaGeral !== null ? mediaGeral.toFixed(1) : "—"} / 20
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notas.filter((n) => n.media !== null).length} disciplina(s) com nota
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Frequência Total</p>
                        <p className="text-3xl font-bold mt-1">
                          {stats?.taxa_freq !== null && stats?.taxa_freq !== undefined
                            ? `${stats.taxa_freq}%`
                            : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stats?.taxa_freq !== null && stats?.taxa_freq !== undefined
                            ? "Taxa de presença registada"
                            : "Sem dados de frequência"}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Notas Pendentes</p>
                        <p className="text-3xl font-bold mt-1">{pendentes}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Disciplinas sem nota aprovada
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notas Recentes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base font-semibold">Notas Recentes</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          {["Disciplina", "Trimestre", "Média", "Situação"].map((h) => (
                            <th key={h} className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {notas.length > 0 ? (
                          notas.slice(0, 5).map((n, i) => {
                            const st = getStatus(n.media !== null ? Number(n.media) : null)
                            return (
                              <motion.tr
                                key={n.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                              >
                                <td className="px-6 py-3 text-sm font-medium">{n.disciplina_nome}</td>
                                <td className="px-6 py-3 text-sm text-muted-foreground">{n.trimestre_nome}</td>
                                <td className="px-6 py-3">
                                  <span className={`text-sm font-bold ${
                                    n.media !== null
                                      ? Number(n.media) >= 10 ? "text-green-600"
                                        : Number(n.media) >= 7 ? "text-yellow-600"
                                        : "text-red-500"
                                      : "text-muted-foreground"
                                  }`}>
                                    {n.media !== null ? Number(n.media).toFixed(1) : "—"}
                                  </span>
                                </td>
                                <td className="px-6 py-3">
                                  {n.media !== null && (
                                    <Badge variant="outline" className={st.className}>
                                      {st.label}
                                    </Badge>
                                  )}
                                </td>
                              </motion.tr>
                            )
                          })
                        ) : (
                          // CORRECÇÃO: sem dados demo — mostra estado vazio real
                          <tr>
                            <td colSpan={4} className="px-6 py-10 text-center">
                              <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                              <p className="text-sm text-muted-foreground">Sem notas aprovadas disponíveis.</p>
                              <p className="text-xs text-muted-foreground mt-1">As notas aparecem aqui após validação pelo administrador.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <div className="px-6 py-3 border-t border-border">
                      <Button variant="link" className="text-primary p-0 h-auto text-sm gap-1" asChild>
                        <Link href="/dashboard/aluno/boletim">Ver histórico completo <ChevronRight className="w-4 h-4" /></Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Gráfico de Evolução — só mostra se houver dados reais */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base font-semibold">Evolução por Trimestre</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {evolucaoData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={evolucaoData}>
                          <defs>
                            <linearGradient id="mediaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="trimestre" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                          <Area type="monotone" dataKey="media" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#mediaGrad)" name="Média" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[200px] text-center">
                        <Calendar className="w-10 h-10 text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">Sem dados de evolução ainda.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}