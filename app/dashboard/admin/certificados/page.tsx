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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAdminAlunos, apiFetch } from "@/lib/api"
import { FileText, Loader2, Search, Printer, CheckCircle2, AlertTriangle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


interface HistoricoAno {
    ano_lectivo: string
    disciplinas: {
        disciplina: string; sigla: string; creditos: number
        trimestres: { trimestre: string; media: number | null }[]
        media_anual: number | null; situacao: string
    }[]
    media_anual: number | null; aprovado: boolean
}

interface DocData {
    aluno: { nome: string; numero: string; turma_nome: string; curso_nome: string; turma_ano: number }
    historico: HistoricoAno[]
    escola: Record<string, string>
    gerado_em: string
}


function notaColor(v: number | null) {
    if (v === null) return "#6b7280"
    if (v >= 10) return "#16a34a"
    return "#dc2626"
}

function gerarHTMLDoc(dados: DocData, tipo: string): string {
    const titulo = tipo === "certificado" ? "Certificado de Conclusão" : tipo === "declaracao" ? "Declaração de Frequência" : "Histórico Académico"
    const rows = dados.historico.flatMap((ano) =>
        ano.disciplinas.map((d) => {
            const t1 = d.trimestres.find(t => t.trimestre.includes("1º"))?.media
            const t2 = d.trimestres.find(t => t.trimestre.includes("2º"))?.media
            const t3 = d.trimestres.find(t => t.trimestre.includes("3º"))?.media
            return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${ano.ano_lectivo}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${d.disciplina}</td>
        <td style="text-align:center;padding:6px 6px;border-bottom:1px solid #e5e7eb;">${t1?.toFixed(1) ?? "—"}</td>
        <td style="text-align:center;padding:6px 6px;border-bottom:1px solid #e5e7eb;">${t2?.toFixed(1) ?? "—"}</td>
        <td style="text-align:center;padding:6px 6px;border-bottom:1px solid #e5e7eb;">${t3?.toFixed(1) ?? "—"}</td>
        <td style="text-align:center;font-weight:bold;color:${notaColor(d.media_anual)};padding:6px 8px;border-bottom:1px solid #e5e7eb;">${d.media_anual?.toFixed(1) ?? "—"}</td>
        <td style="text-align:center;padding:6px 8px;border-bottom:1px solid #e5e7eb;color:${d.situacao === 'Aprovado' ? '#16a34a' : '#dc2626'};">${d.situacao}</td>
      </tr>`
        })
    ).join("")

    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${titulo} — ${dados.aluno.nome}</title>
<style>
  body{font-family:Arial,sans-serif;margin:32px;font-size:12px;color:#1f2937;}
  h1{color:#1e40af;font-size:20px;margin:0;}
  h2{color:#374151;font-size:14px;font-weight:normal;margin:4px 0 0;}
  table{width:100%;border-collapse:collapse;margin-top:20px;}
  th{background:#f1f5f9;padding:8px 10px;text-align:left;border-bottom:2px solid #cbd5e1;font-size:11px;}
  .info{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:20px 0;padding:16px;background:#f9fafb;border-radius:8px;}
  .info-item label{font-size:10px;color:#6b7280;display:block;}
  .info-item span{font-weight:600;font-size:12px;}
  .footer{margin-top:40px;border-top:1px solid #e5e7eb;padding-top:16px;display:flex;justify-content:space-between;}
  .assinatura{text-align:center;width:200px;}
  .assinatura-linha{border-top:1px solid #374151;margin-bottom:4px;}
  @media print{body{margin:20px;}}
</style></head><body>
<h1>${dados.escola.nome_escola || "Instituto Politécnico do Mayombe"}</h1>
<h2>${titulo}</h2>
<div class="info">
  <div class="info-item"><label>Aluno</label><span>${dados.aluno.nome}</span></div>
  <div class="info-item"><label>Número de Processo</label><span>${dados.aluno.numero}</span></div>
  <div class="info-item"><label>Turma / Ano</label><span>${dados.aluno.turma_nome} — ${dados.aluno.turma_ano}º Ano</span></div>
  <div class="info-item"><label>Curso</label><span>${dados.aluno.curso_nome}</span></div>
  <div class="info-item"><label>Data de Emissão</label><span>${new Date(dados.gerado_em).toLocaleDateString("pt-PT")}</span></div>
</div>
<table>
  <thead><tr>
    <th>Ano Lectivo</th><th>Disciplina</th>
    <th style="text-align:center">1º Trim.</th>
    <th style="text-align:center">2º Trim.</th>
    <th style="text-align:center">3º Trim.</th>
    <th style="text-align:center">Média Anual</th>
    <th style="text-align:center">Situação</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">
  <p style="color:#6b7280;font-size:10px;">Documento gerado pelo SGN — ${dados.escola.morada_escola || "Cabinda, Angola"}</p>
  <div class="assinatura">
    <div class="assinatura-linha"></div>
    <p style="font-size:10px;margin:0;">Secretaria Académica</p>
  </div>
</div>
</body></html>`
}

export default function AdminCertificadosPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const { toast } = useToast()

    const [alunos, setAlunos] = useState<{ id: number; nome: string; numero: string }[]>([])
    const [search, setSearch] = useState("")
    const [alunoId, setAlunoId] = useState("")
    const [tipo, setTipo] = useState("historico")
    const [dados, setDados] = useState<DocData | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingDoc, setLoadingDoc] = useState(false)

    useEffect(() => {
        if (!isAuthenticated || user?.type !== "admin") router.push("/login/admin")
    }, [isAuthenticated, user, router])

    useEffect(() => {
        getAdminAlunos({ search }).then((res) => {
            setAlunos((res.data || []).map((a: { id: number; nome: string; numero: string }) => ({ id: a.id, nome: a.nome, numero: a.numero })))
        }).finally(() => setLoading(false))
    }, [search])

    const gerar = async () => {
        if (!alunoId) { toast({ title: "Seleccione um aluno", variant: "destructive" }); return }
        setLoadingDoc(true)
        try {
            const res = await apiFetch<DocData & { success: boolean }>(`/aluno/documentos.php?alunoId=${alunoId}&tipo=${tipo}`)
            if (res.success) setDados(res)
            else toast({ title: "Erro ao gerar documento", variant: "destructive" })
        } catch { toast({ title: "Erro ao gerar documento", variant: "destructive" }) }
        finally { setLoadingDoc(false) }
    }

    const imprimir = () => {
        if (!dados) return
        const html = gerarHTMLDoc(dados, tipo)
        const w = window.open("", "_blank")!
        w.document.write(html)
        w.document.close()
        setTimeout(() => w.print(), 500)
    }

    return (
        <div className="min-h-screen bg-background">
            <DashboardSidebar />
            <div className="ml-64 transition-all duration-300">
                <DashboardHeader />
                <main className="p-6 space-y-6">

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Emitir Documento</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="relative md:col-span-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input className="pl-9" placeholder="Pesquisar aluno..." value={search} onChange={(e) => setSearch(e.target.value)} />
                                </div>
                                <Select value={alunoId} onValueChange={setAlunoId}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar aluno" /></SelectTrigger>
                                    <SelectContent>
                                        {alunos.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.nome} ({a.numero})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={tipo} onValueChange={setTipo}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="historico">Histórico Académico</SelectItem>
                                        <SelectItem value="certificado">Certificado de Conclusão</SelectItem>
                                        <SelectItem value="declaracao">Declaração de Frequência</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <Button onClick={gerar} disabled={loadingDoc || !alunoId}>
                                    {loadingDoc ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                                    Gerar Documento
                                </Button>
                                {dados && (
                                    <Button variant="outline" onClick={imprimir}>
                                        <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    {dados && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-5 w-5" /> Pré-visualização — {dados.aluno.nome}
                                    <Badge variant="outline" className="ml-auto capitalize">{tipo}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-xs text-muted-foreground">
                                                <th className="text-left py-2 px-3">Ano</th>
                                                <th className="text-left py-2 px-3">Disciplina</th>
                                                <th className="text-center py-2 px-2">1º</th>
                                                <th className="text-center py-2 px-2">2º</th>
                                                <th className="text-center py-2 px-2">3º</th>
                                                <th className="text-center py-2 px-3 font-bold">Anual</th>
                                                <th className="text-center py-2 px-3">Situação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dados.historico.flatMap((ano) =>
                                                ano.disciplinas.map((d, i) => {
                                                    const t1 = d.trimestres.find(t => t.trimestre.includes("1º"))?.media
                                                    const t2 = d.trimestres.find(t => t.trimestre.includes("2º"))?.media
                                                    const t3 = d.trimestres.find(t => t.trimestre.includes("3º"))?.media
                                                    return (
                                                        <tr key={`${ano.ano_lectivo}-${i}`} className="border-b hover:bg-muted/20">
                                                            <td className="py-1.5 px-3 text-xs text-muted-foreground">{i === 0 ? ano.ano_lectivo : ""}</td>
                                                            <td className="py-1.5 px-3">{d.disciplina}</td>
                                                            {[t1, t2, t3].map((t, ti) => (
                                                                <td key={ti} className="py-1.5 px-2 text-center text-xs" style={{ color: notaColor(t ?? null) }}>
                                                                    {t?.toFixed(1) ?? "—"}
                                                                </td>
                                                            ))}
                                                            <td className="py-1.5 px-3 text-center font-bold" style={{ color: notaColor(d.media_anual) }}>
                                                                {d.media_anual?.toFixed(1) ?? "—"}
                                                            </td>
                                                            <td className="py-1.5 px-3 text-center">
                                                                {d.situacao === "Aprovado"
                                                                    ? <Badge className="bg-green-100 text-green-800 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovado</Badge>
                                                                    : d.situacao === "Reprovado"
                                                                        ? <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Reprovado</Badge>
                                                                        : <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>}
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                </main>
            </div>
        </div>
    )
}