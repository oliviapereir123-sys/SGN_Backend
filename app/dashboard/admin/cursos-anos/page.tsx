"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  getAnosLectivosAdmin, createAnoLectivo, updateAnoLectivo, deleteAnoLectivo,
  updateTrimestre, deleteTrimestre,
  getAdminCursos, createCurso, updateCurso, deleteCurso,
  type AnoLectivo, type Trimestre, type Curso,
} from "@/lib/api"
import {
  BookOpen, Calendar, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Loader2, AlertCircle, Lock, Unlock, CheckCircle2, Clock, X,
} from "lucide-react"

// ── helpers ───────────────────────────────────────────────────────────────────

const ESTADOS_ANO = ["Activo", "Encerrado", "Pendente"] as const
const ESTADOS_TRIM = ["Activo", "Encerrado", "Pendente"] as const

function badgeVariant(estado: string) {
  if (estado === "Activo") return "default"
  if (estado === "Encerrado") return "secondary"
  return "outline"
}

// ── Modal Ano Lectivo ─────────────────────────────────────────────────────────

interface ModalAnoProps {
  initial?: AnoLectivo | null
  onClose: () => void
  onSaved: () => void
  toast: ReturnType<typeof useToast>["toast"]
}

function ModalAno({ initial, onClose, onSaved, toast }: ModalAnoProps) {
  const isEdit = !!initial
  const [nome, setNome] = useState(initial?.nome ?? "")
  const [inicio, setInicio] = useState(initial?.inicio ?? "")
  const [fim, setFim] = useState(initial?.fim ?? "")
  const [estado, setEstado] = useState<string>(initial?.estado ?? "Pendente")
  const [trims, setTrims] = useState([
    { nome: "1º Trimestre", inicio: "", fim: "", estado: "Pendente" },
    { nome: "2º Trimestre", inicio: "", fim: "", estado: "Pendente" },
    { nome: "3º Trimestre", inicio: "", fim: "", estado: "Pendente" },
  ])
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit) {
        await updateAnoLectivo({ id: initial!.id, nome, inicio, fim, estado })
      } else {
        const trimsValidos = trims.filter(t => t.inicio && t.fim)
        await createAnoLectivo({ nome, inicio, fim, estado, trimestres: trimsValidos })
      }
      toast({ title: isEdit ? "Ano lectivo actualizado" : "Ano lectivo criado" })
      onSaved()
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro ao guardar", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-lg">{isEdit ? "Editar Ano Lectivo" : "Novo Ano Lectivo"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Nome (ex: 2025/2026)</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="2025/2026" required />
            </div>
            <div className="space-y-1">
              <Label>Data de Início</Label>
              <Input type="date" value={inicio} onChange={e => setInicio(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Data de Fim</Label>
              <Input type="date" value={fim} onChange={e => setFim(e.target.value)} required />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Estado</Label>
              <select
                value={estado}
                onChange={e => setEstado(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {ESTADOS_ANO.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {!isEdit && (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-muted-foreground">Trimestres (opcional)</p>
              {trims.map((t, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="col-span-2 text-xs font-medium text-muted-foreground">{t.nome}</div>
                  <div className="space-y-1">
                    <Label className="text-xs">Início</Label>
                    <Input type="date" value={t.inicio}
                      onChange={e => setTrims(ts => ts.map((x, j) => j === i ? { ...x, inicio: e.target.value } : x))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fim</Label>
                    <Input type="date" value={t.fim}
                      onChange={e => setTrims(ts => ts.map((x, j) => j === i ? { ...x, fim: e.target.value } : x))}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Guardar" : "Criar"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Modal Trimestre ───────────────────────────────────────────────────────────

interface ModalTrimProps {
  trim: Trimestre
  onClose: () => void
  onSaved: () => void
  toast: ReturnType<typeof useToast>["toast"]
}

function ModalTrimestre({ trim, onClose, onSaved, toast }: ModalTrimProps) {
  const [nome, setNome] = useState(trim.nome)
  const [inicio, setInicio] = useState(trim.inicio)
  const [fim, setFim] = useState(trim.fim)
  const [estado, setEstado] = useState(trim.estado)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateTrimestre({ id: trim.id, nome, inicio, fim, estado })
      toast({ title: "Trimestre actualizado" })
      onSaved()
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro ao guardar", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">Editar Trimestre</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Início</Label>
              <Input type="date" value={inicio} onChange={e => setInicio(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Fim</Label>
              <Input type="date" value={fim} onChange={e => setFim(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Estado</Label>
            <select
              value={estado}
              onChange={e => setEstado(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {ESTADOS_TRIM.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Modal Curso ───────────────────────────────────────────────────────────────

interface ModalCursoProps {
  initial?: Curso | null
  onClose: () => void
  onSaved: () => void
  toast: ReturnType<typeof useToast>["toast"]
}

function ModalCurso({ initial, onClose, onSaved, toast }: ModalCursoProps) {
  const isEdit = !!initial
  const [nome, setNome] = useState(initial?.nome ?? "")
  const [sigla, setSigla] = useState(initial?.sigla ?? "")
  const [estado, setEstado] = useState(initial?.estado ?? "Activo")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit) {
        await updateCurso({ id: initial!.id, nome, sigla, estado })
      } else {
        await createCurso({ nome, sigla })
      }
      toast({ title: isEdit ? "Curso actualizado" : "Curso criado" })
      onSaved()
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro ao guardar", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">{isEdit ? "Editar Curso" : "Novo Curso"}</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Informática de Gestão" required />
          </div>
          <div className="space-y-1">
            <Label>Sigla</Label>
            <Input value={sigla} onChange={e => setSigla(e.target.value.toUpperCase())} placeholder="Ex: IG" maxLength={10} required />
          </div>
          {isEdit && (
            <div className="space-y-1">
              <Label>Estado</Label>
              <select
                value={estado}
                onChange={e => setEstado(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Guardar" : "Criar"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function CursosAnosPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [anos, setAnos] = useState<AnoLectivo[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedAnos, setExpandedAnos] = useState<Set<number>>(new Set())

  const [modalAno, setModalAno] = useState<{ open: boolean; item?: AnoLectivo | null }>({ open: false })
  const [modalTrim, setModalTrim] = useState<{ open: boolean; item?: Trimestre }>({ open: false })
  const [modalCurso, setModalCurso] = useState<{ open: boolean; item?: Curso | null }>({ open: false })

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/")
  }, [isAuthenticated, user, router])

  async function load() {
    setLoading(true)
    try {
      const [ra, rc] = await Promise.all([getAnosLectivosAdmin(), getAdminCursos()])
      setAnos(ra.data || [])
      setCursos(rc.data || [])
      if (ra.data?.length) setExpandedAnos(new Set([ra.data[0].id]))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function toggleBloqueio(t: Trimestre) {
    try {
      await updateTrimestre({ id: t.id, bloqueado: t.bloqueado ? 0 : 1 })
      toast({ title: t.bloqueado ? "Trimestre desbloqueado" : "Trimestre bloqueado" })
      load()
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    }
  }

  async function handleDeleteAno(ano: AnoLectivo) {
    const hasTrimestres = ano.trimestres && ano.trimestres.length > 0
    const msg = hasTrimestres
      ? `Remover "${ano.nome}" e os seus ${ano.trimestres!.length} trimestre(s)? Esta acção não pode ser desfeita.`
      : `Remover "${ano.nome}"? Esta acção não pode ser desfeita.`

    if (!confirm(msg)) return

    try {
      // Se tiver trimestres, apagar todos primeiro
      if (hasTrimestres) {
        for (const t of ano.trimestres!) {
          await deleteTrimestre(t.id)
        }
      }
      await deleteAnoLectivo(ano.id)
      toast({ title: "Ano lectivo removido" })
      load()
    } catch (err: any) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" })
    }
  }

  async function handleDeleteTrim(id: number) {
    if (!confirm("Remover este trimestre?")) return
    try {
      await deleteTrimestre(id)
      toast({ title: "Trimestre removido" })
      load()
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    }
  }

  async function handleDeleteCurso(id: number) {
    if (!confirm("Remover este curso?")) return
    try {
      await deleteCurso(id)
      toast({ title: "Curso removido" })
      load()
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    }
  }

  function toggleExpand(id: number) {
    setExpandedAnos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (!isAuthenticated || user?.type !== "admin") return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:ml-64">
        <DashboardHeader />
        <main className="p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            <div>
              <h1 className="text-2xl font-bold">Cursos & Anos Lectivos</h1>
              <p className="text-muted-foreground">Gerir cursos, anos lectivos e trimestres</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* ══ CURSOS ══════════════════════════════════════════════════ */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold">Cursos</h2>
                      <Badge variant="outline">{cursos.length}</Badge>
                    </div>
                    <Button size="sm" onClick={() => setModalCurso({ open: true, item: null })}>
                      <Plus className="w-4 h-4 mr-1" /> Novo Curso
                    </Button>
                  </div>

                  {cursos.length === 0 ? (
                    <Card>
                      <CardContent className="py-10 text-center text-muted-foreground">
                        <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        Nenhum curso registado.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cursos.map(c => (
                        <Card key={c.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold">{c.nome}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{c.sigla}</p>
                              </div>
                              <Badge variant={c.estado === "Activo" ? "default" : "secondary"} className="text-xs shrink-0">
                                {c.estado}
                              </Badge>
                            </div>
                            <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                              <span>{c.total_turmas ?? 0} turmas</span>
                              <span>{c.total_disciplinas ?? 0} disciplinas</span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" variant="outline" className="flex-1"
                                onClick={() => setModalCurso({ open: true, item: c })}>
                                <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteCurso(c.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>

                {/* ══ ANOS LECTIVOS ═══════════════════════════════════════════ */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold">Anos Lectivos</h2>
                      <Badge variant="outline">{anos.length}</Badge>
                    </div>
                    <Button size="sm" onClick={() => setModalAno({ open: true, item: null })}>
                      <Plus className="w-4 h-4 mr-1" /> Novo Ano
                    </Button>
                  </div>

                  {anos.length === 0 ? (
                    <Card>
                      <CardContent className="py-10 text-center text-muted-foreground">
                        <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        Nenhum ano lectivo registado.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {anos.map(ano => {
                        const expanded = expandedAnos.has(ano.id)
                        return (
                          <Card key={ano.id}>
                            <CardHeader
                              className="py-3 px-4 cursor-pointer select-none"
                              onClick={() => toggleExpand(ano.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {expanded
                                    ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                  }
                                  <span className="font-semibold">{ano.nome}</span>
                                  <Badge variant={badgeVariant(ano.estado) as any}>{ano.estado}</Badge>
                                </div>
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                  <span className="text-xs text-muted-foreground hidden sm:block">
                                    {new Date(ano.inicio).toLocaleDateString("pt-PT")} — {new Date(ano.fim).toLocaleDateString("pt-PT")}
                                  </span>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                                    onClick={() => setModalAno({ open: true, item: ano })}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteAno(ano)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>

                            <AnimatePresence>
                              {expanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <CardContent className="pt-0 pb-4 px-4">
                                    <div className="border-t border-border pt-3 space-y-2">
                                      {!ano.trimestres?.length ? (
                                        <p className="text-sm text-muted-foreground py-2">Sem trimestres.</p>
                                      ) : (
                                        ano.trimestres.map(t => (
                                          <div key={t.id}
                                            className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 border border-border px-3 py-2">
                                            <div className="flex items-center gap-3">
                                              {t.estado === "Activo"
                                                ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                : t.estado === "Encerrado"
                                                  ? <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                                                  : <Clock className="w-4 h-4 text-muted-foreground" />
                                              }
                                              <div>
                                                <p className="text-sm font-medium">{t.nome}</p>
                                                <p className="text-xs text-muted-foreground">
                                                  {new Date(t.inicio).toLocaleDateString("pt-PT")} — {new Date(t.fim).toLocaleDateString("pt-PT")}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                              <Badge variant={badgeVariant(t.estado) as any} className="text-xs">{t.estado}</Badge>
                                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                                                title={t.bloqueado ? "Desbloquear" : "Bloquear"}
                                                onClick={() => toggleBloqueio(t)}>
                                                {t.bloqueado
                                                  ? <Lock className="w-3.5 h-3.5 text-destructive" />
                                                  : <Unlock className="w-3.5 h-3.5 text-muted-foreground" />
                                                }
                                              </Button>
                                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                                                onClick={() => setModalTrim({ open: true, item: t })}>
                                                <Pencil className="w-3.5 h-3.5" />
                                              </Button>
                                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteTrim(t.id)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </CardContent>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </motion.div>
        </main>
      </div>

      {/* ── Modais ── */}
      {modalAno.open && (
        <ModalAno
          initial={modalAno.item}
          toast={toast}
          onClose={() => setModalAno({ open: false })}
          onSaved={() => { setModalAno({ open: false }); load() }}
        />
      )}
      {modalTrim.open && modalTrim.item && (
        <ModalTrimestre
          trim={modalTrim.item}
          toast={toast}
          onClose={() => setModalTrim({ open: false })}
          onSaved={() => { setModalTrim({ open: false }); load() }}
        />
      )}
      {modalCurso.open && (
        <ModalCurso
          initial={modalCurso.item}
          toast={toast}
          onClose={() => setModalCurso({ open: false })}
          onSaved={() => { setModalCurso({ open: false }); load() }}
        />
      )}
    </div>
  )
}