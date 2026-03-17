"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { getAdminTurmas, apiFetch, type TurmaAdmin } from "@/lib/api"
import {
  Users, Plus, Search, Edit2, Trash2,
  Loader2, GraduationCap, BookOpen, AlertTriangle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"



interface Curso { id: number; nome: string; sigla: string }

const emptyForm = {
  nome: "", curso_id: "", ano: "10",
  turno: "Matutino", periodo: "Matutino",
  sala: "", capacidade: "30", estado: "Activa",
}

const TURNOS = ["Matutino", "Vespertino", "Nocturno"]

export default function AdminTurmasPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [turmas, setTurmas] = useState<TurmaAdmin[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [stats, setStats] = useState({ total_turmas: 0, total_alunos: 0, total_disciplinas_vinculadas: 0 })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [filtroAno, setFiltroAno] = useState("all")

  const [openForm, setOpenForm] = useState(false)
  const [openDelete, setOpenDelete] = useState<TurmaAdmin | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    apiFetch<{ success: boolean; data: Curso[] }>('/admin/cursos.php')
      .then((r) => setCursos(r.data || []))
      .catch(() => {})
  }, [])

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminTurmas({
        search: search || undefined,
        ano: filtroAno && filtroAno !== "all" ? Number(filtroAno) : undefined,
      })
      setTurmas(res.data || [])
      setStats(res.stats || { total_turmas: 0, total_alunos: 0, total_disciplinas_vinculadas: 0 })
    } catch {
      toast({ title: "Erro ao carregar turmas", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [search, filtroAno])

  useEffect(() => { carregar() }, [filtroAno])

  // Sugerir nome automaticamente
  const sugerirNome = (cursoId: string, ano: string, turno: string) => {
    const curso = cursos.find((c) => String(c.id) === cursoId)
    if (!curso || !ano) return
    const letra = turno === "Matutino" ? "A" : turno === "Vespertino" ? "B" : "C"
    // Contar quantas turmas já existem deste curso/ano
    const existentes = turmas.filter((t) => t.curso_id === Number(cursoId) && t.ano === Number(ano))
    const numLetra = String.fromCharCode(65 + existentes.length) // A, B, C...
    const nome = `${curso.sigla}-${ano}${numLetra}`
    setForm((f) => ({ ...f, nome }))
  }

  const guardar = async () => {
    if (!form.nome || !form.curso_id || !form.ano) {
      toast({ title: "Nome, curso e ano são obrigatórios", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const body = {
        ...(editId ? { id: editId } : {}),
        nome: form.nome,
        curso_id: Number(form.curso_id),
        ano: Number(form.ano),
        turno: form.turno,
        periodo: form.periodo,
        sala: form.sala || undefined,
        capacidade: Number(form.capacidade) || 30,
        estado: form.estado,
      }
      const res = await apiFetch<{ success: boolean; error?: string }>(
        '/admin/turmas.php',
        { method: editId ? "PUT" : "POST", body: JSON.stringify(body) }
      )
      if (res.success) {
        toast({ title: editId ? "Turma actualizada" : "Turma criada" })
        setOpenForm(false); setEditId(null); setForm(emptyForm)
        carregar()
      } else {
        toast({ title: res.error || "Erro ao guardar", variant: "destructive" })
      }
    } finally { setSaving(false) }
  }

  const desactivar = async (t: TurmaAdmin) => {
    setSaving(true)
    try {
      const res = await apiFetch<{ success: boolean; error?: string }>(
        `/admin/turmas.php?id=${t.id}`,
        { method: "DELETE" }
      )
      if (res.success) {
        toast({ title: "Turma desactivada" })
        setOpenDelete(null); carregar()
      } else {
        toast({ title: res.error || "Erro ao desactivar", variant: "destructive" })
      }
    } finally { setSaving(false) }
  }

  const abrirEditar = (t: TurmaAdmin) => {
    setEditId(t.id)
    setForm({
      nome: t.nome, curso_id: String(t.curso_id), ano: String(t.ano),
      turno: t.turno || "Matutino", periodo: t.periodo || "Matutino",
      sala: t.sala || "", capacidade: String(t.capacidade || 30), estado: t.estado,
    })
    setOpenForm(true)
  }

  if (!isAuthenticated || user?.type !== "admin") return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" /> Turmas
                </h2>
                <p className="text-muted-foreground">Criar e gerir turmas por curso e ano</p>
              </div>
              <Button onClick={() => { setEditId(null); setForm(emptyForm); setOpenForm(true) }}>
                <Plus className="h-4 w-4 mr-2" /> Nova Turma
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total de Turmas",       value: stats.total_turmas,               icon: Users,         color: "text-primary" },
                { label: "Total de Alunos",        value: stats.total_alunos,               icon: GraduationCap, color: "text-green-600" },
                { label: "Disciplinas vinculadas", value: stats.total_disciplinas_vinculadas,icon: BookOpen,      color: "text-blue-600" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      </div>
                      <s.icon className={`h-8 w-8 opacity-20 ${s.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filtros */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Pesquisar turma..." value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && carregar()} />
                  </div>
                  <Select value={filtroAno} onValueChange={setFiltroAno}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Todos os anos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="10">10º Ano</SelectItem>
                      <SelectItem value="11">11º Ano</SelectItem>
                      <SelectItem value="12">12º Ano</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={carregar}>Pesquisar</Button>
                </div>
              </CardContent>
            </Card>

            {/* Grid de turmas */}
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : turmas.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhuma turma encontrada</p>
                  <Button className="mt-4" onClick={() => { setEditId(null); setForm(emptyForm); setOpenForm(true) }}>
                    <Plus className="h-4 w-4 mr-2" /> Criar primeira turma
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {turmas.map((t) => (
                  <Card key={t.id} className={`hover:shadow-md transition-shadow ${t.estado === "Inactiva" ? "opacity-60" : ""}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{t.nome}</h3>
                          <p className="text-sm text-muted-foreground">{t.curso_nome}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => abrirEditar(t)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setOpenDelete(t)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">{t.ano}º Ano</Badge>
                        <Badge variant="secondary" className="text-xs">{t.turno || "Matutino"}</Badge>
                        {t.sala && <Badge variant="outline" className="text-xs">Sala {t.sala}</Badge>}
                        {t.estado === "Inactiva" && <Badge variant="destructive" className="text-xs">Inactiva</Badge>}
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3.5 w-3.5" /> {t.total_alunos} alunos
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> {t.total_disciplinas} disciplinas
                        </span>
                      </div>
                      {t.disciplinas_preview?.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2 truncate">
                          {t.disciplinas_preview.join(", ")}
                          {t.total_disciplinas > t.disciplinas_preview.length && ` +${t.total_disciplinas - t.disciplinas_preview.length}`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

          </motion.div>
        </main>
      </div>

      {/* ── Dialog: criar/editar turma ── */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Turma" : "Nova Turma"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Curso *</Label>
                <Select
                  value={form.curso_id}
                  onValueChange={(v) => {
                    setForm((f) => ({ ...f, curso_id: v }))
                    sugerirNome(v, form.ano, form.turno)
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {cursos.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Ano *</Label>
                <Select
                  value={form.ano}
                  onValueChange={(v) => {
                    setForm((f) => ({ ...f, ano: v }))
                    sugerirNome(form.curso_id, v, form.turno)
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10º Ano</SelectItem>
                    <SelectItem value="11">11º Ano</SelectItem>
                    <SelectItem value="12">12º Ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Nome *</Label>
                <Input
                  placeholder="ex: CONT-10A"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Turno</Label>
                <Select value={form.turno} onValueChange={(v) => setForm((f) => ({ ...f, turno: v, periodo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TURNOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Sala</Label>
                <Input
                  placeholder="ex: A12"
                  value={form.sala}
                  onChange={(e) => setForm((f) => ({ ...f, sala: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Capacidade</Label>
                <Input
                  type="number" min={1} max={100}
                  value={form.capacidade}
                  onChange={(e) => setForm((f) => ({ ...f, capacidade: e.target.value }))}
                />
              </div>
              {editId && (
                <div className="space-y-1">
                  <Label>Estado</Label>
                  <Select value={form.estado} onValueChange={(v) => setForm((f) => ({ ...f, estado: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activa">Activa</SelectItem>
                      <SelectItem value="Inactiva">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editId ? "Actualizar" : "Criar Turma"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: confirmar desactivar ── */}
      <Dialog open={!!openDelete} onOpenChange={() => setOpenDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Desactivar Turma
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Tem a certeza que quer desactivar <strong>{openDelete?.nome}</strong>?
            {(openDelete?.total_alunos || 0) > 0 && (
              <span className="block mt-2 text-destructive">
                Esta turma tem {openDelete?.total_alunos} aluno(s) activo(s) e não pode ser desactivada.
              </span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => openDelete && desactivar(openDelete)}
              disabled={saving || (openDelete?.total_alunos || 0) > 0}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Desactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
