"use client"

import type React from "react"
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

interface HistoricoAno {
  ano_lectivo: string
  turma_nome: string
  media_geral: number | null
  status: "Aprovado" | "Reprovado" | "Em Curso"
}

export default function AlunoPerfil() {
  const router = useRouter()
  const { user, isAuthenticated, updateUser } = useAuth()
  const { toast } = useToast()

  const [nome, setNome]         = useState("")
  const [telefone, setTelefone] = useState("")
  const [dataNasc, setDataNasc] = useState("")
  const [saving, setSaving]     = useState(false)

  const [senhaAtual, setSenhaAtual]         = useState("")
  const [novaSenha, setNovaSenha]           = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [showSenha, setShowSenha]           = useState(false)
  const [savingSenha, setSavingSenha]       = useState(false)

  const [historico, setHistorico] = useState<HistoricoAno[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "aluno") router.push("/login/aluno")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (!user) return
    setNome(user.nome || "")
    setTelefone((user as any).telefone || "")
    setDataNasc((user as any).dataNascimento || "")
    setLoading(true)
    apiFetch<{ success: boolean; data: HistoricoAno[] }>(`/aluno/historico.php?alunoId=${user.id}`)
      .then((res) => setHistorico(res.data || []))
      .catch(() => setHistorico([]))
      .finally(() => setLoading(false))
  }, [user])

  if (!isAuthenticated || user?.type !== "aluno") return null

  const handleSavePerfil = async () => {
    if (!nome.trim()) { toast({ title: "O nome é obrigatório", variant: "destructive" }); return }
    setSaving(true)
    try {
      const res = await apiFetch<{ success: boolean; message: string; data: any }>(
        "/aluno/perfil.php",
        { method: "PUT", body: JSON.stringify({ operacao: "perfil", nome: nome.trim(), telefone: telefone.trim() || null, data_nascimento: dataNasc || null }) }
      )
      if (res.success) {
        updateUser({ nome: res.data.nome, telefone: res.data.telefone, dataNascimento: res.data.data_nascimento } as any)
        toast({ title: "Perfil actualizado com sucesso!" })
      }
    } catch (err: any) {
      toast({ title: err.message || "Erro ao guardar perfil", variant: "destructive" })
    } finally { setSaving(false) }
  }

  const handleSaveSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) { toast({ title: "Preencha todos os campos", variant: "destructive" }); return }
    if (novaSenha !== confirmarSenha) { toast({ title: "As senhas não coincidem", variant: "destructive" }); return }
    if (novaSenha.length < 8) { toast({ title: "Mínimo 8 caracteres", variant: "destructive" }); return }
    setSavingSenha(true)
    try {
      await apiFetch("/aluno/perfil.php", {
        method: "PUT",
        body: JSON.stringify({ operacao: "senha", senha_atual: senhaAtual, nova_senha: novaSenha, confirmar_senha: confirmarSenha })
      })
      toast({ title: "Senha alterada com sucesso!" })
      setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("")
    } catch (err: any) {
      toast({ title: err.message || "Erro ao alterar senha", variant: "destructive" })
    } finally { setSavingSenha(false) }
  }

  const statusConfig = {
    Aprovado:  { className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400" },
    Reprovado: { className: "bg-red-100 text-red-700 border-red-200" },
    "Em Curso":{ className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400" },
  }

  const senhaValida      = novaSenha.length >= 8
  const temMaiuscula     = /[A-Z]/.test(novaSenha)
  const temNumeroSimbolo = /[0-9!@#$%^&*]/.test(novaSenha)

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

              <div>
                <p className="text-sm text-muted-foreground mb-1">Início &rsaquo; <span className="text-primary font-medium">Meu Perfil</span></p>
                <h1 className="text-3xl font-bold">Configurações da Conta</h1>
                <p className="text-muted-foreground mt-1">Gerencie as suas informações pessoais e segurança.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Dados Pessoais */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
                      <div>
                        <CardTitle className="text-base">Dados Pessoais</CardTitle>
                        <CardDescription className="text-xs">Actualize as suas informações de contacto.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden ring-4 ring-primary/20">
                          <img src={user.foto || "/placeholder.svg?height=80&width=80"} alt={user.nome} className="w-full h-full object-cover" />
                        </div>
                        <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary/90">
                          <Camera className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                      <div>
                        <p className="font-semibold">{user.nome}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Nº {user.numeroAluno} · {user.curso || "—"} · {user.turma || "—"}</p>
                      </div>
                    </div>

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
                        <Input id="email" value={user.email || ""} disabled className="bg-muted/50 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Só pode ser alterado pela secretaria.</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                        <Input id="telefone" placeholder="+244 9XX XXX XXX" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dataNasc">Data de Nascimento</Label>
                        <Input id="dataNasc" type="date" value={dataNasc} onChange={(e) => setDataNasc(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="outline" onClick={() => { setNome(user.nome || ""); setTelefone((user as any).telefone || ""); setDataNasc((user as any).dataNascimento || "") }}>Cancelar</Button>
                      <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={handleSavePerfil} disabled={saving}>
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Salvar Alterações
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Segurança */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Shield className="w-4 h-4 text-primary" /></div>
                      <div>
                        <CardTitle className="text-base">Segurança</CardTitle>
                        <CardDescription className="text-xs">Altere a sua senha regularmente.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Senha Actual</Label>
                      <Input type="password" placeholder="••••••••" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} autoComplete="current-password" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nova Senha</Label>
                      <div className="relative">
                        <Input type={showSenha ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="pr-10" autoComplete="new-password" />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowSenha(!showSenha)}>
                          {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Confirmar Nova Senha</Label>
                      <Input type="password" placeholder="Repita a nova senha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} autoComplete="new-password" />
                    </div>

                    {novaSenha && (
                      <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30 space-y-1.5">
                        <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Requisitos</p>
                        {[
                          { ok: senhaValida,      text: "Mínimo 8 caracteres" },
                          { ok: temMaiuscula,     text: "Pelo menos uma letra maiúscula" },
                          { ok: temNumeroSimbolo, text: "Número ou símbolo (!@#$%)" },
                        ].map((r) => (
                          <p key={r.text} className={`text-xs flex items-center gap-1.5 ${r.ok ? "text-green-600" : "text-yellow-700 dark:text-yellow-500"}`}>
                            <span>{r.ok ? "✓" : "·"}</span>{r.text}
                          </p>
                        ))}
                      </div>
                    )}

                    {confirmarSenha && (
                      <p className={`text-xs flex items-center gap-1 ${novaSenha === confirmarSenha ? "text-green-600" : "text-red-500"}`}>
                        {novaSenha === confirmarSenha ? "✓ As senhas coincidem" : "✗ As senhas não coincidem"}
                      </p>
                    )}

                    <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5" onClick={handleSaveSenha} disabled={savingSenha}>
                      {savingSenha && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Redefinir Senha
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Histórico */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Clock className="w-4 h-4 text-primary" /></div>
                      <div>
                        <CardTitle className="text-base">Histórico Académico</CardTitle>
                        <CardDescription className="text-xs">Desempenho nos anos anteriores.</CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 text-xs"><FileText className="w-3.5 h-3.5" />Exportar</Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {historico.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum histórico disponível.</p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          {["Ano Lectivo", "Turma / Nível", "Média Geral", "Status", "Acções"].map((h) => (
                            <th key={h} className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {historico.map((h, i) => (
                          <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold">{h.ano_lectivo}</td>
                            <td className="px-6 py-4 text-sm">{h.turma_nome}</td>
                            <td className="px-6 py-4">
                              {h.media_geral !== null
                                ? <span className="text-sm font-bold text-green-600">{Number(h.media_geral).toFixed(1)}</span>
                                : <span className="text-sm text-muted-foreground">—</span>
                              }
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className={statusConfig[h.status].className}>{h.status}</Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Button variant="link" size="sm" className="text-primary p-0 h-auto text-sm gap-1">
                                Ver Detalhes <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <div className="px-6 py-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">Para anos anteriores, solicitar via requerimento à secretaria.</p>
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
