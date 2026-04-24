<?php
/**
 * GET /aluno/stats.php?alunoId=X
 * Estatísticas do aluno para o painel principal.
 *
 * Fórmula de média (30% / 30% / 40%) e critérios de aprovação:
 *   MAC / Avaliação (trabalho) × 30%
 *   Prova do Professor (p1)    × 30%
 *   Prova do Trimestre (exame) × 40%
 *
 * Critérios IPM:
 *   0  – 6.9  → Reprovado
 *   7  – 9.9  → Recurso
 *   10 – 20   → Aprovado
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('aluno', 'encarregado');
$db   = new Database();
$conn = $db->connect();

$alunoId = intval($_GET['alunoId'] ?? $auth['id']);

// Notas aprovadas por disciplina
$notasR = $conn->prepare("
    SELECT n.id, d.nome AS disciplina_nome, tr.nome AS trimestre_nome,
           n.media, n.estado, n.nota_recuperacao,
           n.p1, n.p2, n.trabalho, n.exame
    FROM notas n
    JOIN disciplinas d  ON n.disciplina_id  = d.id
    JOIN trimestres  tr ON n.trimestre_id   = tr.id
    WHERE n.aluno_id = ? AND n.estado = 'Aprovado'
    ORDER BY tr.id, d.nome
");
$notasR->bind_param("i", $alunoId);
$notasR->execute();
$notas = $notasR->get_result()->fetch_all(MYSQLI_ASSOC);

// Frequência
$freqR = $conn->prepare("
    SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN presente = 1 THEN 1 ELSE 0 END) AS presencas
    FROM presencas WHERE aluno_id = ?
");
$freqR->bind_param("i", $alunoId);
$freqR->execute();
$freq = $freqR->get_result()->fetch_assoc();
$taxaFreq = ($freq['total'] > 0)
    ? round(100 * $freq['presencas'] / $freq['total'], 1)
    : null;

// Calcular médias usando fórmula corrigida
$comMedia  = array_filter($notas, fn($n) => $n['media'] !== null);
$mediaGeral = count($comMedia) > 0
    ? round(array_sum(array_column($comMedia, 'media')) / count($comMedia), 1)
    : null;

// Critérios corrigidos
$aprovadas  = count(array_filter($comMedia, fn($n) => floatval($n['media']) >= 10));
$recurso    = count(array_filter($comMedia, fn($n) => floatval($n['media']) >= 7 && floatval($n['media']) < 10));
$reprovadas = count($comMedia) - $aprovadas - $recurso;

// Evolução por trimestre
$evolucaoR = $conn->prepare("
    SELECT tr.nome AS trimestre,
           ROUND(AVG(n.media), 1) AS media
    FROM notas n
    JOIN trimestres tr ON n.trimestre_id = tr.id
    WHERE n.aluno_id = ? AND n.estado = 'Aprovado' AND n.media IS NOT NULL
    GROUP BY tr.id, tr.nome ORDER BY tr.id
");
$evolucaoR->bind_param("i", $alunoId);
$evolucaoR->execute();
$evolucao = $evolucaoR->get_result()->fetch_all(MYSQLI_ASSOC);
foreach ($evolucao as &$e) $e['media'] = floatval($e['media']);

echo json_encode([
    'success'     => true,
    'notas'       => $notas,
    'media_geral' => $mediaGeral,
    'aprovadas'   => $aprovadas,
    'recurso'     => $recurso,
    'reprovadas'  => $reprovadas,
    'taxa_freq'   => $taxaFreq,
    'evolucao'    => $evolucao,
]);
$db->closeConnection();
