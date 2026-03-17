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
import { BookOpen, CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EncarregadoNotasPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [notas, setNotas] = useState<NotaAluno[]>([])
  const [trimestres, setTrimestres] = useState<Trimestre[]>([])
  const [selectedTrId, setSelectedTrId] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "encarregado") {
      router.push("/login/encarregado")
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (!user?.alunoId) return
    getTrimestres().then((res) => setTrimestres(res.data || []))
  }, [user?.alunoId])

  useEffect(() => {
    if (!user?.alunoId) return
    setLoading(true)
    const trId = selectedTrId !== "all" ? Number(selectedTrId) : undefined
    getNotasAluno(user.alunoId, trId)
      .then((res) => setNotas(res.data || []))
      .catch(() => toast({ title: "Erro ao carregar notas", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [user?.alunoId, selectedTrId])

  if (!isAuthenticated || user?.type !== "encarregado") return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Notas de {user.alunoNome}</h2>
                <p className="text-muted-foreground">Nº {user.alunoNumero}</p>
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
                  <h3 className="text-lg font-medium mb-2">Sem notas aprovadas</h3>
                  <p className="text-muted-foreground">Não existem notas aprovadas para este período.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {notas.map((n, index) => (
                  <motion.div key={n.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{n.disciplina_nome}</CardTitle>
                              <p className="text-sm text-muted-foreground">{n.professor_nome} · {n.trimestre_nome}</p>
                            </div>
                          </div>
                          {n.media !== null && Number(n.media) >= 10 ? (
                            <span className="flex items-center gap-1 text-sm text-success bg-success/10 px-3 py-1 rounded-full">
                              <CheckCircle2 className="w-4 h-4" />Aprovado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                              <Clock className="w-4 h-4" />Em curso
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-5 gap-4">
                          {[["1ª Prova", n.p1], ["2ª Prova", n.p2], ["Trabalho", n.trabalho], ["Exame", n.exame]].map(([label, val]) => (
                            <div key={String(label)} className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">{label}</p>
                              <p className="text-xl font-bold">{val !== null ? val : "—"}</p>
                            </div>
                          ))}
                          <div className="text-center p-3 bg-primary/10 rounded-lg">
                            <p className="text-xs text-primary mb-1">Média</p>
                            <p className={`text-xl font-bold ${n.media !== null ? (Number(n.media) >= 10 ? "text-success" : "text-destructive") : "text-primary"}`}>
                              {n.media !== null ? Number(n.media).toFixed(1) : "—"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
