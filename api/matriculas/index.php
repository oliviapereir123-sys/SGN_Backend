<?php
/**
 * API de Matrículas — GET/POST/PUT/DELETE
 * Admin: acesso total
 * Aluno: só pode ver a sua própria matrícula
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth   = Auth::requireRole('admin', 'aluno');
$db     = new Database();
$conn   = $db->connect();
$method = $_SERVER['REQUEST_METHOD'];
$isAdmin= $auth['type'] === 'admin';

// ─── GET ────────────────────────────────────────────────────
if ($method === 'GET') {
    // Aluno só vê as suas
    if (!$isAdmin) {
        $stmt = $conn->prepare("
            SELECT m.id, m.data_matricula, m.tipo, m.estado, m.observacoes, m.criado_em,
                   t.nome AS turma_nome, c.nome AS curso_nome, al.nome AS ano_lectivo
            FROM matriculas m
            JOIN turmas t        ON m.turma_id       = t.id
            JOIN cursos c        ON t.curso_id        = c.id
            JOIN anos_lectivos al ON m.ano_lectivo_id = al.id
            WHERE m.aluno_id = ?
            ORDER BY m.criado_em DESC
        ");
        $stmt->bind_param('i', $auth['id']);
        $stmt->execute();
        echo json_encode(['success' => true, 'data' => $stmt->get_result()->fetch_all(MYSQLI_ASSOC)]);
        exit();
    }

    // Admin: filtros
    $alunoId     = intval($_GET['alunoId']      ?? 0);
    $turmaId     = intval($_GET['turmaId']       ?? 0);
    $anoId       = intval($_GET['anoLectivoId']  ?? 0);
    $estado      = trim($_GET['estado']          ?? '');
    $search      = trim($_GET['search']          ?? '');

    $where  = [];
    $params = [];
    $types  = '';

    if ($alunoId)  { $where[] = 'm.aluno_id = ?';        $params[] = $alunoId;  $types .= 'i'; }
    if ($turmaId)  { $where[] = 'm.turma_id = ?';        $params[] = $turmaId;  $types .= 'i'; }
    if ($anoId)    { $where[] = 'm.ano_lectivo_id = ?';  $params[] = $anoId;    $types .= 'i'; }
    if ($estado)   { $where[] = 'm.estado = ?';          $params[] = $estado;   $types .= 's'; }
    if ($search)   {
        $like = '%' . $search . '%';
        $where[] = '(a.nome LIKE ? OR a.numero LIKE ?)';
        $params[] = $like; $params[] = $like;
        $types .= 'ss';
    }

    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $stmt = $conn->prepare("
        SELECT m.id, m.data_matricula, m.tipo, m.estado, m.observacoes, m.criado_em,
               a.id AS aluno_id, a.nome AS aluno_nome, a.numero AS aluno_numero,
               t.nome AS turma_nome, t.ano AS turma_ano,
               c.nome AS curso_nome,
               al.nome AS ano_lectivo,
               adm.nome AS registado_por_nome
        FROM matriculas m
        JOIN alunos a        ON m.aluno_id       = a.id
        JOIN turmas t        ON m.turma_id       = t.id
        JOIN cursos c        ON t.curso_id        = c.id
        JOIN anos_lectivos al ON m.ano_lectivo_id = al.id
        LEFT JOIN admin adm  ON m.registado_por  = adm.id
        $whereSQL
        ORDER BY m.criado_em DESC
        LIMIT 500
    ");
    if ($types) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Estatísticas
    $stats = $conn->query("
        SELECT
            COUNT(*) AS total,
            SUM(estado='Activa') AS activas,
            SUM(estado='Cancelada') AS canceladas,
            SUM(estado='Transferida') AS transferidas
        FROM matriculas m
        JOIN anos_lectivos al ON m.ano_lectivo_id = al.id
        WHERE al.estado = 'Activo'
    ")->fetch_assoc();

    echo json_encode(['success' => true, 'data' => $rows, 'stats' => $stats]);
    exit();
}

// ─── POST: criar matrícula ───────────────────────────────────
if ($method === 'POST' && $isAdmin) {
    $input        = json_decode(file_get_contents('php://input'), true);
    $alunoId      = intval($input['aluno_id']       ?? 0);
    $turmaId      = intval($input['turma_id']        ?? 0);
    $anoId        = intval($input['ano_lectivo_id']  ?? 0);
    $tipo         = $input['tipo']        ?? 'Renovacao';
    $estado       = $input['estado']      ?? 'Activa';
    $observacoes  = trim($input['observacoes'] ?? '') ?: null;
    $adminId      = intval($auth['id']);

    if (!$alunoId || !$turmaId || !$anoId) {
        http_response_code(400);
        echo json_encode(['error' => 'aluno_id, turma_id e ano_lectivo_id são obrigatórios']);
        exit();
    }

    // Verificar se já existe matrícula para este aluno/ano
    $chk = $conn->prepare("SELECT id FROM matriculas WHERE aluno_id = ? AND ano_lectivo_id = ?");
    $chk->bind_param('ii', $alunoId, $anoId);
    $chk->execute();
    if ($chk->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Aluno já tem matrícula para este ano lectivo']);
        exit();
    }

    $stmt = $conn->prepare("
        INSERT INTO matriculas (aluno_id, turma_id, ano_lectivo_id, tipo, estado, observacoes, registado_por, data_matricula)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)
    ");
    $stmt->bind_param('iiiisssi', $alunoId, $turmaId, $anoId, $tipo, $estado, $observacoes, $adminId);

    if ($stmt->execute()) {
        // Actualizar turma do aluno
        $conn->prepare("UPDATE alunos SET turma_id = ? WHERE id = ?")->bind_param('ii', $turmaId, $alunoId);
        $conn->prepare("UPDATE alunos SET turma_id = ? WHERE id = ?")->execute();
        $upd = $conn->prepare("UPDATE alunos SET turma_id = ? WHERE id = ?");
        $upd->bind_param('ii', $turmaId, $alunoId);
        $upd->execute();

        echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao criar matrícula: ' . $conn->error]);
    }
    exit();
}

// ─── PUT: actualizar estado/turma ────────────────────────────
if ($method === 'PUT' && $isAdmin) {
    $input  = json_decode(file_get_contents('php://input'), true);
    $id     = intval($input['id'] ?? 0);

    if (!$id) { http_response_code(400); echo json_encode(['error' => 'id obrigatório']); exit(); }

    $updates = [];
    $params  = [];
    $types   = '';

    if (isset($input['estado']))     { $updates[] = 'estado = ?';      $params[] = $input['estado'];          $types .= 's'; }
    if (isset($input['turma_id']))   { $updates[] = 'turma_id = ?';    $params[] = intval($input['turma_id']); $types .= 'i'; }
    if (isset($input['observacoes'])){ $updates[] = 'observacoes = ?'; $params[] = $input['observacoes'];     $types .= 's'; }

    if (!$updates) { http_response_code(400); echo json_encode(['error' => 'Nada para actualizar']); exit(); }

    $params[] = $id;
    $types   .= 'i';
    $stmt     = $conn->prepare('UPDATE matriculas SET ' . implode(', ', $updates) . ' WHERE id = ?');
    $stmt->bind_param($types, ...$params);
    $stmt->execute();

    echo json_encode(['success' => true]);
    exit();
}

// ─── DELETE ──────────────────────────────────────────────────
if ($method === 'DELETE' && $isAdmin) {
    $id = intval($_GET['id'] ?? 0);
    if ($id) {
        $conn->query("DELETE FROM matriculas WHERE id = $id");
    }
    echo json_encode(['success' => true]);
    exit();
}

http_response_code($isAdmin ? 405 : 403);
echo json_encode(['error' => $isAdmin ? 'Método não permitido' : 'Sem permissão']);
$db->closeConnection();
?>
