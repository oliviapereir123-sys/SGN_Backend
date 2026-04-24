"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  getAdminAlunos,
  getAdminTurmas,
  createAluno,
  updateAluno,
  getHistoricoAluno,
  type AlunoAdmin,
  type TurmaAdmin,
  type HistoricoAno,
} from "@/lib/api"
import {
  Search, Download, Plus, Edit2, Clock, Users,
  UserPlus, ArrowUpDown, ChevronLeft, ChevronRight, Loader2, GraduationCap,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const PAGE_SIZE = 6

export default function AdminAlunosPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [alunos, setAlunos] = useState<AlunoAdmin[]>([])
  const [total, setTotal] = useState(0)
  const [paginas, setPaginas] = useState(1)
  const [turmas, setTurmas] = useState<TurmaAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [turmaFilter, setTurmaFilter] = useState("todas")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [page, setPage] = useState(1)

  const [openForm, setOpenForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editAluno, setEditAluno] = useState<AlunoAdmin | null>(null)
  const [form, setForm] = useState({
    nome: "",
    email: "",
    numero: "",
    turma_id: "",
    estado: "Activo",
    telefone: "",
    data_nascimento: "",
    enc_nome: "",
    enc_email: "",
  })

  const [openHistorico, setOpenHistorico] = useState(false)
  const [historicoAluno, setHistoricoAluno] = useState<{ id: number; nome: string; numero: string } | null>(null)
  const [historico, setHistorico] = useState<HistoricoAno[]>([])
  const [historicoLoading, setHistoricoLoading] = useState(false)

  const stats = {
    total,
    novos_mes: 12,
    taxa_frequencia: 94.2,
  }

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/")
  }, [isAuthenticated, user, router])

  const carregarAlunos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminAlunos({
        search: search || undefined,
        turmaId: turmaFilter !== "todas" ? Number(turmaFilter) : undefined,
        estado: statusFilter !== "todos" ? statusFilter : undefined,
        pagina: page,
        limite: PAGE_SIZE,
      })
      setAlunos(res.data || [])
      setTotal(res.total || 0)
      setPaginas(res.paginas || 1)
    } catch {
      toast({ title: "Erro ao carregar alunos", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [search, turmaFilter, statusFilter, page, toast])

  useEffect(() => {
    getAdminTurmas()
      .then((res) => setTurmas(res.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") return
    carregarAlunos()
  }, [isAuthenticated, user, carregarAlunos])

  if (!isAuthenticated || user?.type !== "admin") return null

  const paginados = alunos

  const statusConfig = {
    Activo: { label: "Ativo", className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400" },
    Inactivo: { label: "Inativo", className: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400" },
    Suspenso: { label: "Suspenso", className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400" },
  }

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
                <p className="text-sm text-muted-foreground mb-1">Início &rsaquo; Gestão de Alunos</p>
                <h1 className="text-3xl font-bold">Gestão de Alunos</h1>
                <p className="text-muted-foreground mt-1">Gerencie a lista de estudantes matriculados, turmas e históricos académicos.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />Exportar
                </Button>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4" />Adicionar Aluno
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por nome ou e-mail..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                      className="pl-10"
                    />
                  </div>
                  <Select value={turmaFilter} onValueChange={(v) => { setTurmaFilter(v); setPage(1) }}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Todas as Turmas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Turmas</SelectItem>
                      {turmas.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                    <SelectTrigger className="w-full sm:w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Status</SelectItem>
                      <SelectItem value="Activo">Ativo</SelectItem>
                      <SelectItem value="Inactivo">Inativo</SelectItem>
                      <SelectItem value="Suspenso">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabela */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">Nº</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">
                            <div className="flex items-center gap-1">Nome do Aluno <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">Turma</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">Status</th>
                          <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginados.map((aluno, i) => (
                          <motion.tr
                            key={aluno.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.04 }}
                            className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{aluno.numero}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {aluno.foto
                                    ? <img src={aluno.foto} alt={aluno.nome} className="w-full h-full object-cover" />
                                    : <span className="text-sm font-semibold text-primary">{aluno.nome.charAt(0)}</span>
                                  }
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{aluno.nome}</p>
                                  <p className="text-xs text-muted-foreground">{aluno.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {aluno.turma_nome ? (
                                <span className="text-sm px-2.5 py-1 rounded-md bg-muted text-foreground font-medium">
                                  {aluno.turma_nome}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">Sem turma</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${aluno.estado === "Activo" ? "bg-green-500" :
                                    aluno.estado === "Suspenso" ? "bg-yellow-500" : "bg-gray-400"
                                  }`} />
                                <Badge variant="outline" className={statusConfig[aluno.estado].className}>
                                  {statusConfig[aluno.estado].label}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                                  <Edit2 className="w-3 h-3" />Editar
                                </Button>
                                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                                  <Clock className="w-3 h-3" />Histórico
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                        {paginados.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-muted-foreground">
                              Nenhum aluno encontrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Paginação */}
                {!loading && total > 0 && (
                  <div className="flex items-center justify-between px-6 py-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, total)}-
                      {Math.min(page * PAGE_SIZE, total)} de {total} alunos
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="w-8 h-8" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: Math.min(paginas, 5) }, (_, i) => i + 1).map((p) => (
                        <Button
                          key={p}
                          variant={page === p ? "default" : "outline"}
                          size="icon"
                          className="w-8 h-8 text-sm"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      ))}
                      <Button variant="outline" size="icon" className="w-8 h-8" disabled={page === paginas} onClick={() => setPage(p => p + 1)}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Matrículas</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Novos este Mês</p>
                    <p className="text-2xl font-bold">+{stats.novos_mes}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                    <ArrowUpDown className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Frequência</p>
                    <p className="text-2xl font-bold">{stats.taxa_frequencia}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
