<?php
/**
 * GET /professor/stats.php
 * Estatísticas do professor para o painel.
 *
 * Fórmula de média:
 *   Prova do Professor (p1)   × 30%
 *   Avaliação / Trabalho      × 30%
 *   Prova do Trimestre (exame)× 40%
 *
 * Critérios de aprovação IPM:
 *   0  – 6.9  → Reprovado
 *   7  – 9.9  → Recurso
 *   10 – 20   → Aprovado
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('professor');
$db   = new Database();
$conn = $db->connect();
$profId = intval($auth['id']);

// Turmas do professor
$turmasR = $conn->prepare("
    SELECT DISTINCT
        t.id        AS id,
        t.nome      AS turma_nome,
        d.id        AS disciplina_id,
        d.nome      AS disciplina_nome,
        COUNT(DISTINCT a.id) AS total_alunos
    FROM professor_disciplina_turma pd
    JOIN turmas      t  ON pd.turma_id      = t.id
    JOIN disciplinas d  ON pd.disciplina_id = d.id
    LEFT JOIN alunos a  ON a.turma_id       = t.id
    WHERE pd.professor_id = ?
    GROUP BY t.id, d.id
");
$turmasR->bind_param("i", $profId);
$turmasR->execute();
$turmas = $turmasR->get_result()->fetch_all(MYSQLI_ASSOC);

$totalAlunos = 0;
foreach ($turmas as $t) $totalAlunos += intval($t['total_alunos']);

// Notas pendentes de validação
$pendR = $conn->prepare("
    SELECT COUNT(*) AS total
    FROM notas
    WHERE professor_id = ? AND estado = 'Pendente'
");
$pendR->bind_param("i", $profId);
$pendR->execute();
$pendentes = intval($pendR->get_result()->fetch_assoc()['total']);

$mediaR = $conn->prepare("
    SELECT ROUND(AVG(
        p1       * 0.30 +
        trabalho * 0.30 +
        exame    * 0.40
    ), 1) AS media_geral
    FROM notas
    WHERE professor_id = ?
      AND estado = 'Aprovado'
      AND p1 IS NOT NULL
      AND trabalho IS NOT NULL
      AND exame IS NOT NULL
");
$mediaR->bind_param("i", $profId);
$mediaR->execute();
$mediaGeral = floatval($mediaR->get_result()->fetch_assoc()['media_geral'] ?? 0);

// Evolução por trimestre
$evolR = $conn->prepare("
    SELECT tr.nome AS trimestre,
           ROUND(AVG(
               n.p1       * 0.30 +
               n.trabalho * 0.30 +
               n.exame    * 0.40
           ), 1) AS media
    FROM notas n
    JOIN trimestres tr ON n.trimestre_id = tr.id
    WHERE n.professor_id = ? AND n.estado = 'Aprovado'
      AND n.p1 IS NOT NULL
      AND n.trabalho IS NOT NULL
      AND n.exame IS NOT NULL
    GROUP BY tr.id, tr.nome
    ORDER BY tr.id
");
$evolR->bind_param("i", $profId);
$evolR->execute();
$evolucao = $evolR->get_result()->fetch_all(MYSQLI_ASSOC);

// Formatar médias como float
foreach ($evolucao as &$e) {
    $e['media'] = floatval($e['media']);
}

echo json_encode([
    'success'      => true,
    'total_alunos' => $totalAlunos,
    'total_turmas' => count($turmas),
    'pendentes'    => $pendentes,
    'media_geral'  => $mediaGeral,
    'turmas'       => $turmas,
    'evolucao'     => $evolucao,
]);
$db->closeConnection();
