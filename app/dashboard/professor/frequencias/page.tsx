"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTurmasProfessor, getFrequenciasList, registarFrequencias } from "@/lib/api"
import { Users, Loader2, Save, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { format, subMonths } from "date-fns"

export default function ProfessorFrequenciasPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [turmas, setTurmas] = useState<{ turma_id: number; turma_nome: string }[]>([])
  const [alunos, setAlunos] = useState<{ id: number; numero: string; nome: string }[]>([])
  const [presencas, setPresencas] = useState<Record<number, { presente: number; justificada: number; observacao?: string }>>({})
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("")
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"))
  const [loading, setLoading] = useState(true)
  const [loadingList, setLoadingList] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "professor") router.push("/login/professor")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    getTurmasProfessor(user.id)
      .then((res) => {
        const list = res.data || []
        const byTurma = new Map<number, string>()
        list.forEach((t: { turma_id: number; turma_nome: string }) => byTurma.set(t.turma_id, t.turma_nome))
        setTurmas(Array.from(byTurma.entries()).map(([turma_id, turma_nome]) => ({ turma_id, turma_nome })))
        if (byTurma.size > 0 && !selectedTurmaId) setSelectedTurmaId(String(Array.from(byTurma.keys())[0]))
      })
      .catch(() => toast({ title: "Erro ao carregar turmas", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [user?.id])

  const loadList = useCallback(() => {
    if (!selectedTurmaId || !data) return
    setLoadingList(true)
    getFrequenciasList({
      turmaId: Number(selectedTurmaId),
      dataInicio: data,
      dataFim: data,
    })
      .then((res) => {
        setAlunos(res.alunos || [])
        const byAluno: Record<number, { presente: number; justificada: number; observacao?: string }> = {}
        ;(res.alunos || []).forEach((a: { id: number }) => {
          const p = (res.data || []).find((x: { aluno_id: number }) => x.aluno_id === a.id)
          byAluno[a.id] = p
            ? { presente: p.presente, justificada: p.justificada || 0, observacao: p.observacao || undefined }
            : { presente: 1, justificada: 0 }
        })
        setPresencas(byAluno)
      })
      .catch(() => toast({ title: "Erro ao carregar presenças", variant: "destructive" }))
      .finally(() => setLoadingList(false))
  }, [selectedTurmaId, data])

  useEffect(() => {
    loadList()
  }, [loadList])

  const handleTogglePresente = (alunoId: number) => {
    setPresencas((prev) => ({
      ...prev,
      [alunoId]: {
        ...prev[alunoId],
        presente: prev[alunoId]?.presente ? 0 : 1,
        justificada: 0,
      },
    }))
  }

  const handleToggleJustificada = (alunoId: number) => {
    setPresencas((prev) => ({
      ...prev,
      [alunoId]: {
        ...prev[alunoId],
        justificada: prev[alunoId]?.justificada ? 0 : 1,
      },
    }))
  }

  const handleSave = async () => {
    if (!selectedTurmaId || !data) return
    setSaving(true)
    try {
      await registarFrequencias({
        data,
        turmaId: Number(selectedTurmaId),
        presencas: alunos.map((a) => ({
          alunoId: a.id,
          presente: presencas[a.id]?.presente ?? 1,
          justificada: presencas[a.id]?.justificada ?? 0,
          observacao: presencas[a.id]?.observacao,
        })),
      })
      toast({ title: "Frequências guardadas com sucesso" })
      loadList()
    } catch (e) {
      toast({ title: "Erro ao guardar", description: e instanceof Error ? e.message : "Erro", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (!isAuthenticated || user?.type !== "professor") return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
              <Users className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Registar Frequências</h1>
                <p className="text-muted-foreground">Marque as presenças e faltas por data e turma</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Turma e Data
                </CardTitle>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Turma</label>
                      <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId} disabled={loading}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Seleccionar turma" />
                        </SelectTrigger>
                        <SelectContent>
                          {turmas.map((t) => (
                            <SelectItem key={t.turma_id} value={String(t.turma_id)}>
                              {t.turma_nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data</label>
                      <Input
                        type="date"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        max={format(new Date(), "yyyy-MM-dd")}
                        min={format(subMonths(new Date(), 6), "yyyy-MM-dd")}
                        className="w-40"
                      />
                    </div>
                  </div>
                </CardContent>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Lista de alunos</CardTitle>
                <Button onClick={handleSave} disabled={saving || loadingList || alunos.length === 0}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar
                </Button>
              </CardHeader>
              <CardContent>
                {loadingList ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : alunos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Seleccione uma turma e uma data.</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left py-3 px-4 font-semibold">Nº</th>
                          <th className="text-left py-3 px-4 font-semibold">Nome</th>
                          <th className="text-center py-3 px-4 font-semibold">Presente</th>
                          <th className="text-center py-3 px-4 font-semibold">Falta justificada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alunos.map((a) => (
                          <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="py-3 px-4">{a.numero}</td>
                            <td className="py-3 px-4 font-medium">{a.nome}</td>
                            <td className="py-3 px-4 text-center">
                              <Checkbox
                                checked={(presencas[a.id]?.presente ?? 1) === 1}
                                onCheckedChange={() => handleTogglePresente(a.id)}
                              />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Checkbox
                                checked={(presencas[a.id]?.justificada ?? 0) === 1}
                                onCheckedChange={() => handleToggleJustificada(a.id)}
                                disabled={(presencas[a.id]?.presente ?? 1) === 1}
                              />
                            </td>
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
