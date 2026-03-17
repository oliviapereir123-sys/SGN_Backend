<?php
/**
 * POST: Registar presenças em lote (uma data, uma turma, vários alunos).
 * Body: { data: 'YYYY-MM-DD', turmaId: number, presencas: [ { alunoId, presente, justificada?, observacao? } ] }
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('professor', 'admin');
$db   = new Database();
$conn = $db->connect();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$data = trim($input['data'] ?? '');
$turmaId = intval($input['turmaId'] ?? 0);
$presencas = $input['presencas'] ?? [];

if (!$data || !$turmaId || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data)) {
    http_response_code(400);
    echo json_encode(['error' => 'data (YYYY-MM-DD) e turmaId são obrigatórios']);
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

$tipoRegistado = $auth['type'] === 'admin' ? 'admin' : 'professor';
$registadoPor = intval($auth['id']);

// Verificar que todos os alunoIds pertencem à turma
$stmtTurma = $conn->prepare("SELECT id FROM alunos WHERE turma_id = ? AND estado = 'Activo'");
$stmtTurma->bind_param("i", $turmaId);
$stmtTurma->execute();
$alunosTurma = array_column($stmtTurma->get_result()->fetch_all(MYSQLI_ASSOC), 'id');

$stmtInsert = $conn->prepare("
    INSERT INTO presencas (aluno_id, data, presente, justificada, observacao, registado_por, tipo_registado)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        presente = VALUES(presente),
        justificada = VALUES(justificada),
        observacao = VALUES(observacao),
        registado_por = VALUES(registado_por),
        tipo_registado = VALUES(tipo_registado)
");

$conn->begin_transaction();
try {
    foreach ($presencas as $row) {
        $alunoId = intval($row['alunoId'] ?? 0);
        if (!in_array($alunoId, $alunosTurma, true)) {
            continue;
        }
        $presente = isset($row['presente']) ? (int) (bool) $row['presente'] : 1;
        $justificada = isset($row['justificada']) ? (int) (bool) $row['justificada'] : 0;
        $observacao = !empty(trim($row['observacao'] ?? '')) ? trim($row['observacao']) : null;

        $stmtInsert->bind_param(
            "isiisis",
            $alunoId,
            $data,
            $presente,
            $justificada,
            $observacao,
            $registadoPor,
            $tipoRegistado
        );
        $stmtInsert->execute();
    }
    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Presenças guardadas com sucesso']);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao guardar: ' . $e->getMessage()]);
}
$db->closeConnection();
