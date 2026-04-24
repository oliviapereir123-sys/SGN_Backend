<?php
/**
 * API Anos Lectivos + Trimestres — GET / POST / PUT / DELETE
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

Auth::requireRole('admin');
$db     = new Database();
$conn   = $db->connect();
$method = $_SERVER['REQUEST_METHOD'];

// ─── GET ─────────────────────────────────────────────────────
if ($method === 'GET') {
    $anos = $conn->query("
        SELECT id, nome, inicio, fim, estado
        FROM anos_lectivos
        ORDER BY inicio DESC
    ")->fetch_all(MYSQLI_ASSOC);

    foreach ($anos as &$a) {
        $a['id'] = intval($a['id']);
        $aid = $a['id'];
        $trims = $conn->query("
            SELECT id, nome, inicio, fim, estado, bloqueado
            FROM trimestres
            WHERE ano_lectivo_id = $aid
            ORDER BY id
        ")->fetch_all(MYSQLI_ASSOC);
        foreach ($trims as &$t) {
            $t['id']       = intval($t['id']);
            $t['bloqueado'] = intval($t['bloqueado']);
        }
        $a['trimestres'] = $trims;
    }

    echo json_encode(['success' => true, 'data' => $anos]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

// ─── POST: criar ano lectivo ─────────────────────────────────
if ($method === 'POST') {
    $nome   = trim($data['nome']   ?? '');
    $inicio = trim($data['inicio'] ?? '');
    $fim    = trim($data['fim']    ?? '');
    $estado = $data['estado'] ?? 'Pendente';

    if (!$nome || !$inicio || !$fim) {
        http_response_code(400);
        echo json_encode(['error' => 'nome, inicio e fim são obrigatórios']);
        exit();
    }

    $stmt = $conn->prepare("INSERT INTO anos_lectivos (nome, inicio, fim, estado) VALUES (?, ?, ?, ?)");
    $stmt->bind_param('ssss', $nome, $inicio, $fim, $estado);

    if (!$stmt->execute()) {
        http_response_code(409);
        echo json_encode(['error' => 'Ano lectivo já existe com esse nome']);
        exit();
    }

    $anoId = $conn->insert_id;

    // Criar trimestres padrão se enviados
    if (!empty($data['trimestres']) && is_array($data['trimestres'])) {
        $st = $conn->prepare("INSERT INTO trimestres (nome, ano_lectivo_id, inicio, fim, estado) VALUES (?, ?, ?, ?, ?)");
        foreach ($data['trimestres'] as $t) {
            $tnome   = trim($t['nome']   ?? '');
            $tinicio = trim($t['inicio'] ?? '');
            $tfim    = trim($t['fim']    ?? '');
            $testado = $t['estado'] ?? 'Pendente';
            if ($tnome && $tinicio && $tfim) {
                $st->bind_param('sisss', $tnome, $anoId, $tinicio, $tfim, $testado);
                $st->execute();
            }
        }
    }

    echo json_encode(['success' => true, 'id' => $anoId]);
    exit();
}

// ─── PUT: editar ano lectivo ou trimestre ────────────────────
if ($method === 'PUT') {
    $tipo = $data['tipo'] ?? 'ano'; // 'ano' ou 'trimestre'

    if ($tipo === 'trimestre') {
        $id       = intval($data['id'] ?? 0);
        $estado   = $data['estado']   ?? null;
        $bloq     = isset($data['bloqueado']) ? intval($data['bloqueado']) : null;

        if (!$id) { http_response_code(400); echo json_encode(['error' => 'id obrigatório']); exit(); }

        $sets = []; $types = ''; $vals = [];
        if ($estado !== null)  { $sets[] = 'estado = ?';    $types .= 's'; $vals[] = $estado; }
        if ($bloq !== null)    { $sets[] = 'bloqueado = ?'; $types .= 'i'; $vals[] = $bloq; }
        if (isset($data['nome']))   { $sets[] = 'nome = ?';   $types .= 's'; $vals[] = $data['nome']; }
        if (isset($data['inicio'])) { $sets[] = 'inicio = ?'; $types .= 's'; $vals[] = $data['inicio']; }
        if (isset($data['fim']))    { $sets[] = 'fim = ?';    $types .= 's'; $vals[] = $data['fim']; }

        if (empty($sets)) { http_response_code(400); echo json_encode(['error' => 'Nada para actualizar']); exit(); }

        $vals[] = $id; $types .= 'i';
        $stmt = $conn->prepare("UPDATE trimestres SET " . implode(', ', $sets) . " WHERE id = ?");
        $stmt->bind_param($types, ...$vals);
        $stmt->execute();
        echo json_encode(['success' => true]);
        exit();
    }

    // tipo = 'ano'
    $id     = intval($data['id']    ?? 0);
    $nome   = trim($data['nome']   ?? '');
    $inicio = trim($data['inicio'] ?? '');
    $fim    = trim($data['fim']    ?? '');
    $estado = $data['estado'] ?? 'Activo';

    if (!$id || !$nome || !$inicio || !$fim) {
        http_response_code(400);
        echo json_encode(['error' => 'id, nome, inicio e fim são obrigatórios']);
        exit();
    }

    $stmt = $conn->prepare("UPDATE anos_lectivos SET nome=?, inicio=?, fim=?, estado=? WHERE id=?");
    $stmt->bind_param('ssssi', $nome, $inicio, $fim, $estado, $id);
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit();
}

// ─── DELETE: remover ano lectivo ─────────────────────────────
if ($method === 'DELETE') {
    $id   = intval($_GET['id']   ?? 0);
    $tipo = $_GET['tipo'] ?? 'ano';

    if (!$id) { http_response_code(400); echo json_encode(['error' => 'id obrigatório']); exit(); }

    if ($tipo === 'trimestre') {
        $check = $conn->query("SELECT COUNT(*) AS c FROM notas WHERE trimestre_id = $id")->fetch_assoc();
        if ($check['c'] > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Trimestre tem notas associadas e não pode ser removido']);
            exit();
        }
        $conn->query("DELETE FROM trimestres WHERE id = $id");
        echo json_encode(['success' => true]);
        exit();
    }

    $check = $conn->query("SELECT COUNT(*) AS c FROM trimestres WHERE ano_lectivo_id = $id")->fetch_assoc();
    if ($check['c'] > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Ano lectivo tem trimestres associados. Remova primeiro os trimestres.']);
        exit();
    }

    $conn->query("DELETE FROM anos_lectivos WHERE id = $id");
    echo json_encode(['success' => true]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
$db->closeConnection();
?>
