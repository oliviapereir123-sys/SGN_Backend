"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  getNotasPendentes, getTrimestres, validarNota, validarLote, reenviarBoletim,
  type NotaPendente, type Trimestre, type ResultadoLote
} from "@/lib/api"
import {
  Shield, CheckCircle2, XCircle, Clock, AlertTriangle,
  Loader2, RefreshCw, Mail, Send, Users, ChevronDown, ChevronUp, RotateCcw
} from "lucide-react"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// ─── Tipos auxiliares ────────────────────────────────────────────────────────
interface GrupoTurmaDisc {
  turma: string
  turmaId: number
  disciplina: string
  disciplinaId: number
  trimestreId: number
  trimestre: string
  notas: NotaPendente[]
  totalAlunos: number
}

interface GrupoBoletim {
  trimestreId: number
  trimestre: string
  alunos: { alunoId: number; nome: string; numero: string; turma: string }[]
}

export default function ValidacaoNotasPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [notas, setNotas] = useState<NotaPendente[]>([])
  const [trimestres, setTrimestres] = useState<Trimestre[]>([])
  const [filterTrId, setFilterTrId] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [reenvioAluno, setReenvioAluno] = useState<string | null>(null)
  const [selectedNota, setSelectedNota] = useState<NotaPendente | null>(null)
  const [observacoes, setObservacoes] = useState("")
  const [isRejectDialog, setIsRejectDialog] = useState(false)
  const [isLoteDialog, setIsLoteDialog] = useState(false)
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoTurmaDisc | null>(null)
  const [resultadoLote, setResultadoLote] = useState<ResultadoLote | null>(null)
  const [isResultDialog, setIsResultDialog] = useState(false)
  const [gruposExpandidos, setGruposExpandidos] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/")
  }, [isAuthenticated, user, router])

  const loadNotas = useCallback(async () => {
    setLoading(true)
    try {
      const trId = filterTrId !== "all" ? Number(filterTrId) : undefined
      const res = await getNotasPendentes(trId)
      setNotas(res.data || [])
    } catch {
      toast({ title: "Erro ao carregar notas", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [filterTrId])

  useEffect(() => {
    getTrimestres().then(r => setTrimestres(r.data || []))
  }, [])

  useEffect(() => { loadNotas() }, [loadNotas])

  if (!isAuthenticated || user?.type !== "admin") return null

  // ─── Derivados ───────────────────────────────────────────────────────────────
  const notasPendentes = notas.filter(n => n.estado === "Pendente")
  const notasAprovadas = notas.filter(n => n.estado === "Aprovado")
  const notasRejeitadas = notas.filter(n => n.estado === "Rejeitado")

  // Grupos por lote — agora usando IDs reais (não nomes) como chave
  const grupos = notasPendentes.reduce<Record<string, GrupoTurmaDisc>>((acc, nota) => {
    const key = `${nota.turma_id}||${nota.disciplina_id}||${nota.trimestre_id}`
    if (!acc[key]) {
      acc[key] = {
        turma: nota.turma_nome,
        turmaId: nota.turma_id ?? 0,
        disciplina: nota.disciplina_nome,
        disciplinaId: nota.disciplina_id,
        trimestreId: nota.trimestre_id,
        trimestre: nota.trimestre_nome,
        notas: [],
        totalAlunos: 0,
      }
    }
    acc[key].notas.push(nota)
    acc[key].totalAlunos = acc[key].notas.length
    return acc
  }, {})
  const gruposList = Object.entries(grupos)

  // Grupos de boletins para reenvio (notas aprovadas, agrupadas por trimestre)
  const gruposBoletim = notasAprovadas.reduce<Record<number, GrupoBoletim>>((acc, nota) => {
    if (!acc[nota.trimestre_id]) {
      acc[nota.trimestre_id] = {
        trimestreId: nota.trimestre_id,
        trimestre: nota.trimestre_nome,
        alunos: [],
      }
    }
    if (!acc[nota.trimestre_id].alunos.find(a => a.alunoId === nota.aluno_id)) {
      acc[nota.trimestre_id].alunos.push({
        alunoId: nota.aluno_id,
        nome: nota.aluno_nome,
        numero: nota.aluno_numero,
        turma: nota.turma_nome,
      })
    }
    return acc
  }, {})
  const gruposBoletimList = Object.values(gruposBoletim)

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleAprovar = async (nota: NotaPendente) => {
    setProcessing(true)
    try {
      await validarNota(nota.id, "Aprovado", user!.id)
      setNotas(prev => prev.map(n => n.id === nota.id ? { ...n, estado: "Aprovado" } : n))
      toast({ title: "Nota aprovada!", description: `Nota de ${nota.aluno_nome} aprovada.` })
    } catch (e: unknown) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" })
    } finally {
      setProcessing(false)
    }
  }

  const handleRejeitar = async () => {
    if (!selectedNota || !observacoes.trim()) return
    setProcessing(true)
    try {
      await validarNota(selectedNota.id, "Rejeitado", user!.id, observacoes)
      setNotas(prev => prev.map(n => n.id === selectedNota.id ? { ...n, estado: "Rejeitado", observacoes } : n))
      toast({ title: "Nota rejeitada", variant: "destructive" })
      setIsRejectDialog(false)
      setSelectedNota(null)
      setObservacoes("")
    } catch (e: unknown) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" })
    } finally {
      setProcessing(false)
    }
  }

  const handleAprovarLote = async () => {
    if (!selectedGrupo) return
    setProcessing(true)
    try {
      const resultado = await validarLote(
        selectedGrupo.turmaId,
        selectedGrupo.disciplinaId,
        selectedGrupo.trimestreId
      )
      const idsGrupo = new Set(selectedGrupo.notas.map(n => n.id))
      setNotas(prev => prev.map(n => idsGrupo.has(n.id) ? { ...n, estado: "Aprovado" } : n))
      setResultadoLote(resultado)
      setIsLoteDialog(false)
      setIsResultDialog(true)
    } catch (e: unknown) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" })
    } finally {
      setProcessing(false)
    }
  }

  const handleReenviarBoletim = async (alunoId: number, trimestreId: number, nomeAluno: string) => {
    const key = `${alunoId}-${trimestreId}`
    setReenvioAluno(key)
    try {
      await reenviarBoletim(alunoId, trimestreId)
      toast({
        title: "Boletim reenviado!",
        description: `Email enviado para o encarregado de ${nomeAluno}.`,
      })
    } catch (e: unknown) {
      toast({
        title: "Erro ao reenviar",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setReenvioAluno(null)
    }
  }

  const toggleGrupo = (key: string) => {
    setGruposExpandidos(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // ─── Componentes internos ────────────────────────────────────────────────────
  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "Pendente": return <Badge className="bg-warning/20 text-warning border-warning/30"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
      case "Aprovado": return <Badge className="bg-success/20 text-success border-success/30"><CheckCircle2 className="w-3 h-3 mr-1" />Aprovado</Badge>
      case "Rejeitado": return <Badge className="bg-destructive/20 text-destructive border-destructive/30"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>
      default: return <Badge>{estado}</Badge>
    }
  }

  const NotaCard = ({ nota }: { nota: NotaPendente }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="font-bold text-primary text-sm">{nota.aluno_nome.charAt(0)}</span>
          </div>
          <div>
            <p className="font-semibold text-sm">{nota.aluno_nome}</p>
            <p className="text-xs text-muted-foreground">{nota.aluno_numero}</p>
          </div>
        </div>
        {getStatusBadge(nota.estado)}
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {([["P1", nota.p1], ["P2", nota.p2], ["Trab.", nota.trabalho], ["Exame", nota.exame]] as [string, number | null][]).map(([l, v]) => (
          <div key={l} className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="font-bold text-sm">{v !== null ? v : "—"}</p>
          </div>
        ))}
      </div>
      {nota.media !== null && (
        <div className="text-center p-2 rounded-lg bg-primary/10 mb-3">
          <span className="text-xs text-primary">Média: </span>
          <span className={`font-bold ${Number(nota.media) >= 10 ? "text-success" : "text-destructive"}`}>
            {Number(nota.media).toFixed(1)}
          </span>
        </div>
      )}
      {nota.observacoes && (
        <p className="text-xs text-muted-foreground bg-muted/30 rounded p-2 mb-3">{nota.observacoes}</p>
      )}
      {nota.estado === "Pendente" && (
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 bg-success hover:bg-success/90 text-xs" onClick={() => handleAprovar(nota)} disabled={processing}>
            <CheckCircle2 className="w-3 h-3 mr-1" />Aprovar
          </Button>
          <Button size="sm" variant="destructive" className="flex-1 text-xs" onClick={() => { setSelectedNota(nota); setIsRejectDialog(true) }} disabled={processing}>
            <XCircle className="w-3 h-3 mr-1" />Rejeitar
          </Button>
        </div>
      )}
    </motion.div>
  )

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="w-7 h-7 text-primary" />Validação de Notas
                </h1>
                <p className="text-muted-foreground">Aprovar individualmente, em lote, ou reenviar boletins por email</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterTrId} onValueChange={setFilterTrId}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Todos os trimestres" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {trimestres.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={loadNotas} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-warning/5 border-warning/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-warning" />
                  </div>
                  <div><p className="text-3xl font-bold text-warning">{notasPendentes.length}</p><p className="text-sm text-muted-foreground">Pendentes</p></div>
                </CardContent>
              </Card>
              <Card className="bg-success/5 border-success/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                  <div><p className="text-3xl font-bold text-success">{notasAprovadas.length}</p><p className="text-sm text-muted-foreground">Aprovadas</p></div>
                </CardContent>
              </Card>
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-destructive" />
                  </div>
                  <div><p className="text-3xl font-bold text-destructive">{notasRejeitadas.length}</p><p className="text-sm text-muted-foreground">Rejeitadas</p></div>
                </CardContent>
              </Card>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="lote" className="space-y-4">
                <TabsList className="grid w-full max-w-2xl grid-cols-4">
                  <TabsTrigger value="lote" className="gap-1.5 text-xs sm:text-sm"><Mail className="w-4 h-4" />Lote ({gruposList.length})</TabsTrigger>
                  <TabsTrigger value="individual" className="gap-1.5 text-xs sm:text-sm"><Clock className="w-4 h-4" />Individual ({notasPendentes.length})</TabsTrigger>
                  <TabsTrigger value="boletins" className="gap-1.5 text-xs sm:text-sm"><RotateCcw className="w-4 h-4" />Reenviar</TabsTrigger>
                  <TabsTrigger value="historico" className="gap-1.5 text-xs sm:text-sm"><CheckCircle2 className="w-4 h-4" />Histórico</TabsTrigger>
                </TabsList>

                {/* ── TAB LOTE ── */}
                <TabsContent value="lote" className="space-y-4">
                  {gruposList.length === 0 ? (
                    <Card className="py-12">
                      <CardContent className="text-center text-muted-foreground">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum grupo de notas pendente de validação.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                        <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-sm text-primary">Aprovação em lote com envio automático de boletim</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ao aprovar um lote (turma + disciplina), o sistema verifica se todas as disciplinas
                            do trimestre estão aprovadas para cada aluno. Quando sim, envia o boletim completo
                            por email ao encarregado de educação automaticamente.
                          </p>
                        </div>
                      </div>

                      {gruposList.map(([key, grupo]) => {
                        const expandido = gruposExpandidos.has(key)
                        const mediasValidas = grupo.notas.filter(n => n.media !== null)
                        const mediaGrupo = mediasValidas.length > 0
                          ? mediasValidas.reduce((s, n) => s + Number(n.media), 0) / mediasValidas.length
                          : null

                        return (
                          <Card key={key} className="overflow-hidden">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-base">{grupo.turma} — {grupo.disciplina}</CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                      {grupo.trimestre} · {grupo.totalAlunos} aluno{grupo.totalAlunos !== 1 ? "s" : ""}{" "}
                                      · Média: {mediaGrupo !== null ? mediaGrupo.toFixed(1) : "—"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    className="gap-2 bg-success hover:bg-success/90"
                                    onClick={() => { setSelectedGrupo(grupo); setIsLoteDialog(true) }}
                                  >
                                    <Send className="w-4 h-4" />
                                    Aprovar Lote + Email
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => toggleGrupo(key)}>
                                    {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>

                            {expandido && (
                              <CardContent className="pt-0">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b bg-muted/30">
                                        <th className="text-left py-2 px-3 font-semibold">Aluno</th>
                                        <th className="text-center py-2 px-2 font-semibold">P1</th>
                                        <th className="text-center py-2 px-2 font-semibold">P2</th>
                                        <th className="text-center py-2 px-2 font-semibold">Trab.</th>
                                        <th className="text-center py-2 px-2 font-semibold">Exame</th>
                                        <th className="text-center py-2 px-2 font-semibold">Média</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {grupo.notas.map(n => (
                                        <tr key={n.id} className="border-b hover:bg-muted/20">
                                          <td className="py-2 px-3 font-medium">{n.aluno_nome}</td>
                                          <td className="py-2 px-2 text-center">{n.p1 ?? "—"}</td>
                                          <td className="py-2 px-2 text-center">{n.p2 ?? "—"}</td>
                                          <td className="py-2 px-2 text-center">{n.trabalho ?? "—"}</td>
                                          <td className="py-2 px-2 text-center">{n.exame ?? "—"}</td>
                                          <td className="py-2 px-2 text-center">
                                            <span className={`font-bold ${n.media !== null && Number(n.media) >= 10 ? "text-success" : "text-destructive"}`}>
                                              {n.media !== null ? Number(n.media).toFixed(1) : "—"}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        )
                      })}
                    </>
                  )}
                </TabsContent>

                {/* ── TAB INDIVIDUAL ── */}
                <TabsContent value="individual">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {notasPendentes.map(nota => <NotaCard key={`pendente-${nota.id}`} nota={nota} />)}
                    </AnimatePresence>
                    {notasPendentes.length === 0 && (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma nota pendente.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* ── TAB REENVIAR BOLETINS ── */}
                <TabsContent value="boletins" className="space-y-4">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                    <RotateCcw className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-primary">Reenvio manual de boletins</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reenvia o boletim por email ao encarregado de qualquer aluno com notas aprovadas.
                        Útil quando o email inicial falhou ou o encarregado solicita nova cópia.
                      </p>
                    </div>
                  </div>

                  {gruposBoletimList.length === 0 ? (
                    <Card className="py-12">
                      <CardContent className="text-center text-muted-foreground">
                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum aluno com notas aprovadas disponível para reenvio.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    gruposBoletimList.map(grupo => (
                      <Card key={grupo.trimestreId} className="overflow-hidden">
                        <CardHeader className="pb-3 bg-muted/20">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Mail className="w-4 h-4 text-primary" />
                              {grupo.trimestre}
                            </CardTitle>
                            <Badge variant="outline">
                              {grupo.alunos.length} aluno{grupo.alunos.length !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="divide-y">
                            {grupo.alunos.map(aluno => {
                              const key = `${aluno.alunoId}-${grupo.trimestreId}`
                              const enviando = reenvioAluno === key
                              return (
                                <div key={aluno.alunoId} className="flex items-center justify-between py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                      <span className="font-bold text-primary text-sm">{aluno.nome.charAt(0)}</span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{aluno.nome}</p>
                                      <p className="text-xs text-muted-foreground">{aluno.numero} · {aluno.turma}</p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2 text-xs shrink-0"
                                    disabled={enviando}
                                    onClick={() => handleReenviarBoletim(aluno.alunoId, grupo.trimestreId, aluno.nome)}
                                  >
                                    {enviando
                                      ? <><Loader2 className="w-3 h-3 animate-spin" />A enviar...</>
                                      : <><RotateCcw className="w-3 h-3" />Reenviar Boletim</>
                                    }
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* ── TAB HISTÓRICO ── */}
                <TabsContent value="historico">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {[...notasAprovadas.map(n => ({ ...n, _tab: "apr" })), ...notasRejeitadas.map(n => ({ ...n, _tab: "rej" }))].map(nota => <NotaCard key={`${nota._tab}-${nota.id}`} nota={nota} />)}
                    </AnimatePresence>
                    {notasAprovadas.length + notasRejeitadas.length === 0 && (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        <p>Sem histórico de notas processadas.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </motion.div>
        </main>
      </div>

      {/* ── Dialog: Confirmar lote ── */}
      <Dialog open={isLoteDialog} onOpenChange={setIsLoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-success" />
              Aprovar Lote e Enviar Boletins
            </DialogTitle>
            <DialogDescription>
              Todas as notas pendentes deste grupo serão aprovadas. Se, após esta aprovação,
              um aluno tiver <strong>todas as disciplinas do trimestre aprovadas</strong>,
              o boletim completo é enviado automaticamente ao encarregado por email.
            </DialogDescription>
          </DialogHeader>

          {selectedGrupo && (
            <div className="py-3 space-y-3">
              <div className="p-4 rounded-xl bg-muted/40 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Turma</span>
                  <span className="font-semibold">{selectedGrupo.turma}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Disciplina</span>
                  <span className="font-semibold">{selectedGrupo.disciplina}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Período</span>
                  <span className="font-semibold">{selectedGrupo.trimestre}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Notas a aprovar</span>
                  <span className="font-bold text-success">{selectedGrupo.totalAlunos}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Os boletins só são enviados aos alunos que ficarem com
                  <strong> todas as disciplinas do trimestre aprovadas</strong> após esta operação.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLoteDialog(false)}>Cancelar</Button>
            <Button className="bg-success hover:bg-success/90 gap-2" onClick={handleAprovarLote} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Confirmar e Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Resultado do lote ── */}
      <Dialog open={isResultDialog} onOpenChange={setIsResultDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Lote Processado
            </DialogTitle>
          </DialogHeader>
          {resultadoLote && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-success/10">
                  <p className="text-2xl font-bold text-success">{resultadoLote.aprovadas}</p>
                  <p className="text-xs text-muted-foreground">Aprovadas</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-primary/10">
                  <p className="text-2xl font-bold text-primary">{resultadoLote.emails_enviados}</p>
                  <p className="text-xs text-muted-foreground">Emails enviados</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-destructive/10">
                  <p className="text-2xl font-bold text-destructive">{resultadoLote.emails_falhados}</p>
                  <p className="text-xs text-muted-foreground">Falhas</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">{resultadoLote.message}</p>
              {resultadoLote.detalhes_enviados.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-success">Boletins enviados:</p>
                  {resultadoLote.detalhes_enviados.map((d, i) => (
                    <div key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                      {d.aluno} → {d.encarregado} ({d.email})
                    </div>
                  ))}
                </div>
              )}
              {resultadoLote.detalhes_falhados.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-destructive">Falhas de envio:</p>
                  {resultadoLote.detalhes_falhados.map((d, i) => (
                    <div key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-destructive shrink-0" />
                      {d.aluno} — {d.erro}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { setIsResultDialog(false); setResultadoLote(null) }}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Rejeitar nota individual ── */}
      <Dialog open={isRejectDialog} onOpenChange={setIsRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />Rejeitar Nota
            </DialogTitle>
            <DialogDescription>
              Adicione uma observação para o professor poder corrigir e resubmeter.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ex: A nota da P2 parece incorrecta. Por favor verifique."
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRejeitar} disabled={!observacoes.trim() || processing}>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}