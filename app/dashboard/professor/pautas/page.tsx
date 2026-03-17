"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { getTurmasProfessor, getTrimestres, getAlunosTurma, type TurmaProfessor, type Trimestre, type AlunoTurma } from "@/lib/api"
import {
  Printer, FileSpreadsheet, FileDown, Search, FileText,
  ChevronLeft, ChevronRight, Info, Download, Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const SITUACAO = (media: number | null) => {
  if (media === null) return { label: "—", className: "bg-muted text-muted-foreground" }
  if (media >= 10) return { label: "Aprovado", className: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" }
  if (media >= 7) return { label: "Recuperação", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400" }
  return { label: "Reprovado", className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" }
}

const PAGE_SIZE = 5

export default function ProfessorPautasPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [turmas, setTurmas] = useState<TurmaProfessor[]>([])
  const [trimestres, setTrimestres] = useState<Trimestre[]>([])
  const [alunos, setAlunos] = useState<AlunoTurma[]>([])

  const [selectedTurmaKey, setSelectedTurmaKey] = useState("")
  const [selectedTrId, setSelectedTrId] = useState("")
  const [searchAluno, setSearchAluno] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingAlunos, setLoadingAlunos] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "professor") router.push("/login/professor")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    Promise.all([getTurmasProfessor(user.id), getTrimestres()])
      .then(([turmasRes, trRes]) => {
        const t = turmasRes.data || []
        const tr = trRes.data || []
        setTurmas(t)
        setTrimestres(tr)
        if (t.length) setSelectedTurmaKey(`${t[0].turma_id}|${t[0].disciplina_id}`)
        const activo = tr.find((x) => x.estado === "Activo") || tr[0]
        if (activo) setSelectedTrId(String(activo.id))
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  const loadAlunos = useCallback(async () => {
    if (!selectedTurmaKey || !selectedTrId) return
    const [turmaId, disciplinaId] = selectedTurmaKey.split("|").map(Number)
    setLoadingAlunos(true)
    try {
      const res = await getAlunosTurma(turmaId, disciplinaId, Number(selectedTrId))
      setAlunos(res.data || [])
      setPage(1)
    } catch {
      toast({ title: "Erro ao carregar alunos", variant: "destructive" })
    } finally {
      setLoadingAlunos(false)
    }
  }, [selectedTurmaKey, selectedTrId])

  useEffect(() => { loadAlunos() }, [loadAlunos])

  if (!isAuthenticated || user?.type !== "professor") return null

  const selectedTurma = turmas.find((t) => `${t.turma_id}|${t.disciplina_id}` === selectedTurmaKey)
  const selectedTrimestre = trimestres.find((t) => String(t.id) === selectedTrId)

  const filtrados = alunos.filter((a) =>
    a.nome.toLowerCase().includes(searchAluno.toLowerCase()) ||
    a.numero.includes(searchAluno)
  )
  const totalPages = Math.ceil(filtrados.length / PAGE_SIZE)
  const paginados = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const aprovados = alunos.filter((a) => a.media !== null && Number(a.media) >= 10).length
  const recuperacao = alunos.filter((a) => a.media !== null && Number(a.media) >= 7 && Number(a.media) < 10).length
  const mediaGeral = alunos.length > 0
    ? alunos.filter((a) => a.media !== null).reduce((s, a) => s + Number(a.media), 0) /
    (alunos.filter((a) => a.media !== null).length || 1)
    : 0
  const aproveitamento = alunos.length > 0 ? Math.round((aprovados / alunos.length) * 100) : 0

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
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Pauta Académica</h1>
                  <p className="text-muted-foreground mt-1">Relatório consolidado de rendimento escolar por turma e disciplina.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="gap-2 text-sm">
                    <Printer className="w-4 h-4" />Imprimir
                  </Button>
                  <Button variant="outline" className="gap-2 text-sm">
                    <FileSpreadsheet className="w-4 h-4" />Excel
                  </Button>
                  <Button className="gap-2 bg-primary hover:bg-primary/90 text-sm">
                    <FileDown className="w-4 h-4" />Exportar PDF
                  </Button>
                </div>
              </div>

              {/* Filtros */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Disciplina</p>
                      <Select value={selectedTurmaKey} onValueChange={setSelectedTurmaKey}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {turmas.map((t) => (
                            <SelectItem key={`${t.turma_id}|${t.disciplina_id}`} value={`${t.turma_id}|${t.disciplina_id}`}>
                              {t.disciplina_nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Turma</p>
                      <Select value={selectedTurmaKey} onValueChange={setSelectedTurmaKey}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {turmas.map((t) => (
                            <SelectItem key={`${t.turma_id}|${t.disciplina_id}`} value={`${t.turma_id}|${t.disciplina_id}`}>
                              {t.turma_nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Período</p>
                      <Select value={selectedTrId} onValueChange={setSelectedTrId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {trimestres.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Pesquisar Aluno</p>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Nome ou número..."
                          value={searchAluno}
                          onChange={(e) => setSearchAluno(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela de Alunos */}
              <Card>
                <CardContent className="p-0">
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <h2 className="font-semibold">Listagem de Estudantes</h2>
                    </div>
                    <p className="text-sm text-primary">
                      Exibindo {filtrados.length} de {alunos.length} alunos matriculados
                    </p>
                  </div>

                  {loadingAlunos ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase px-6 py-3 w-12">Nº</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase px-6 py-3">Estudante</th>
                          <th className="text-center text-xs font-medium text-muted-foreground uppercase px-4 py-3">P1 (20%)</th>
                          <th className="text-center text-xs font-medium text-muted-foreground uppercase px-4 py-3">P2 (20%)</th>
                          <th className="text-center text-xs font-medium text-muted-foreground uppercase px-4 py-3">Trab. (20%)</th>
                          <th className="text-center text-xs font-medium text-muted-foreground uppercase px-4 py-3">Exame (40%)</th>
                          <th className="text-center text-xs font-medium text-muted-foreground uppercase px-4 py-3">Média</th>
                          <th className="text-center text-xs font-medium text-muted-foreground uppercase px-4 py-3">Situação</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {paginados.length > 0 ? paginados.map((aluno, i) => {
                          const media = aluno.media !== null ? Number(aluno.media) : null
                          const sit = SITUACAO(media)
                          return (
                            <motion.tr key={aluno.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="px-6 py-3.5 text-sm text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary overflow-hidden flex-shrink-0">
                                    {aluno.foto
                                      ? <img src={aluno.foto} alt="" className="w-full h-full object-cover" />
                                      : aluno.nome.charAt(0)
                                    }
                                  </div>
                                  <span className="text-sm font-medium">{aluno.nome}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center text-sm">{aluno.p1 ?? "—"}</td>
                              <td className="px-4 py-3.5 text-center text-sm">{aluno.p2 ?? "—"}</td>
                              <td className="px-4 py-3.5 text-center text-sm">{aluno.trabalho ?? "—"}</td>
                              <td className="px-4 py-3.5 text-center text-sm">{aluno.exame ?? "—"}</td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`text-sm font-bold ${media !== null ? (media >= 10 ? "text-green-600" : "text-red-500") : "text-muted-foreground"}`}>
                                  {media !== null ? media.toFixed(1) : "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <Badge variant="outline" className={sit.className}>{sit.label}</Badge>
                              </td>
                              <td className="pr-4">
                                <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground">
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </td>
                            </motion.tr>
                          )
                        }) : (
                          // Linhas vazias como no design
                          Array.from({ length: 3 }, (_, i) => (
                            <tr key={i} className="border-b border-border">
                              <td className="px-6 py-3.5 text-muted-foreground text-sm">-</td>
                              <td className="px-6 py-3.5"><div className="w-4 h-4 bg-muted rounded" /></td>
                              <td className="px-4 py-3.5 text-center text-muted-foreground">-</td>
                              <td className="px-4 py-3.5 text-center text-muted-foreground">-</td>
                              <td className="px-4 py-3.5 text-center text-muted-foreground">-</td>
                              <td className="px-4 py-3.5 text-center text-muted-foreground">-</td>
                              <td />
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* Rodapé da tabela */}
                  <div className="px-6 py-3 border-t border-border flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      * Notas calculadas automaticamente com base no sistema de pesos configurado.
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="w-7 h-7" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-sm px-2">{page}</span>
                      <Button variant="outline" size="icon" className="w-7 h-7" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Média da Turma", value: mediaGeral > 0 ? mediaGeral.toFixed(1) : "—", icon: Info, color: "text-blue-600" },
                  { label: "Aproveitamento", value: `${aproveitamento}%`, icon: Download, color: "text-green-600" },
                  { label: "Aprovados", value: aprovados, icon: Info, color: "text-green-600" },
                  { label: "Em Recuperação", value: recuperacao, icon: Info, color: "text-yellow-600" },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                        <p className="text-2xl font-bold mt-1">{s.value}</p>
                      </div>
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}