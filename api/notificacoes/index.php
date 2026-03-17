<?php
/**
 * API de Notificações
 * GET  — listar as minhas notificações
 * POST — criar (admin/professor)
 * PUT  — marcar como lida
 * DELETE ?id=X — apagar
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth   = Auth::requireRole('aluno', 'professor', 'admin', 'encarregado');
$db     = new Database();
$conn   = $db->connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->prepare("
        SELECT id, titulo, mensagem, tipo, lida, criado_em
        FROM notificacoes
        WHERE destinatario_id = ? AND destinatario_tipo = ?
        ORDER BY criado_em DESC LIMIT 50
    ");
    $stmt->bind_param('is', $auth['id'], $auth['type']);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    foreach ($rows as &$r) $r['lida'] = (bool)$r['lida'];
    $naoLidas = count(array_filter($rows, fn($r) => !$r['lida']));
    echo json_encode(['success' => true, 'data' => $rows, 'nao_lidas' => $naoLidas]);
    exit();
}

if ($method === 'POST') {
    if (!in_array($auth['type'], ['admin', 'professor'])) {
        http_response_code(403); echo json_encode(['error' => 'Sem permissão']); exit();
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $destId   = intval($input['destinatario_id']   ?? 0);
    $destTipo = trim($input['destinatario_tipo']   ?? '');
    $titulo   = trim($input['titulo']              ?? '');
    $mensagem = trim($input['mensagem']            ?? '');
    $tipo     = in_array($input['tipo'] ?? '', ['info','aviso','sucesso','erro']) ? $input['tipo'] : 'info';

    if (!$destId || !$destTipo || !$titulo || !$mensagem) {
        http_response_code(400);
        echo json_encode(['error' => 'destinatario_id, destinatario_tipo, titulo e mensagem são obrigatórios']);
        exit();
    }
    $stmt = $conn->prepare("INSERT INTO notificacoes (destinatario_id, destinatario_tipo, titulo, mensagem, tipo) VALUES (?,?,?,?,?)");
    $stmt->bind_param('issss', $destId, $destTipo, $titulo, $mensagem, $tipo);
    $stmt->execute();
    echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    exit();
}

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!empty($input['todos'])) {
        $stmt = $conn->prepare("UPDATE notificacoes SET lida=1 WHERE destinatario_id=? AND destinatario_tipo=?");
        $stmt->bind_param('is', $auth['id'], $auth['type']);
    } else {
        $id   = intval($input['id'] ?? 0);
        $stmt = $conn->prepare("UPDATE notificacoes SET lida=1 WHERE id=? AND destinatario_id=?");
        $stmt->bind_param('ii', $id, $auth['id']);
    }
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit();
}

if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if ($id) {
        $stmt = $conn->prepare("DELETE FROM notificacoes WHERE id=? AND destinatario_id=?");
        $stmt->bind_param('ii', $id, $auth['id']);
        $stmt->execute();
    }
    echo json_encode(['success' => true]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
$db->closeConnection();
?>
