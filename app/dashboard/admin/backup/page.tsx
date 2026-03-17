"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Database, Download, Trash2, RefreshCw, Loader2, AlertTriangle, CheckCircle2, Clock, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"


interface BackupItem {
  nome: string
  tamanho: number
  tamanho_fmt: string
  data_criacao: string
}


export default function AdminBackupPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [backups, setBackups] = useState<BackupItem[]>([])
  const [total, setTotal] = useState(0)
  const [ultimoBackup, setUltimoBackup] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [criando, setCriando] = useState(false)
  const [apagarTarget, setApagarTarget] = useState<string | null>(null)
  const [apagando, setApagando] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/")
  }, [isAuthenticated, user, router])

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<{ success: boolean; data: BackupItem[]; total: number; ultimo_backup: string | null }>(
        '/backup/index.php'
      )
      setBackups(res.data || [])
      setTotal(res.total || 0)
      setUltimoBackup(res.ultimo_backup)
    } catch {
      toast({ title: "Erro ao carregar backups", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [])

  const criarBackup = async () => {
    setCriando(true)
    try {
      const res = await apiFetch<{ success: boolean; ficheiro?: string; tamanho_fmt?: string; error?: string }>(
        '/backup/index.php',
        { method: "POST", body: JSON.stringify({}) }
      )
      if (res.success) {
        toast({ title: `Backup criado: ${res.ficheiro} (${res.tamanho_fmt})` })
        carregar()
      } else {
        toast({ title: res.error || "Erro ao criar backup", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro ao criar backup", variant: "destructive" })
    } finally {
      setCriando(false) }
  }

  const apagar = async () => {
    if (!apagarTarget) return
    setApagando(true)
    try {
      const res = await apiFetch<{ success: boolean }>(
        `/backup/index.php?ficheiro=${encodeURIComponent(apagarTarget)}`,
        { method: "DELETE" }
      )
      if (res.success) {
        toast({ title: "Backup apagado" })
        setApagarTarget(null)
        carregar()
      }
    } finally { setApagando(false) }
  }

  const formatData = (dt: string) =>
    new Date(dt).toLocaleDateString("pt-PT", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })

  const agoraStr = ultimoBackup ? formatData(ultimoBackup) : "Nunca"
  const ultimoHorasAtras = ultimoBackup
    ? Math.round((Date.now() - new Date(ultimoBackup).getTime()) / 3600000)
    : null

  if (!isAuthenticated || user?.type !== "admin") return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="p-6 space-y-6">

          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" /> Backup & Restauração
              </h2>
              <p className="text-muted-foreground">Guardar e gerir cópias de segurança da base de dados</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={carregar} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Actualizar
              </Button>
              <Button onClick={criarBackup} disabled={criando}>
                {criando
                  ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  : <Database className="h-4 w-4 mr-2" />}
                {criando ? "A criar backup..." : "Criar Backup Agora"}
              </Button>
            </div>
          </div>

          {/* Cards de estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${ultimoHorasAtras !== null && ultimoHorasAtras < 25 ? "bg-green-100" : "bg-amber-100"}`}>
                    {ultimoHorasAtras !== null && ultimoHorasAtras < 25
                      ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                      : <Clock className="h-5 w-5 text-amber-600" />}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Último Backup</p>
                    <p className="font-semibold text-sm">{agoraStr}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Database className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Backups Guardados</p>
                    <p className="font-semibold text-sm">{total} ficheiro(s)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Retenção</p>
                    <p className="font-semibold text-sm">14 diários · 8 semanais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instruções cron */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex gap-3">
                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Backup Automático (Cron)</p>
                  <p className="mb-2">Para activar backups automáticos, adicionar ao crontab do servidor:</p>
                  <div className="bg-blue-900/10 rounded p-2 font-mono text-xs space-y-1">
                    <p><span className="opacity-60"># Backup diário às 02:00</span></p>
                    <p>0 2 * * * php /var/www/html/sgn/backend/scripts/backup_cron.php &gt;&gt; /var/log/sgn_backup.log 2&gt;&amp;1</p>
                    <p className="mt-2"><span className="opacity-60"># Backup semanal (domingo às 03:00)</span></p>
                    <p>0 3 * * 0 php /var/www/html/sgn/backend/scripts/backup_cron.php full &gt;&gt; /var/log/sgn_backup.log 2&gt;&amp;1</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de backups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Database className="h-5 w-5" /> Backups Disponíveis
                </span>
                <Badge variant="secondary">{total}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Database className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>Ainda não há backups. Crie o primeiro agora.</p>
                  <Button className="mt-4" onClick={criarBackup} disabled={criando}>
                    {criando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                    Criar Backup
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="text-left py-2 px-3">Ficheiro</th>
                        <th className="text-center py-2 px-3">Tamanho</th>
                        <th className="text-left py-2 px-3">Data de Criação</th>
                        <th className="text-center py-2 px-3">Acções</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map((b, i) => (
                        <tr key={b.nome} className={`border-b hover:bg-muted/20 ${i === 0 ? "bg-green-50/50" : ""}`}>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-mono text-xs">{b.nome}</span>
                              {i === 0 && <Badge className="bg-green-100 text-green-800 text-xs">Mais recente</Badge>}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center text-xs text-muted-foreground">{b.tamanho_fmt}</td>
                          <td className="py-2 px-3 text-xs text-muted-foreground">{formatData(b.data_criacao)}</td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex justify-center gap-1">
                              <Button
                                size="sm" variant="ghost"
                                title="Apagar"
                                onClick={() => setApagarTarget(b.nome)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

        </main>
      </div>

      {/* Dialog confirmar apagar */}
      <Dialog open={!!apagarTarget} onOpenChange={() => setApagarTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Apagar Backup
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Tem a certeza que quer apagar permanentemente <strong className="font-mono text-xs break-all">{apagarTarget}</strong>?
            Esta acção não pode ser revertida.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApagarTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={apagar} disabled={apagando}>
              {apagando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Apagar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
