"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiFetch, getAdminTurmas, getTrimestres, getAdminDisciplinasList, type Trimestre } from "@/lib/api"
import {
  RefreshCw, Loader2, Save, AlertTriangle, CheckCircle2,
  GraduationCap, BookOpen, Filter, Users, Award
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RecuperacaoAluno {
  nota_id: number
  aluno_id: number
  aluno_numero: string
  aluno_nome: string
  disciplina: string
  trimestre: string
  p1: number | null
  p2: number | null
  trabalho: number | null
  exame: number | null
  media: number | null
  nota_recuperacao: number | null
  media_final: number | null
  aprovado: boolean
}

export default function AdminRecuperacaoPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [trimestres, setTrimestres] = useState<Trimestre[]>([])
  const [turmas, setTurmas] = useState<{ id: number; nome: string }[]>([])
  const [disciplinas, setDisciplinas] = useState<{ id: number; nome: string; sigla: string }[]>([])
  const [dados, setDados] = useState<RecuperacaoAluno[]>([])
  const [editando, setEditando] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [loadingList, setLoadingList] = useState(false)

  const [trimestreId, setTrimestreId] = useState("")
  const [turmaId, setTurmaId] = useState("all")
  const [disciplinaId, setDisciplinaId] = useState("all")
  const [filtro, setFiltro] = useState<"todos" | "reprovados">("reprovados")

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/login/admin")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    Promise.all([getTrimestres(), getAdminTurmas(), getAdminDisciplinasList()])
      .then(([tr, tu, di]) => {
        setTrimestres(tr.data || [])
        setTurmas((tu.data || []).map((t: { id: number; nome: string }) => ({ id: t.id, nome: t.nome })))
        setDisciplinas(di.data || [])
        const activo = (tr.data || []).find((t: Trimestre) => t.estado === "Activo")
        if (activo) setTrimestreId(String(activo.id))
      })
      .finally(() => setLoading(false))
  }, [])

  const carregar = useCallback(async () => {
    setLoadingList(true)
    try {
      const params = new URLSearchParams()
      if (trimestreId) params.set("trimestreId", trimestreId)
      if (turmaId && turmaId !== "all") params.set("turmaId", turmaId)
      if (disciplinaId && disciplinaId !== "all") params.set("disciplinaId", disciplinaId)
      const res = await apiFetch<{ success: boolean; data: RecuperacaoAluno[] }>(
        `/notas/recuperacao.php?${params}`
      )
      let lista = res.data || []
      if (filtro === "reprovados") lista = lista.filter((a) => !a.aprovado)
      setDados(lista)
      setEditando({})
    } catch {
      toast({ title: "Erro ao carregar dados", variant: "destructive" })
    } finally {
      setLoadingList(false)
    }
  }, [trimestreId, turmaId, disciplinaId, filtro, toast])

  const guardar = async (notaId: number) => {
    const valor = editando[notaId]
    const nota = valor === "" ? null : parseFloat(valor)
    if (nota !== null && (isNaN(nota) || nota < 0 || nota > 20)) {
      toast({ title: "Nota deve estar entre 0 e 20", variant: "destructive" })
      return
    }
    setSaving((s) => ({ ...s, [notaId]: true }))
    try {
      await apiFetch("/notas/recuperacao.php", {
        method: "POST",
        body: JSON.stringify({ notaId, nota_recuperacao: nota }),
      })
      toast({ title: "Nota de recuperação guardada" })
      await carregar()
    } catch {
      toast({ title: "Erro ao guardar nota", variant: "destructive" })
    } finally {
      setSaving((s) => ({ ...s, [notaId]: false }))
    }
  }

  const mediaFinalCalc = (media: number | null, recup: number | null) => {
    if (media === null) return null
    if (recup === null) return media
    return Math.round(((media + recup) / 2) * 100) / 100
  }

  const totalAprovados = dados.filter((a) => {
    const rv = editando[a.nota_id] !== undefined
      ? (editando[a.nota_id] === "" ? null : parseFloat(editando[a.nota_id]))
      : a.nota_recuperacao
    const mf = mediaFinalCalc(a.media, rv)
    return mf !== null ? mf >= 10 : a.aprovado
  }).length

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">A carregar...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="p-6 space-y-5">

          {/* Cabeçalho */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Exames de Recuperação</h1>
              <p className="text-sm text-muted-foreground">Lance notas de recuperação para alunos reprovados</p>
            </div>
          </div>

          {/* Filtros */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" /> Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Trimestre</label>
                  <Select value={trimestreId} onValueChange={setTrimestreId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {trimestres.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Turma</label>
                  <Select value={turmaId} onValueChange={setTurmaId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Todas as turmas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as turmas</SelectItem>
                      {turmas.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Disciplina</label>
                  <Select value={disciplinaId} onValueChange={setDisciplinaId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as disciplinas</SelectItem>
                      {disciplinas.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Mostrar</label>
                  <div className="flex gap-2">
                    <Select value={filtro} onValueChange={(v) => setFiltro(v as "todos" | "reprovados")}>
                      <SelectTrigger className="h-9 flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reprovados">Só reprovados</SelectItem>
                        <SelectItem value="todos">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={carregar} disabled={loadingList} size="sm" className="h-9 px-3">
                      {loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          {dados.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Users, label: "Total", value: dados.length, bg: "bg-blue-50", text: "text-blue-600" },
                { icon: CheckCircle2, label: "Aprovados", value: totalAprovados, bg: "bg-green-50", text: "text-green-600" },
                { icon: AlertTriangle, label: "Reprovados", value: dados.length - totalAprovados, bg: "bg-red-50", text: "text-red-600" },
              ].map(({ icon: Icon, label, value, bg, text }) => (
                <Card key={label} className="border shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}>
                      <Icon className={`h-4 w-4 ${text}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-2xl font-bold leading-none mt-0.5">{value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Tabela */}
          {dados.length > 0 ? (
            <Card className="border shadow-sm">
              <CardHeader className="px-5 pt-4 pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  Alunos
                  <Badge variant="secondary" className="ml-auto font-normal">{dados.length} registos</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide border-b">
                        <th className="text-left py-3 px-4 font-medium">Aluno</th>
                        <th className="text-left py-3 px-4 font-medium">Disciplina</th>
                        <th className="text-center py-3 px-3 font-medium">P1</th>
                        <th className="text-center py-3 px-3 font-medium">P2</th>
                        <th className="text-center py-3 px-3 font-medium">Trab.</th>
                        <th className="text-center py-3 px-3 font-medium">MAC</th>
                        <th className="text-center py-3 px-3 font-medium">Média</th>
                        <th className="text-center py-3 px-4 font-medium">Recuperação</th>
                        <th className="text-center py-3 px-3 font-medium">M. Final</th>
                        <th className="text-center py-3 px-4 font-medium">Situação</th>
                        <th className="text-center py-3 px-4 font-medium">Gravar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {dados.map((aluno) => {
                        const recupVal = editando[aluno.nota_id] !== undefined
                          ? (editando[aluno.nota_id] === "" ? null : parseFloat(editando[aluno.nota_id]))
                          : aluno.nota_recuperacao
                        const mac = aluno.p1 !== null && aluno.p2 !== null && aluno.trabalho !== null
                          ? ((aluno.p1 + aluno.p2 + aluno.trabalho) / 3) : null
                        const mf = mediaFinalCalc(aluno.media, recupVal)
                        const aprovado = mf !== null ? mf >= 10 : aluno.aprovado
                        const temEdicao = editando[aluno.nota_id] !== undefined

                        return (
                          <tr key={aluno.nota_id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-medium">{aluno.aluno_nome}</p>
                              <p className="text-xs text-muted-foreground font-mono">{aluno.aluno_numero}</p>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">{aluno.disciplina}</td>
                            {[aluno.p1, aluno.p2, aluno.trabalho].map((v, i) => (
                              <td key={i} className="py-3 px-3 text-center text-muted-foreground">{v ?? "—"}</td>
                            ))}
                            <td className="py-3 px-3 text-center font-medium">
                              {mac !== null ? mac.toFixed(1) : "—"}
                            </td>
                            <td className={`py-3 px-3 text-center font-semibold ${aluno.media === null ? "text-muted-foreground"
                                : aluno.media < 10 ? "text-red-600" : "text-green-600"
                              }`}>
                              {aluno.media ?? "—"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Input
                                type="number" min={0} max={20} step={0.5}
                                placeholder="0 – 20"
                                className={`w-24 text-center h-8 mx-auto ${temEdicao ? "border-amber-400 ring-1 ring-amber-200" : ""}`}
                                value={editando[aluno.nota_id] ?? (aluno.nota_recuperacao !== null ? String(aluno.nota_recuperacao) : "")}
                                onChange={(e) => setEditando((prev) => ({ ...prev, [aluno.nota_id]: e.target.value }))}
                              />
                            </td>
                            <td className={`py-3 px-3 text-center font-bold ${mf === null ? "text-muted-foreground" : aprovado ? "text-green-600" : "text-red-600"
                              }`}>
                              {mf !== null ? mf.toFixed(1) : "—"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {aprovado
                                ? <Badge className="bg-green-50 text-green-700 border border-green-200 font-normal gap-1 hover:bg-green-50">
                                  <CheckCircle2 className="h-3 w-3" />Aprovado
                                </Badge>
                                : <Badge className="bg-red-50 text-red-700 border border-red-200 font-normal gap-1 hover:bg-red-50">
                                  <AlertTriangle className="h-3 w-3" />Reprovado
                                </Badge>
                              }
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Button
                                size="sm" variant={temEdicao ? "default" : "ghost"}
                                disabled={saving[aluno.nota_id] || !temEdicao}
                                onClick={() => guardar(aluno.nota_id)}
                                className="h-8 w-8 p-0"
                              >
                                {saving[aluno.nota_id]
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Save className="h-3.5 w-3.5" />}
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : !loadingList ? (
            <Card className="border shadow-sm">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="font-medium text-muted-foreground">Seleccione os filtros e clique em carregar</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Os alunos elegíveis para recuperação aparecerão aqui</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border shadow-sm">
              <CardContent className="py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              </CardContent>
            </Card>
          )}

        </main>
      </div>
    </div>
  )
}