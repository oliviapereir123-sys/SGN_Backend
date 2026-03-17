"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiFetch } from "@/lib/api"
import {
  Users, BookOpen, Clock, TrendingUp, Send, FileText,
  ChevronRight, Loader2, RefreshCw, AlertCircle
} from "lucide-react"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ProfStats {
  total_alunos: number
  total_turmas: number
  pendentes: number
  media_geral: number
  turmas: { id: number; turma_nome: string; disciplina_id: number; disciplina_nome: string; total_alunos: number }[]
  evolucao: { trimestre: string; media: number }[]
}

export default function ProfessorDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<ProfStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "professor") router.push("/login/professor")
  }, [isAuthenticated, user, router])

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<{ success: boolean } & ProfStats>("/professor/stats.php")
      if (res.success) setStats(res)
    } catch { }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { if (isAuthenticated) carregar() }, [isAuthenticated, carregar])

  if (!isAuthenticated || user?.type !== "professor") return null

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar />
      <div className="lg:ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="p-4 sm:p-6 space-y-5">

          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Painel do Professor</h1>
              <p className="text-sm text-muted-foreground">
                Bem-vindo, Prof. {user?.nome?.split(" ").slice(-1)[0]}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={carregar} disabled={loading} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
              <Button size="sm" className="gap-2" asChild>
                <Link href="/dashboard/professor/notas">
                  <Send className="h-4 w-4" /> Lançar Notas
                </Link>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Alerta de pendentes */}
              {stats && stats.pendentes > 0 && (
                <Link href="/dashboard/professor/notas">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-amber-800">
                      {stats.pendentes} nota{stats.pendentes !== 1 ? "s" : ""} aguardam validação
                    </p>
                    <ChevronRight className="h-4 w-4 text-amber-500 ml-auto" />
                  </div>
                </Link>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { icon: Users, label: "Total Alunos", value: stats?.total_alunos ?? "—", color: "bg-blue-50 text-blue-600" },
                  { icon: BookOpen, label: "Turmas Activas", value: stats?.total_turmas ?? "—", color: "bg-green-50 text-green-600" },
                  { icon: Clock, label: "Pendentes", value: stats?.pendentes ?? 0, color: "bg-amber-50 text-amber-600" },
                  { icon: TrendingUp, label: "Média Geral", value: stats?.media_geral ? stats.media_geral.toFixed(1) : "—", color: "bg-purple-50 text-purple-600" },
                ].map((s) => (
                  <Card key={s.label} className="border shadow-sm">
                    <CardContent className="p-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                        <s.icon className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Turmas + Gráfico */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                {/* Minhas Turmas */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Minhas Turmas</h2>
                  </div>
                  {stats && stats.turmas.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {stats.turmas.slice(0, 6).map((t) => (
                        <Card key={`${t.id}-${t.disciplina_id}`} className="border shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">{t.turma_nome}</p>
                                <p className="text-xs text-primary truncate">{t.disciplina_nome}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                                {t.total_alunos} alunos
                              </Badge>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" asChild>
                                <Link href="/dashboard/professor/notas">Notas</Link>
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" asChild>
                                <Link href="/dashboard/professor/pautas">Pauta</Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border shadow-sm">
                      <CardContent className="py-10 text-center">
                        <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">Nenhuma turma atribuída</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Coluna direita */}
                <div className="space-y-4">
                  {/* Evolução */}
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2 pt-4 px-5">
                      <CardTitle className="text-sm font-semibold">Evolução por Trimestre</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 pb-4">
                      {stats && stats.evolucao.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={stats.evolucao}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="trimestre" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 20]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                            <Line type="monotone" dataKey="media" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} name="Média" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-[180px] text-xs text-muted-foreground">
                          Sem dados de evolução ainda
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Acesso rápido */}
                  <Card className="bg-primary text-white border-0">
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-semibold text-sm">Acesso Rápido</h3>
                      <Button size="sm" variant="secondary" className="w-full justify-start gap-2 bg-white/10 hover:bg-white/20 text-white border-0 text-xs" asChild>
                        <Link href="/dashboard/professor/pautas">
                          <FileText className="w-3.5 h-3.5" /> Exportar Pauta
                        </Link>
                      </Button>
                      <Button size="sm" variant="secondary" className="w-full justify-start gap-2 bg-white/10 hover:bg-white/20 text-white border-0 text-xs" asChild>
                        <Link href="/dashboard/professor/frequencias">
                          <Users className="w-3.5 h-3.5" /> Registar Frequências
                        </Link>
                      </Button>
                      <Button size="sm" variant="secondary" className="w-full justify-start gap-2 bg-white/10 hover:bg-white/20 text-white border-0 text-xs" asChild>
                        <Link href="/dashboard/professor/avaliacoes">
                          <Clock className="w-3.5 h-3.5" /> Calendário de Avaliações
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}