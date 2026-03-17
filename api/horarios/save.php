<?php
/**
 * POST: Criar horário. PUT: Actualizar. DELETE: Remover.
 * Apenas admin.
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('admin');
$db   = new Database();
$conn = $db->connect();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id é obrigatório']);
        exit();
    }
    $conn->query("DELETE FROM horarios WHERE id = $id");
    echo json_encode(['success' => true]);
    $db->closeConnection();
    exit();
}

if ($method !== 'POST' && $method !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$turmaId = intval($input['turma_id'] ?? 0);
$disciplinaId = intval($input['disciplina_id'] ?? 0);
$professorId = intval($input['professor_id'] ?? 0);
$anoLectivoId = intval($input['ano_lectivo_id'] ?? 0);
$diaSemana = intval($input['dia_semana'] ?? 1);
$horaInicio = trim($input['hora_inicio'] ?? '08:00');
$horaFim = trim($input['hora_fim'] ?? '09:00');
$sala = !empty(trim($input['sala'] ?? '')) ? trim($input['sala']) : null;

if (!$turmaId || !$disciplinaId || !$professorId || !$anoLectivoId || $diaSemana < 1 || $diaSemana > 5) {
    http_response_code(400);
    echo json_encode(['error' => 'turma_id, disciplina_id, professor_id, ano_lectivo_id e dia_semana (1-5) são obrigatórios']);
    exit();
}

if ($method === 'PUT') {
    $id = intval($input['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id é obrigatório para actualizar']);
        exit();
    }
    $stmt = $conn->prepare("
        UPDATE horarios SET turma_id=?, disciplina_id=?, professor_id=?, ano_lectivo_id=?, dia_semana=?, hora_inicio=?, hora_fim=?, sala=?
        WHERE id=?
    ");
    $stmt->bind_param("iiiiisssi", $turmaId, $disciplinaId, $professorId, $anoLectivoId, $diaSemana, $horaInicio, $horaFim, $sala, $id);
    $stmt->execute();
    echo json_encode(['success' => true, 'id' => $id]);
    $db->closeConnection();
    exit();
}

$stmt = $conn->prepare("
    INSERT INTO horarios (turma_id, disciplina_id, professor_id, ano_lectivo_id, dia_semana, hora_inicio, hora_fim, sala)
    VALUES (?,?,?,?,?,?,?,?)
");
$stmt->bind_param("iiiiisss", $turmaId, $disciplinaId, $professorId, $anoLectivoId, $diaSemana, $horaInicio, $horaFim, $sala);
if ($stmt->execute()) {
    echo json_encode(['success' => true, 'id' => $conn->insert_id]);
} else {
    http_response_code(500);
    echo json_encode(['error' => $conn->error]);
}
$db->closeConnection();
