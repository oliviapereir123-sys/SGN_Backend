<?php
/**
 * GET horários da turma de um aluno específico
 * ?alunoId=X  (ou usa o próprio ID se for aluno autenticado)
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth    = Auth::requireRole('aluno', 'encarregado', 'admin');
$db      = new Database();
$conn    = $db->connect();

$alunoId = intval($_GET['alunoId'] ?? ($auth['type'] === 'aluno' ? $auth['id'] : 0));

if (!$alunoId) {
    http_response_code(400);
    echo json_encode(['error' => 'alunoId é obrigatório']);
    exit();
}

// Controlo de acesso
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

// Buscar ano lectivo activo
$anoRes = $conn->query("SELECT id FROM anos_lectivos WHERE estado='Activo' LIMIT 1");
$anoId  = $anoRes ? intval($anoRes->fetch_assoc()['id']) : 0;

$stmt = $conn->prepare("
    SELECT h.id, h.dia_semana, h.hora_inicio, h.hora_fim, h.sala,
           d.nome AS disciplina_nome, d.sigla AS disciplina_sigla,
           p.nome AS professor_nome
    FROM horarios h
    JOIN disciplinas d  ON h.disciplina_id  = d.id
    JOIN professores p  ON h.professor_id   = p.id
    WHERE h.turma_id = ? AND h.ano_lectivo_id = ?
    ORDER BY h.dia_semana, h.hora_inicio
");
$stmt->bind_param('ii', $turmaId, $anoId);
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($rows as &$r) {
    $r['id']         = intval($r['id']);
    $r['dia_semana'] = intval($r['dia_semana']);
}

echo json_encode(['success' => true, 'data' => $rows]);
$db->closeConnection();
?>
