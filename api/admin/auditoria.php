<?php
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('admin');
$db   = new Database();
$conn = $db->connect();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $pagina = intval($_GET['pagina'] ?? 1);
    $limite = 50;
    $offset = ($pagina - 1) * $limite;

    $total = $conn->query("SELECT COUNT(*) AS c FROM auditoria_notas")->fetch_assoc()['c'];
    $stmt  = $conn->prepare("SELECT * FROM auditoria_notas ORDER BY criado_em DESC LIMIT ? OFFSET ?");
    $stmt->bind_param("ii", $limite, $offset);
    $stmt->execute();
    $registos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    echo json_encode([
        'success'  => true,
        'data'     => $registos,
        'total'    => intval($total),
        'pagina'   => $pagina,
        'paginas'  => ceil($total / $limite),
    ]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
$db->closeConnection();
?>