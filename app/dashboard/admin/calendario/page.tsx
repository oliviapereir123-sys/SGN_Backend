"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getAnosLectivos,
  getCalendario,
  saveCalendarioEvento,
  deleteCalendarioEvento,
  type CalendarioEvento,
} from "@/lib/api"
import { Calendar, Loader2, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { addMonths, subMonths, format } from "date-fns"

const TIPOS = [
  { value: "feriado", label: "Feriado" },
  { value: "evento", label: "Evento" },
  { value: "exame", label: "Exame" },
  { value: "matricula", label: "Matrícula" },
  { value: "encerramento", label: "Encerramento" },
  { value: "outro", label: "Outro" },
]

export default function AdminCalendarioPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [anos, setAnos] = useState<{ id: number; nome: string }[]>([])
  const [anoId, setAnoId] = useState<string>("")
  const [eventos, setEventos] = useState<CalendarioEvento[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingList, setLoadingList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CalendarioEvento | null>(null)
  const [form, setForm] = useState({
    titulo: "",
    tipo: "evento",
    data_inicio: format(new Date(), "yyyy-MM-dd"),
    data_fim: "",
    descricao: "",
    ano_lectivo_id: null as number | null,
  })

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/login/admin")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    getAnosLectivos()
      .then((r) => {
        setAnos((r.data || []).map((x) => ({ id: x.id, nome: x.nome })))
        if (r.data?.length && !anoId) setAnoId(String((r.data as { id: number }[])[0].id))
      })
      .finally(() => setLoading(false))
  }, [])

  const loadEventos = () => {
    const inicio = format(subMonths(new Date(), 2), "yyyy-MM-dd")
    const fim = format(addMonths(new Date(), 10), "yyyy-MM-dd")
    setLoadingList(true)
    getCalendario({
      anoLectivoId: anoId ? Number(anoId) : undefined,
      dataInicio: inicio,
      dataFim: fim,
    })
      .then((r) => setEventos(r.data || []))
      .catch(() => toast({ title: "Erro ao carregar calendário", variant: "destructive" }))
      .finally(() => setLoadingList(false))
  }

  useEffect(() => {
    loadEventos()
  }, [anoId])

  const handleSave = () => {
    if (!form.titulo || !form.data_inicio) {
      toast({ title: "Título e data são obrigatórios", variant: "destructive" })
      return
    }
    setSaving(true)
    saveCalendarioEvento({
      ...(editing ? { id: editing.id } : {}),
      titulo: form.titulo,
      tipo: form.tipo,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim || null,
      descricao: form.descricao || null,
      ano_lectivo_id: form.ano_lectivo_id || null,
    })
      .then(() => {
        toast({ title: editing ? "Evento actualizado" : "Evento adicionado" })
        setOpen(false)
        setEditing(null)
        setForm({ titulo: "", tipo: "evento", data_inicio: format(new Date(), "yyyy-MM-dd"), data_fim: "", descricao: "", ano_lectivo_id: null })
        loadEventos()
      })
      .catch((e) => toast({ title: "Erro", description: e instanceof Error ? e.message : "", variant: "destructive" }))
      .finally(() => setSaving(false))
  }

  const handleDelete = (id: number) => {
    if (!confirm("Remover este evento?")) return
    deleteCalendarioEvento(id)
      .then(() => { toast({ title: "Evento removido" }); loadEventos() })
      .catch(() => toast({ title: "Erro ao remover", variant: "destructive" }))
  }

  const openEdit = (e: CalendarioEvento) => {
    setEditing(e)
    setForm({
      titulo: e.titulo,
      tipo: e.tipo,
      data_inicio: e.data_inicio,
      data_fim: e.data_fim || "",
      descricao: e.descricao || "",
      ano_lectivo_id: e.ano_lectivo_id,
    })
    setOpen(true)
  }

  if (!isAuthenticated || user?.type !== "admin") return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Calendário Académico</h1>
                <p className="text-muted-foreground">Feriados, eventos e datas importantes</p>
              </div>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex gap-4 items-center">
                  <Select value={anoId} onValueChange={setAnoId} disabled={loading}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Ano lectivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {anos.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => { setEditing(null); setForm({ titulo: "", tipo: "evento", data_inicio: format(new Date(), "yyyy-MM-dd"), data_fim: "", descricao: "", ano_lectivo_id: anoId ? Number(anoId) : null }); setOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingList ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : eventos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum evento. Clique em Adicionar.</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left py-3 px-4 font-semibold">Data</th>
                          <th className="text-left py-3 px-4 font-semibold">Título</th>
                          <th className="text-left py-3 px-4 font-semibold">Tipo</th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {eventos.map((e) => (
                          <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="py-3 px-4">{e.data_inicio}{e.data_fim && e.data_fim !== e.data_inicio ? ` a ${e.data_fim}` : ""}</td>
                            <td className="py-3 px-4 font-medium">{e.titulo}</td>
                            <td className="py-3 px-4">{TIPOS.find((t) => t.value === e.tipo)?.label ?? e.tipo}</td>
                            <td className="py-3 px-4">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(e)}>Editar</Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(e.id)}><Trash2 className="w-4 h-4" /></Button>
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
            <DialogTitle>{editing ? "Editar evento" : "Adicionar evento"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Feriado Nacional" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data início</label>
                <Input type="date" value={form.data_inicio} onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data fim (opcional)</label>
                <Input type="date" value={form.data_fim} onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano lectivo (opcional)</label>
              <Select
                value={form.ano_lectivo_id ? String(form.ano_lectivo_id) : "todos"}
                onValueChange={(v) => setForm((f) => ({ ...f, ano_lectivo_id: v === "todos" ? null : Number(v) }))}
              >
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os anos</SelectItem>
                  {anos.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}