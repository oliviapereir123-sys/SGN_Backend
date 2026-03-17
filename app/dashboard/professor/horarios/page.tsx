"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getHorarios } from "@/lib/api"
import { Clock, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const DIAS = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta"]

export default function ProfessorHorariosPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [horarios, setHorarios] = useState<Array<{
    id: number
    dia_semana: number
    hora_inicio: string
    hora_fim: string
    disciplina_nome: string
    turma_nome: string
    sala: string | null
  }>>([])

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "professor") router.push("/login/professor")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    getHorarios({ professorId: user.id })
      .then((r) => setHorarios(r.data || []))
      .catch(() => toast({ title: "Erro ao carregar horários", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [user?.id])

  if (!isAuthenticated || user?.type !== "professor") return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
              <Clock className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Meu Horário</h1>
                <p className="text-muted-foreground">Aulas por dia da semana</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Horário semanal</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : horarios.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum horário definido.</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left py-3 px-4 font-semibold">Dia</th>
                          <th className="text-left py-3 px-4 font-semibold">Hora</th>
                          <th className="text-left py-3 px-4 font-semibold">Disciplina</th>
                          <th className="text-left py-3 px-4 font-semibold">Turma</th>
                          <th className="text-left py-3 px-4 font-semibold">Sala</th>
                        </tr>
                      </thead>
                      <tbody>
                        {horarios.map((h) => (
                          <tr key={h.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="py-3 px-4">{DIAS[h.dia_semana] ?? "-"}</td>
                            <td className="py-3 px-4">{h.hora_inicio} - {h.hora_fim}</td>
                            <td className="py-3 px-4 font-medium">{h.disciplina_nome}</td>
                            <td className="py-3 px-4">{h.turma_nome}</td>
                            <td className="py-3 px-4">{h.sala ?? "—"}</td>
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
    </div>
  )
}
