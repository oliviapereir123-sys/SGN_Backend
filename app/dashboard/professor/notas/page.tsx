"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getTurmasProfessor,
  getTrimestres,
  getAlunosTurma,
  submitNotas,
  type TurmaProfessor,
  type AlunoTurma,
  type Trimestre,
} from "@/lib/api"
import {
  ClipboardList,
  Save,
  CheckCircle2,
  Send,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Calculator,
  Loader2,
  MessageSquare,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function ProfessorNotasPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [turmas, setTurmas] = useState<TurmaProfessor[]>([])
  const [trimestres, setTrimestres] = useState<Trimestre[]>([])
  const [alunos, setAlunos] = useState<AlunoTurma[]>([])

  const [selectedTurmaKey, setSelectedTurmaKey] = useState<string>("")
  const [selectedTrId, setSelectedTrId] = useState<string>("")

  const [loading, setLoading] = useState(true)
  const [loadingAlunos, setLoadingAlunos] = useState(false)
  const [saving, setSaving] = useState(false)

  const [hasChanges, setHasChanges] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "professor") {
      router.push("/login/professor")
    }
  }, [isAuthenticated, user, router])

  // Carregar turmas e trimestres ao montar
  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    Promise.all([getTurmasProfessor(user.id), getTrimestres()])
      .then(([turmasRes, trRes]) => {
        setTurmas(turmasRes.data || [])
        const activos = (trRes.data || []).filter((t) => t.estado !== "Pendente")
        setTrimestres(activos)
        // pré-seleccionar trimestre activo
        const activo = activos.find((t) => t.estado === "Activo")
        if (activo) setSelectedTrId(String(activo.id))
      })
      .catch(() => toast({ title: "Erro ao carregar dados", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [user?.id])

  // Quando turma ou trimestre mudam, carregar alunos
  const loadAlunos = useCallback(async () => {
    if (!selectedTurmaKey || !selectedTrId) return
    const [turmaId, disciplinaId] = selectedTurmaKey.split("|").map(Number)
    setLoadingAlunos(true)
    try {
      const res = await getAlunosTurma(turmaId, disciplinaId, Number(selectedTrId))
      setAlunos(res.data || [])
      setHasChanges(false)
    } catch {
      toast({ title: "Erro ao carregar alunos", variant: "destructive" })
    } finally {
      setLoadingAlunos(false)
    }
  }, [selectedTurmaKey, selectedTrId])

  useEffect(() => { loadAlunos() }, [loadAlunos])

  if (!isAuthenticated || user?.type !== "professor") return null

  const selectedTurma = turmas.find(
    (t) => `${t.turma_id}|${t.disciplina_id}` === selectedTurmaKey
  )

  const handleNotaChange = (alunoId: number, campo: string, valor: string) => {
    const novoValor = valor === "" ? null : Math.min(20, Math.max(0, Number(valor)))
    setAlunos((prev) => prev.map((a) => (a.id === alunoId ? { ...a, [campo]: novoValor } : a)))
    setHasChanges(true)
    setSaved(false)
  }

  const calcularMedia = (aluno: AlunoTurma) => {
    if (aluno.p1 === null || aluno.p2 === null || aluno.trabalho === null || aluno.exame === null) return null
    return aluno.p1 * 0.2 + aluno.p2 * 0.2 + aluno.trabalho * 0.2 + aluno.exame * 0.4
  }

  const buildPayload = () => {
    const [turmaId, disciplinaId] = selectedTurmaKey.split("|").map(Number)
    return alunos
      .filter((a) => a.estado !== "Aprovado")
      .map((a) => ({
        alunoId: a.id,
        disciplinaId,
        professorId: user!.id,
        trimestreId: Number(selectedTrId),
        p1: a.p1,
        p2: a.p2,
        trabalho: a.trabalho,
        exame: a.exame,
        feedback: (a as any).feedback ?? null,
      }))
  }

  const handleSaveRascunho = async () => {
    if (!selectedTurmaKey || !selectedTrId) return
    setSaving(true)
    try {
      await submitNotas(buildPayload())
      setSaved(true)
      setHasChanges(false)
      toast({ title: "Rascunho guardado!", description: "As notas foram guardadas como rascunho." })
      setTimeout(() => setSaved(false), 3000)
      await loadAlunos()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao guardar"
      toast({ title: "Erro", description: msg, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedTurmaKey || !selectedTrId) return
    setSaving(true)
    try {
      await submitNotas(buildPayload())
      setIsSubmitDialogOpen(false)
      setHasChanges(false)
      toast({
        title: "Notas submetidas!",
        description: "As notas foram enviadas para validação pelo administrador.",
      })
      await loadAlunos()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao submeter"
      toast({ title: "Erro", description: msg, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Aprovado":
        return (
          <Badge className="bg-success/20 text-success border-0">
            <CheckCircle2 className="w-3 h-3 mr-1" />Validado
          </Badge>
        )
      case "Pendente":
        return (
          <Badge className="bg-warning/20 text-warning border-0">
            <Clock className="w-3 h-3 mr-1" />Pendente
          </Badge>
        )
      case "Rejeitado":
        return (
          <Badge className="bg-destructive/20 text-destructive border-0">
            <XCircle className="w-3 h-3 mr-1" />Rejeitado
          </Badge>
        )
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border-0">
            <FileText className="w-3 h-3 mr-1" />Rascunho
          </Badge>
        )
    }
  }

  const notasCompletas = alunos.filter(
    (a) => a.p1 !== null && a.p2 !== null && a.trabalho !== null && a.estado !== "Aprovado"
  ).length
  const notasIncompletas = alunos.filter((a) => a.estado !== "Aprovado").length - notasCompletas
  const mediaGeral =
    alunos.filter((a) => calcularMedia(a) !== null).reduce((s, a) => s + calcularMedia(a)!, 0) /
      (alunos.filter((a) => calcularMedia(a) !== null).length || 1) || null

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
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ClipboardList className="w-7 h-7 text-primary" />
                    Lançamento de Notas
                  </h1>
                  <p className="text-muted-foreground">Lançar e submeter notas para validação</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSaveRascunho}
                    disabled={!hasChanges || saving}
                    className="gap-2 bg-transparent"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Save className="w-4 h-4" />}
                    {saved ? "Guardado!" : "Guardar Rascunho"}
                  </Button>
                  <Button onClick={() => setIsSubmitDialogOpen(true)} disabled={notasCompletas === 0 || saving} className="gap-2">
                    <Send className="w-4 h-4" />
                    Submeter para Validação
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-2 block">Turma / Disciplina</label>
                      <Select value={selectedTurmaKey} onValueChange={setSelectedTurmaKey}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione uma turma" />
                        </SelectTrigger>
                        <SelectContent>
                          {turmas.map((t) => (
                            <SelectItem key={`${t.turma_id}|${t.disciplina_id}`} value={`${t.turma_id}|${t.disciplina_id}`}>
                              {t.turma_nome} — {t.disciplina_nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full sm:w-48">
                      <label className="text-sm font-medium mb-2 block">Período</label>
                      <Select value={selectedTrId} onValueChange={setSelectedTrId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Trimestre" />
                        </SelectTrigger>
                        <SelectContent>
                          {trimestres.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              {selectedTurmaKey && !loadingAlunos && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{alunos.length}</p>
                        <p className="text-xs text-muted-foreground">Total Alunos</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{notasCompletas}</p>
                        <p className="text-xs text-muted-foreground">Notas Completas</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{notasIncompletas}</p>
                        <p className="text-xs text-muted-foreground">Incompletas</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Calculator className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{mediaGeral !== null ? mediaGeral.toFixed(1) : "—"}</p>
                        <p className="text-xs text-muted-foreground">Média Turma</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Loading alunos */}
              {selectedTurmaKey && loadingAlunos && (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}

              {/* Pauta */}
              {selectedTurmaKey && !loadingAlunos && alunos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Pauta — {selectedTurma?.turma_nome} / {selectedTurma?.disciplina_nome}
                    </CardTitle>
                    <CardDescription>
                      Peso: P1 (20%) + P2 (20%) + Trabalho (20%) + Exame (40%)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-border bg-muted/30">
                            <th className="text-left py-4 px-4 font-semibold text-sm">Nº</th>
                            <th className="text-left py-4 px-4 font-semibold text-sm">Aluno</th>
                            <th className="text-center py-4 px-2 font-semibold text-sm">
                              <TooltipProvider><Tooltip><TooltipTrigger>P1 (20%)</TooltipTrigger><TooltipContent>Primeira Prova</TooltipContent></Tooltip></TooltipProvider>
                            </th>
                            <th className="text-center py-4 px-2 font-semibold text-sm">
                              <TooltipProvider><Tooltip><TooltipTrigger>P2 (20%)</TooltipTrigger><TooltipContent>Segunda Prova</TooltipContent></Tooltip></TooltipProvider>
                            </th>
                            <th className="text-center py-4 px-2 font-semibold text-sm">
                              <TooltipProvider><Tooltip><TooltipTrigger>Trab (20%)</TooltipTrigger><TooltipContent>Trabalho</TooltipContent></Tooltip></TooltipProvider>
                            </th>
                            <th className="text-center py-4 px-2 font-semibold text-sm">
                              <TooltipProvider><Tooltip><TooltipTrigger>Exame (40%)</TooltipTrigger><TooltipContent>Exame Final</TooltipContent></Tooltip></TooltipProvider>
                            </th>
                            <th className="text-center py-4 px-4 font-semibold text-sm">Média</th>
                            <th className="text-center py-4 px-4 font-semibold text-sm">Estado</th>
                            <th className="text-left py-4 px-4 font-semibold text-sm">Feedback</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {alunos.map((aluno, index) => {
                              const media = calcularMedia(aluno)
                              const isEditable = aluno.estado !== "Aprovado"
                              return (
                                <motion.tr
                                  key={aluno.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.02 }}
                                  className="border-b border-border hover:bg-muted/30 transition-colors"
                                >
                                  <td className="py-3 px-4 text-sm text-muted-foreground">{aluno.numero}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                        {aluno.foto ? (
                                          <img src={aluno.foto} alt={aluno.nome} className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="text-xs font-bold">{aluno.nome.charAt(0)}</span>
                                        )}
                                      </div>
                                      <span className="font-medium">{aluno.nome}</span>
                                    </div>
                                  </td>
                                  {(["p1", "p2", "trabalho", "exame"] as const).map((campo) => (
                                    <td key={campo} className="py-2 px-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="20"
                                        step="0.5"
                                        value={aluno[campo] ?? ""}
                                        onChange={(e) => handleNotaChange(aluno.id, campo, e.target.value)}
                                        className="w-16 text-center h-9 mx-auto"
                                        disabled={!isEditable}
                                      />
                                    </td>
                                  ))}
                                  <td className="py-3 px-4 text-center">
                                    <span className={`text-lg font-bold ${media !== null ? (media >= 10 ? "text-success" : "text-destructive") : "text-muted-foreground"}`}>
                                      {media !== null ? media.toFixed(1) : "—"}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">{getEstadoBadge(aluno.estado || "Rascunho")}</td>
                                  <td className="py-2 px-2">
                                    <Textarea
                                      rows={1}
                                      placeholder="Comentário para o aluno..."
                                      value={(aluno as any).feedback ?? ""}
                                      onChange={(e) => handleNotaChange(aluno.id, "feedback", e.target.value)}
                                      disabled={!isEditable}
                                      className="text-xs min-h-0 resize-none w-40"
                                    />
                                  </td>
                                </motion.tr>
                              )
                            })}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!selectedTurmaKey && (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Seleccione uma Turma</h3>
                    <p className="text-muted-foreground">Escolha uma turma e período para começar a lançar as notas.</p>
                  </CardContent>
                </Card>
              )}

              {turmas.length === 0 && !loading && (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Sem turmas atribuídas</h3>
                    <p className="text-muted-foreground">Contacte o administrador para atribuir turmas à sua conta.</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </main>
      </div>

      {/* Submit Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Submeter Notas para Validação
            </DialogTitle>
            <DialogDescription>
              As notas serão enviadas ao administrador. Após a submissão não poderá editá-las até serem processadas.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex justify-between p-3 rounded-lg bg-muted/50">
              <span>Notas completas a submeter:</span>
              <span className="font-bold text-success">{notasCompletas}</span>
            </div>
            {notasIncompletas > 0 && (
              <div className="flex justify-between p-3 rounded-lg bg-warning/10 text-warning">
                <span>Notas incompletas (não submetidas):</span>
                <span className="font-bold">{notasIncompletas}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Submissão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}