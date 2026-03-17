"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTrimestres, getAnosLectivos, apiFetch, type Trimestre } from "@/lib/api"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell,
} from "recharts"
import { BarChart3, TrendingUp, CheckCircle2, BookOpen, Loader2, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#84cc16",
]


type TabType = "turmas" | "disciplinas" | "aprovacao"

interface TurmaRow {
  turma_id: number; turma_nome: string; curso_sigla: string; ano: number
  total_alunos: number; media_geral: number; aprovados: number; reprovados: number; pct_aprovacao: number
}
interface DiscRow {
  disciplina_id: number; disciplina_nome: string; sigla: string; curso_nome: string
  total_notas: number; media_geral: number; media_min: number; media_max: number
  aprovados: number; reprovados: number; pct_aprovacao: number
}
interface AprovacaoData {
  geral: { total: number; aprovados: number; reprovados: number; media_geral: number; pct_aprovacao: number }
  por_curso: { curso: string; sigla: string; total: number; aprovados: number; pct: number }[]
  por_ano: { ano: string; total: number; aprovados: number; media: number; pct: number }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function AdminRelatoriosComparativosPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [tab, setTab] = useState<TabType>("turmas")
  const [anos, setAnos] = useState<{ id: number; nome: string; estado: string }[]>([])
  const [trimestres, setTrimestres] = useState<Trimestre[]>([])
  const [anoId, setAnoId] = useState("")
  const [trimestreId, setTrimestreId] = useState("all")

  const [turmaDados, setTurmaDados] = useState<TurmaRow[]>([])
  const [discDados, setDiscDados] = useState<DiscRow[]>([])
  const [aprovDados, setAprovDados] = useState<AprovacaoData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    Promise.all([getAnosLectivos(), getTrimestres()]).then(([anosRes, trRes]) => {
      const listaAnos = anosRes.data || []
      setAnos(listaAnos)
      setTrimestres(trRes.data || [])
      const activo = listaAnos.find((a: { id: number; estado: string }) => a.estado === "Activo")
      if (activo) setAnoId(String(activo.id))
    })
  }, [])

  const carregar = useCallback(async () => {
    if (!anoId) return
    setLoading(true)
    try {
      const qs = `anoLectivoId=${anoId}${trimestreId && trimestreId !== "all" ? `&trimestreId=${trimestreId}` : ""}`
      const base = `/relatorios/comparativos.php?${qs}`

      const [t, d, a] = await Promise.all([
        apiFetch<{ success: boolean; data: TurmaRow[] }>(`${base}&tipo=turmas`),
        apiFetch<{ success: boolean; data: DiscRow[] }>(`${base}&tipo=disciplinas`),
        apiFetch<{ success: boolean } & AprovacaoData>(`${base}&tipo=aprovacao`),
      ])
      setTurmaDados(t.data || [])
      setDiscDados(d.data || [])
      setAprovDados(a.success ? a : null)
    } catch {
      toast({ title: "Erro ao carregar relatórios", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [anoId, trimestreId])

  useEffect(() => { if (anoId) carregar() }, [anoId, trimestreId])

  const exportarCSV = (dados: object[], nome: string) => {
    if (!dados.length) return
    const headers = Object.keys(dados[0]).join(",")
    const rows = dados.map((r) => Object.values(r).map((v) => `"${v}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + headers + "\n" + rows], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${nome}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  if (!isAuthenticated || user?.type !== "admin") return null

  const TABS: { key: TabType; label: string; icon: typeof BarChart3 }[] = [
    { key: "turmas",      label: "Por Turma",      icon: BarChart3 },
    { key: "disciplinas", label: "Por Disciplina",  icon: BookOpen },
    { key: "aprovacao",   label: "Taxa de Aprovação", icon: CheckCircle2 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" /> Relatórios Comparativos
                </h2>
                <p className="text-muted-foreground">Análises cruzadas entre turmas, disciplinas e taxas de aprovação</p>
              </div>
              <div className="flex gap-3">
                <Select value={anoId} onValueChange={setAnoId}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Ano lectivo" /></SelectTrigger>
                  <SelectContent>
                    {anos.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={trimestreId} onValueChange={setTrimestreId}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Todos os trimestres" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os trimestres</SelectItem>
                    {trimestres.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    tab === t.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <>
                {/* ── Tab: Turmas ── */}
                {tab === "turmas" && (
                  <div className="space-y-6">
                    {turmaDados.length === 0 ? (
                      <Card><CardContent className="py-16 text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Sem dados para o período seleccionado</p>
                      </CardContent></Card>
                    ) : (
                      <>
                        {/* Gráfico: Média por turma */}
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Média Geral por Turma</CardTitle>
                            <Button size="sm" variant="outline" onClick={() => exportarCSV(turmaDados, "turmas")}>
                              <Download className="h-3.5 w-3.5 mr-1" /> CSV
                            </Button>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={turmaDados} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="turma_nome" angle={-30} textAnchor="end" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 20]} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="media_geral" name="Média" radius={4}>
                                  {turmaDados.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Gráfico: Aprovados vs Reprovados */}
                        <Card>
                          <CardHeader><CardTitle>Aprovados vs Reprovados por Turma</CardTitle></CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={turmaDados} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="turma_nome" angle={-30} textAnchor="end" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="aprovados" name="Aprovados" fill="#10b981" radius={[4,4,0,0]} />
                                <Bar dataKey="reprovados" name="Reprovados" fill="#ef4444" radius={[4,4,0,0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Tabela */}
                        <Card>
                          <CardHeader><CardTitle>Detalhe por Turma</CardTitle></CardHeader>
                          <CardContent>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b text-xs text-muted-foreground">
                                  <th className="text-left py-2 px-3">Turma</th>
                                  <th className="text-center py-2 px-3">Alunos</th>
                                  <th className="text-center py-2 px-3">Média</th>
                                  <th className="text-center py-2 px-3">Aprovados</th>
                                  <th className="text-center py-2 px-3">Reprovados</th>
                                  <th className="text-center py-2 px-3">% Aprovação</th>
                                </tr>
                              </thead>
                              <tbody>
                                {turmaDados.map((t, i) => (
                                  <tr key={t.turma_id} className="border-b hover:bg-muted/20">
                                    <td className="py-2 px-3">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                        <span className="font-medium">{t.turma_nome}</span>
                                        <Badge variant="outline" className="text-xs">{t.ano}º</Badge>
                                      </div>
                                    </td>
                                    <td className="py-2 px-3 text-center">{t.total_alunos}</td>
                                    <td className="py-2 px-3 text-center font-bold" style={{
                                      color: t.media_geral >= 14 ? "#16a34a" : t.media_geral >= 10 ? "#2563eb" : "#dc2626"
                                    }}>{t.media_geral?.toFixed(1)}</td>
                                    <td className="py-2 px-3 text-center text-green-600">{t.aprovados}</td>
                                    <td className="py-2 px-3 text-center text-red-600">{t.reprovados}</td>
                                    <td className="py-2 px-3 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-16 bg-muted rounded-full h-1.5">
                                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${t.pct_aprovacao}%` }} />
                                        </div>
                                        <span className="text-xs font-medium">{t.pct_aprovacao}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                )}

                {/* ── Tab: Disciplinas ── */}
                {tab === "disciplinas" && (
                  <div className="space-y-6">
                    {discDados.length === 0 ? (
                      <Card><CardContent className="py-16 text-center text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Sem dados para o período seleccionado</p>
                      </CardContent></Card>
                    ) : (
                      <>
                        {/* Gráfico: top 10 disciplinas */}
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Média por Disciplina</CardTitle>
                            <Button size="sm" variant="outline" onClick={() => exportarCSV(discDados, "disciplinas")}>
                              <Download className="h-3.5 w-3.5 mr-1" /> CSV
                            </Button>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={320}>
                              <BarChart
                                data={discDados.slice(0, 15)}
                                layout="vertical"
                                margin={{ top: 5, right: 40, left: 130, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="disciplina_nome" tick={{ fontSize: 11 }} width={120} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="media_geral" name="Média" radius={4}>
                                  {discDados.slice(0, 15).map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Gráfico: taxa de aprovação por disciplina */}
                        <Card>
                          <CardHeader><CardTitle>Taxa de Aprovação por Disciplina (%)</CardTitle></CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={discDados.slice(0, 12)} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="disciplina_nome" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} />
                                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="pct_aprovacao" name="% Aprovação" radius={4}>
                                  {discDados.slice(0, 12).map((d, i) => (
                                    <Cell key={i} fill={d.pct_aprovacao >= 75 ? "#10b981" : d.pct_aprovacao >= 50 ? "#f59e0b" : "#ef4444"} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Tabela */}
                        <Card>
                          <CardHeader><CardTitle>Ranking de Disciplinas</CardTitle></CardHeader>
                          <CardContent>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b text-xs text-muted-foreground">
                                  <th className="text-left py-2 px-3">#</th>
                                  <th className="text-left py-2 px-3">Disciplina</th>
                                  <th className="text-center py-2 px-3">Média</th>
                                  <th className="text-center py-2 px-3">Mín / Máx</th>
                                  <th className="text-center py-2 px-3">Aprovados</th>
                                  <th className="text-center py-2 px-3">% Aprovação</th>
                                </tr>
                              </thead>
                              <tbody>
                                {discDados.map((d, i) => (
                                  <tr key={d.disciplina_id} className="border-b hover:bg-muted/20">
                                    <td className="py-2 px-3 text-muted-foreground text-xs">{i + 1}</td>
                                    <td className="py-2 px-3">
                                      <p className="font-medium">{d.disciplina_nome}</p>
                                      <p className="text-xs text-muted-foreground">{d.curso_nome}</p>
                                    </td>
                                    <td className="py-2 px-3 text-center font-bold" style={{
                                      color: d.media_geral >= 14 ? "#16a34a" : d.media_geral >= 10 ? "#2563eb" : "#dc2626"
                                    }}>{d.media_geral?.toFixed(1)}</td>
                                    <td className="py-2 px-3 text-center text-xs text-muted-foreground">
                                      {d.media_min?.toFixed(1)} / {d.media_max?.toFixed(1)}
                                    </td>
                                    <td className="py-2 px-3 text-center text-green-600">
                                      {d.aprovados} <span className="text-muted-foreground text-xs">/ {d.total_notas}</span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <Badge className={`text-xs ${d.pct_aprovacao >= 75 ? "bg-green-100 text-green-800" : d.pct_aprovacao >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                                        {d.pct_aprovacao}%
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                )}

                {/* ── Tab: Aprovação ── */}
                {tab === "aprovacao" && aprovDados && (
                  <div className="space-y-6">
                    {/* Cards gerais */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Total de Avaliações", value: aprovDados.geral?.total,           color: "text-primary" },
                        { label: "Aprovados",            value: aprovDados.geral?.aprovados,        color: "text-green-600" },
                        { label: "Reprovados",           value: aprovDados.geral?.reprovados,       color: "text-red-600" },
                        { label: "Taxa de Aprovação",    value: `${aprovDados.geral?.pct_aprovacao}%`, color: "text-blue-600" },
                      ].map((s) => (
                        <Card key={s.label}>
                          <CardContent className="pt-4 pb-4 text-center">
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Por curso */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader><CardTitle className="text-base">Taxa de Aprovação por Curso</CardTitle></CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={aprovDados.por_curso} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="sigla" tick={{ fontSize: 12 }} />
                              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="pct" name="% Aprovação" radius={4}>
                                {aprovDados.por_curso.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader><CardTitle className="text-base">Aprovação por Ano de Escolaridade</CardTitle></CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={aprovDados.por_ano} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="ano" tick={{ fontSize: 12 }} />
                              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend />
                              <Bar dataKey="pct" name="% Aprovação" fill="#3b82f6" radius={4} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Tabela por ano */}
                    <Card>
                      <CardHeader><CardTitle className="text-base">Detalhe por Ano de Escolaridade</CardTitle></CardHeader>
                      <CardContent>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-xs text-muted-foreground">
                              <th className="text-left py-2 px-3">Ano</th>
                              <th className="text-center py-2 px-3">Total</th>
                              <th className="text-center py-2 px-3">Aprovados</th>
                              <th className="text-center py-2 px-3">Média</th>
                              <th className="text-center py-2 px-3">Taxa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {aprovDados.por_ano.map((a) => (
                              <tr key={a.ano} className="border-b hover:bg-muted/20">
                                <td className="py-2 px-3 font-medium">{a.ano}</td>
                                <td className="py-2 px-3 text-center">{a.total}</td>
                                <td className="py-2 px-3 text-center text-green-600">{a.aprovados}</td>
                                <td className="py-2 px-3 text-center font-semibold text-primary">{a.media?.toFixed(1)}</td>
                                <td className="py-2 px-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-20 bg-muted rounded-full h-2">
                                      <div className="bg-primary h-2 rounded-full" style={{ width: `${a.pct}%` }} />
                                    </div>
                                    <span className="text-xs font-medium">{a.pct}%</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}

          </motion.div>
        </main>
      </div>
    </div>
  )
}
