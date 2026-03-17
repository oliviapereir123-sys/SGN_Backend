"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getNotasAluno, getTrimestres, type NotaAluno, type Trimestre } from "@/lib/api"
import { FileText, Printer, GraduationCap, Award, TrendingUp, Calendar, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AlunoBoletimPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const boletimRef = useRef<HTMLDivElement>(null)

  const [notas, setNotas] = useState<NotaAluno[]>([])
  const [trimestres, setTrimestres] = useState<Trimestre[]>([])
  const [selectedTrId, setSelectedTrId] = useState<string>("")
  const [selectedTrimestre, setSelectedTrimestre] = useState<Trimestre | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "aluno") {
      router.push("/login/aluno")
    }
  }, [isAuthenticated, user, router])

  // Carregar trimestres e pré-seleccionar o mais recente com notas
  useEffect(() => {
    if (!user?.id) return
    getTrimestres().then((res) => {
      const lista = res.data || []
      setTrimestres(lista)
      // pré-seleccionar primeiro encerrado ou activo
      const primeiro = lista.find((t) => t.estado === "Encerrado") || lista[0]
      if (primeiro) {
        setSelectedTrId(String(primeiro.id))
        setSelectedTrimestre(primeiro)
      }
    })
  }, [user?.id])

  // Carregar notas quando trimestre mudar
  useEffect(() => {
    if (!user?.id || !selectedTrId) return
    setLoading(true)
    getNotasAluno(user.id, Number(selectedTrId))
      .then((res) => setNotas(res.data || []))
      .catch(() => toast({ title: "Erro ao carregar boletim", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [user?.id, selectedTrId])

  const handleTrChange = (val: string) => {
    setSelectedTrId(val)
    setSelectedTrimestre(trimestres.find((t) => String(t.id) === val) || null)
  }

  if (!isAuthenticated || user?.type !== "aluno") return null

  const mediaGeral =
    notas.length > 0
      ? notas.filter((n) => n.media !== null).reduce((s, n) => s + Number(n.media), 0) /
      (notas.filter((n) => n.media !== null).length || 1)
      : 0
  const aprovadas = notas.filter((n) => n.media !== null && Number(n.media) >= 10).length

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="p-4 sm:p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-7 h-7 text-primary" />
                  Boletim de Notas
                </h1>
                <p className="text-muted-foreground">Visualizar e imprimir boletim trimestral</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedTrId} onValueChange={handleTrChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    {trimestres.filter((t) => t.estado !== "Pendente").map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />Imprimir
                </Button>
              </div>
            </div>

            {/* Stats */}
            {!loading && notas.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{mediaGeral.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Média Geral</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <Award className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">{aprovadas}</p>
                      <p className="text-xs text-muted-foreground">Aprovadas</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{notas.length}</p>
                      <p className="text-xs text-muted-foreground">Total Disciplinas</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{selectedTrimestre?.nome}</p>
                      <p className="text-xs text-muted-foreground">Período</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : notas.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Sem notas aprovadas</h3>
                  <p className="text-muted-foreground">Ainda não existem notas aprovadas para este período.</p>
                </CardContent>
              </Card>
            ) : (
              <Card ref={boletimRef} className="print:shadow-none">
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Instituto Politécnico do Mayombe</h2>
                        <p className="text-sm text-muted-foreground">Boletim de Avaliação — {selectedTrimestre?.nome}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-2">Ano Lectivo 2024/2025</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Dados do Aluno */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/30 mb-6">
                    <div><p className="text-xs text-muted-foreground">Nome do Aluno</p><p className="font-semibold">{user.nome}</p></div>
                    <div><p className="text-xs text-muted-foreground">Número</p><p className="font-semibold">{user.numeroAluno}</p></div>
                    <div><p className="text-xs text-muted-foreground">Curso</p><p className="font-semibold">{user.curso || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Turma / Ano</p><p className="font-semibold">{user.turma || "—"}</p></div>
                  </div>

                  {/* Tabela */}
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left py-4 px-4 font-semibold">Disciplina</th>
                          <th className="text-center py-4 px-2 font-semibold">P1</th>
                          <th className="text-center py-4 px-2 font-semibold">P2</th>
                          <th className="text-center py-4 px-2 font-semibold">Trab.</th>
                          <th className="text-center py-4 px-2 font-semibold">Exame</th>
                          <th className="text-center py-4 px-4 font-semibold">Média</th>
                          <th className="text-center py-4 px-4 font-semibold">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notas.map((nota, index) => {
                          const aprovado = nota.media !== null && Number(nota.media) >= 10
                          return (
                            <motion.tr
                              key={nota.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.04 }}
                              className="border-t border-border hover:bg-muted/30"
                            >
                              <td className="py-4 px-4">
                                <p className="font-medium">{nota.disciplina_nome}</p>
                                <p className="text-xs text-muted-foreground">{nota.professor_nome}</p>
                              </td>
                              <td className="text-center py-4 px-2 font-medium">{nota.p1 ?? "—"}</td>
                              <td className="text-center py-4 px-2 font-medium">{nota.p2 ?? "—"}</td>
                              <td className="text-center py-4 px-2 font-medium">{nota.trabalho ?? "—"}</td>
                              <td className="text-center py-4 px-2 font-medium">{nota.exame ?? "—"}</td>
                              <td className="text-center py-4 px-4">
                                <span className={`text-lg font-bold ${nota.media !== null ? (aprovado ? "text-success" : "text-destructive") : "text-muted-foreground"}`}>
                                  {nota.media !== null ? Number(nota.media).toFixed(1) : "—"}
                                </span>
                              </td>
                              <td className="text-center py-4 px-4">
                                <Badge className={aprovado ? "bg-success/20 text-success border-0" : "bg-destructive/20 text-destructive border-0"}>
                                  {aprovado ? "Aprovado" : "Reprovado"}
                                </Badge>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-primary/5 border-t-2 border-primary">
                          <td colSpan={4} className="py-4 px-4 font-bold text-right">Média Geral do Período:</td>
                          <td className="text-center py-4 px-4">
                            <span className={`text-xl font-bold ${mediaGeral >= 10 ? "text-success" : "text-destructive"}`}>
                              {mediaGeral.toFixed(2)}
                            </span>
                          </td>
                          <td className="text-center py-4 px-4">
                            <Badge className={mediaGeral >= 10 ? "bg-success/20 text-success border-0" : "bg-destructive/20 text-destructive border-0"}>
                              {mediaGeral >= 10 ? "Aprovado" : "Reprovado"}
                            </Badge>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Assinaturas */}
                  <div className="grid grid-cols-3 gap-8 mt-8 pt-8 border-t border-border">
                    {["Director de Turma", "Coordenador de Curso", "Director Geral"].map((cargo) => (
                      <div key={cargo} className="text-center">
                        <div className="h-16 border-b border-dashed border-muted-foreground mb-2" />
                        <p className="text-sm font-medium">{cargo}</p>
                      </div>
                    ))}
                  </div>

                  <div className="text-center mt-6 text-xs text-muted-foreground">
                    <p>Documento gerado automaticamente pelo Sistema de Gestão de Notas do IPM</p>
                    <p>Data de emissão: {new Date().toLocaleDateString("pt-AO")}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}