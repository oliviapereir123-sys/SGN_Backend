"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTrimestres, apiFetch, type Trimestre } from "@/lib/api"
import { ClipboardList, Calendar, Loader2, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


interface Avaliacao {
    id: number
    nome: string
    tipo: string
    peso: number
    data_entrega: string | null
    descricao: string | null
    estado: string
    disciplina_nome: string
    disciplina_sigla: string
    trimestre_nome: string
    professor_nome: string
}

const tipoColors: Record<string, string> = {
    Prova: "bg-blue-100 text-blue-800",
    Trabalho: "bg-purple-100 text-purple-800",
    Seminario: "bg-orange-100 text-orange-800",
    Projecto: "bg-green-100 text-green-800",
    Exame: "bg-red-100 text-red-800",
    Outro: "bg-gray-100 text-gray-800",
}

export default function AlunoAvaliacoesPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const { toast } = useToast()

    const [trimestres, setTrimestres] = useState<Trimestre[]>([])
    const [trimestreId, setTrimestreId] = useState("")
    const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingList, setLoadingList] = useState(false)

    useEffect(() => {
        if (!isAuthenticated || user?.type !== "aluno") router.push("/login/aluno")
    }, [isAuthenticated, user, router])

    useEffect(() => {
        if (!user?.id) return
        getTrimestres()
            .then((res) => {
                const lista = res.data || []
                setTrimestres(lista)
                const activo = lista.find((t: Trimestre) => t.estado === "Activo") || lista[0]
                if (activo) setTrimestreId(String(activo.id))
            })
            .finally(() => setLoading(false))
    }, [user?.id])

    useEffect(() => {
        if (!user?.id || !trimestreId) return
        setLoadingList(true)
        // Buscar avaliações da turma do aluno para o trimestre seleccionado
        apiFetch(`/aluno/avaliacoes.php?alunoId=${user.id}&trimestreId=${trimestreId}`)
            .then((r: any) => r.json())
            .then((res) => setAvaliacoes(res.data || []))
            .catch(() => toast({ title: "Erro ao carregar avaliações", variant: "destructive" }))
            .finally(() => setLoadingList(false))
    }, [user?.id, trimestreId])

    if (!isAuthenticated || user?.type !== "aluno") return null

    // Agrupar por disciplina
    const porDisciplina = avaliacoes.reduce((acc, a) => {
        const key = a.disciplina_nome
        if (!acc[key]) acc[key] = { nome: a.disciplina_nome, sigla: a.disciplina_sigla, itens: [] }
        acc[key].itens.push(a)
        return acc
    }, {} as Record<string, { nome: string; sigla: string; itens: Avaliacao[] }>)

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
                                    <ClipboardList className="h-6 w-6 text-primary" /> Avaliações e Actividades
                                </h2>
                                <p className="text-muted-foreground">Provas, trabalhos e projectos programados</p>
                            </div>
                            <Select value={trimestreId} onValueChange={setTrimestreId}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Seleccionar trimestre" />
                                </SelectTrigger>
                                <SelectContent>
                                    {trimestres.map((t) => (
                                        <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {loading || loadingList ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : Object.keys(porDisciplina).length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center text-muted-foreground">
                                    <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>Sem avaliações programadas para este trimestre</p>
                                </CardContent>
                            </Card>
                        ) : (
                            Object.values(porDisciplina).map((disc) => (
                                <Card key={disc.nome}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <BookOpen className="h-4 w-4 text-primary" />
                                            {disc.nome}
                                            <Badge variant="outline" className="ml-auto text-xs">{disc.sigla}</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {disc.itens.map((a) => (
                                                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-medium text-sm">{a.nome}</span>
                                                            <Badge className={`text-xs ${tipoColors[a.tipo] || tipoColors.Outro}`}>{a.tipo}</Badge>
                                                            {a.peso > 0 && (
                                                                <Badge variant="outline" className="text-xs">{a.peso}%</Badge>
                                                            )}
                                                        </div>
                                                        {a.descricao && (
                                                            <p className="text-xs text-muted-foreground mt-1">{a.descricao}</p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground mt-1">Prof. {a.professor_nome}</p>
                                                    </div>
                                                    {a.data_entrega && (
                                                        <div className="text-right flex-shrink-0">
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(a.data_entrega).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}

                    </motion.div>
                </main>
            </div>
        </div>
    )
}