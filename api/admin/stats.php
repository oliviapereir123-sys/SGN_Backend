<?php
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

Auth::requireRole('admin');
$db   = new Database();
$conn = $db->connect();

// Totais gerais
$totais = $conn->query("
    SELECT
        (SELECT COUNT(*) FROM alunos        WHERE estado = 'Activo')    AS total_alunos,
        (SELECT COUNT(*) FROM turmas        WHERE estado = 'Activa')    AS total_turmas,
        (SELECT COUNT(*) FROM disciplinas)                              AS total_disciplinas,
        (SELECT COUNT(*) FROM utilizadores  WHERE tipo = 'professor' AND estado = 'Activo') AS total_professores
")->fetch_assoc();

// Notas: contagens por estado
$notas = $conn->query("
    SELECT
        COUNT(*)                                                        AS total_notas,
        SUM(CASE WHEN estado = 'Pendente'  THEN 1 ELSE 0 END)          AS pendentes,
        SUM(CASE WHEN estado = 'Aprovado'  THEN 1 ELSE 0 END)          AS aprovadas,
        SUM(CASE WHEN estado = 'Rejeitado' THEN 1 ELSE 0 END)          AS rejeitadas,
        ROUND(AVG(CASE WHEN estado = 'Aprovado' AND media IS NOT NULL THEN media END), 1) AS media_geral
    FROM notas
")->fetch_assoc();

// Taxa de aprovação (alunos com média >= 10)
$aprovacao = $conn->query("
    SELECT
        COUNT(*)                                             AS total,
        SUM(CASE WHEN media >= 10 THEN 1 ELSE 0 END)        AS aprovados
    FROM notas
    WHERE estado = 'Aprovado' AND media IS NOT NULL
")->fetch_assoc();

$taxa = ($aprovacao['total'] > 0)
    ? round(100 * $aprovacao['aprovados'] / $aprovacao['total'])
    : 0;

// Lançamento de notas por trimestre activo
$trimestre = $conn->query("
    SELECT t.nome, t.id,
        (SELECT COUNT(*) FROM notas n
         JOIN matriculas m ON n.aluno_id = m.aluno_id
         WHERE n.trimestre_id = t.id) AS notas_lancadas,
        (SELECT COUNT(*) FROM matriculas WHERE estado = 'Activa') *
        (SELECT COUNT(*) FROM disciplinas) AS notas_esperadas
    FROM trimestres t
    WHERE t.estado = 'Activo'
    LIMIT 1
")->fetch_assoc();

$pct_lancamento = 0;
if ($trimestre && $trimestre['notas_esperadas'] > 0) {
    $pct_lancamento = min(100, round(100 * $trimestre['notas_lancadas'] / $trimestre['notas_esperadas']));
}

// Evolução por trimestre (média)
$evolucao = $conn->query("
    SELECT t.nome AS trimestre,
           ROUND(AVG(n.media), 1) AS media,
           COUNT(n.id) AS total_notas,
           SUM(CASE WHEN n.media >= 10 THEN 1 ELSE 0 END) AS aprovados
    FROM notas n
    JOIN trimestres t ON n.trimestre_id = t.id
    WHERE n.estado = 'Aprovado' AND n.media IS NOT NULL
    GROUP BY t.id, t.nome
    ORDER BY t.id
")->fetch_all(MYSQLI_ASSOC);

// Auditoria recente
$auditoria = $conn->query("
    SELECT a.acao, a.detalhes, a.criado_em,
           u.nome AS utilizador
    FROM auditoria a
    LEFT JOIN utilizadores u ON a.utilizador_id = u.id
    ORDER BY a.criado_em DESC
    LIMIT 5
")->fetch_all(MYSQLI_ASSOC);

echo json_encode([
    'success'        => true,
    'totais'         => [
        'alunos'       => intval($totais['total_alunos']),
        'turmas'       => intval($totais['total_turmas']),
        'disciplinas'  => intval($totais['total_disciplinas']),
        'professores'  => intval($totais['total_professores']),
    ],
    'notas'          => [
        'total'        => intval($notas['total_notas']),
        'pendentes'    => intval($notas['pendentes']),
        'aprovadas'    => intval($notas['aprovadas']),
        'rejeitadas'   => intval($notas['rejeitadas']),
        'media_geral'  => floatval($notas['media_geral']),
    ],
    'taxa_aprovacao'  => $taxa,
    'pct_lancamento'  => $pct_lancamento,
    'trimestre_activo'=> $trimestre ? $trimestre['nome'] : null,
    'evolucao'        => $evolucao,
    'auditoria'       => $auditoria,
]);
$db->closeConnection();
?>