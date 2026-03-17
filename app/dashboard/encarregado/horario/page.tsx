"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Loader2, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAnosLectivos, apiFetch } from "@/lib/api"


interface HorarioItem {
    id: number
    dia_semana: number
    hora_inicio: string
    hora_fim: string
    sala: string | null
    disciplina_nome: string
    disciplina_sigla: string
    professor_nome: string
}

const DIAS = ["", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"]
const DIA_CORES = ["", "bg-blue-50 border-blue-200", "bg-purple-50 border-purple-200", "bg-green-50 border-green-200", "bg-orange-50 border-orange-200", "bg-red-50 border-red-200"]

export default function EncarregadoHorariosPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const { toast } = useToast()

    const [horarios, setHorarios] = useState<HorarioItem[]>([])
    const [loading, setLoading] = useState(true)
    const [anoActivo, setAnoActivo] = useState<{ id: number; nome: string } | null>(null)

    useEffect(() => {
        if (!isAuthenticated || user?.type !== "encarregado") router.push("/login/encarregado")
    }, [isAuthenticated, user, router])

    useEffect(() => {
        if (!user?.alunoId) return

        // Buscar ano activo e turma do aluno para depois buscar horários
        Promise.all([
            getAnosLectivos(),
            apiFetch(`/aluno/horarios.php?alunoId=${user.alunoId}`).then((r: any) => r.json()),
        ])
            .then(([anosRes, horariosRes]) => {
                const activo = (anosRes.data || []).find((a: { id: number; estado: string }) => a.estado === "Activo")
                setAnoActivo(activo || null)
                setHorarios(horariosRes.data || [])
            })
            .catch(() => toast({ title: "Erro ao carregar horários", variant: "destructive" }))
            .finally(() => setLoading(false))
    }, [user?.alunoId])

    if (!isAuthenticated || user?.type !== "encarregado") return null

    // Agrupar por dia
    const porDia: Record<number, HorarioItem[]> = {}
    for (let d = 1; d <= 5; d++) {
        porDia[d] = horarios.filter((h) => h.dia_semana === d).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    }

    return (
        <div className="min-h-screen bg-background">
            <DashboardSidebar />
            <div className="ml-64 transition-all duration-300">
                <DashboardHeader />
                <main className="p-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Clock className="h-6 w-6 text-primary" /> Horário de {user.alunoNome}
                            </h2>
                            <p className="text-muted-foreground">
                                {anoActivo ? `Ano Lectivo ${anoActivo.nome}` : "Horário semanal"}
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : horarios.length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center text-muted-foreground">
                                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>Ainda não há horário definido para este ano lectivo</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5].map((dia) => (
                                    porDia[dia].length > 0 && (
                                        <Card key={dia} className={`border ${DIA_CORES[dia]}`}>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm font-semibold">{DIAS[dia]}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                {porDia[dia].map((h) => (
                                                    <div key={h.id} className="flex gap-3 p-2 bg-white rounded-lg border text-sm shadow-sm">
                                                        <div className="flex-shrink-0 text-center">
                                                            <p className="text-xs font-mono text-muted-foreground">{h.hora_inicio.slice(0, 5)}</p>
                                                            <p className="text-xs text-muted-foreground">—</p>
                                                            <p className="text-xs font-mono text-muted-foreground">{h.hora_fim.slice(0, 5)}</p>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1 flex-wrap">
                                                                <BookOpen className="h-3 w-3 text-primary flex-shrink-0" />
                                                                <span className="font-medium truncate">{h.disciplina_nome}</span>
                                                                <Badge variant="outline" className="text-xs px-1">{h.disciplina_sigla}</Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-0.5">Prof. {h.professor_nome}</p>
                                                            {h.sala && <p className="text-xs text-muted-foreground">{h.sala}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    )
                                ))}
                            </div>
                        )}

                    </motion.div>
                </main>
            </div>
        </div>
    )
}