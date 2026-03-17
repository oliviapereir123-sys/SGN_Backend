"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAnosLectivos, apiFetch } from "@/lib/api"
import { Award, CheckCircle2, AlertTriangle, Clock, Printer, TrendingUp, Loader2, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


interface DisciplinaAnual {
    disciplina_id: number
    disciplina_nome: string
    disciplina_sigla: string
    trimestres: { trimestre_nome: string; media_final_trimestral: number | null; nota_recuperacao: number | null }[]
    media_anual: number | null
    situacao: "Aprovado" | "Reprovado" | "Pendente"
}

interface BoletimAnual {
    aluno: { nome: string; numero: string; turma_nome: string; turma_ano: number; curso_nome: string; ano_lectivo: string }
    disciplinas: DisciplinaAnual[]
    resumo: { total_disciplinas: number; aprovadas: number; reprovadas: number; pendentes: number; media_geral_anual: number | null; situacao_final: string }
}

function notaColor(v: number | null) {
    if (v === null) return "text-muted-foreground"
    if (v >= 14) return "text-green-600 font-bold"
    if (v >= 10) return "text-blue-600 font-semibold"
    return "text-red-600 font-bold"
}

export default function EncarregadoBoletimAnualPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const { toast } = useToast()

    const [anos, setAnos] = useState<{ id: number; nome: string }[]>([])
    const [anoId, setAnoId] = useState("")
    const [dados, setDados] = useState<BoletimAnual | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingBoletim, setLoadingBoletim] = useState(false)

    useEffect(() => {
        if (!isAuthenticated || user?.type !== "encarregado") router.push("/login/encarregado")
    }, [isAuthenticated, user, router])

    useEffect(() => {
        if (!user?.alunoId) return
        getAnosLectivos().then((res) => {
            const lista = res.data || []
            setAnos(lista)
            const activo = lista.find((a: { id: number; estado: string }) => a.estado === "Activo")
            if (activo) setAnoId(String(activo.id))
        }).finally(() => setLoading(false))
    }, [user?.alunoId])

    useEffect(() => {
        if (!user?.alunoId || !anoId) return
        setLoadingBoletim(true)
        apiFetch(`/aluno/boletim_anual.php?alunoId=${user.alunoId}&anoLectivoId=${anoId}`)
            .then((r: any) => r.json())
            .then((res) => { if (res.success) setDados(res) })
            .catch(() => toast({ title: "Erro ao carregar boletim", variant: "destructive" }))
            .finally(() => setLoadingBoletim(false))
    }, [user?.alunoId, anoId])

    if (!isAuthenticated || user?.type !== "encarregado") return null

    return (
        <div className="min-h-screen bg-background">
            <DashboardSidebar />
            <div className="ml-64 transition-all duration-300">
                <DashboardHeader />
                <main className="p-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Award className="h-6 w-6 text-primary" /> Boletim Anual de {user.alunoNome}
                                </h2>
                                <p className="text-muted-foreground">Resultado consolidado do ano lectivo</p>
                            </div>
                            <div className="flex gap-3">
                                <Select value={anoId} onValueChange={setAnoId}>
                                    <SelectTrigger className="w-40"><SelectValue placeholder="Ano lectivo" /></SelectTrigger>
                                    <SelectContent>
                                        {anos.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="sm" onClick={() => window.print()}>
                                    <Printer className="h-4 w-4 mr-2" /> Imprimir
                                </Button>
                            </div>
                        </div>

                        {loadingBoletim ? (
                            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : dados ? (
                            <div className="space-y-6">
                                {/* Info */}
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div><p className="text-muted-foreground">Aluno</p><p className="font-semibold">{dados.aluno.nome}</p></div>
                                            <div><p className="text-muted-foreground">Número</p><p className="font-semibold">{dados.aluno.numero}</p></div>
                                            <div><p className="text-muted-foreground">Turma</p><p className="font-semibold">{dados.aluno.turma_nome}</p></div>
                                            <div><p className="text-muted-foreground">Curso</p><p className="font-semibold">{dados.aluno.curso_nome}</p></div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Resumo */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: "Média Geral", value: dados.resumo.media_geral_anual?.toFixed(1) ?? "—", icon: TrendingUp, color: "text-primary" },
                                        { label: "Aprovadas", value: String(dados.resumo.aprovadas), icon: CheckCircle2, color: "text-green-600" },
                                        { label: "Reprovadas", value: String(dados.resumo.reprovadas), icon: AlertTriangle, color: "text-red-600" },
                                        { label: "Pendentes", value: String(dados.resumo.pendentes), icon: Clock, color: "text-yellow-600" },
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

                                {/* Banner situação final */}
                                {dados.resumo.situacao_final !== "Pendente" && (
                                    <Card className={dados.resumo.situacao_final === "Aprovado" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                                        <CardContent className="pt-4 pb-4 flex items-center gap-3">
                                            {dados.resumo.situacao_final === "Aprovado"
                                                ? <CheckCircle2 className="h-8 w-8 text-green-600" />
                                                : <AlertTriangle className="h-8 w-8 text-red-600" />}
                                            <div>
                                                <p className={`text-lg font-bold ${dados.resumo.situacao_final === "Aprovado" ? "text-green-700" : "text-red-700"}`}>
                                                    {dados.aluno.nome} — {dados.resumo.situacao_final === "Aprovado" ? "Aprovado(a)" : "Reprovado(a)"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {dados.resumo.situacao_final === "Aprovado"
                                                        ? `Média geral de ${dados.resumo.media_geral_anual?.toFixed(1)} valores`
                                                        : `${dados.resumo.reprovadas} disciplina(s) com resultado negativo`}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Tabela */}
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5" /> Resultados Detalhados</CardTitle></CardHeader>
                                    <CardContent>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-xs text-muted-foreground">
                                                    <th className="text-left py-2 px-3">Disciplina</th>
                                                    <th className="text-center py-2 px-2">1º Trim.</th>
                                                    <th className="text-center py-2 px-2">2º Trim.</th>
                                                    <th className="text-center py-2 px-2">3º Trim.</th>
                                                    <th className="text-center py-2 px-3 font-bold">Média Anual</th>
                                                    <th className="text-center py-2 px-3">Situação</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dados.disciplinas.map((d) => {
                                                    const t1 = d.trimestres.find(t => t.trimestre_nome.includes("1º"))
                                                    const t2 = d.trimestres.find(t => t.trimestre_nome.includes("2º"))
                                                    const t3 = d.trimestres.find(t => t.trimestre_nome.includes("3º"))
                                                    return (
                                                        <tr key={d.disciplina_id} className="border-b hover:bg-muted/20">
                                                            <td className="py-2 px-3 font-medium">{d.disciplina_nome}</td>
                                                            {[t1, t2, t3].map((t, i) => (
                                                                <td key={i} className={`py-2 px-2 text-center ${notaColor(t?.media_final_trimestral ?? null)}`}>
                                                                    {t?.media_final_trimestral?.toFixed(1) ?? "—"}
                                                                    {t?.nota_recuperacao && <span className="text-xs text-amber-500 ml-1">*</span>}
                                                                </td>
                                                            ))}
                                                            <td className={`py-2 px-3 text-center text-base ${notaColor(d.media_anual)}`}>{d.media_anual?.toFixed(1) ?? "—"}</td>
                                                            <td className="py-2 px-3 text-center">
                                                                {d.situacao === "Aprovado"
                                                                    ? <Badge className="bg-green-100 text-green-800 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovado</Badge>
                                                                    : d.situacao === "Reprovado"
                                                                        ? <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Reprovado</Badge>
                                                                        : <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                        <p className="text-xs text-muted-foreground mt-2">* Nota com exame de recuperação incluído</p>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-16 text-center text-muted-foreground">
                                    <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>Seleccione o ano lectivo para ver o boletim anual</p>
                                </CardContent>
                            </Card>
                        )}

                    </motion.div>
                </main>
            </div>
        </div>
    )
}