"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { apiFetch } from "@/lib/api"
import {
    Settings, Save, Loader2, School, Calculator,
    Bell, BookOpen, CheckCircle2, RotateCcw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Config {
    chave: string
    valor: string | number | boolean
    descricao: string
    tipo: string
    grupo: string
}

const grupoMeta: Record<string, { icon: typeof Settings; label: string; desc: string; cor: string }> = {
    escola: { icon: School, label: "Escola", desc: "Dados institucionais", cor: "bg-blue-50 text-blue-600" },
    notas: { icon: Calculator, label: "Cálculo de Notas", desc: "Fórmulas e limites", cor: "bg-purple-50 text-purple-600" },
    frequencias: { icon: BookOpen, label: "Frequências", desc: "Regras de presença", cor: "bg-amber-50 text-amber-600" },
    notificacoes: { icon: Bell, label: "Notificações", desc: "Alertas automáticos", cor: "bg-green-50 text-green-600" },
    boletins: { icon: BookOpen, label: "Boletins", desc: "Configuração de documentos", cor: "bg-rose-50 text-rose-600" },
    geral: { icon: Settings, label: "Geral", desc: "Configurações do sistema", cor: "bg-slate-50 text-slate-600" },
}

export default function AdminConfiguracoesPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const { toast } = useToast()

    const [configs, setConfigs] = useState<Config[]>([])
    const [editando, setEditando] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        if (!isAuthenticated || user?.type !== "admin") router.push("/login/admin")
    }, [isAuthenticated, user, router])

    useEffect(() => {
        apiFetch<{ success: boolean; data: Config[] }>("/configuracoes/index.php")
            .then((res) => setConfigs(res.data || []))
            .catch(() => toast({ title: "Erro ao carregar configurações", variant: "destructive" }))
            .finally(() => setLoading(false))
    }, [])

    const guardar = async () => {
        if (Object.keys(editando).length === 0) return
        setSaving(true)
        try {
            const items = Object.entries(editando).map(([chave, valor]) => ({ chave, valor }))
            const res = await apiFetch<{ success: boolean }>("/configuracoes/index.php", {
                method: "PUT",
                body: JSON.stringify(items),
            })
            if (res.success) {
                setSaved(true)
                setTimeout(() => setSaved(false), 2500)
                toast({ title: "Configurações guardadas com sucesso" })
                setConfigs((prev) => prev.map((c) => {
                    const novo = editando[c.chave]
                    return novo !== undefined ? { ...c, valor: novo } : c
                }))
                setEditando({})
            }
        } catch {
            toast({ title: "Erro ao guardar", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const descartar = () => setEditando({})
    const valor = (c: Config) => editando[c.chave] !== undefined ? editando[c.chave] : String(c.valor)
    const alterar = (chave: string, val: string) => setEditando((prev) => ({ ...prev, [chave]: val }))
    const temAlteracoes = Object.keys(editando).length > 0

    const grupos: Record<string, Config[]> = {}
    configs.forEach((c) => {
        if (!grupos[c.grupo]) grupos[c.grupo] = []
        grupos[c.grupo].push(c)
    })

    return (
        <div className="min-h-screen bg-background">
            <DashboardSidebar />
            <div className="ml-64 transition-all duration-300">
                <DashboardHeader />
                <main className="p-6 space-y-5">

                    {/* Cabeçalho */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                <Settings className="h-5 w-5 text-slate-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Configurações</h1>
                                <p className="text-sm text-muted-foreground">Personalize o sistema conforme as necessidades da escola</p>
                            </div>
                        </div>

                        {/* Barra de acções — aparece só com alterações */}
                        {temAlteracoes && (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 shadow-sm">
                                <span className="text-sm font-medium text-amber-700">
                                    {Object.keys(editando).length} alteração{Object.keys(editando).length !== 1 ? "ões" : ""} por guardar
                                </span>
                                <Button variant="ghost" size="sm" onClick={descartar} className="h-7 text-amber-700 hover:text-amber-800 hover:bg-amber-100 gap-1">
                                    <RotateCcw className="h-3.5 w-3.5" /> Descartar
                                </Button>
                                <Button size="sm" onClick={guardar} disabled={saving} className="h-7 gap-1">
                                    {saving
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : saved
                                            ? <CheckCircle2 className="h-3.5 w-3.5" />
                                            : <Save className="h-3.5 w-3.5" />}
                                    {saving ? "A guardar..." : saved ? "Guardado!" : "Guardar"}
                                </Button>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">A carregar configurações...</p>
                            </div>
                        </div>
                    ) : configs.length === 0 ? (
                        <Card className="border shadow-sm">
                            <CardContent className="py-16 text-center">
                                <Settings className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="font-medium text-muted-foreground">Nenhuma configuração encontrada</p>
                                <p className="text-sm text-muted-foreground/60 mt-1">Execute o script de migração da base de dados</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(grupos).map(([grupo, items]) => {
                                const meta = grupoMeta[grupo] || grupoMeta.geral
                                const grupoAlteracoes = items.filter((c) => editando[c.chave] !== undefined).length

                                return (
                                    <Card key={grupo} className="border shadow-sm overflow-hidden">
                                        <CardHeader className="pb-0 px-5 pt-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.cor}`}>
                                                        <meta.icon className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-sm font-semibold">{meta.label}</CardTitle>
                                                        <p className="text-xs text-muted-foreground">{meta.desc}</p>
                                                    </div>
                                                </div>
                                                {grupoAlteracoes > 0 && (
                                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 font-normal text-xs">
                                                        {grupoAlteracoes} alterado{grupoAlteracoes !== 1 ? "s" : ""}
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="px-5 py-3">
                                            <div className="divide-y divide-border">
                                                {items.map((c) => {
                                                    const alterado = editando[c.chave] !== undefined
                                                    return (
                                                        <div key={c.chave} className={`py-3.5 grid grid-cols-1 md:grid-cols-5 gap-3 items-center transition-colors ${alterado ? "bg-amber-50/40 -mx-5 px-5 rounded" : ""}`}>
                                                            <div className="md:col-span-3">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-medium">{c.descricao || c.chave}</p>
                                                                    {alterado && (
                                                                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50 py-0 px-1.5 font-normal">
                                                                            editado
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground/60 font-mono mt-0.5">{c.chave}</p>
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                {c.tipo === "booleano" ? (
                                                                    <div className="flex items-center gap-3">
                                                                        <button
                                                                            onClick={() => alterar(c.chave, valor(c) === "1" ? "0" : "1")}
                                                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${valor(c) === "1" ? "bg-primary" : "bg-muted-foreground/30"}`}
                                                                        >
                                                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${valor(c) === "1" ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                                                                        </button>
                                                                        <span className={`text-sm font-medium ${valor(c) === "1" ? "text-foreground" : "text-muted-foreground"}`}>
                                                                            {valor(c) === "1" ? "Activado" : "Desactivado"}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <Input
                                                                        value={valor(c)}
                                                                        onChange={(e) => alterar(c.chave, e.target.value)}
                                                                        type={c.tipo === "numero" ? "number" : "text"}
                                                                        className={`h-8 text-sm ${alterado ? "border-amber-400 focus:ring-amber-200" : ""}`}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}

                            {/* Referência fórmulas MED */}
                            <Card className="border border-blue-100 bg-blue-50/50 shadow-sm">
                                <CardContent className="pt-4 pb-4 px-5">
                                    <div className="flex gap-3">
                                        <Calculator className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-semibold text-blue-800 mb-2">Fórmulas MED Angola</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 text-blue-700 font-mono text-xs">
                                                <p>MAC = (P1 + P2 + Trabalho) ÷ 3</p>
                                                <p>MT  = (MAC + Prova Trim.) ÷ 2</p>
                                                <p>MA  = (MT1 + MT2 + MT3) ÷ 3</p>
                                                <p>MF  = (MA + Recuperação) ÷ 2</p>
                                            </div>
                                            <p className="text-blue-500 text-xs mt-2">Aprovação: nota ≥ 10 valores (escala 0 – 20)</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                </main>
            </div>
        </div>
    )
}