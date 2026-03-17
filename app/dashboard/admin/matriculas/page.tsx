"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { getAdminAlunos, getAdminTurmas, getAnosLectivos, apiFetch } from "@/lib/api"
import { GraduationCap, Plus, Loader2, Search, Edit2, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


interface Matricula {
  id: number
  data_matricula: string
  tipo: string
  estado: string
  observacoes: string | null
  aluno_id: number
  aluno_nome: string
  aluno_numero: string
  turma_nome: string
  turma_ano: number
  curso_nome: string
  ano_lectivo: string
  registado_por_nome: string | null
}

const estadoCores: Record<string, string> = {
  Activa: "bg-green-100 text-green-800",
  Cancelada: "bg-red-100 text-red-800",
  Transferida: "bg-yellow-100 text-yellow-800",
  Concluida: "bg-blue-100 text-blue-800",
}


export default function AdminMatriculasPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [matriculas, setMatriculas] = useState<Matricula[]>([])
  const [alunos, setAlunos] = useState<{ id: number; nome: string; numero: string }[]>([])
  const [turmas, setTurmas] = useState<{ id: number; nome: string }[]>([])
  const [anos, setAnos] = useState<{ id: number; nome: string; estado: string }[]>([])
  const [stats, setStats] = useState<{ total: number; activas: number; canceladas: number; transferidas: number } | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("all")
  const [filtroAno, setFiltroAno] = useState("all")

  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ aluno_id: "", turma_id: "", ano_lectivo_id: "", tipo: "Renovacao", estado: "Activa", observacoes: "" })

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/login/admin")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    Promise.all([getAdminAlunos(), getAdminTurmas(), getAnosLectivos()])
      .then(([al, tu, an]) => {
        setAlunos((al.data || []).map((a: { id: number; nome: string; numero: string }) => ({ id: a.id, nome: a.nome, numero: a.numero })))
        setTurmas((tu.data || []).map((t: { id: number; nome: string }) => ({ id: t.id, nome: t.nome })))
        const lista = an.data || []
        setAnos(lista)
        const activo = lista.find((a: { id: number; estado: string }) => a.estado === "Activo")
        if (activo) setFiltroAno(String(activo.id))
      })
  }, [])

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (filtroEstado && filtroEstado !== "all") params.set("estado", filtroEstado)
      if (filtroAno && filtroAno !== "all") params.set("anoLectivoId", filtroAno)
      const res = await apiFetch<{ success: boolean; data: Matricula[]; stats: typeof stats }>(`/matriculas/index.php?${params}`)
      setMatriculas(res.data || [])
      setStats(res.stats || null)
    } catch { toast({ title: "Erro ao carregar matrículas", variant: "destructive" }) }
    finally { setLoading(false) }
  }, [search, filtroEstado, filtroAno])

  useEffect(() => { carregar() }, [filtroAno, filtroEstado])

  const guardar = async () => {
    setSaving(true)
    try {
      const url = `/matriculas/index.php`
      const body = editId
        ? JSON.stringify({ id: editId, estado: form.estado, turma_id: Number(form.turma_id), observacoes: form.observacoes })
        : JSON.stringify({ aluno_id: Number(form.aluno_id), turma_id: Number(form.turma_id), ano_lectivo_id: Number(form.ano_lectivo_id), tipo: form.tipo, estado: form.estado, observacoes: form.observacoes })
      const res = await apiFetch<{ success: boolean; error?: string }>(url, { method: editId ? "PUT" : "POST", body })
      if (res.success) {
        toast({ title: editId ? "Matrícula actualizada" : "Matrícula criada" })
        setOpen(false); setEditId(null)
        setForm({ aluno_id: "", turma_id: "", ano_lectivo_id: "", tipo: "Renovacao", estado: "Activa", observacoes: "" })
        carregar()
      } else {
        toast({ title: res.error || "Erro ao guardar", variant: "destructive" })
      }
    } finally { setSaving(false) }
  }

  const abrirEditar = (m: Matricula) => {
    setEditId(m.id)
    setForm({ aluno_id: String(m.aluno_id), turma_id: "", ano_lectivo_id: "", tipo: m.tipo, estado: m.estado, observacoes: m.observacoes || "" })
    setOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="p-6 space-y-6">

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total", value: stats.total, color: "text-primary" },
                { label: "Activas", value: stats.activas, color: "text-green-600" },
                { label: "Canceladas", value: stats.canceladas, color: "text-red-600" },
                { label: "Transferidas", value: stats.transferidas, color: "text-yellow-600" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="pt-4 pb-4 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Filtros + botão */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Pesquisar aluno..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && carregar()} />
                </div>
                <Select value={filtroAno} onValueChange={setFiltroAno}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Ano lectivo" /></SelectTrigger>
                  <SelectContent>{anos.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {["Activa", "Cancelada", "Transferida", "Concluida"].map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={carregar} variant="outline">Pesquisar</Button>
                <Button onClick={() => { setEditId(null); setForm({ aluno_id: "", turma_id: "", ano_lectivo_id: "", tipo: "Renovacao", estado: "Activa", observacoes: "" }); setOpen(true) }}>
                  <Plus className="h-4 w-4 mr-2" /> Nova Matrícula
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" /> Matrículas
                <Badge variant="secondary" className="ml-auto">{matriculas.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : matriculas.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma matrícula encontrada</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-xs">
                        <th className="text-left py-2 px-3">Aluno</th>
                        <th className="text-left py-2 px-3">Turma / Curso</th>
                        <th className="text-center py-2 px-3">Tipo</th>
                        <th className="text-center py-2 px-3">Estado</th>
                        <th className="text-center py-2 px-3">Data</th>
                        <th className="text-center py-2 px-3">Acções</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matriculas.map((m) => (
                        <tr key={m.id} className="border-b hover:bg-muted/20">
                          <td className="py-2 px-3">
                            <p className="font-medium">{m.aluno_nome}</p>
                            <p className="text-xs text-muted-foreground font-mono">{m.aluno_numero}</p>
                          </td>
                          <td className="py-2 px-3">
                            <p>{m.turma_nome} — {m.turma_ano}º Ano</p>
                            <p className="text-xs text-muted-foreground">{m.curso_nome}</p>
                          </td>
                          <td className="py-2 px-3 text-center"><Badge variant="outline" className="text-xs">{m.tipo}</Badge></td>
                          <td className="py-2 px-3 text-center"><Badge className={`text-xs ${estadoCores[m.estado] || ""}`}>{m.estado}</Badge></td>
                          <td className="py-2 px-3 text-center text-xs text-muted-foreground">{new Date(m.data_matricula).toLocaleDateString("pt-PT")}</td>
                          <td className="py-2 px-3 text-center">
                            <Button size="sm" variant="ghost" onClick={() => abrirEditar(m)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

        </main>
      </div>

      {/* Dialog nova/editar matrícula */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Editar Matrícula" : "Nova Matrícula"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {!editId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Aluno</label>
                <Select value={form.aluno_id} onValueChange={(v) => setForm((f) => ({ ...f, aluno_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar aluno" /></SelectTrigger>
                  <SelectContent>{alunos.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.nome} ({a.numero})</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Turma</label>
              <Select value={form.turma_id} onValueChange={(v) => setForm((f) => ({ ...f, turma_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar turma" /></SelectTrigger>
                <SelectContent>{turmas.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {!editId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Ano Lectivo</label>
                <Select value={form.ano_lectivo_id} onValueChange={(v) => setForm((f) => ({ ...f, ano_lectivo_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Ano lectivo" /></SelectTrigger>
                  <SelectContent>{anos.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Nova", "Renovacao", "Transferencia"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select value={form.estado} onValueChange={(v) => setForm((f) => ({ ...f, estado: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Activa", "Cancelada", "Transferida", "Concluida"].map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <Input placeholder="Opcional" value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editId ? "Actualizar" : "Criar Matrícula"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}