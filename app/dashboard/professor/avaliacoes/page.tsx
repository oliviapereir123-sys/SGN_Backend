"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { getTurmasProfessor, getTrimestres, type TurmaProfessor, type Trimestre } from "@/lib/api"
import {
  Plus, Search, Edit2, Trash2, X, ClipboardList,
  BookOpen, AlertCircle, Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Avaliacao {
  id: number
  nome: string
  tipo: string
  disciplina: string
  turma: string
  peso: number
  periodo: string
}

const TIPOS = ["Prova", "Trabalho", "Seminário", "Projecto", "Exame"]
const PERIODOS = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "1º Trimestre", "2º Trimestre", "3º Trimestre"]

const TIPO_COLOR: Record<string, string> = {
  Prova: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Trabalho: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  Seminário: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  Projecto: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
  Exame: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
}

const DEMO_AVALIACOES: Avaliacao[] = [
  { id: 1, nome: "P1 - Álgebra Linear", tipo: "Prova", disciplina: "Matemática", turma: "10º Ano A", peso: 40, periodo: "1º Bimestre" },
  { id: 2, nome: "Trabalho de Campo - Ecossistemas", tipo: "Trabalho", disciplina: "Biologia", turma: "11º Ano B", peso: 20, periodo: "1º Bimestre" },
  { id: 3, nome: "Projecto Interdisciplinar - Brasil Colónia", tipo: "Projecto", disciplina: "História", turma: "1º Ano C", peso: 30, periodo: "2º Bimestre" },
  { id: 4, nome: "P2 - Literatura Brasileira", tipo: "Prova", disciplina: "Português", turma: "3º Ano A", peso: 50, periodo: "2º Bimestre" },
]

export default function ProfessorAvaliacoesPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>(DEMO_AVALIACOES)
  const [turmas, setTurmas] = useState<TurmaProfessor[]>([])
  const [trimestres, setTrimestres] = useState<Trimestre[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState("")

  // Form state
  const [form, setForm] = useState({
    nome: "", tipo: "Prova", disciplina_id: "", turma_id: "", peso: "", periodo: "1º Bimestre",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "professor") router.push("/login/professor")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    Promise.all([getTurmasProfessor(user.id), getTrimestres()])
      .then(([turmasRes, trRes]) => {
        setTurmas(turmasRes.data || [])
        setTrimestres(trRes.data || [])
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  if (!isAuthenticated || user?.type !== "professor") return null

  const filtradas = avaliacoes.filter((a) =>
    a.nome.toLowerCase().includes(search.toLowerCase()) ||
    a.disciplina.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async () => {
    if (!form.nome || !form.peso) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" })
      return
    }
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    const novaAval: Avaliacao = {
      id: Date.now(),
      nome: form.nome,
      tipo: form.tipo,
      disciplina: turmas.find((t) => String(t.disciplina_id) === form.disciplina_id)?.disciplina_nome || "—",
      turma: turmas.find((t) => String(t.turma_id) === form.turma_id)?.turma_nome || "—",
      peso: Number(form.peso),
      periodo: form.periodo,
    }
    setAvaliacoes((prev) => [novaAval, ...prev])
    toast({ title: "Avaliação cadastrada com sucesso!" })
    setShowModal(false)
    setForm({ nome: "", tipo: "Prova", disciplina_id: "", turma_id: "", peso: "", periodo: "1º Bimestre" })
    setSaving(false)
  }

  const pendentes = 2

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Académico &rsaquo; <span className="text-primary font-medium">Avaliações</span></p>
                <h1 className="text-3xl font-bold">Gestão de Avaliações</h1>
                <p className="text-muted-foreground mt-1">Configure o sistema de pontuação e as datas de entrega de suas turmas.</p>
              </div>
              <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4" />Nova Avaliação
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total de Avaliações</p>
                  <p className="text-3xl font-bold">{avaliacoes.length}</p>
                  <p className="text-xs text-green-600 mt-1">+4 criadas este mês</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Turmas Ativas</p>
                  <p className="text-3xl font-bold">{turmas.length || 5}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-yellow-400">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Pendentes de Config.</p>
                  <p className="text-3xl font-bold text-yellow-600">{String(pendentes).padStart(2, "0")}</p>
                  <p className="text-xs text-yellow-600 mt-1">Turma 2º Ano B sem peso definido</p>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar avaliação pelo nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select>
                <SelectTrigger className="w-48"><SelectValue placeholder="Todas Disciplinas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas Disciplinas</SelectItem>
                  {turmas.map((t) => <SelectItem key={t.disciplina_id} value={String(t.disciplina_id)}>{t.disciplina_nome}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-40"><SelectValue placeholder="Todas Turmas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas Turmas</SelectItem>
                  {turmas.map((t) => <SelectItem key={t.turma_id} value={String(t.turma_id)}>{t.turma_nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Tabela */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Avaliações Cadastradas</CardTitle>
                <CardDescription>Visualize e gerencie todas as avaliações registadas.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {["Avaliação", "Tipo", "Disciplina", "Turma", "Peso (%)", "Período", "Ações"].map((h) => (
                          <th key={h} className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtradas.map((aval, i) => (
                        <motion.tr key={aval.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium">{aval.nome}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={TIPO_COLOR[aval.tipo] || ""}>{aval.tipo}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <BookOpen className="w-3.5 h-3.5" />{aval.disciplina}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{aval.turma}</td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-primary">× {aval.peso}%</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <ClipboardList className="w-3.5 h-3.5" />{aval.periodo}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="w-8 h-8"><Edit2 className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md p-6"
            >
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-xl font-bold">Cadastrar Nova Avaliação</h2>
                <Button variant="ghost" size="icon" className="w-8 h-8 -mt-1 -mr-1" onClick={() => setShowModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Defina os critérios da avaliação para que os alunos possam visualizar no calendário académico.</p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" placeholder="Ex: Prova Mensal 1" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Disciplina</Label>
                  <Select value={form.disciplina_id} onValueChange={(v) => setForm((f) => ({ ...f, disciplina_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Escolha a disciplina" /></SelectTrigger>
                    <SelectContent>
                      {turmas.map((t) => (
                        <SelectItem key={t.disciplina_id} value={String(t.disciplina_id)}>{t.disciplina_nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="peso">Peso (%)</Label>
                  <div className="relative">
                    <Input id="peso" type="number" min="0" max="100" placeholder="0 a 100" value={form.peso} onChange={(e) => setForm((f) => ({ ...f, peso: e.target.value }))} className="pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Período</Label>
                  <Select value={form.periodo} onValueChange={(v) => setForm((f) => ({ ...f, periodo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PERIODOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Avaliação"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}