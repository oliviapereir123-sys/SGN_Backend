<?php
/**
 * GET: Avaliações programadas para a turma do aluno
 * ?alunoId=X&trimestreId=Y
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('aluno', 'encarregado');
$db   = new Database();
$conn = $db->connect();

$alunoId     = intval($_GET['alunoId']     ?? ($auth['type'] === 'aluno' ? $auth['id'] : 0));
$trimestreId = intval($_GET['trimestreId'] ?? 0);

if (!$alunoId) {
    http_response_code(400);
    echo json_encode(['error' => 'alunoId é obrigatório']);
    exit();
}

// Segurança: aluno só pode ver as suas
if ($auth['type'] === 'aluno' && intval($auth['id']) !== $alunoId) {
    http_response_code(403); echo json_encode(['error' => 'Acesso negado']); exit();
}
if ($auth['type'] === 'encarregado') {
    $chk = $conn->prepare("SELECT id FROM encarregados WHERE id = ? AND aluno_id = ?");
    $chk->bind_param('ii', $auth['id'], $alunoId);
    $chk->execute();
    if ($chk->get_result()->num_rows === 0) {
        http_response_code(403); echo json_encode(['error' => 'Acesso negado']); exit();
    }
}

// Buscar turma do aluno
$turmaRes = $conn->prepare("SELECT turma_id FROM alunos WHERE id = ?");
$turmaRes->bind_param('i', $alunoId);
$turmaRes->execute();
$turmaRow = $turmaRes->get_result()->fetch_assoc();
if (!$turmaRow) { http_response_code(404); echo json_encode(['error' => 'Aluno não encontrado']); exit(); }

$turmaId = intval($turmaRow['turma_id']);

$sql = "
    SELECT
        av.id, av.nome, av.tipo, av.peso, av.data_entrega, av.descricao, av.estado,
        d.nome AS disciplina_nome, d.sigla AS disciplina_sigla,
        p.nome AS professor_nome,
        tr.nome AS trimestre_nome
    FROM avaliacoes av
    JOIN disciplinas d  ON av.disciplina_id = d.id
    JOIN professores p  ON av.professor_id  = p.id
    JOIN trimestres tr  ON av.trimestre_id  = tr.id
    WHERE av.turma_id = ?
      AND av.estado   = 'Activa'
";
$params = [$turmaId];
$types  = 'i';

if ($trimestreId) {
    $sql    .= ' AND av.trimestre_id = ?';
    $params[] = $trimestreId;
    $types   .= 'i';
}
$sql .= ' ORDER BY av.data_entrega ASC, d.nome';

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($rows as &$r) {
    $r['id']   = intval($r['id']);
    $r['peso'] = floatval($r['peso']);
}

echo json_encode(['success' => true, 'data' => $rows]);
$db->closeConnection();
?>
