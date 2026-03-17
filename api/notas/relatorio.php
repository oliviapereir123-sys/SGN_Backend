<?php
/**
 * GET: Relatório de notas com cálculo completo MED Angola.
 * Acessível a admin e professor (professor só vê as suas turmas).
 *
 * Parâmetros opcionais:
 *   turmaId, disciplinaId, trimestreId, anoLectivoId, estado
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth    = Auth::requireRole('professor', 'admin');
$db      = new Database();
$conn    = $db->connect();
$isAdmin = $auth['type'] === 'admin';

$turmaId      = intval($_GET['turmaId']      ?? 0);
$disciplinaId = intval($_GET['disciplinaId'] ?? 0);
$trimestreId  = intval($_GET['trimestreId']  ?? 0);
$anoId        = intval($_GET['anoLectivoId'] ?? 0);
$estado       = trim($_GET['estado']         ?? '');

$where  = [];
$params = [];
$types  = '';

if (!$isAdmin) {
    $where[]  = 'n.professor_id = ?';
    $params[] = intval($auth['id']);
    $types   .= 'i';
}
if ($turmaId)      { $where[] = 'a.turma_id      = ?'; $params[] = $turmaId;      $types .= 'i'; }
if ($disciplinaId) { $where[] = 'n.disciplina_id = ?'; $params[] = $disciplinaId; $types .= 'i'; }
if ($trimestreId)  { $where[] = 'n.trimestre_id  = ?'; $params[] = $trimestreId;  $types .= 'i'; }
if ($anoId)        { $where[] = 'al.id           = ?'; $params[] = $anoId;        $types .= 'i'; }
if ($estado)       { $where[] = 'n.estado        = ?'; $params[] = $estado;       $types .= 's'; }

$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$sql = "
    SELECT
        n.id          AS nota_id,
        a.id          AS aluno_id,
        a.numero      AS aluno_numero,
        a.nome        AS aluno_nome,
        tu.nome       AS turma_nome,
        d.id          AS disciplina_id,
        d.nome        AS disciplina_nome,
        d.sigla       AS disciplina_sigla,
        p.nome        AS professor_nome,
        tr.nome       AS trimestre_nome,
        al.nome       AS ano_lectivo,
        n.p1, n.p2, n.trabalho, n.exame,
        -- MAC = média de avaliação contínua
        CASE
            WHEN n.p1 IS NOT NULL AND n.p2 IS NOT NULL AND n.trabalho IS NOT NULL
            THEN ROUND((n.p1 + n.p2 + n.trabalho) / 3.0, 2)
            ELSE NULL
        END AS mac,
        n.media       AS media_trimestral,
        n.nota_recuperacao,
        -- Média final
        CASE
            WHEN n.nota_recuperacao IS NOT NULL AND n.media IS NOT NULL
            THEN ROUND((n.media + n.nota_recuperacao) / 2.0, 2)
            ELSE n.media
        END AS media_final,
        -- Situação
        CASE
            WHEN n.nota_recuperacao IS NOT NULL AND n.media IS NOT NULL
            THEN CASE WHEN ROUND((n.media + n.nota_recuperacao) / 2.0, 2) >= 10 THEN 'Aprovado' ELSE 'Reprovado' END
            WHEN n.media IS NOT NULL
            THEN CASE WHEN n.media >= 10 THEN 'Aprovado' ELSE 'Reprovado' END
            ELSE 'Pendente'
        END AS situacao,
        n.estado,
        n.feedback,
        n.observacoes,
        n.data_lancamento,
        n.data_validacao
    FROM notas n
    JOIN alunos a       ON n.aluno_id      = a.id
    JOIN turmas tu      ON a.turma_id      = tu.id
    JOIN disciplinas d  ON n.disciplina_id = d.id
    JOIN professores p  ON n.professor_id  = p.id
    JOIN trimestres tr  ON n.trimestre_id  = tr.id
    JOIN anos_lectivos al ON tr.ano_lectivo_id = al.id
    $whereSQL
    ORDER BY a.nome, d.nome, tr.id
";

$stmt = $conn->prepare($sql);
if ($types !== '') $stmt->bind_param($types, ...$params);
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

// Tipagem correcta
foreach ($rows as &$r) {
    foreach (['nota_id','aluno_id','disciplina_id'] as $col) {
        $r[$col] = intval($r[$col]);
    }
    foreach (['p1','p2','trabalho','exame','mac','media_trimestral','nota_recuperacao','media_final'] as $col) {
        $r[$col] = $r[$col] !== null ? floatval($r[$col]) : null;
    }
}

// Estatísticas resumo
$total     = count($rows);
$aprovados = count(array_filter($rows, fn($r) => $r['situacao'] === 'Aprovado'));
$reprovados= count(array_filter($rows, fn($r) => $r['situacao'] === 'Reprovado'));
$pendentes = $total - $aprovados - $reprovados;
$medias    = array_filter(array_column($rows, 'media_final'), fn($v) => $v !== null);
$mediaGeral = $medias ? round(array_sum($medias) / count($medias), 2) : null;

echo json_encode([
    'success' => true,
    'data'    => $rows,
    'stats'   => [
        'total'       => $total,
        'aprovados'   => $aprovados,
        'reprovados'  => $reprovados,
        'pendentes'   => $pendentes,
        'taxa_aprovacao' => $total > 0 ? round($aprovados * 100.0 / $total, 1) : 0,
        'media_geral' => $mediaGeral,
    ],
]);
$db->closeConnection();
?>
