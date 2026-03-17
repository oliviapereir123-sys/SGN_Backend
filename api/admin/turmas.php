<?php
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('admin');
$db   = new Database();
$conn = $db->connect();

$method = $_SERVER['REQUEST_METHOD'];

// ─── GET: listar turmas ──────────────────────────────────────
if ($method === 'GET') {

    $search = trim($_GET['search'] ?? '');
    $ano    = intval($_GET['ano']  ?? 0);

    $where  = ['1=1'];
    $params = [];
    $types  = '';

    if ($search !== '') {
        $like     = '%' . $search . '%';
        $where[]  = '(t.nome LIKE ? OR c.nome LIKE ?)';
        $params[] = $like;
        $params[] = $like;
        $types   .= 'ss';
    }

    if ($ano > 0) {
        $where[]  = 't.ano = ?';
        $params[] = $ano;
        $types   .= 'i';
    }

    $whereSQL = implode(' AND ', $where);

    $sql = "
        SELECT
            t.id, t.nome, t.ano, t.turno, t.sala,
            t.periodo, t.capacidade, t.estado,
            c.id   AS curso_id,
            c.nome AS curso_nome,
            c.sigla AS curso_sigla,
            (SELECT COUNT(*) FROM alunos a WHERE a.turma_id = t.id AND a.estado = 'Activo')
                AS total_alunos,
            (SELECT COUNT(DISTINCT pdt.disciplina_id)
             FROM professor_disciplina_turma pdt
             WHERE pdt.turma_id = t.id)
                AS total_disciplinas
        FROM turmas t
        JOIN cursos c ON t.curso_id = c.id
        WHERE $whereSQL
        ORDER BY t.nome
    ";

    $stmt = $conn->prepare($sql);
    if ($types !== '') $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $turmas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Buscar nomes das disciplinas de cada turma (max 3)
    foreach ($turmas as &$t) {
        $tid   = intval($t['id']);
        $discs = $conn->query("
            SELECT DISTINCT d.nome
            FROM professor_disciplina_turma pdt
            JOIN disciplinas d ON pdt.disciplina_id = d.id
            WHERE pdt.turma_id = $tid
            ORDER BY d.nome
            LIMIT 3
        ");
        $t['disciplinas_preview'] = array_column($discs->fetch_all(MYSQLI_ASSOC), 'nome');
        $t['id']              = intval($t['id']);
        $t['ano']             = intval($t['ano']);
        $t['total_alunos']    = intval($t['total_alunos']);
        $t['total_disciplinas'] = intval($t['total_disciplinas']);
    }

    // Estatísticas globais
    $stats = $conn->query("
        SELECT
            COUNT(*) AS total_turmas,
            SUM((SELECT COUNT(*) FROM alunos a WHERE a.turma_id = t.id AND a.estado = 'Activo')) AS total_alunos,
            (SELECT COUNT(DISTINCT disciplina_id) FROM professor_disciplina_turma) AS total_disciplinas_vinculadas
        FROM turmas t
    ")->fetch_assoc();

    echo json_encode([
        'success' => true,
        'data'    => $turmas,
        'stats'   => [
            'total_turmas'               => intval($stats['total_turmas']),
            'total_alunos'               => intval($stats['total_alunos']),
            'total_disciplinas_vinculadas' => intval($stats['total_disciplinas_vinculadas']),
        ],
    ]);
    exit();
}

// ─── POST: criar nova turma ──────────────────────────────────
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $nome      = trim($data['nome']       ?? '');
    $cursoId   = intval($data['curso_id'] ?? 0);
    $ano       = intval($data['ano']      ?? 0);
    $turno     = trim($data['turno']      ?? 'Matutino');
    $periodo   = trim($data['periodo']    ?? 'Matutino');
    $sala      = trim($data['sala']       ?? '') ?: null;
    $capacidade = intval($data['capacidade'] ?? 30);

    if (!$nome || !$cursoId || !$ano) {
        http_response_code(400);
        echo json_encode(['error' => 'nome, curso_id e ano são obrigatórios']);
        exit();
    }

    $stmt = $conn->prepare(
        'INSERT INTO turmas (nome, curso_id, ano, turno, periodo, sala, capacidade) VALUES (?,?,?,?,?,?,?)'
    );
    $stmt->bind_param('siisssi', $nome, $cursoId, $ano, $turno, $periodo, $sala, $capacidade);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    } else {
        http_response_code(409);
        echo json_encode(['error' => 'Turma já existe com esse nome']);
    }
    exit();
}

// ─── PUT: editar turma ───────────────────────────────────────
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = intval($data['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id é obrigatório']);
        exit();
    }

    $nome      = trim($data['nome']       ?? '');
    $cursoId   = intval($data['curso_id'] ?? 0);
    $ano       = intval($data['ano']      ?? 0);
    $turno     = trim($data['turno']      ?? 'Matutino');
    $periodo   = trim($data['periodo']    ?? 'Matutino');
    $sala      = trim($data['sala']       ?? '') ?: null;
    $capacidade = intval($data['capacidade'] ?? 30);
    $estado    = $data['estado'] ?? 'Activa';

    $stmt = $conn->prepare(
        'UPDATE turmas SET nome=?, curso_id=?, ano=?, turno=?, periodo=?, sala=?, capacidade=?, estado=? WHERE id=?'
    );
    $stmt->bind_param('siisssisi', $nome, $cursoId, $ano, $turno, $periodo, $sala, $capacidade, $estado, $id);
    $stmt->execute();

    echo json_encode(['success' => true]);
    exit();
}

// ─── DELETE: desactivar turma ────────────────────────────────
if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id é obrigatório']);
        exit();
    }

    // Verificar se tem alunos activos
    $check = $conn->prepare('SELECT COUNT(*) AS c FROM alunos WHERE turma_id=? AND estado="Activo"');
    $check->bind_param('i', $id);
    $check->execute();
    $count = intval($check->get_result()->fetch_assoc()['c']);

    if ($count > 0) {
        http_response_code(409);
        echo json_encode(['error' => "Não é possível remover: turma tem $count aluno(s) activo(s)"]);
        exit();
    }

    $conn->query("UPDATE turmas SET estado='Inactiva' WHERE id=$id");
    echo json_encode(['success' => true]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
$db->closeConnection();
?>