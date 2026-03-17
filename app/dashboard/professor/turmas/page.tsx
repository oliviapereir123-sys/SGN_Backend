"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getTurmasProfessor, type TurmaProfessor } from "@/lib/api"
import { BookOpen, Users, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ProfessorTurmasPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [turmas, setTurmas] = useState<TurmaProfessor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "professor") {
      router.push("/login/professor")
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (!user?.id) return
    getTurmasProfessor(user.id)
      .then((res) => setTurmas(res.data || []))
      .finally(() => setLoading(false))
  }, [user?.id])

  if (!isAuthenticated || user?.type !== "professor") return null

  const totalAlunos = turmas.reduce((s, t) => s + Number(t.total_alunos), 0)

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-7 h-7 text-primary" />
                As Minhas Turmas
              </h2>
              <p className="text-muted-foreground">Turmas e disciplinas atribuídas</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Resumo */}
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-primary">{turmas.length}</p>
                      <p className="text-sm text-muted-foreground">Turmas</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-success">{totalAlunos}</p>
                      <p className="text-sm text-muted-foreground">Alunos</p>
                    </CardContent>
                  </Card>
                </div>

                {turmas.length === 0 ? (
                  <Card className="py-12">
                    <CardContent className="text-center">
                      <Users className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Sem turmas atribuídas</h3>
                      <p className="text-muted-foreground">Contacte o administrador para atribuir turmas à sua conta.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {turmas.map((t, index) => (
                      <motion.div key={`${t.turma_id}-${t.disciplina_id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
                        <Card className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <CardTitle className="text-lg">{t.turma_nome}</CardTitle>
                            <p className="text-sm text-muted-foreground">{t.disciplina_nome}</p>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                              <Users className="w-4 h-4" />
                              <span>{t.total_alunos} alunos</span>
                            </div>
                            <Link href="/dashboard/professor/notas">
                              <Button className="w-full" size="sm">Lançar Notas</Button>
                            </Link>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
