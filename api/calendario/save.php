<?php
/**
 * POST: Criar evento. PUT: Actualizar. DELETE: Remover.
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
    $conn->query("DELETE FROM calendario_academico WHERE id = $id");
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
$titulo = trim($input['titulo'] ?? '');
$tipo = trim($input['tipo'] ?? 'evento');
$dataInicio = trim($input['data_inicio'] ?? '');
$dataFim = !empty(trim($input['data_fim'] ?? '')) ? trim($input['data_fim']) : null;
$descricao = !empty(trim($input['descricao'] ?? '')) ? trim($input['descricao']) : null;
$anoLectivoId = !empty($input['ano_lectivo_id']) ? intval($input['ano_lectivo_id']) : null;

$tiposValidos = ['feriado', 'evento', 'exame', 'matricula', 'encerramento', 'outro'];
if (!in_array($tipo, $tiposValidos)) $tipo = 'evento';

if (!$titulo || !$dataInicio || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dataInicio)) {
    http_response_code(400);
    echo json_encode(['error' => 'titulo e data_inicio (YYYY-MM-DD) são obrigatórios']);
    exit();
}
if ($dataFim !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dataFim)) {
    $dataFim = $dataInicio;
}

if ($method === 'PUT') {
    $id = intval($input['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id é obrigatório para actualizar']);
        exit();
    }
    $stmt = $conn->prepare("
        UPDATE calendario_academico SET titulo=?, tipo=?, data_inicio=?, data_fim=?, descricao=?, ano_lectivo_id=?
        WHERE id=?
    ");
    $stmt->bind_param("sssssii", $titulo, $tipo, $dataInicio, $dataFim, $descricao, $anoLectivoId, $id);
    $stmt->execute();
    echo json_encode(['success' => true, 'id' => $id]);
    $db->closeConnection();
    exit();
}

$stmt = $conn->prepare("
    INSERT INTO calendario_academico (titulo, tipo, data_inicio, data_fim, descricao, ano_lectivo_id)
    VALUES (?,?,?,?,?,?)
");
$stmt->bind_param("sssssi", $titulo, $tipo, $dataInicio, $dataFim, $descricao, $anoLectivoId);
if ($stmt->execute()) {
    echo json_encode(['success' => true, 'id' => $conn->insert_id]);
} else {
    http_response_code(500);
    echo json_encode(['error' => $conn->error]);
}
$db->closeConnection();
