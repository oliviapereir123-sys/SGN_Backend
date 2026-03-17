<?php
/**
 * API Cursos — GET / POST / PUT / DELETE
 * Utilizado por disciplinas e turmas para popular selects
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

Auth::requireRole('admin');
$db     = new Database();
$conn   = $db->connect();
$method = $_SERVER['REQUEST_METHOD'];

// ─── GET: listar cursos ──────────────────────────────────────
if ($method === 'GET') {
    $apenasActivos = ($_GET['activos'] ?? '') === '1';

    $where = $apenasActivos ? "WHERE estado = 'Activo'" : '';

    $rows = $conn->query("
        SELECT
            c.id,
            c.nome,
            c.sigla,
            c.estado,
            COUNT(DISTINCT d.id) AS total_disciplinas,
            COUNT(DISTINCT t.id) AS total_turmas
        FROM cursos c
        LEFT JOIN disciplinas d ON d.curso_id = c.id
        LEFT JOIN turmas      t ON t.curso_id = c.id
        $where
        GROUP BY c.id, c.nome, c.sigla, c.estado
        ORDER BY c.nome
    ")->fetch_all(MYSQLI_ASSOC);

    foreach ($rows as &$r) {
        $r['id']                = intval($r['id']);
        $r['total_disciplinas'] = intval($r['total_disciplinas']);
        $r['total_turmas']      = intval($r['total_turmas']);
    }

    echo json_encode(['success' => true, 'data' => $rows]);
    exit();
}

// ─── POST: criar curso ───────────────────────────────────────
if ($method === 'POST') {
    $data  = json_decode(file_get_contents('php://input'), true);
    $nome  = trim($data['nome']  ?? '');
    $sigla = strtoupper(trim($data['sigla'] ?? ''));

    if (!$nome || !$sigla) {
        http_response_code(400);
        echo json_encode(['error' => 'nome e sigla são obrigatórios']);
        exit();
    }

    $stmt = $conn->prepare('INSERT INTO cursos (nome, sigla) VALUES (?, ?)');
    $stmt->bind_param('ss', $nome, $sigla);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    } else {
        http_response_code(409);
        echo json_encode(['error' => 'Curso já existe com esse nome ou sigla']);
    }
    exit();
}

// ─── PUT: editar curso ───────────────────────────────────────
if ($method === 'PUT') {
    $data  = json_decode(file_get_contents('php://input'), true);
    $id    = intval($data['id']    ?? 0);
    $nome  = trim($data['nome']   ?? '');
    $sigla = strtoupper(trim($data['sigla'] ?? ''));
    $estado = $data['estado'] ?? 'Activo';

    if (!$id || !$nome || !$sigla) {
        http_response_code(400);
        echo json_encode(['error' => 'id, nome e sigla são obrigatórios']);
        exit();
    }

    $stmt = $conn->prepare('UPDATE cursos SET nome=?, sigla=?, estado=? WHERE id=?');
    $stmt->bind_param('sssi', $nome, $sigla, $estado, $id);
    $stmt->execute();

    echo json_encode(['success' => true]);
    exit();
}

// ─── DELETE: desactivar curso ────────────────────────────────
if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id é obrigatório']);
        exit();
    }

    // Verificar se tem turmas ou disciplinas activas
    $check = $conn->query("
        SELECT
            (SELECT COUNT(*) FROM turmas      WHERE curso_id=$id AND estado='Activa') AS turmas,
            (SELECT COUNT(*) FROM disciplinas WHERE curso_id=$id)                     AS disciplinas
    ")->fetch_assoc();

    if ($check['turmas'] > 0 || $check['disciplinas'] > 0) {
        http_response_code(409);
        echo json_encode([
            'error' => "Não é possível remover: curso tem {$check['turmas']} turma(s) e {$check['disciplinas']} disciplina(s) associada(s)"
        ]);
        exit();
    }

    $conn->query("UPDATE cursos SET estado='Inactivo' WHERE id=$id");
    echo json_encode(['success' => true]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
$db->closeConnection();
?>
