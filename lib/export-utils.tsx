// Export utilities for PDF and Excel/CSV generation
// Angola/IPM formula: P1×20% + P2×20% + Trabalho×20% + Exame×40%

/**
 * Calculate final grade according to Angola's grading system (SGN IPM)
 */
export function calcularMediaAngola(p1: number, p2: number, trabalho: number, exame?: number | null): number | null {
  if (exame === null || exame === undefined) {
    // Without exam, partial average (same weights, exame = 0)
    const mediaParcial = (p1 * 0.2 + p2 * 0.2 + trabalho * 0.2) / 0.6
    return Math.round(mediaParcial * 100) / 100
  }
  const media = p1 * 0.2 + p2 * 0.2 + trabalho * 0.2 + exame * 0.4
  return Math.round(media * 100) / 100
}

/**
 * Determine approval status based on Angola's system
 */
export function determinarEstado(media: number | null): string {
  if (media === null) return "Pendente"
  return media >= 10 ? "Aprovado" : "Reprovado"
}

/**
 * Export data to CSV file (Excel compatible)
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string, headers?: Record<string, string>): void {
  if (data.length === 0) return

  const keys = Object.keys(data[0])
  const headerRow = headers ? keys.map((key) => headers[key] || key) : keys
  const csvContent = [
    headerRow.join(";"),
    ...data.map((row) =>
      keys
        .map((key) => {
          const value = row[key]
          // Handle different data types
          if (value === null || value === undefined) return ""
          if (typeof value === "string" && value.includes(";")) return `"${value}"`
          return String(value)
        })
        .join(";"),
    ),
  ].join("\n")

  // Add BOM for Excel UTF-8 compatibility
  const BOM = "\uFEFF"
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Parse Excel/CSV file and return data array
 */
export function parseExcelFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split(/\r?\n/).filter((line) => line.trim())

        if (lines.length < 2) {
          resolve([])
          return
        }

        // Parse header line
        const headers = lines[0].split(/[;,\t]/).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"))

        // Parse data lines
        const data = lines.slice(1).map((line) => {
          const values = line.split(/[;,\t]/).map((v) => v.trim().replace(/^"|"$/g, ""))
          const row: Record<string, string> = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ""
          })
          return row
        })

        resolve(data)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

/**
 * Generate printable HTML content and open print dialog
 */
export function generatePrintContent(title: string, content: string): void {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  const html = `
    <!DOCTYPE html>
    <html lang="pt-AO">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          padding: 20px;
          color: #1a1a1a;
          line-height: 1.5;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #2563EB;
        }
        .header h1 { 
          font-size: 24px; 
          color: #1E40AF;
          margin-bottom: 5px;
        }
        .header p { 
          color: #64748B; 
          font-size: 14px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 25px;
        }
        .info-item {
          padding: 10px;
          background: #F8FAFC;
          border-radius: 8px;
        }
        .info-item label {
          font-size: 11px;
          color: #64748B;
          text-transform: uppercase;
        }
        .info-item span {
          display: block;
          font-weight: 600;
          font-size: 14px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
          font-size: 13px;
        }
        th, td { 
          border: 1px solid #E2E8F0; 
          padding: 10px 8px;
          text-align: left;
        }
        th { 
          background: #F1F5F9;
          font-weight: 600;
          color: #334155;
        }
        tr:nth-child(even) { 
          background: #F8FAFC; 
        }
        .text-center { text-align: center; }
        .text-success { color: #14B8A6; }
        .text-danger { color: #F43F5E; }
        .text-warning { color: #F97316; }
        .font-bold { font-weight: 700; }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }
        .badge-success { background: #D1FAE5; color: #065F46; }
        .badge-danger { background: #FEE2E2; color: #991B1B; }
        .badge-warning { background: #FEF3C7; color: #92400E; }
        .badge-info { background: #DBEAFE; color: #1E40AF; }
        .print-date {
          text-align: right;
          font-size: 11px;
          color: #94A3B8;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #E2E8F0;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      ${content}
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}

/**
 * Generate boletim (report card) PDF content
 */
export function generateBoletimPDF(
  aluno: {
    nome: string
    numero: string
    curso: string
    turma: string
    ano: number
  },
  disciplinas: Array<{
    nome: string
    professor: string
    notas: { p1: number; p2: number; trabalho: number; exame?: number | null }
    media: number | null
    estado: string
  }>,
  trimestre: string,
  anoLectivo: string,
): string {
  const mediaGeral =
    disciplinas.filter((d) => d.media !== null).reduce((acc, d) => acc + (d.media || 0), 0) /
    disciplinas.filter((d) => d.media !== null).length

  return `
    <div class="header">
      <h1>Instituto Politécnico do Mayombe</h1>
      <p>Boletim de Notas - ${trimestre} - ${anoLectivo}</p>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <label>Aluno</label>
        <span>${aluno.nome}</span>
      </div>
      <div class="info-item">
        <label>Número</label>
        <span>${aluno.numero}</span>
      </div>
      <div class="info-item">
        <label>Curso</label>
        <span>${aluno.curso}</span>
      </div>
      <div class="info-item">
        <label>Turma / Ano</label>
        <span>${aluno.turma} - ${aluno.ano}º Ano</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Disciplina</th>
          <th>Professor</th>
          <th class="text-center">P1 (20%)</th>
          <th class="text-center">P2 (20%)</th>
          <th class="text-center">Trab. (20%)</th>
          <th class="text-center">Exame (40%)</th>
          <th class="text-center">Média Final</th>
          <th class="text-center">Estado</th>
        </tr>
      </thead>
      <tbody>
        ${disciplinas
          .map(
            (disc) => `
          <tr>
            <td>${disc.nome}</td>
            <td>${disc.professor}</td>
            <td class="text-center">${disc.notas.p1}</td>
            <td class="text-center">${disc.notas.p2}</td>
            <td class="text-center">${disc.notas.trabalho}</td>
            <td class="text-center">${disc.notas.exame ?? "-"}</td>
            <td class="text-center font-bold ${disc.media !== null ? (disc.media >= 10 ? "text-success" : "text-danger") : ""}">${disc.media?.toFixed(1) ?? "-"}</td>
            <td class="text-center">
              <span class="badge ${disc.estado === "Aprovado" ? "badge-success" : disc.estado === "Reprovado" ? "badge-danger" : "badge-warning"}">${disc.estado}</span>
            </td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="6" style="text-align: right; font-weight: 600;">Média Geral:</td>
          <td class="text-center font-bold ${mediaGeral >= 10 ? "text-success" : "text-danger"}">${mediaGeral.toFixed(1)}</td>
          <td class="text-center">
            <span class="badge ${mediaGeral >= 10 ? "badge-success" : "badge-danger"}">${mediaGeral >= 10 ? "Aprovado" : "Reprovado"}</span>
          </td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top: 40px; display: flex; justify-content: space-between;">
      <div style="text-align: center; width: 200px;">
        <div style="border-top: 1px solid #333; padding-top: 5px;">
          <p style="font-size: 12px;">Director de Turma</p>
        </div>
      </div>
      <div style="text-align: center; width: 200px;">
        <div style="border-top: 1px solid #333; padding-top: 5px;">
          <p style="font-size: 12px;">Director Pedagógico</p>
        </div>
      </div>
    </div>

    <div class="print-date">
      Documento gerado em: ${new Date().toLocaleDateString("pt-AO", { dateStyle: "full" })}
    </div>
  `
}

/**
 * Generate relatório (report) PDF content
 */
export function generateRelatorioPDF(
  titulo: string,
  subtitulo: string,
  dados: Array<Record<string, unknown>>,
  colunas: Array<{ key: string; label: string; type?: "text" | "number" | "badge" }>,
  resumo?: { label: string; value: string | number }[],
): string {
  return `
    <div class="header">
      <h1>Instituto Politécnico do Mayombe</h1>
      <p>${titulo}</p>
      ${subtitulo ? `<p style="margin-top: 5px;">${subtitulo}</p>` : ""}
    </div>

    ${
      resumo
        ? `
    <div class="info-grid" style="grid-template-columns: repeat(${Math.min(resumo.length, 4)}, 1fr);">
      ${resumo
        .map(
          (item) => `
        <div class="info-item">
          <label>${item.label}</label>
          <span>${item.value}</span>
        </div>
      `,
        )
        .join("")}
    </div>
    `
        : ""
    }

    <table>
      <thead>
        <tr>
          ${colunas.map((col) => `<th class="${col.type === "number" ? "text-center" : ""}">${col.label}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${dados
          .map(
            (row) => `
          <tr>
            ${colunas
              .map((col) => {
                const value = row[col.key]
                if (col.type === "badge") {
                  const badgeClass =
                    value === "Aprovado" || value === "Activo"
                      ? "badge-success"
                      : value === "Reprovado"
                        ? "badge-danger"
                        : "badge-warning"
                  return `<td class="text-center"><span class="badge ${badgeClass}">${value}</span></td>`
                }
                if (col.type === "number") {
                  return `<td class="text-center">${value ?? "-"}</td>`
                }
                return `<td>${value ?? "-"}</td>`
              })
              .join("")}
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>

    <div class="print-date">
      Relatório gerado em: ${new Date().toLocaleDateString("pt-AO", { dateStyle: "full" })}
    </div>
  `
}
