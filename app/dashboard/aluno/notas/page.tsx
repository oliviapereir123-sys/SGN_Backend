"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getNotasAluno, getTrimestres, type NotaAluno, type Trimestre } from "@/lib/api"
import { BookOpen, CheckCircle2, Clock, Loader2, AlertCircle, MessageSquare, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// ─── Lógica de situação corrigida: Aprovado / Recurso / Reprovado ─────────────
function getStatus(media: number | null) {
  if (media === null) return null
  if (media >= 10) return {
    label: "Aprovado",
    icon: CheckCircle2,
    className: "text-green-600 bg-green-50 dark:bg-green-500/10",
  }
  if (media >= 7) return {
    label: "Recurso",
    icon: AlertTriangle,
    className: "text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10",
  }
  return {
    label: "Reprovado",
    icon: Clock,
    className: "text-red-500 bg-red-50 dark:bg-red-500/10",
  }
}

export default function AlunoNotasPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [notas, setNotas] = useState<NotaAluno[]>([])
  const [trimestres, setTrimestres] = useState<Trimestre[]>([])
  const [selectedTrId, setSelectedTrId] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "aluno") router.push("/login/aluno")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (!user?.id) return
    getTrimestres().then((res) => setTrimestres(res.data || []))
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    const trId = selectedTrId !== "all" ? Number(selectedTrId) : undefined
    getNotasAluno(user.id, trId)
      .then((res) => setNotas(res.data || []))
      .catch(() => toast({ title: "Erro ao carregar notas", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [user?.id, selectedTrId])

  if (!isAuthenticated || user?.type !== "aluno") return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Minhas Notas</h2>
                <p className="text-muted-foreground">Acompanhe o seu desempenho em todas as disciplinas</p>
              </div>
              <Select value={selectedTrId} onValueChange={setSelectedTrId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os trimestres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os trimestres</SelectItem>
                  {trimestres.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : notas.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Sem notas disponíveis</h3>
                  <p className="text-muted-foreground">
                    Ainda não existem notas aprovadas para este período. As notas ficam visíveis após validação pelo administrador.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {notas.map((disciplina, index) => {
                  const status = getStatus(disciplina.media !== null ? Number(disciplina.media) : null)
                  return (
                    <motion.div
                      key={disciplina.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.07 }}
                    >
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{disciplina.disciplina_nome}</CardTitle>
                                <p className="text-sm text-muted-foreground">{disciplina.professor_nome}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-muted-foreground">{disciplina.trimestre_nome}</span>
                              {status && (
                                <span className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full ${status.className}`}>
                                  <status.icon className="w-4 h-4" />{status.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            {[
                              { label: "MAC", val: disciplina.trabalho },
                              { label: "PP",  val: disciplina.p1 },
                              { label: "PT",  val: disciplina.exame },
                            ].map(({ label, val }) => (
                              <div key={label} className="text-center p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                                <p className="text-xl font-bold">{val !== null ? val : "—"}</p>
                              </div>
                            ))}
                            {/* Nota de Recuperação — só mostra se existir */}
                            {disciplina.nota_recuperacao !== null && (
                              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg">
                                <p className="text-xs text-yellow-600 mb-1">Recuperação</p>
                                <p className="text-xl font-bold text-yellow-600">
                                  {Number(disciplina.nota_recuperacao).toFixed(1)}
                                </p>
                              </div>
                            )}
                            <div className="text-center p-3 bg-primary/10 rounded-lg">
                              <p className="text-xs text-primary mb-1">Média Final</p>
                              <p className={`text-xl font-bold ${
                                disciplina.media !== null
                                  ? Number(disciplina.media) >= 10 ? "text-green-600"
                                    : Number(disciplina.media) >= 7  ? "text-yellow-600"
                                    : "text-red-500"
                                  : "text-primary"
                              }`}>
                                {disciplina.media !== null ? Number(disciplina.media).toFixed(1) : "—"}
                              </p>
                            </div>
                          </div>

                          {/* Feedback do professor */}
                          {disciplina.feedback && (
                            <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm flex gap-2">
                              <MessageSquare className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-blue-600 mb-0.5">Feedback do professor</p>
                                <p className="text-blue-800">{disciplina.feedback}</p>
                              </div>
                            </div>
                          )}

                          {disciplina.observacoes && (
                            <div className="mt-2 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                              <strong>Obs:</strong> {disciplina.observacoes}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
