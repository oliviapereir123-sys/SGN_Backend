<?php
require_once '../../config/Headers.php';
require_once '../../config/Database.php';
require_once '../../config/Auth.php';

$auth = Auth::requireRole('admin');

$db = new Database();
$conn = $db->connect();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['notaId']) || empty($data['estado']) || empty($data['adminId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'notaId, estado e adminId são obrigatórios']);
    exit();
}

$estados_validos = ['Aprovado', 'Rejeitado'];
if (!in_array($data['estado'], $estados_validos)) {
    http_response_code(400);
    echo json_encode(['error' => 'Estado inválido']);
    exit();
}

$stmt = $conn->prepare("
    UPDATE notas 
    SET estado = ?, observacoes = ?, data_validacao = NOW(), validado_por = ?
    WHERE id = ? AND estado = 'Pendente'
");

$observacoes = $data['observacoes'] ?? null;
$stmt->bind_param("ssii", $data['estado'], $observacoes, $data['adminId'], $data['notaId']);
$stmt->execute();

if ($stmt->affected_rows === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'Nota não encontrada ou já processada']);
    exit();
}

echo json_encode(['success' => true, 'message' => "Nota {$data['estado']} com sucesso"]);
$db->closeConnection();
?>
