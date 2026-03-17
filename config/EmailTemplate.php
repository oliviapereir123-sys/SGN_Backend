<?php
/**
 * EmailTemplate.php — Boletim HTML para email
 * Fórmula Angola: Média = P1×20% + P2×20% + Trabalho×20% + Exame×40%
 */
class EmailTemplate {

    public static function boletim(array $aluno, array $notas, array $trimestre, array $encarregado): string {
        $mediaGeral     = count($notas) > 0 ? array_sum(array_column($notas, 'media')) / count($notas) : 0;
        $aprovadas      = count(array_filter($notas, fn($n) => $n['media'] >= 10));
        $reprovadas     = count($notas) - $aprovadas;
        $resultadoGeral = $mediaGeral >= 10 ? 'APROVADO' : 'REPROVADO';
        $corResultado   = $mediaGeral >= 10 ? '#16a34a' : '#dc2626';
        $anoLectivo     = $trimestre['ano_lectivo'] ?? '2024/2025';
        $dataEmissao    = date('d/m/Y');

        $linhasNotas = '';
        foreach ($notas as $i => $nota) {
            $bgRow     = $i % 2 === 0 ? '#ffffff' : '#f9fafb';
            $media     = number_format(floatval($nota['media']), 1, ',', '');
            $corMedia  = floatval($nota['media']) >= 10 ? '#16a34a' : '#dc2626';
            $resultado = floatval($nota['media']) >= 10 ? 'Aprovado' : 'Reprovado';
            $corRes    = floatval($nota['media']) >= 10 ? '#16a34a' : '#dc2626';

            $p1  = $nota['p1']       !== null ? number_format(floatval($nota['p1']),       1, ',', '') : '—';
            $p2  = $nota['p2']       !== null ? number_format(floatval($nota['p2']),       1, ',', '') : '—';
            $trab = $nota['trabalho'] !== null ? number_format(floatval($nota['trabalho']), 1, ',', '') : '—';
            $ex  = $nota['exame']    !== null ? number_format(floatval($nota['exame']),    1, ',', '') : '—';

            $feedbackHtml = '';
            if (!empty($nota['feedback'])) {
                $feedbackHtml = "<tr><td colspan='6' style='padding:6px 16px 12px;color:#6b7280;font-size:12px;font-style:italic;'>💬 " . htmlspecialchars($nota['feedback']) . "</td></tr>";
            }

            $linhasNotas .= "
            <tr style='background-color:{$bgRow};'>
              <td style='padding:12px 16px;border-bottom:1px solid #e5e7eb;font-weight:500;color:#111827;'>{$nota['disciplina_nome']}</td>
              <td style='padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#374151;'>{$p1}</td>
              <td style='padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#374151;'>{$p2}</td>
              <td style='padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#374151;'>{$trab}</td>
              <td style='padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#374151;'>{$ex}</td>
              <td style='padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;color:{$corMedia};font-size:16px;'>{$media}</td>
              <td style='padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600;color:{$corRes};'>{$resultado}</td>
            </tr>{$feedbackHtml}";
        }

        $mediaGeralFmt = number_format($mediaGeral, 2, ',', '');

        return <<<HTML
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><title>Boletim — {$aluno['nome']}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:700px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#1e40af,#7c3aed);padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0 0 4px;font-size:22px;">Instituto Politécnico do Mayombe</h1>
      <p style="color:rgba(255,255,255,0.85);margin:0;">Boletim de Avaliação — {$trimestre['nome']}</p>
      <p style="color:rgba(255,255,255,0.70);margin:8px 0 0;font-size:13px;">Ano Lectivo {$anoLectivo}</p>
    </div>
    <div style="padding:28px 40px 0;">
      <p style="color:#374151;">Exmo(a). Sr(a). <strong>{$encarregado['nome']}</strong> ({$encarregado['parentesco']}),</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;">As notas do {$trimestre['nome']} do seu educando foram aprovadas e estão disponíveis abaixo.</p>
    </div>
    <div style="margin:0 40px 24px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:20px 24px;">
      <h3 style="color:#0369a1;margin:0 0 14px;font-size:14px;text-transform:uppercase;">Dados do Educando</h3>
      <p style="margin:4px 0;"><strong>{$aluno['nome']}</strong> · Nº {$aluno['numero']}</p>
      <p style="margin:4px 0;color:#6b7280;">{$aluno['curso']} · {$aluno['turma']} — {$aluno['ano']}º Ano</p>
    </div>
    <div style="margin:0 40px 24px;">
      <h3 style="color:#374151;font-size:14px;text-transform:uppercase;margin:0 0 12px;">Pauta de Avaliação</h3>
      <div style="border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f8f9fa;">
              <th style="padding:12px 16px;text-align:left;border-bottom:2px solid #e5e7eb;">Disciplina</th>
              <th style="padding:12px 8px;text-align:center;border-bottom:2px solid #e5e7eb;font-size:12px;">P1<br><span style="font-weight:400;color:#9ca3af;">20%</span></th>
              <th style="padding:12px 8px;text-align:center;border-bottom:2px solid #e5e7eb;font-size:12px;">P2<br><span style="font-weight:400;color:#9ca3af;">20%</span></th>
              <th style="padding:12px 8px;text-align:center;border-bottom:2px solid #e5e7eb;font-size:12px;">Trab.<br><span style="font-weight:400;color:#9ca3af;">20%</span></th>
              <th style="padding:12px 8px;text-align:center;border-bottom:2px solid #e5e7eb;font-size:12px;">Exame<br><span style="font-weight:400;color:#9ca3af;">40%</span></th>
              <th style="padding:12px 8px;text-align:center;border-bottom:2px solid #e5e7eb;">Média</th>
              <th style="padding:12px 8px;text-align:center;border-bottom:2px solid #e5e7eb;">Resultado</th>
            </tr>
          </thead>
          <tbody>{$linhasNotas}</tbody>
          <tfoot>
            <tr style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);">
              <td colspan="5" style="padding:16px;text-align:right;font-weight:700;font-size:15px;">Média Geral:</td>
              <td style="padding:16px 8px;text-align:center;font-weight:800;color:{$corResultado};font-size:20px;">{$mediaGeralFmt}</td>
              <td style="padding:16px 8px;text-align:center;"><span style="background:{$corResultado};color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;">{$resultadoGeral}</span></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    <div style="margin:0 40px 28px;display:flex;gap:12px;">
      <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#16a34a;">{$aprovadas}</div>
        <div style="font-size:12px;color:#15803d;">Aprovadas</div>
      </div>
      <div style="flex:1;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#dc2626;">{$reprovadas}</div>
        <div style="font-size:12px;color:#b91c1c;">Reprovadas</div>
      </div>
      <div style="flex:1;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#0369a1;">{$mediaGeralFmt}</div>
        <div style="font-size:12px;color:#075985;">Média Geral</div>
      </div>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
      <p style="color:#374151;font-weight:600;margin:0 0 4px;">Instituto Politécnico do Mayombe</p>
      <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">Buco Zau, Cabinda, Angola</p>
      <p style="color:#d1d5db;font-size:11px;margin:0;">Documento gerado automaticamente pelo SGN em {$dataEmissao}</p>
    </div>
  </div>
</body>
</html>
HTML;
    }

    public static function assunto(array $aluno, array $trimestre): string {
        return "📋 Boletim de Notas — {$aluno['nome']} — {$trimestre['nome']}";
    }
}
?>