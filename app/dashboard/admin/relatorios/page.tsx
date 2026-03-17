"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getNotasPendentes, getTrimestres, type NotaPendente, type Trimestre } from "@/lib/api"
import { FileText, Loader2, Printer, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

function exportarCSV(notas: NotaPendente[], trimestre: string) {
  const header = "Aluno,Turma,Disciplina,P1,P2,Trab.,Exame,Média,Estado\n"
  const rows = notas.map(n =>
    `"${n.aluno_nome}","${n.turma_nome || ''}","${n.disciplina_nome}",${n.p1 ?? ''},${n.p2 ?? ''},${n.trabalho ?? ''},${n.exame ?? ''},${n.media ?? ''},${n.media !== null && Number(n.media) >= 10 ? 'Aprovado' : 'Reprovado'}`
  ).join("\n")
  const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `pauta_${trimestre.replace(/\s+/g, '_')}.csv`
  a.click()
}

function exportarPDF(notas: NotaPendente[], trimestre: string, mediaGeral: number, aprovadas: number) {
  const rows = notas.map((n, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${n.aluno_nome}</td>
      <td style="padding:8px 8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${n.turma_nome || '—'}</td>
      <td style="padding:8px 8px;border-bottom:1px solid #e5e7eb;">${n.disciplina_nome}</td>
      <td style="padding:8px 6px;text-align:center;border-bottom:1px solid #e5e7eb;">${n.p1 ?? '—'}</td>
      <td style="padding:8px 6px;text-align:center;border-bottom:1px solid #e5e7eb;">${n.p2 ?? '—'}</td>
      <td style="padding:8px 6px;text-align:center;border-bottom:1px solid #e5e7eb;">${n.trabalho ?? '—'}</td>
      <td style="padding:8px 6px;text-align:center;border-bottom:1px solid #e5e7eb;">${n.exame ?? '—'}</td>
      <td style="padding:8px 6px;text-align:center;border-bottom:1px solid #e5e7eb;font-weight:700;color:${n.media !== null && Number(n.media) >= 10 ? '#16a34a' : '#dc2626'};">${n.media !== null ? Number(n.media).toFixed(1) : '—'}</td>
    </tr>`).join("")

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Pauta — ${trimestre}</title>
<style>body{font-family:Arial,sans-serif;margin:24px;font-size:13px;}h1{color:#1e40af;}table{width:100%;border-collapse:collapse;}th{background:#f1f5f9;padding:10px 8px;text-align:left;border-bottom:2px solid #cbd5e1;}@media print{body{margin:12px;}}</style>
</head><body>
<h1>Instituto Politécnico do Mayombe</h1>
<h2 style="color:#374151;font-weight:normal;">Pauta — ${trimestre}</h2>
<p style="color:#6b7280;">${notas.length} notas · Média geral: ${mediaGeral.toFixed(1)} · ${aprovadas} aprovadas (${Math.round(100*aprovadas/notas.length)}%)</p>
<table>
  <thead><tr>
    <th>Aluno</th><th>Turma</th><th>Disciplina</th>
    <th style="text-align:center">P1</th><th style="text-align:center">P2</th>
    <th style="text-align:center">Trab.</th><th style="text-align:center">Exame</th><th style="text-align:center">Média</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<p style="margin-top:32px;color:#9ca3af;font-size:11px;">Gerado pelo SGN — Instituto Politécnico do Mayombe — ${new Date().toLocaleDateString('pt-AO')}</p>
</body></html>`

  const w = window.open("", "_blank")!
  w.document.write(html)
  w.document.close()
  w.print()
}

export default function AdminRelatoriosPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [notas, setNotas] = useState<NotaPendente[]>([])
  const [trimestres, setTrimestres] = useState<Trimestre[]>([])
  const [selectedTrId, setSelectedTrId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "admin") router.push("/")
  }, [isAuthenticated, user, router])

  useEffect(() => {
    getTrimestres().then((res) => {
      const lista = res.data || []
      setTrimestres(lista)
      const primeiro = lista.find((t) => t.estado === "Encerrado") || lista[0]
      if (primeiro) setSelectedTrId(String(primeiro.id))
    })
  }, [])

  useEffect(() => {
    if (!selectedTrId) return
    setLoading(true)
    getNotasPendentes(Number(selectedTrId))
      .then((res) => setNotas((res.data || []).filter((n) => n.estado === "Aprovado")))
      .catch(() => toast({ title: "Erro ao carregar relatório", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [selectedTrId])

  if (!isAuthenticated || user?.type !== "admin") return null

  const selectedTrimestre = trimestres.find((t) => String(t.id) === selectedTrId)
  const mediaGeral = notas.filter(n => n.media !== null).reduce((s, n) => s + Number(n.media), 0) / (notas.filter(n => n.media !== null).length || 1)
  const aprovadas = notas.filter(n => n.media !== null && Number(n.media) >= 10).length

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-7 h-7 text-primary" />Relatórios de Notas
                </h1>
                <p className="text-muted-foreground">Pauta consolidada por período</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={selectedTrId} onValueChange={setSelectedTrId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    {trimestres.filter(t => t.estado !== "Pendente").map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => exportarCSV(notas, selectedTrimestre?.nome || "")} disabled={notas.length === 0}>
                  <Download className="w-4 h-4 mr-2" />CSV
                </Button>
                <Button variant="outline" onClick={() => exportarPDF(notas, selectedTrimestre?.nome || "", mediaGeral, aprovadas)} disabled={notas.length === 0}>
                  <Printer className="w-4 h-4 mr-2" />PDF / Imprimir
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : notas.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-40" />
                  <p>Sem notas aprovadas neste período.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Pauta — {selectedTrimestre?.nome}
                    <span className="ml-4 text-sm font-normal text-muted-foreground">
                      {notas.length} notas · Média: {mediaGeral.toFixed(1)} · {aprovadas} aprovadas ({Math.round(100 * aprovadas / notas.length)}%)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left py-3 px-3 font-semibold">Aluno</th>
                          <th className="text-left py-3 px-3 font-semibold">Turma</th>
                          <th className="text-left py-3 px-3 font-semibold">Disciplina</th>
                          <th className="text-center py-3 px-2 font-semibold">P1</th>
                          <th className="text-center py-3 px-2 font-semibold">P2</th>
                          <th className="text-center py-3 px-2 font-semibold">Trab.</th>
                          <th className="text-center py-3 px-2 font-semibold">Exame</th>
                          <th className="text-center py-3 px-3 font-semibold">Média</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notas.map((n) => (
                          <tr key={n.id} className="border-b hover:bg-muted/20">
                            <td className="py-2 px-3 font-medium">{n.aluno_nome}</td>
                            <td className="py-2 px-3 text-muted-foreground">{n.turma_nome}</td>
                            <td className="py-2 px-3">{n.disciplina_nome}</td>
                            <td className="py-2 px-2 text-center">{n.p1 ?? "—"}</td>
                            <td className="py-2 px-2 text-center">{n.p2 ?? "—"}</td>
                            <td className="py-2 px-2 text-center">{n.trabalho ?? "—"}</td>
                            <td className="py-2 px-2 text-center">{n.exame ?? "—"}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`font-bold ${n.media !== null && Number(n.media) >= 10 ? "text-success" : "text-destructive"}`}>
                                {n.media !== null ? Number(n.media).toFixed(1) : "—"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}