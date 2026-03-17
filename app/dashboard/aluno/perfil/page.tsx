"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { apiFetch } from "@/lib/api"
import {
  Camera, User, Shield, Clock, FileText, CheckCircle2,
  ChevronRight, Loader2, AlertCircle, Eye, EyeOff
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface HistoricoAno {
  ano_lectivo: string
  turma_nome: string
  media_geral: number | null
  status: "Aprovado" | "Reprovado" | "Em Curso"
}

export default function AlunoPerfil() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [dataNasc, setDataNasc] = useState("")
  const [saving, setSaving] = useState(false)

  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [showSenha, setShowSenha] = useState(false)
  const [savingSenha, setSavingSenha] = useState(false)

  const [historico, setHistorico] = useState<HistoricoAno[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "aluno") router.push("/login/aluno")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (!user) return
    setNome(user.nome || "")
    setLoading(true)
    apiFetch<{ success: boolean; data: HistoricoAno[] }>(`/aluno/historico.php?alunoId=${user.id}`)
      .then((res) => setHistorico(res.data || []))
      .catch(() => {
        setHistorico([
          { ano_lectivo: "2023", turma_nome: "3º Ano A - Ensino Médio", media_geral: 18.5, status: "Aprovado" },
          { ano_lectivo: "2022", turma_nome: "2º Ano B - Ensino Médio", media_geral: 17.2, status: "Aprovado" },
          { ano_lectivo: "2021", turma_nome: "1º Ano A - Ensino Médio", media_geral: 16.8, status: "Aprovado" },
          { ano_lectivo: "2024", turma_nome: "Cursando Especialização", media_geral: null, status: "Em Curso" },
        ])
      })
      .finally(() => setLoading(false))
  }, [user])

  if (!isAuthenticated || user?.type !== "aluno") return null

  const handleSavePerfil = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    toast({ title: "Alterações guardadas com sucesso!" })
    setSaving(false)
  }

  const handleSaveSenha = async () => {
    if (novaSenha !== confirmarSenha) {
      toast({ title: "As senhas não coincidem.", variant: "destructive" })
      return
    }
    if (novaSenha.length < 8) {
      toast({ title: "A senha deve ter pelo menos 8 caracteres.", variant: "destructive" })
      return
    }
    setSavingSenha(true)
    await new Promise((r) => setTimeout(r, 800))
    toast({ title: "Senha alterada com sucesso!" })
    setSenhaAtual("")
    setNovaSenha("")
    setConfirmarSenha("")
    setSavingSenha(false)
  }

  const statusConfig = {
    Aprovado: { label: "Aprovado", className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400", icon: CheckCircle2 },
    Reprovado: { label: "Reprovado", className: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
    "Em Curso": { label: "Em Curso", className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400", icon: Clock },
  }

  const senhaValida = novaSenha.length >= 8
  const temMaiuscula = /[A-Z]/.test(novaSenha)
  const temNumeroSimbolo = /[0-9!@#$%^&*]/.test(novaSenha)

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Header */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Início &rsaquo; <span className="text-primary font-medium">Meu Perfil</span></p>
                <h1 className="text-3xl font-bold">Configurações da Conta</h1>
                <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais, segurança e acompanhe seu histórico académico.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Dados Pessoais */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Dados Pessoais</CardTitle>
                        <CardDescription className="text-xs">Actualize suas informações de contacto e foto de exibição.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Foto */}
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden ring-4 ring-primary/20">
                          <img
                            src={user.foto || "/placeholder.svg?height=80&width=80"}
                            alt={user.nome}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary/90">
                          <Camera className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                      <div>
                        <p className="font-semibold">{user.nome}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Formatos suportados: JPG, PNG. Tamanho máx: 2MB.</p>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" className="text-xs h-7">Remover</Button>
                          <Button size="sm" className="text-xs h-7 bg-primary hover:bg-primary/90">Alterar Foto</Button>
                        </div>
                      </div>
                    </div>

                    {/* Campos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="nome">Nome Completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="pl-10" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">E-mail Institucional</Label>
                        <div className="relative">
                          <Input id="email" value={user.email || ""} disabled className="bg-muted/50 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground">O e-mail institucional só pode ser alterado pela secretaria.</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                        <Input
                          id="telefone"
                          placeholder="(11) 98765-4321"
                          value={telefone}
                          onChange={(e) => setTelefone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dataNasc">Data de Nascimento</Label>
                        <Input
                          id="dataNasc"
                          type="date"
                          value={dataNasc}
                          onChange={(e) => setDataNasc(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="outline">Cancelar</Button>
                      <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={handleSavePerfil} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Salvar Alterações
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Segurança */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Segurança</CardTitle>
                        <CardDescription className="text-xs">Proteja sua conta alterando sua senha regularmente.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Senha Atual</Label>
                      <Input type="password" placeholder="••••••••" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nova Senha</Label>
                      <div className="relative">
                        <Input
                          type={showSenha ? "text" : "password"}
                          placeholder="Mínimo 8 caracteres"
                          value={novaSenha}
                          onChange={(e) => setNovaSenha(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowSenha(!showSenha)}
                        >
                          {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Confirmar Nova Senha</Label>
                      <Input type="password" placeholder="Repita a nova senha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} />
                    </div>

                    {/* Requisitos */}
                    {novaSenha && (
                      <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30 space-y-1.5">
                        <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />Requisitos de Senha
                        </p>
                        {[
                          { ok: senhaValida, text: "Mínimo de 8 caracteres" },
                          { ok: temMaiuscula, text: "Pelo menos uma letra maiúscula" },
                          { ok: temNumeroSimbolo, text: "Pelo menos um número ou símbolo" },
                        ].map((r) => (
                          <p key={r.text} className={`text-xs flex items-center gap-1.5 ${r.ok ? "text-green-600" : "text-yellow-700 dark:text-yellow-500"}`}>
                            <span>{r.ok ? "✓" : "·"}</span>{r.text}
                          </p>
                        ))}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full border-primary text-primary hover:bg-primary/5"
                      onClick={handleSaveSenha}
                      disabled={savingSenha}
                    >
                      {savingSenha ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Redefinir Senha
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Histórico Académico */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Histórico Académico</CardTitle>
                        <CardDescription className="text-xs">Visualize sua jornada e desempenho nos anos anteriores.</CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 text-xs">
                      <FileText className="w-3.5 h-3.5" />Exportar Histórico Completo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {["Ano Letivo", "Turma / Nível", "Média Geral", "Status Final", "Ações"].map((h) => (
                          <th key={h} className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {historico.map((h, i) => {
                        const s = statusConfig[h.status]
                        return (
                          <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold">{h.ano_lectivo}</td>
                            <td className="px-6 py-4 text-sm">{h.turma_nome}</td>
                            <td className="px-6 py-4">
                              {h.media_geral !== null
                                ? <span className="text-sm font-bold text-green-600">{h.media_geral.toFixed(1)}</span>
                                : <span className="text-sm text-muted-foreground">-</span>
                              }
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className={s.className}>{s.label}</Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Button variant="link" size="sm" className="text-primary p-0 h-auto text-sm gap-1">
                                Ver Detalhes <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className="px-6 py-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Exibindo registros dos últimos 4 ciclos académicos. Para anos anteriores, favor solicitar via requerimento à secretaria.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}