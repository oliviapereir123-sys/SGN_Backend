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
import { TrendingUp, Clock, BookOpen, Award, Loader2, ChevronRight, Users } from "lucide-react"
import Link from "next/link"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface AlunoStats {
  notas: { id: number; disciplina_nome: string; trimestre_nome: string; media: number | null }[]
  media_geral: number | null
  aprovadas: number
  reprovadas: number
  taxa_freq: number | null
  evolucao: { trimestre: string; media: number }[]
}

export default function EncarregadoDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<AlunoStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "encarregado") router.push("/login/encarregado")
  }, [isAuthenticated, user, router])

  const carregar = useCallback(async () => {
    if (!user?.alunoId) return
    setLoading(true)
    try {
      const res = await apiFetch<{ success: boolean } & AlunoStats>(`/aluno/stats.php?alunoId=${user.alunoId}`)
      if (res.success) setStats(res)
    } catch { }
    finally { setLoading(false) }
  }, [user?.alunoId])

  useEffect(() => { if (isAuthenticated) carregar() }, [isAuthenticated, carregar])

  if (!isAuthenticated || user?.type !== "encarregado") return null

  const situacao = stats?.media_geral != null
    ? stats.media_geral >= 10 ? { label: "Aprovado", color: "bg-green-100 text-green-700" }
      : stats.media_geral >= 7 ? { label: "Recuperação", color: "bg-amber-100 text-amber-700" }
        : { label: "Reprovado", color: "bg-red-100 text-red-700" }
    : null

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar />
      <div className="lg:ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="p-4 sm:p-6 space-y-5">

          {/* Cabeçalho */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Olá, {user?.nome?.split(" ")[0]}!</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              A acompanhar: <strong>{user?.alunoNome ?? "—"}</strong>
              {situacao && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${situacao.color}`}>
                  {situacao.label}
                </span>
              )}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: TrendingUp, label: "Média Geral", value: stats?.media_geral != null ? `${stats.media_geral.toFixed(1)}/20` : "—", color: "bg-primary/10 text-primary" },
                  { icon: Award, label: "Aprovadas", value: stats?.aprovadas ?? 0, color: "bg-green-50 text-green-600" },
                  { icon: Users, label: "Reprovadas", value: stats?.reprovadas ?? 0, color: "bg-red-50 text-red-600" },
                  { icon: Clock, label: "Frequência", value: stats?.taxa_freq != null ? `${stats.taxa_freq}%` : "—", color: "bg-blue-50 text-blue-600" },
                ].map((s) => (
                  <Card key={s.label} className="border shadow-sm">
                    <CardContent className="p-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                        <s.icon className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-xl sm:text-2xl font-bold mt-0.5">{s.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Notas + Gráfico */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                <Card className="lg:col-span-2 border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      Notas de {user?.alunoNome?.split(" ")[0] ?? "—"}
                    </CardTitle>
                    <Link href="/dashboard/encarregado/notas">
                      <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                        Ver todas <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    {stats && stats.notas.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left text-xs text-muted-foreground font-medium px-5 py-2">Disciplina</th>
                              <th className="text-left text-xs text-muted-foreground font-medium px-3 py-2 hidden sm:table-cell">Trimestre</th>
                              <th className="text-right text-xs text-muted-foreground font-medium px-5 py-2">Média</th>
                              <th className="text-right text-xs text-muted-foreground font-medium px-5 py-2">Situação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.notas.slice(0, 8).map((n) => (
                              <tr key={n.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                <td className="px-5 py-2.5 font-medium truncate max-w-[140px]">{n.disciplina_nome}</td>
                                <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{n.trimestre_nome}</td>
                                <td className="px-5 py-2.5 text-right">
                                  <span className={`font-bold ${n.media != null && Number(n.media) >= 10 ? "text-green-600" : "text-red-500"}`}>
                                    {n.media != null ? Number(n.media).toFixed(1) : "—"}
                                  </span>
                                </td>
                                <td className="px-5 py-2.5 text-right">
                                  {n.media != null && (
                                    <Badge variant="outline" className={`text-xs ${Number(n.media) >= 10 ? "bg-green-50 text-green-700 border-green-200" : Number(n.media) >= 7 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                      {Number(n.media) >= 10 ? "Aprovado" : Number(n.media) >= 7 ? "Recuperação" : "Reprovado"}
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-10 text-center">
                        <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">Nenhuma nota disponível ainda</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Gráfico + Links */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold">Evolução Trimestral</CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {stats && stats.evolucao.length > 0 ? (
                      <ResponsiveContainer width="100%" height={190}>
                        <AreaChart data={stats.evolucao}>
                          <defs>
                            <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="trimestre" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 20]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                          <Area type="monotone" dataKey="media" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#grad2)" name="Média" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[190px] text-xs text-muted-foreground text-center px-4">
                        Os gráficos aparecerão após o lançamento das notas
                      </div>
                    )}
                  </CardContent>
                  <div className="border-t px-5 py-3 space-y-1">
                    {[
                      { label: "Frequências", href: "/dashboard/encarregado/frequencias" },
                      { label: "Horário", href: "/dashboard/encarregado/horarios" },
                      { label: "Boletim Anual", href: "/dashboard/encarregado/boletim-anual" },
                    ].map((l) => (
                      <Link key={l.label} href={l.href} className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground py-1 transition-colors">
                        {l.label} <ChevronRight className="h-3 w-3" />
                      </Link>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}