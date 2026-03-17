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
import {
  getAdminDisciplinas, getAdminProfessores, apiFetch,
  type DisciplinaAdmin,
} from "@/lib/api"
import {
  BookOpen, Plus, Search, Edit2, UserPlus,
  Loader2, Users, GraduationCap, Clock,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"



interface Curso { id: number; nome: string; sigla: string }
interface Professor { id: number; nome: string; email: string }

const emptyForm = { nome: "", sigla: "", curso_id: "", ano: "10", carga_horaria: "", creditos: "" }

export default function AdminDisciplinasPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [disciplinas, setDisciplinas] = useState<DisciplinaAdmin[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [professores, setProfessores] = useState<Professor[]>([])
  const [stats, setStats] = useState({ total: 0, ativas: 0, sem_professor: 0, professores_vinculados: 0 })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [filtroCurso, setFiltroCurso] = useState("all")

  // Dialogs
  const [openForm, setOpenForm] = useState(false)
  const [openProf, setOpenProf] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [profTarget, setProfTarget] = useState<{ discId: number; nome: string } | null>(null)
  const [profId, setProfId] = useState("")

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/")
  }, [isAuthenticated, user, router])

  // Carregar dados auxiliares uma vez
  useEffect(() => {
    apiFetch<{ success: boolean; data: Curso[] }>('/admin/cursos.php')
      .then((r) => setCursos(r.data || []))
      .catch(() => {})
    getAdminProfessores()
      .then((r) => setProfessores(r.data || []))
      .catch(() => {})
  }, [])

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminDisciplinas({
        search: search || undefined,
        cursoId: filtroCurso && filtroCurso !== "all" ? Number(filtroCurso) : undefined,
      })
      setDisciplinas(res.data || [])
      setStats(res.stats || { total: 0, ativas: 0, sem_professor: 0, professores_vinculados: 0 })
    } catch {
      toast({ title: "Erro ao carregar disciplinas", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [search, filtroCurso])

  useEffect(() => { carregar() }, [filtroCurso])

  // ── Guardar disciplina (criar ou editar) ──
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
        sigla: form.sigla || undefined,
        curso_id: Number(form.curso_id),
        ano: Number(form.ano),
        carga_horaria: form.carga_horaria ? Number(form.carga_horaria) : undefined,
        creditos: form.creditos ? Number(form.creditos) : undefined,
      }
      const res = await apiFetch<{ success: boolean; error?: string; id?: number }>(
        '/admin/disciplinas.php',
        { method: editId ? "PUT" : "POST", body: JSON.stringify(body) }
      )
      if (res.success) {
        toast({ title: editId ? "Disciplina actualizada" : "Disciplina criada" })
        setOpenForm(false)
        setEditId(null)
        setForm(emptyForm)
        carregar()
      } else {
        toast({ title: res.error || "Erro ao guardar", variant: "destructive" })
      }
    } finally { setSaving(false) }
  }

  // ── Associar professor ──
  const associar = async () => {
    if (!profTarget || !profId) return
    setSaving(true)
    try {
      const res = await apiFetch<{ success: boolean; error?: string }>(
        '/admin/disciplinas.php',
        {
          method: "POST",
          body: JSON.stringify({ action: "associar_professor", disciplina_id: profTarget.discId, professor_id: Number(profId) }),
        }
      )
      if (res.success) {
        toast({ title: "Professor associado" })
        setOpenProf(false)
        setProfTarget(null)
        setProfId("")
        carregar()
      } else {
        toast({ title: res.error || "Erro ao associar", variant: "destructive" })
      }
    } finally { setSaving(false) }
  }

  const abrirEditar = (d: DisciplinaAdmin) => {
    setEditId(d.id)
    setForm({
      nome: d.nome,
      sigla: d.sigla || "",
      curso_id: String(d.curso_id),
      ano: String(d.ano),
      carga_horaria: d.carga_horaria ? String(d.carga_horaria) : "",
      creditos: "",
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
                  <BookOpen className="h-6 w-6 text-primary" /> Disciplinas
                </h2>
                <p className="text-muted-foreground">Criar, editar e associar professores</p>
              </div>
              <Button onClick={() => { setEditId(null); setForm(emptyForm); setOpenForm(true) }}>
                <Plus className="h-4 w-4 mr-2" /> Nova Disciplina
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total",               value: stats.total,                 icon: BookOpen, color: "text-primary" },
                { label: "Activas",             value: stats.ativas,                icon: GraduationCap, color: "text-green-600" },
                { label: "Com professor",        value: stats.professores_vinculados, icon: Users, color: "text-blue-600" },
                { label: "Sem professor",        value: stats.sem_professor,         icon: Users, color: "text-amber-600" },
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
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9" placeholder="Pesquisar por nome ou sigla..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && carregar()}
                    />
                  </div>
                  <Select value={filtroCurso} onValueChange={setFiltroCurso}>
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="Todos os cursos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os cursos</SelectItem>
                      {cursos.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={carregar}>Pesquisar</Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabela */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Lista de Disciplinas</span>
                  <Badge variant="secondary">{disciplinas.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : disciplinas.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Nenhuma disciplina encontrada</p>
                    <Button className="mt-4" onClick={() => { setEditId(null); setForm(emptyForm); setOpenForm(true) }}>
                      <Plus className="h-4 w-4 mr-2" /> Criar primeira disciplina
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs text-muted-foreground">
                          <th className="text-left py-3 px-4">Disciplina</th>
                          <th className="text-left py-3 px-4">Curso</th>
                          <th className="text-center py-3 px-3">Ano</th>
                          <th className="text-center py-3 px-3">
                            <Clock className="h-3 w-3 inline mr-1" />Horas
                          </th>
                          <th className="text-left py-3 px-4">Professor</th>
                          <th className="text-center py-3 px-4">Acções</th>
                        </tr>
                      </thead>
                      <tbody>
                        {disciplinas.map((d) => (
                          <tr key={d.id} className="border-b hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{d.nome}</p>
                                <p className="text-xs text-muted-foreground font-mono">{d.codigo || d.sigla || "—"}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">{d.curso_nome}</td>
                            <td className="py-3 px-3 text-center">
                              <Badge variant="outline" className="text-xs">{d.ano}º Ano</Badge>
                            </td>
                            <td className="py-3 px-3 text-center text-xs text-muted-foreground">
                              {d.carga_horaria ? `${d.carga_horaria}h` : "—"}
                            </td>
                            <td className="py-3 px-4">
                              {d.professor_nome ? (
                                <span className="text-sm">{d.professor_nome}</span>
                              ) : (
                                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                                  Sem professor
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-center gap-1">
                                <Button
                                  size="sm" variant="ghost"
                                  onClick={() => abrirEditar(d)}
                                  title="Editar"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm" variant="ghost"
                                  onClick={() => { setProfTarget({ discId: d.id, nome: d.nome }); setProfId(d.professor_id ? String(d.professor_id) : ""); setOpenProf(true) }}
                                  title="Associar professor"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

          </motion.div>
        </main>
      </div>

      {/* ── Dialog: criar/editar disciplina ── */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Disciplina" : "Nova Disciplina"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Nome *</Label>
                <Input
                  placeholder="ex: Matemática Aplicada"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Sigla</Label>
                <Input
                  placeholder="ex: MAT"
                  value={form.sigla}
                  onChange={(e) => setForm((f) => ({ ...f, sigla: e.target.value.toUpperCase() }))}
                  maxLength={10}
                />
              </div>
              <div className="space-y-1">
                <Label>Ano *</Label>
                <Select value={form.ano} onValueChange={(v) => setForm((f) => ({ ...f, ano: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10º Ano</SelectItem>
                    <SelectItem value="11">11º Ano</SelectItem>
                    <SelectItem value="12">12º Ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Curso *</Label>
                <Select value={form.curso_id} onValueChange={(v) => setForm((f) => ({ ...f, curso_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                  <SelectContent>
                    {cursos.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Carga Horária (horas)</Label>
                <Input
                  type="number" min={0} placeholder="ex: 80"
                  value={form.carga_horaria}
                  onChange={(e) => setForm((f) => ({ ...f, carga_horaria: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Créditos</Label>
                <Input
                  type="number" min={0} placeholder="ex: 4"
                  value={form.creditos}
                  onChange={(e) => setForm((f) => ({ ...f, creditos: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editId ? "Actualizar" : "Criar Disciplina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: associar professor ── */}
      <Dialog open={openProf} onOpenChange={setOpenProf}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Associar Professor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{profTarget?.nome}</p>
            <div className="space-y-1">
              <Label>Professor</Label>
              <Select value={profId} onValueChange={setProfId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar professor" /></SelectTrigger>
                <SelectContent>
                  {professores.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenProf(false)}>Cancelar</Button>
            <Button onClick={associar} disabled={saving || !profId}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Associar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
