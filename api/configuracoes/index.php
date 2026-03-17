<?php
/**
 * API de Configurações do Sistema
 * GET  — listar todas (admin) ou subset público
 * PUT  — actualizar (admin only)
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$db     = new Database();
$conn   = $db->connect();
$method = $_SERVER['REQUEST_METHOD'];

// GET público para algumas configs (nome escola, etc.)
if ($method === 'GET') {
    $auth = Auth::requireRole('admin', 'professor', 'aluno', 'encarregado');
    $grupo = trim($_GET['grupo'] ?? '');

    $sql = "SELECT chave, valor, descricao, tipo, grupo FROM configuracoes";
    if ($grupo) $sql .= " WHERE grupo = '" . $conn->real_escape_string($grupo) . "'";
    $sql .= " ORDER BY grupo, chave";

    $rows = $conn->query($sql)->fetch_all(MYSQLI_ASSOC);

    // Converter tipos
    foreach ($rows as &$r) {
        if ($r['tipo'] === 'numero')   $r['valor'] = floatval($r['valor']);
        if ($r['tipo'] === 'booleano') $r['valor'] = (bool)intval($r['valor']);
        if ($r['tipo'] === 'json')     $r['valor'] = json_decode($r['valor'], true);
    }

    // Formato conveniente: { chave: valor }
    $mapa = [];
    foreach ($rows as $r) $mapa[$r['chave']] = $r['valor'];

    echo json_encode(['success' => true, 'data' => $rows, 'mapa' => $mapa]);
    exit();
}

// PUT — apenas admin
if ($method === 'PUT') {
    $auth = Auth::requireRole('admin');
    $input = json_decode(file_get_contents('php://input'), true);

    // Pode enviar array de {chave, valor} ou par único
    $items = isset($input[0]) ? $input : [$input];

    $stmt = $conn->prepare("UPDATE configuracoes SET valor = ? WHERE chave = ?");
    $actualizados = 0;

    foreach ($items as $item) {
        $chave = trim($item['chave'] ?? '');
        $valor = $item['valor'] ?? null;
        if (!$chave || $valor === null) continue;

        // Serializar se for array/object
        if (is_array($valor) || is_object($valor)) $valor = json_encode($valor);
        $valor = (string)$valor;

        $stmt->bind_param('ss', $valor, $chave);
        $stmt->execute();
        $actualizados += $stmt->affected_rows;
    }

    echo json_encode(['success' => true, 'actualizados' => $actualizados]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
$db->closeConnection();
?>
