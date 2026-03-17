"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getAdminTurmas,
  getAnosLectivos,
  getHorarios,
  saveHorario,
  deleteHorario,
  getAdminProfessores,
  getAdminDisciplinasList,
  type HorarioItem,
} from "@/lib/api"
import { Clock, Loader2, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const DIAS = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta"]

export default function AdminHorariosPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [turmas, setTurmas] = useState<{ id: number; nome: string }[]>([])
  const [anos, setAnos] = useState<{ id: number; nome: string }[]>([])
  const [disciplinas, setDisciplinas] = useState<{ id: number; nome: string; sigla: string }[]>([])
  const [professores, setProfessores] = useState<{ id: number; nome: string }[]>([])
  const [turmaId, setTurmaId] = useState<string>("")
  const [anoId, setAnoId] = useState<string>("")
  const [horarios, setHorarios] = useState<HorarioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingList, setLoadingList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    disciplina_id: 0,
    professor_id: 0,
    dia_semana: 1,
    hora_inicio: "08:00",
    hora_fim: "09:00",
    sala: "",
  })

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/login/admin")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    Promise.all([
      getAdminTurmas(),
      getAnosLectivos(),
      getAdminDisciplinasList(),
      getAdminProfessores(),
    ])
      .then(([t, a, d, p]) => {
        setTurmas((t.data || []).map((x) => ({ id: x.id, nome: x.nome })))
        setAnos((a.data || []).map((x) => ({ id: x.id, nome: x.nome })))
        setDisciplinas(d.data || [])
        setProfessores((p.data || []).map((x) => ({ id: x.id, nome: x.nome })))
        if (a.data?.length && !anoId) setAnoId(String((a.data as { id: number }[])[0].id))
        if (t.data?.length && !turmaId) setTurmaId(String((t.data as { id: number }[])[0].id))
      })
      .catch(() => toast({ title: "Erro ao carregar dados", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!turmaId || !anoId) return
    setLoadingList(true)
    getHorarios({ turmaId: Number(turmaId), anoLectivoId: Number(anoId) })
      .then((r) => setHorarios(r.data || []))
      .catch(() => toast({ title: "Erro ao carregar horários", variant: "destructive" }))
      .finally(() => setLoadingList(false))
  }, [turmaId, anoId])

  const handleAdd = () => {
    if (!turmaId || !anoId || !form.disciplina_id || !form.professor_id) {
      toast({ title: "Preencha turma, ano, disciplina e professor", variant: "destructive" })
      return
    }
    setSaving(true)
    saveHorario({
      turma_id: Number(turmaId),
      ano_lectivo_id: Number(anoId),
      disciplina_id: form.disciplina_id,
      professor_id: form.professor_id,
      dia_semana: form.dia_semana,
      hora_inicio: form.hora_inicio,
      hora_fim: form.hora_fim,
      sala: form.sala || null,
    })
      .then(() => {
        toast({ title: "Horário adicionado" })
        setOpen(false)
        setForm({ disciplina_id: 0, professor_id: 0, dia_semana: 1, hora_inicio: "08:00", hora_fim: "09:00", sala: "" })
        getHorarios({ turmaId: Number(turmaId), anoLectivoId: Number(anoId) }).then((r) => setHorarios(r.data || []))
      })
      .catch((e) => toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" }))
      .finally(() => setSaving(false))
  }

  const handleDelete = (id: number) => {
    if (!confirm("Remover este horário?")) return
    deleteHorario(id)
      .then(() => {
        toast({ title: "Horário removido" })
        getHorarios({ turmaId: Number(turmaId), anoLectivoId: Number(anoId) }).then((r) => setHorarios(r.data || []))
      })
      .catch(() => toast({ title: "Erro ao remover", variant: "destructive" }))
  }

  if (!isAuthenticated || user?.type !== "admin") return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
              <Clock className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Gestão de Horários</h1>
                <p className="text-muted-foreground">Definir horários por turma e ano lectivo</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
                <CardContent className="pt-4 flex flex-wrap gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Turma</label>
                    <Select value={turmaId} onValueChange={setTurmaId} disabled={loading}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ano lectivo</label>
                    <Select value={anoId} onValueChange={setAnoId} disabled={loading}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {anos.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => setOpen(true)} disabled={!turmaId || !anoId}>
                    <Plus className="w-4 h-4 mr-2" /> Adicionar
                  </Button>
                </CardContent>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horários</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingList ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : horarios.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum horário. Clique em Adicionar.</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left py-3 px-4 font-semibold">Dia</th>
                          <th className="text-left py-3 px-4 font-semibold">Hora</th>
                          <th className="text-left py-3 px-4 font-semibold">Disciplina</th>
                          <th className="text-left py-3 px-4 font-semibold">Professor</th>
                          <th className="text-left py-3 px-4 font-semibold">Sala</th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {horarios.map((h) => (
                          <tr key={h.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="py-3 px-4">{DIAS[h.dia_semana] ?? "-"}</td>
                            <td className="py-3 px-4">{h.hora_inicio} - {h.hora_fim}</td>
                            <td className="py-3 px-4 font-medium">{h.disciplina_nome}</td>
                            <td className="py-3 px-4">{h.professor_nome}</td>
                            <td className="py-3 px-4">{h.sala ?? "—"}</td>
                            <td className="py-3 px-4">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(h.id)}>
                                <Trash2 className="w-4 h-4" />
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
          </div>
        </main>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar horário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Disciplina</label>
                <Select
                  value={form.disciplina_id ? String(form.disciplina_id) : ""}
                  onValueChange={(v) => setForm((f) => ({ ...f, disciplina_id: Number(v) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Disciplina" /></SelectTrigger>
                  <SelectContent>
                    {disciplinas.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Professor</label>
                <Select
                  value={form.professor_id ? String(form.professor_id) : ""}
                  onValueChange={(v) => setForm((f) => ({ ...f, professor_id: Number(v) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Professor" /></SelectTrigger>
                  <SelectContent>
                    {professores.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Dia da semana</label>
              <Select
                value={String(form.dia_semana)}
                onValueChange={(v) => setForm((f) => ({ ...f, dia_semana: Number(v) }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <SelectItem key={d} value={String(d)}>{DIAS[d]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Hora início</label>
                <Input type="time" value={form.hora_inicio} onChange={(e) => setForm((f) => ({ ...f, hora_inicio: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hora fim</label>
                <Input type="time" value={form.hora_fim} onChange={(e) => setForm((f) => ({ ...f, hora_fim: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sala (opcional)</label>
              <Input value={form.sala} onChange={(e) => setForm((f) => ({ ...f, sala: e.target.value }))} placeholder="Sala 101" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}