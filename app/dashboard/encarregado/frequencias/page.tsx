"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getFrequenciasRelatorio } from "@/lib/api"
import { Users, Loader2, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { subMonths, format } from "date-fns"

export default function EncarregadoFrequenciasPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const alunoId = user?.type === "encarregado" ? Number((user as { aluno_id?: number; alunoId?: number }).aluno_id ?? (user as { alunoId?: number }).alunoId) || null : null
  const [dataInicio, setDataInicio] = useState(format(subMonths(new Date(), 1), "yyyy-MM-dd"))
  const [dataFim, setDataFim] = useState(format(new Date(), "yyyy-MM-dd"))
  const [loading, setLoading] = useState(false)
  const [resumo, setResumo] = useState<{ total_dias: number; presentes: number; faltas: number; justificadas: number; percentagem_presencas: number } | null>(null)
  const [aluno, setAluno] = useState<{ id: number; numero: string; nome: string; turma_nome: string | null } | null>(null)
  const [dados, setDados] = useState<Array<{ data: string; presente: number; justificada: number; observacao: string | null }>>([])

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "encarregado") router.push("/login/encarregado")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (!alunoId) return
    setLoading(true)
    getFrequenciasRelatorio({ alunoId, dataInicio, dataFim })
      .then((r) => {
        if (r.tipo === "aluno" && r.aluno) {
          setAluno(r.aluno)
          setResumo(r.resumo as typeof resumo)
          setDados(r.dados || [])
        }
      })
      .catch(() => toast({ title: "Erro ao carregar frequências", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [alunoId, dataInicio, dataFim])

  if (!isAuthenticated || user?.type !== "encarregado") return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
              <Users className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Frequências do Educando</h1>
                <p className="text-muted-foreground">Presenças e faltas no período</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Período
                </CardTitle>
                <CardContent className="pt-4 flex flex-wrap gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data início</label>
                    <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-40" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data fim</label>
                    <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-40" />
                  </div>
                </CardContent>
              </CardHeader>
            </Card>

            {aluno && (
              <Card>
                <CardHeader>
                  <CardTitle>{aluno.nome}</CardTitle>
                  <p className="text-sm text-muted-foreground">Nº {aluno.numero} · {aluno.turma_nome || "—"}</p>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : resumo ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className="text-2xl font-bold">{resumo.percentagem_presencas}%</p>
                          <p className="text-xs text-muted-foreground">Presenças</p>
                        </div>
                        <div className="p-4 rounded-lg bg-green-500/10 text-center">
                          <p className="text-2xl font-bold text-green-600">{resumo.presentes}</p>
                          <p className="text-xs text-muted-foreground">Presentes</p>
                        </div>
                        <div className="p-4 rounded-lg bg-red-500/10 text-center">
                          <p className="text-2xl font-bold text-red-600">{resumo.faltas}</p>
                          <p className="text-xs text-muted-foreground">Faltas</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className="text-2xl font-bold">{resumo.justificadas}</p>
                          <p className="text-xs text-muted-foreground">Justificadas</p>
                        </div>
                      </div>
                      {dados.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted/50 border-b">
                                <th className="text-left py-2 px-3 font-semibold">Data</th>
                                <th className="text-center py-2 px-3 font-semibold">Situação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dados.map((d) => (
                                <tr key={d.data} className="border-b last:border-0">
                                  <td className="py-2 px-3">{d.data}</td>
                                  <td className="py-2 px-3 text-center">
                                    {d.presente ? (
                                      <span className="text-green-600 font-medium">Presente</span>
                                    ) : d.justificada ? (
                                      <span className="text-amber-600">Falta justificada</span>
                                    ) : (
                                      <span className="text-red-600">Falta</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Nenhum registo no período.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {!alunoId && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Não foi possível identificar o educando. Contacte a secretaria.
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
