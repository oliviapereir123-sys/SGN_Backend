"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShieldCheck, Lock, Unlock, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API = process.env.NEXT_PUBLIC_API_URL


type Registo = {
  id: number
  nota_id: number
  aluno_nome: string
  disciplina: string
  trimestre: string
  campo: string
  valor_antes: string | null
  valor_depois: string | null
  alterado_por: string
  tipo_user: string
  criado_em: string
}

type Periodo = {
  id: number
  nome: string
  estado: string
  bloqueado: number
  ano_lectivo: string
}

export default function AuditoriaPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [tab, setTab] = useState<"auditoria" | "periodos">("periodos")
  const [registos, setRegistos] = useState<Registo[]>([])
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/login/admin")
  }, [isAuthenticated, user, router])

  const carregarAuditoria = async (p = 1) => {
    setLoading(true)
    const res = await apiFetch(`/admin/auditoria.php?pagina=${p}`)
    setRegistos(res.data || [])
    setTotalPaginas(res.paginas || 1)
    setPagina(p)
    setLoading(false)
  }

  const carregarPeriodos = async () => {
    setLoading(true)
    const res = await apiFetch("/admin/periodos.php")
    setPeriodos(res.data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!user?.id) return
    if (tab === "auditoria") carregarAuditoria()
    else carregarPeriodos()
  }, [user?.id, tab])

  const toggleBloqueio = async (periodo: Periodo) => {
    const novo = periodo.bloqueado ? 0 : 1
    await apiFetch("/admin/periodos.php", {
      method: "PUT",
      body: JSON.stringify({ id: periodo.id, bloqueado: novo }),
    })
    toast({ title: novo ? `🔒 ${periodo.nome} bloqueado` : `🔓 ${periodo.nome} desbloqueado` })
    carregarPeriodos()
  }

  const mudarEstado = async (id: number, estado: string) => {
    await apiFetch("/admin/periodos.php", {
      method: "PUT",
      body: JSON.stringify({ id, estado }),
    })
    toast({ title: "Estado actualizado" })
    carregarPeriodos()
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" /> Auditoria & Períodos
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Histórico de alterações e gestão de períodos lectivos</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {(["periodos", "auditoria"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
                  {t === "periodos" ? "🗓️ Períodos Lectivos" : "📋 Registo de Alterações"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : tab === "periodos" ? (
              <div className="grid gap-4">
                {periodos.map(p => (
                  <Card key={p.id}>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">{p.nome}</p>
                        <p className="text-sm text-muted-foreground">{p.ano_lectivo}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge className={
                            p.estado === "Activo" ? "bg-green-100 text-green-700" :
                              p.estado === "Encerrado" ? "bg-gray-100 text-gray-600" : "bg-yellow-100 text-yellow-700"
                          }>{p.estado}</Badge>
                          {p.bloqueado ? (
                            <Badge className="bg-red-100 text-red-700">🔒 Bloqueado</Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-700">🔓 Aberto</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {/* Mudar estado */}
                        {p.estado !== "Encerrado" && (
                          <Button size="sm" variant="outline" onClick={() => mudarEstado(p.id, p.estado === "Pendente" ? "Activo" : "Encerrado")}>
                            {p.estado === "Pendente" ? "Activar" : "Encerrar"}
                          </Button>
                        )}
                        {/* Bloquear/desbloquear lançamento de notas */}
                        <Button size="sm" variant={p.bloqueado ? "default" : "outline"}
                          className={p.bloqueado ? "bg-orange-500 hover:bg-orange-600" : ""}
                          onClick={() => toggleBloqueio(p)}>
                          {p.bloqueado ? <><Unlock className="w-4 h-4 mr-1" />Desbloquear</> : <><Lock className="w-4 h-4 mr-1" />Bloquear</>}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Histórico de Alterações de Notas</span>
                    <Button size="sm" variant="ghost" onClick={() => carregarAuditoria(pagina)}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {registos.length === 0 ? (
                    <p className="p-8 text-center text-muted-foreground">Nenhuma alteração registada ainda.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-4">Data</th>
                          <th className="text-left p-4">Aluno</th>
                          <th className="text-left p-4">Disciplina</th>
                          <th className="text-left p-4">Campo</th>
                          <th className="text-center p-4">Antes</th>
                          <th className="text-center p-4">Depois</th>
                          <th className="text-left p-4">Utilizador</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registos.map(r => (
                          <tr key={r.id} className="border-t hover:bg-muted/20">
                            <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.criado_em).toLocaleString("pt-AO")}</td>
                            <td className="p-4 font-medium">{r.aluno_nome}</td>
                            <td className="p-4 text-muted-foreground">{r.disciplina}</td>
                            <td className="p-4"><Badge variant="outline" className="text-xs">{r.campo}</Badge></td>
                            <td className="p-4 text-center text-muted-foreground">{r.valor_antes ?? "—"}</td>
                            <td className="p-4 text-center font-medium text-primary">{r.valor_depois ?? "—"}</td>
                            <td className="p-4 text-xs">
                              <span className="font-medium">{r.alterado_por}</span>
                              <span className="text-muted-foreground ml-1">({r.tipo_user})</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {/* Paginação */}
                  {totalPaginas > 1 && (
                    <div className="flex items-center justify-center gap-4 p-4 border-t">
                      <Button size="sm" variant="ghost" disabled={pagina === 1} onClick={() => carregarAuditoria(pagina - 1)}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">Página {pagina} de {totalPaginas}</span>
                      <Button size="sm" variant="ghost" disabled={pagina === totalPaginas} onClick={() => carregarAuditoria(pagina + 1)}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}