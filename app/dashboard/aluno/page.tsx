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
import { getNotasAluno, type NotaAluno } from "@/lib/api"
import {
  TrendingUp, Clock, Bell, X, BookOpen, Calendar,
  Award, ChevronRight, Loader2
} from "lucide-react"
import Link from "next/link"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts"

const performanceData = [
  { mes: "Fev", media: 14.5 },
  { mes: "Mar", media: 15.0 },
  { mes: "Abr", media: 14.8 },
  { mes: "Mai", media: 15.5 },
  { mes: "Jun", media: 15.8 },
  { mes: "Jul", media: 16.8 },
]

const proximasProvas = [
  { disciplina: "QUÍMICA", avaliacao: "Exame Final", dia: "22", mes: "OUT" },
  { disciplina: "FILOSOFIA", avaliacao: "Ensaio Crítico", dia: "25", mes: "OUT" },
  { disciplina: "INGLÊS", avaliacao: "Oral Test", dia: "28", mes: "OUT" },
]

interface Notificacao {
  id: number
  tipo: "info" | "aviso" | "sucesso"
  titulo: string
  mensagem: string
  tempo: string
}

const NOTIFICACOES_DEMO: Notificacao[] = [
  { id: 1, tipo: "info", titulo: "Rematrícula Aberta", mensagem: "O período de rematrícula para o próximo semestre começa amanhã.", tempo: "2H ATRÁS" },
  { id: 2, tipo: "aviso", titulo: "Biblioteca: Atraso", mensagem: "Você possui um livro com devolução pendente: 'Cálculo I'.", tempo: "5H ATRÁS" },
  { id: 3, tipo: "sucesso", titulo: "Nota Lançada", mensagem: "Sua nota de Química Orgânica já está disponível no portal.", tempo: "1 DIA ATRÁS" },
]

export default function AlunoDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [notas, setNotas] = useState<NotaAluno[]>([])
  const [loading, setLoading] = useState(true)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(NOTIFICACOES_DEMO)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "aluno") router.push("/login/aluno")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (!user?.id) return
    getNotasAluno(user.id)
      .then((res) => setNotas(res.data || []))
      .finally(() => setLoading(false))
  }, [user?.id])

  if (!isAuthenticated || user?.type !== "aluno") return null

  const mediaGeral = notas.length > 0
    ? notas.filter((n) => n.media !== null).reduce((s, n) => s + Number(n.media), 0) /
      (notas.filter((n) => n.media !== null).length || 1)
    : 0
  const pendentes = notas.filter((n) => n.media === null || n.estado === "Pendente").length

  const notifIcon = { info: "🔔", aviso: "⚠️", sucesso: "✅" }
  const notifBorder = {
    info: "border-blue-200 dark:border-blue-500/30",
    aviso: "border-yellow-200 dark:border-yellow-500/30",
    sucesso: "border-green-200 dark:border-green-500/30",
  }

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
              {/* Hero Card */}
              <Card className="bg-primary text-white border-0 overflow-hidden relative">
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold">Olá, {user.nome.split(" ")[0]}! 👋</h2>
                      <p className="text-white/80 mt-1 text-sm max-w-lg">
                        Seu desempenho este mês foi excelente. Você está entre os 5% melhores alunos da sua turma. Continue assim!
                      </p>
                      <div className="flex gap-3 mt-4">
                        <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2" asChild>
                          <Link href="/dashboard/aluno/boletim">
                            <BookOpen className="w-4 h-4" />Ver Meu Boletim
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10 gap-2" asChild>
                          <Link href="/dashboard/aluno/perfil">Meu Perfil</Link>
                        </Button>
                      </div>
                    </div>
                    <Award className="w-24 h-24 text-white/20 flex-shrink-0" />
                  </div>
                </CardContent>
                {/* decorative circles */}
                <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
                <div className="absolute -right-4 top-8 w-24 h-24 rounded-full bg-white/5" />
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Média Global</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <p className="text-3xl font-bold">{mediaGeral > 0 ? mediaGeral.toFixed(1) : "—"} / 20</p>
                          <span className="text-xs text-green-600">↗ +12%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Aumento de 1.2 pontos desde o último bimestre</p>
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
                        <p className="text-3xl font-bold mt-1">94.2%</p>
                        <p className="text-xs text-muted-foreground mt-1">3 faltas registadas em 8 disciplinas</p>
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
                        <p className="text-sm text-muted-foreground">Atividades Pendentes</p>
                        <p className="text-3xl font-bold mt-1">{pendentes}</p>
                        <p className="text-xs text-muted-foreground mt-1">Trabalhos com entrega para esta semana</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notas + Notificações */}
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
                          {["Disciplina", "Avaliação", "Data", "Nota", "Status"].map((h) => (
                            <th key={h} className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {notas.length > 0 ? notas.slice(0, 5).map((n, i) => (
                          <motion.tr key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-3 text-sm font-medium">{n.disciplina_nome}</td>
                            <td className="px-6 py-3 text-sm text-muted-foreground">{n.trimestre_nome}</td>
                            <td className="px-6 py-3 text-sm text-muted-foreground">—</td>
                            <td className="px-6 py-3">
                              <span className={`text-sm font-bold ${n.media !== null && Number(n.media) >= 10 ? "text-green-600" : "text-red-500"}`}>
                                {n.media !== null ? Number(n.media).toFixed(1) : "—"}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              {n.media !== null && (
                                <Badge variant="outline" className={Number(n.media) >= 10 ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400" : "bg-red-100 text-red-700 border-red-200"}>
                                  {Number(n.media) >= 10 ? "Aprovado" : "Reprovado"}
                                </Badge>
                              )}
                            </td>
                          </motion.tr>
                        )) : (
                          // Demo rows
                          [
                            ["Matemática Avançada", "Prova Bimestral II", "15/10/2023", "18.5", true],
                            ["Física Geral", "Trabalho em Grupo", "12/10/2023", "16.0", true],
                            ["História do Brasil", "Seminário", "08/10/2023", "14.5", true],
                            ["Língua Portuguesa", "Redação", "05/10/2023", "12.0", true],
                            ["Biologia Celular", "Teste Surpresa", "01/10/2023", "19.0", true],
                          ].map(([disc, aval, data, nota, aprov], i) => (
                            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="px-6 py-3 text-sm font-medium">{disc as string}</td>
                              <td className="px-6 py-3 text-sm text-muted-foreground">{aval as string}</td>
                              <td className="px-6 py-3 text-sm text-muted-foreground">{data as string}</td>
                              <td className="px-6 py-3"><span className="text-sm font-bold text-green-600">{nota as string}</span></td>
                              <td className="px-6 py-3">
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400">Aprovado</Badge>
                              </td>
                            </tr>
                          ))
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

                {/* Notificações */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-primary" />
                        <CardTitle className="text-base font-semibold">Notificações</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {notificacoes.map((n) => (
                      <div key={n.id} className={`p-3 rounded-xl border ${notifBorder[n.tipo]} relative`}>
                        <div className="flex items-start gap-2">
                          <span className="text-base">{notifIcon[n.tipo]}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">{n.titulo}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.mensagem}</p>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">{n.tempo}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setNotificacoes([])}
                    >
                      Limpar Todas
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico + Próximas Provas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base font-semibold">Evolução de Desempenho</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground">Média por Mês — Acompanhamento semestral das suas avaliações</p>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="mediaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                        <Area type="monotone" dataKey="media" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#mediaGrad)" name="Média Mensal" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Próximas Provas */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base font-semibold">Próximas Provas</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-xl bg-[#0F172A] text-white p-1 space-y-1">
                      {proximasProvas.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg">
                          <div>
                            <p className="text-xs font-bold tracking-wide">{p.disciplina}</p>
                            <p className="text-xs text-white/60">{p.avaliacao}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{p.dia}</p>
                            <p className="text-xs text-white/60">{p.mes}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-sm">
                      Adicionar ao Calendário
                    </Button>
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