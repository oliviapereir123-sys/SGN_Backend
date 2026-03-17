"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAdminTurmas, getFrequenciasRelatorio } from "@/lib/api"
import { Users, Loader2, Calendar, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { subMonths, format } from "date-fns"

export default function AdminFrequenciasPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [turmas, setTurmas] = useState<{ id: number; nome: string }[]>([])
  const [turmaId, setTurmaId] = useState<string>("")
  const [dataInicio, setDataInicio] = useState(format(subMonths(new Date(), 1), "yyyy-MM-dd"))
  const [dataFim, setDataFim] = useState(format(new Date(), "yyyy-MM-dd"))
  const [loading, setLoading] = useState(true)
  const [loadingReport, setLoadingReport] = useState(false)
  const [resumo, setResumo] = useState<Array<{ aluno_id: number; numero: string; nome: string; total: number; presentes: number; faltas: number; justificadas: number; percentagem: number }>>([])

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/login/admin")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    getAdminTurmas()
      .then((res) => {
        setTurmas((res.data || []).map((t) => ({ id: t.id, nome: t.nome })))
        if (res.data?.length && !turmaId) setTurmaId(String(res.data[0].id))
      })
      .catch(() => toast({ title: "Erro ao carregar turmas", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [])

  const loadReport = () => {
    if (!turmaId) return
    setLoadingReport(true)
    getFrequenciasRelatorio({
      turmaId: Number(turmaId),
      dataInicio,
      dataFim,
    })
      .then((r) => {
        setResumo(Array.isArray(r.resumo) ? r.resumo : [])
      })
      .catch(() => toast({ title: "Erro ao carregar relatório", variant: "destructive" }))
      .finally(() => setLoadingReport(false))
  }

  useEffect(() => {
    if (turmaId) loadReport()
  }, [turmaId])

  if (!isAuthenticated || user?.type !== "admin") return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Relatório de Frequências</h1>
                <p className="text-muted-foreground">Resumo de presenças e faltas por turma e período</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Filtros
                </CardTitle>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Turma</label>
                      <Select value={turmaId} onValueChange={setTurmaId} disabled={loading}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Turma" />
                        </SelectTrigger>
                        <SelectContent>
                          {turmas.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data início</label>
                      <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-40" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data fim</label>
                      <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-40" />
                    </div>
                    <Button onClick={loadReport} disabled={loadingReport}>
                      {loadingReport ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                      Actualizar
                    </Button>
                  </div>
                </CardContent>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo por aluno</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingReport ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : resumo.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum registo de frequência no período.</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left py-3 px-4 font-semibold">Nº</th>
                          <th className="text-left py-3 px-4 font-semibold">Nome</th>
                          <th className="text-center py-3 px-4 font-semibold">Dias</th>
                          <th className="text-center py-3 px-4 font-semibold">Presentes</th>
                          <th className="text-center py-3 px-4 font-semibold">Faltas</th>
                          <th className="text-center py-3 px-4 font-semibold">Justificadas</th>
                          <th className="text-center py-3 px-4 font-semibold">% Presenças</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumo.map((r) => (
                          <tr key={r.aluno_id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="py-3 px-4">{r.numero}</td>
                            <td className="py-3 px-4 font-medium">{r.nome}</td>
                            <td className="py-3 px-4 text-center">{r.total}</td>
                            <td className="py-3 px-4 text-center text-green-600">{r.presentes}</td>
                            <td className="py-3 px-4 text-center text-red-600">{r.faltas}</td>
                            <td className="py-3 px-4 text-center">{r.justificadas}</td>
                            <td className="py-3 px-4 text-center font-medium">{r.percentagem}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
