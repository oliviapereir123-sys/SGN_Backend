"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Users, UserPlus, Upload, Pencil, UserX, Search,
  GraduationCap, BookOpen, Loader2, Download, X, CheckCircle2, AlertCircle,
} from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL


type Prof = { id: number; nome: string; email: string; departamento: string; estado: string }
type Aluno = { id: number; numero: string; nome: string; email: string; estado: string; turma_id: number | null; turma: string; curso: string }
type Turma = { id: number; nome: string; ano: number; curso: string }

export default function UtilizadoresPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [tab, setTab] = useState<"professores" | "alunos">("professores")
  const [professores, setProfessores] = useState<Prof[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  // Modais
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Prof | Aluno | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Upload CSV
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ inseridos: number; erros: string[]; message: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/login/admin")
  }, [isAuthenticated, user, router])

  const carregar = async () => {
    setLoading(true)
    const [pRes, aRes, tRes] = await Promise.all([
      apiFetch("/admin/utilizadores.php?tipo=professores"),
      apiFetch("/admin/utilizadores.php?tipo=alunos"),
      apiFetch("/admin/utilizadores.php?tipo=turmas"),
    ])
    setProfessores(pRes.data || [])
    setAlunos(aRes.data || [])
    setTurmas(tRes.data || [])
    setLoading(false)
  }

  useEffect(() => { if (user?.id) carregar() }, [user?.id])

  const profsFiltrados = professores.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()))
  const alunosFiltrados = alunos.filter(a => a.nome.toLowerCase().includes(search.toLowerCase()) || a.numero.includes(search))

  const abrirCriar = () => { setEditItem(null); setFormData({}); setModalOpen(true) }
  const abrirEditar = (item: Prof | Aluno) => { setEditItem(item); setFormData(item as any); setModalOpen(true) }

  const guardar = async () => {
    setSaving(true)
    try {
      const method = editItem ? "PUT" : "POST"
      const res = await apiFetch(`/admin/utilizadores.php?tipo=${tab}`, {
        method,
        body: JSON.stringify(editItem ? { ...formData, id: editItem.id } : formData),
      })
      if (res.success) {
        toast({ title: editItem ? "Actualizado com sucesso" : `${tab === "professores" ? "Professor" : "Aluno"} criado`, description: res.password_gerada ? `Senha gerada: ${res.password_gerada}` : undefined })
        setModalOpen(false)
        carregar()
      } else {
        toast({ title: "Erro", description: res.error, variant: "destructive" })
      }
    } finally { setSaving(false) }
  }

  const desactivar = async (id: number) => {
    if (!confirm("Desactivar este utilizador?")) return
    await apiFetch(`/admin/utilizadores.php?tipo=${tab}&id=${id}`, { method: "DELETE" })
    toast({ title: "Utilizador desactivado" })
    carregar()
  }

  const importarCSV = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) { toast({ title: "Seleccione um ficheiro CSV", variant: "destructive" }); return }
    setUploading(true)
    setUploadResult(null)
    const form = new FormData()
    form.append("ficheiro", file)
    const token = localStorage.getItem("sgn_ipm_token")
    try {
      const res = await fetch(`${API}/upload/importar.php?tipo=${tab}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()
      setUploadResult(data)
      if (data.success) carregar()
    } finally { setUploading(false) }
  }

  const downloadModelo = () => {
    const csv = tab === "professores"
      ? "nome,email,departamento,password\nMaria Santos,maria@ipm.ao,Informática,Prof@2025\n"
      : "numero,nome,email,turma,password,enc_nome,enc_email,enc_parentesco\n2024010099,João Silva,joao@email.ao,IG-10A,Aluno@2025,Manuel Silva,manuel@email.ao,Pai\n"
    const blob = new Blob([csv], { type: "text/csv" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `modelo_${tab}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Gestão de Utilizadores</h1>
                <p className="text-muted-foreground text-sm mt-1">Criar, editar e importar professores e alunos</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setUploadOpen(true)}><Upload className="w-4 h-4 mr-2" /> Importar CSV</Button>
                <Button onClick={abrirCriar}><UserPlus className="w-4 h-4 mr-2" /> Novo {tab === "professores" ? "Professor" : "Aluno"}</Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {(["professores", "alunos"] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setSearch("") }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
                  {t === "professores" ? <><BookOpen className="w-4 h-4 inline mr-1" />Professores ({professores.length})</> : <><GraduationCap className="w-4 h-4 inline mr-1" />Alunos ({alunos.length})</>}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={`Pesquisar ${tab}...`} className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {tab === "professores" ? (
                        <><th className="text-left p-4 font-medium">Nome</th><th className="text-left p-4 font-medium">Email</th><th className="text-left p-4 font-medium">Departamento</th><th className="text-left p-4 font-medium">Estado</th><th className="p-4" /></>
                      ) : (
                        <><th className="text-left p-4 font-medium">Número</th><th className="text-left p-4 font-medium">Nome</th><th className="text-left p-4 font-medium">Email</th><th className="text-left p-4 font-medium">Turma</th><th className="text-left p-4 font-medium">Estado</th><th className="p-4" /></>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(tab === "professores" ? profsFiltrados : alunosFiltrados).map((item: any) => (
                      <tr key={item.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        {tab === "professores" ? (
                          <><td className="p-4 font-medium">{item.nome}</td><td className="p-4 text-muted-foreground">{item.email}</td><td className="p-4">{item.departamento || "—"}</td></>
                        ) : (
                          <><td className="p-4 font-mono text-xs">{item.numero}</td><td className="p-4 font-medium">{item.nome}</td><td className="p-4 text-muted-foreground text-xs">{item.email}</td><td className="p-4">{item.turma || "—"}</td></>
                        )}
                        <td className="p-4">
                          <Badge variant={item.estado === "Activo" ? "default" : "secondary"} className={item.estado === "Activo" ? "bg-green-100 text-green-700" : ""}>
                            {item.estado}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => abrirEditar(item)}><Pencil className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => desactivar(item.id)}><UserX className="w-4 h-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(tab === "professores" ? profsFiltrados : alunosFiltrados).length === 0 && (
                      <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Nenhum resultado encontrado</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal criar/editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Editar" : "Criar"} {tab === "professores" ? "Professor" : "Aluno"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nome *</Label><Input value={formData.nome || ""} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input type="email" value={formData.email || ""} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} /></div>

            {tab === "professores" && (
              <div><Label>Departamento</Label><Input value={formData.departamento || ""} onChange={e => setFormData(p => ({ ...p, departamento: e.target.value }))} /></div>
            )}

            {tab === "alunos" && (
              <>
                <div><Label>Número *</Label><Input value={formData.numero || ""} onChange={e => setFormData(p => ({ ...p, numero: e.target.value }))} /></div>
                <div>
                  <Label>Turma</Label>
                  <Select value={formData.turma_id || ""} onValueChange={v => setFormData(p => ({ ...p, turma_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar turma" /></SelectTrigger>
                    <SelectContent>
                      {turmas.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.nome} — {t.curso}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {!editItem && (
                  <>
                    <div className="border-t pt-3"><p className="text-xs text-muted-foreground mb-2 font-medium">Encarregado de Educação (opcional)</p></div>
                    <div><Label>Nome do Encarregado</Label><Input value={formData.enc_nome || ""} onChange={e => setFormData(p => ({ ...p, enc_nome: e.target.value }))} /></div>
                    <div><Label>Email do Encarregado</Label><Input type="email" value={formData.enc_email || ""} onChange={e => setFormData(p => ({ ...p, enc_email: e.target.value }))} /></div>
                    <div><Label>Parentesco</Label><Input value={formData.enc_parentesco || ""} placeholder="Pai, Mãe, Tio..." onChange={e => setFormData(p => ({ ...p, enc_parentesco: e.target.value }))} /></div>
                  </>
                )}
              </>
            )}

            {editItem && (
              <div>
                <Label>Estado</Label>
                <Select value={formData.estado || "Activo"} onValueChange={v => setFormData(p => ({ ...p, estado: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {!editItem && (
              <div><Label>Senha (deixar vazio para gerar automaticamente)</Label><Input type="password" value={formData.password || ""} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editItem ? "Guardar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal importar CSV */}
      <Dialog open={uploadOpen} onOpenChange={v => { setUploadOpen(v); if (!v) setUploadResult(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="w-5 h-5" /> Importar {tab === "professores" ? "Professores" : "Alunos"} via CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Colunas esperadas no CSV:</p>
              {tab === "professores" ? (
                <p className="font-mono text-xs">nome, email, departamento, password</p>
              ) : (
                <p className="font-mono text-xs">numero, nome, email, turma, password,<br />enc_nome, enc_email, enc_parentesco</p>
              )}
              <p className="text-xs">Separador: vírgula (,) ou ponto-e-vírgula (;)</p>
            </div>

            <Button variant="outline" size="sm" onClick={downloadModelo} className="w-full">
              <Download className="w-4 h-4 mr-2" /> Descarregar modelo CSV
            </Button>

            <div>
              <Label>Ficheiro CSV</Label>
              <Input ref={fileRef} type="file" accept=".csv,.txt" className="mt-1" />
            </div>

            {uploadResult && (
              <div className={`rounded-lg p-3 text-sm ${uploadResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <div className="flex items-center gap-2 font-medium mb-1">
                  {uploadResult.success ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                  {uploadResult.message}
                </div>
                {uploadResult.erros?.length > 0 && (
                  <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                    {uploadResult.erros.map((e, i) => <li key={i}>⚠️ {e}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Fechar</Button>
            <Button onClick={importarCSV} disabled={uploading}>
              {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />A importar...</> : <><Upload className="w-4 h-4 mr-2" />Importar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}