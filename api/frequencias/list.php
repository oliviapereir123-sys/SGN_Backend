<?php
/**
 * GET: Listar presenças por turma e data (ou intervalo).
 * Query: turmaId, data (uma data) ou dataInicio + dataFim
 * Professor: só turmas atribuídas. Admin: todas.
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('professor', 'admin');
$db   = new Database();
$conn = $db->connect();

$turmaId   = intval($_GET['turmaId'] ?? 0);
$data      = trim($_GET['data'] ?? '');
$dataInicio = trim($_GET['dataInicio'] ?? '');
$dataFim   = trim($_GET['dataFim'] ?? '');

if (!$turmaId) {
    http_response_code(400);
    echo json_encode(['error' => 'turmaId é obrigatório']);
    exit();
}

if ($auth['type'] === 'professor') {
    $chk = $conn->prepare("SELECT id FROM professor_disciplina_turma WHERE professor_id = ? AND turma_id = ?");
    $chk->bind_param("ii", $auth['id'], $turmaId);
    $chk->execute();
    if ($chk->get_result()->num_rows === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado a esta turma']);
        exit();
    }
}

// Alunos da turma
$stmtAlunos = $conn->prepare("
    SELECT a.id, a.numero, a.nome
    FROM alunos a
    WHERE a.turma_id = ? AND a.estado = 'Activo'
    ORDER BY a.nome
");
$stmtAlunos->bind_param("i", $turmaId);
$stmtAlunos->execute();
$alunos = $stmtAlunos->get_result()->fetch_all(MYSQLI_ASSOC);

if (empty($alunos)) {
    echo json_encode(['success' => true, 'data' => [], 'alunos' => []]);
    $db->closeConnection();
    exit();
}

$alunoIds = array_column($alunos, 'id');

if ($data !== '') {
    $dataInicio = $dataFim = $data;
}

if ($dataInicio === '' || $dataFim === '') {
    echo json_encode(['success' => true, 'data' => [], 'alunos' => $alunos]);
    $db->closeConnection();
    exit();
}

$placeholders = implode(',', array_fill(0, count($alunoIds), '?'));
$types = str_repeat('i', count($alunoIds)) . 'ss';
$params = array_merge($alunoIds, [$dataInicio, $dataFim]);

$sql = "
    SELECT id, aluno_id, data, presente, justificada, observacao, criado_em
    FROM presencas
    WHERE aluno_id IN ($placeholders) AND data BETWEEN ? AND ?
    ORDER BY data DESC, aluno_id
";
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$presencas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($presencas as &$p) {
    $p['id'] = intval($p['id']);
    $p['aluno_id'] = intval($p['aluno_id']);
    $p['presente'] = (int) $p['presente'];
    $p['justificada'] = (int) $p['justificada'];
}

echo json_encode([
    'success' => true,
    'data'    => $presencas,
    'alunos'  => $alunos,
]);
$db->closeConnection();
