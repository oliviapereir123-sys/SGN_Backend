"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiFetch, getNotasPendentes } from "@/lib/api"
import {
  Users, BookOpen, GraduationCap, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, FileText, Loader2, ArrowUpRight, RefreshCw
} from "lucide-react"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface Stats {
  totais: { alunos: number; turmas: number; disciplinas: number; professores: number }
  notas: { total: number; pendentes: number; aprovadas: number; rejeitadas: number; media_geral: number }
  taxa_aprovacao: number
  pct_lancamento: number
  trimestre_activo: string | null
  evolucao: { trimestre: string; media: number; total_notas: number; aprovados: number }[]
  auditoria: { acao: string; detalhes: string; criado_em: string; utilizador: string }[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [pendentes, setPendentes] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/")
  }, [isAuthenticated, user, router])

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [s, n] = await Promise.all([
        apiFetch<{ success: boolean } & Stats>("/admin/stats.php"),
        getNotasPendentes(),
      ])
      if (s.success) setStats(s)
      setPendentes((n.data || []).filter((x: any) => x.estado === "Pendente").length)
    } catch { }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  if (!isAuthenticated || user?.type !== "admin") return null

  const statCards = stats ? [
    { icon: Users, label: "Alunos Activos", value: stats.totais.alunos, color: "bg-blue-50 text-blue-600", trend: null },
    { icon: GraduationCap, label: "Turmas Activas", value: stats.totais.turmas, color: "bg-green-50 text-green-600", trend: null },
    { icon: BookOpen, label: "Disciplinas", value: stats.totais.disciplinas, color: "bg-purple-50 text-purple-600", trend: null },
    { icon: TrendingUp, label: "Média Geral", value: stats.notas.media_geral ? stats.notas.media_geral.toFixed(1) : "—", color: "bg-orange-50 text-orange-600", trend: `${stats.taxa_aprovacao}% aprovação` },
  ] : []

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar />
      <div className="lg:ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="p-4 sm:p-6 space-y-5">

          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Visão Geral</h1>
              <p className="text-sm text-muted-foreground">
                Bem-vindo, {user?.nome?.split(" ")[0]}. {stats?.trimestre_activo ? `${stats.trimestre_activo} em curso.` : ""}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={carregar} disabled={loading} className="gap-2 self-start">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {statCards.map((s) => (
                  <Card key={s.label} className="border shadow-sm">
                    <CardContent className="p-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                        <s.icon className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                      {s.trend && <p className="text-xs text-green-600 mt-1">{s.trend}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Alertas */}
              {(pendentes > 0 || (stats && stats.notas.rejeitadas > 0)) && (
                <div className="flex flex-col sm:flex-row gap-3">
                  {pendentes > 0 && (
                    <Link href="/dashboard/admin/validacao-notas" className="flex-1">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors">
                        <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-amber-800">{pendentes} nota{pendentes !== 1 ? "s" : ""} aguardam validação</p>
                        <ArrowUpRight className="h-4 w-4 text-amber-500 ml-auto" />
                      </div>
                    </Link>
                  )}
                  {stats && stats.notas.rejeitadas > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 flex-1">
                      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <p className="text-sm font-medium text-red-800">{stats.notas.rejeitadas} nota{stats.notas.rejeitadas !== 1 ? "s" : ""} rejeitada{stats.notas.rejeitadas !== 1 ? "s" : ""}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Gráfico + Notas resumo */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                <Card className="lg:col-span-2 border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold">Evolução por Trimestre</CardTitle>
                    <CardDescription className="text-xs">Média das notas aprovadas</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {stats && stats.evolucao.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={stats.evolucao}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="trimestre" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                          <Legend wrapperStyle={{ fontSize: "12px" }} />
                          <Line type="monotone" dataKey="media" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} name="Média" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                        Sem dados de notas aprovadas ainda
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold">Estado das Notas</CardTitle>
                    <CardDescription className="text-xs">Total: {stats?.notas.total ?? 0} registos</CardDescription>
                  </CardHeader>
                  <CardContent className="px-5 pb-4 space-y-3">
                    {[
                      { label: "Aprovadas", value: stats?.notas.aprovadas ?? 0, color: "bg-green-500", text: "text-green-700" },
                      { label: "Pendentes", value: stats?.notas.pendentes ?? 0, color: "bg-amber-400", text: "text-amber-700" },
                      { label: "Rejeitadas", value: stats?.notas.rejeitadas ?? 0, color: "bg-red-400", text: "text-red-700" },
                    ].map(({ label, value, color, text }) => {
                      const total = stats?.notas.total || 1
                      const pct = Math.round((value / total) * 100)
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{label}</span>
                            <span className={`font-semibold ${text}`}>{value} <span className="font-normal text-muted-foreground">({pct}%)</span></span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}

                    <div className="pt-2 border-t mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Lançamento {stats?.trimestre_activo ?? ""}</span>
                        <span className="font-semibold text-primary">{stats?.pct_lancamento ?? 0}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${stats?.pct_lancamento ?? 0}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Auditoria + Acesso rápido */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Actividade Recente</CardTitle>
                    <Link href="/dashboard/admin/auditoria">
                      <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">Ver tudo <ArrowUpRight className="h-3 w-3" /></Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="px-5 pb-4">
                    {stats && stats.auditoria.length > 0 ? (
                      <div className="space-y-3">
                        {stats.auditoria.map((a, i) => (
                          <div key={i} className="flex items-start gap-3 text-sm">
                            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{a.acao}</p>
                              <p className="text-xs text-muted-foreground truncate">{a.detalhes || a.utilizador}</p>
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(a.criado_em).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">Sem actividade recente</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold">Acesso Rápido</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-4">
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {[
                        { label: "Validar Notas", icon: CheckCircle2, href: "/dashboard/admin/validacao-notas", badge: pendentes > 0 ? String(pendentes) : null },
                        { label: "Alunos", icon: Users, href: "/dashboard/admin/alunos", badge: null },
                        { label: "Turmas", icon: GraduationCap, href: "/dashboard/admin/turmas", badge: null },
                        { label: "Disciplinas", icon: BookOpen, href: "/dashboard/admin/disciplinas", badge: null },
                        { label: "Matrículas", icon: FileText, href: "/dashboard/admin/matriculas", badge: null },
                        { label: "Relatórios", icon: TrendingUp, href: "/dashboard/admin/relatorios", badge: null },
                      ].map((item) => (
                        <Link key={item.label} href={item.href}>
                          <div className="relative flex items-center gap-2 p-3 rounded-lg border hover:border-primary/40 hover:bg-primary/5 transition-all">
                            <item.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium truncate">{item.label}</span>
                            {item.badge && (
                              <Badge className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-amber-500 hover:bg-amber-500">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}