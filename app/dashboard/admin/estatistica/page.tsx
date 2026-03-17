"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRelatorioNotas } from "@/lib/api"
import { TrendingUp, CheckCircle2, Clock, XCircle, BookOpen, Loader2, AlertCircle } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from "recharts"

interface Relatorio {
  totais: { total_notas: number; pendentes: number; aprovadas: number; rejeitadas: number; media_geral: number }
  por_disciplina: { disciplina: string; total: number; media: number; aprovados: number; pct_aprovados: number }[]
  por_trimestre: { trimestre: string; total: number; media: number; aprovados: number }[]
}

export default function AdminEstatisticasPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [data, setData] = useState<Relatorio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") {
      router.push("/")
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    getRelatorioNotas()
      .then((res: any) => {
        if (res?.success && res?.totais) {
          setData({ totais: res.totais, por_disciplina: res.por_disciplina || [], por_trimestre: res.por_trimestre || [] })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (!isAuthenticated || user?.type !== "admin") return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-7 h-7 text-primary" />
                Estatísticas
              </h1>
              <p className="text-muted-foreground">Análise de desempenho académico</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !data ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Sem dados disponíveis</h3>
                  <p className="text-muted-foreground">Ainda não há notas aprovadas no sistema.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Totais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: BookOpen,    label: "Total Notas",  value: data.totais.total_notas, color: "primary" },
                    { icon: Clock,       label: "Pendentes",    value: data.totais.pendentes,   color: "warning" },
                    { icon: CheckCircle2,label: "Aprovadas",    value: data.totais.aprovadas,   color: "success" },
                    { icon: XCircle,     label: "Rejeitadas",   value: data.totais.rejeitadas,  color: "destructive" },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <Card key={label}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-${color}/10 flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${color}`} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-2xl font-bold">{value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Média geral destaque */}
                {data.totais.media_geral && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                        <TrendingUp className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-muted-foreground">Média Geral do Sistema</p>
                        <p className="text-4xl font-bold text-primary">{data.totais.media_geral}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Gráfico por disciplina */}
                {data.por_disciplina.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Média por Disciplina</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.por_disciplina} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="disciplina" angle={-30} textAnchor="end" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 20]} />
                          <Tooltip />
                          <Bar dataKey="media" name="Média" fill="hsl(var(--primary))" radius={4} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Evolução por trimestre */}
                {data.por_trimestre.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Evolução por Trimestre</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={data.por_trimestre}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="trimestre" />
                          <YAxis domain={[0, 20]} />
                          <Tooltip />
                          <Line type="monotone" dataKey="media" name="Média" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Tabela por disciplina */}
                {data.por_disciplina.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Detalhes por Disciplina</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/30">
                              <th className="text-left py-3 px-4 font-semibold">Disciplina</th>
                              <th className="text-center py-3 px-4 font-semibold">Total</th>
                              <th className="text-center py-3 px-4 font-semibold">Média</th>
                              <th className="text-center py-3 px-4 font-semibold">Aprovados</th>
                              <th className="text-center py-3 px-4 font-semibold">% Aprovação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.por_disciplina.map((d) => (
                              <tr key={d.disciplina} className="border-b hover:bg-muted/20">
                                <td className="py-3 px-4 font-medium">{d.disciplina}</td>
                                <td className="py-3 px-4 text-center">{d.total}</td>
                                <td className="py-3 px-4 text-center font-bold text-primary">{d.media}</td>
                                <td className="py-3 px-4 text-center text-success">{d.aprovados}</td>
                                <td className="py-3 px-4 text-center">{d.pct_aprovados}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
