<?php
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('admin');
$db   = new Database();
$conn = $db->connect();

$method = $_SERVER['REQUEST_METHOD'];

// GET — listar trimestres com estado de bloqueio
if ($method === 'GET') {
    $r = $conn->query("
        SELECT t.id, t.nome, t.inicio, t.fim, t.estado, t.bloqueado,
               al.nome AS ano_lectivo
        FROM trimestres t
        JOIN anos_lectivos al ON t.ano_lectivo_id = al.id
        ORDER BY al.nome DESC, t.id
    ");
    echo json_encode(['success' => true, 'data' => $r->fetch_all(MYSQLI_ASSOC)]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

// PUT — bloquear/desbloquear ou mudar estado
if ($method === 'PUT') {
    $id = intval($data['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'id obrigatório']); exit(); }

    $updates = [];
    $types   = "";
    $values  = [];

    if (isset($data['bloqueado'])) {
        $updates[] = "bloqueado = ?";
        $types    .= "i";
        $values[]  = intval($data['bloqueado']);
    }
    if (isset($data['estado'])) {
        $updates[] = "estado = ?";
        $types    .= "s";
        $values[]  = $data['estado'];
    }

    if (empty($updates)) { http_response_code(400); echo json_encode(['error' => 'Nada para actualizar']); exit(); }

    $values[] = $id;
    $types   .= "i";
    $stmt = $conn->prepare("UPDATE trimestres SET " . implode(", ", $updates) . " WHERE id = ?");
    $stmt->bind_param($types, ...$values);
    $stmt->execute();

    echo json_encode(['success' => true]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
$db->closeConnection();
?>