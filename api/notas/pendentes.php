<?php
require_once '../../config/Headers.php';
require_once '../../config/Database.php';
require_once '../../config/Auth.php';

$auth = Auth::requireRole('admin');
$db   = new Database();
$conn = $db->connect();

$trimestreId = isset($_GET['trimestreId']) ? intval($_GET['trimestreId']) : null;

$sql = "
    SELECT n.id, n.p1, n.p2, n.trabalho, n.exame, n.media, n.nota_recuperacao,
           n.estado, n.observacoes, n.feedback, n.data_lancamento,
           n.aluno_id, n.disciplina_id, n.trimestre_id,
           a.nome   AS aluno_nome, a.numero AS aluno_numero, a.turma_id,
           d.nome   AS disciplina_nome,
           tu.nome  AS turma_nome, tu.id AS turma_id_real,
           p.nome   AS professor_nome,
           t.nome   AS trimestre_nome
    FROM notas n
    JOIN alunos a       ON n.aluno_id      = a.id
    JOIN disciplinas d  ON n.disciplina_id = d.id
    JOIN professores p  ON n.professor_id  = p.id
    JOIN trimestres t   ON n.trimestre_id  = t.id
    LEFT JOIN turmas tu ON a.turma_id      = tu.id
    WHERE n.estado IN ('Pendente', 'Aprovado', 'Rejeitado')
";

if ($trimestreId) {
    $stmt = $conn->prepare($sql . " AND n.trimestre_id = ? ORDER BY tu.nome, d.nome, n.data_lancamento DESC");
    $stmt->bind_param("i", $trimestreId);
} else {
    $stmt = $conn->prepare($sql . " ORDER BY tu.nome, d.nome, n.data_lancamento DESC");
}

$stmt->execute();
$notas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($notas as &$nota) {
    $nota['id']         = intval($nota['id']);
    $nota['aluno_id']   = intval($nota['aluno_id']);
    $nota['disciplina_id']  = intval($nota['disciplina_id']);
    $nota['trimestre_id']   = intval($nota['trimestre_id']);
    $nota['turma_id']   = $nota['turma_id'] ? intval($nota['turma_id']) : null;
    $nota['p1']         = $nota['p1']       !== null ? floatval($nota['p1'])       : null;
    $nota['p2']         = $nota['p2']       !== null ? floatval($nota['p2'])       : null;
    $nota['trabalho']   = $nota['trabalho'] !== null ? floatval($nota['trabalho']) : null;
    $nota['exame']      = $nota['exame']    !== null ? floatval($nota['exame'])    : null;
    $nota['media']      = $nota['media']    !== null ? floatval($nota['media'])   : null;
}

echo json_encode(['success' => true, 'data' => $notas]);
$db->closeConnection();
?>