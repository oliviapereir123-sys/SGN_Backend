<?php
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('admin');
$db   = new Database();
$conn = $db->connect();

$method = $_SERVER['REQUEST_METHOD'];

// ─── GET: listar alunos com filtros, pesquisa e paginação ────
if ($method === 'GET') {

    $pagina  = max(1, intval($_GET['pagina']  ?? 1));
    $limite  = max(1, min(100, intval($_GET['limite'] ?? 10)));
    $offset  = ($pagina - 1) * $limite;

    $search  = trim($_GET['search']  ?? '');
    $turmaId = intval($_GET['turmaId'] ?? 0);
    $estado  = trim($_GET['estado']    ?? '');

    // Construir cláusula WHERE dinamicamente
    $where   = ['1=1'];
    $params  = [];
    $types   = '';

    if ($search !== '') {
        $like      = '%' . $search . '%';
        $where[]   = '(a.nome LIKE ? OR a.email LIKE ? OR a.numero LIKE ?)';
        $params[]  = $like;
        $params[]  = $like;
        $params[]  = $like;
        $types    .= 'sss';
    }

    if ($turmaId > 0) {
        $where[]  = 'a.turma_id = ?';
        $params[] = $turmaId;
        $types   .= 'i';
    }

    $estados_validos = ['Activo', 'Inactivo', 'Suspenso'];
    if ($estado !== '' && in_array($estado, $estados_validos)) {
        $where[]  = 'a.estado = ?';
        $params[] = $estado;
        $types   .= 's';
    }

    $whereSQL = implode(' AND ', $where);

    // Total sem paginação
    $stmtCount = $conn->prepare("SELECT COUNT(*) AS total FROM alunos a WHERE $whereSQL");
    if ($types !== '') $stmtCount->bind_param($types, ...$params);
    $stmtCount->execute();
    $total = intval($stmtCount->get_result()->fetch_assoc()['total']);

    // Dados paginados
    $sql = "
        SELECT
            a.id, a.numero, a.nome, a.email,
            a.telefone, a.data_nascimento,
            a.turma_id, a.estado, a.foto, a.criado_em,
            t.nome  AS turma_nome,
            c.nome  AS curso_nome,
            c.sigla AS curso_sigla
        FROM alunos a
        LEFT JOIN turmas t ON a.turma_id = t.id
        LEFT JOIN cursos c ON t.curso_id = c.id
        WHERE $whereSQL
        ORDER BY a.nome
        LIMIT ? OFFSET ?
    ";

    $paramsPag   = array_merge($params, [$limite, $offset]);
    $typesPag    = $types . 'ii';

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($typesPag, ...$paramsPag);
    $stmt->execute();
    $alunos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Tipagem correcta
    foreach ($alunos as &$a) {
        $a['id']       = intval($a['id']);
        $a['turma_id'] = $a['turma_id'] ? intval($a['turma_id']) : null;
    }

    echo json_encode([
        'success'  => true,
        'data'     => $alunos,
        'total'    => $total,
        'pagina'   => $pagina,
        'limite'   => $limite,
        'paginas'  => (int) ceil($total / $limite),
    ]);
    exit();
}

// ─── POST: criar novo aluno ──────────────────────────────────
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $nome    = trim($data['nome']    ?? '');
    $email   = trim($data['email']   ?? '');
    $numero  = trim($data['numero']  ?? '');
    $turmaId = intval($data['turma_id'] ?? 0) ?: null;
    $estado  = $data['estado'] ?? 'Activo';
    $pass    = $data['password'] ?? 'Aluno@' . rand(1000, 9999);

    if (!$nome || !$email || !$numero) {
        http_response_code(400);
        echo json_encode(['error' => 'nome, email e numero são obrigatórios']);
        exit();
    }

    $estados_validos = ['Activo', 'Inactivo', 'Suspenso'];
    if (!in_array($estado, $estados_validos)) $estado = 'Activo';

    $hash = password_hash($pass, PASSWORD_BCRYPT);
    $stmt = $conn->prepare(
        'INSERT INTO alunos (numero, nome, email, password, turma_id, estado) VALUES (?,?,?,?,?,?)'
    );
    $stmt->bind_param('ssssss', $numero, $nome, $email, $hash, $turmaId, $estado);

    if ($stmt->execute()) {
        $alunoId = $conn->insert_id;

        // Criar encarregado se fornecido
        if (!empty($data['enc_nome']) && !empty($data['enc_email'])) {
            $encNome     = trim($data['enc_nome']);
            $encEmail    = trim($data['enc_email']);
            $encParent   = $data['enc_parentesco'] ?? 'Encarregado';
            $encPass     = 'Enc@' . rand(1000, 9999);
            $encHash     = password_hash($encPass, PASSWORD_BCRYPT);
            $stmtEnc     = $conn->prepare(
                'INSERT INTO encarregados (nome, email, password, aluno_id, parentesco) VALUES (?,?,?,?,?)'
            );
            $stmtEnc->bind_param('sssss', $encNome, $encEmail, $encHash, $alunoId, $encParent);
            $stmtEnc->execute();
        }

        echo json_encode([
            'success'          => true,
            'id'               => $alunoId,
            'password_gerada'  => $pass,
        ]);
    } else {
        http_response_code(409);
        echo json_encode(['error' => 'Email ou número já existe']);
    }
    exit();
}

// ─── PUT: editar aluno ───────────────────────────────────────
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = intval($data['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id é obrigatório']);
        exit();
    }

    $nome        = trim($data['nome']            ?? '');
    $email       = trim($data['email']           ?? '');
    $numero      = trim($data['numero']          ?? '');
    $turmaId     = intval($data['turma_id']      ?? 0) ?: null;
    $estado      = $data['estado']               ?? 'Activo';
    $telefone    = trim($data['telefone']        ?? '') ?: null;
    $dataNasc    = trim($data['data_nascimento'] ?? '') ?: null;

    $estados_validos = ['Activo', 'Inactivo', 'Suspenso'];
    if (!in_array($estado, $estados_validos)) $estado = 'Activo';

    $stmt = $conn->prepare(
        'UPDATE alunos SET nome=?, email=?, numero=?, turma_id=?, estado=?, telefone=?, data_nascimento=? WHERE id=?'
    );
    $stmt->bind_param('sssssss' . 'i', $nome, $email, $numero, $turmaId, $estado, $telefone, $dataNasc, $id);
    $stmt->execute();

    echo json_encode(['success' => true]);
    exit();
}

// ─── DELETE: desactivar aluno (soft delete) ──────────────────
if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id é obrigatório']);
        exit();
    }

    $conn->prepare("UPDATE alunos SET estado='Inactivo' WHERE id=?")->bind_param('i', $id);
    $conn->query("UPDATE alunos SET estado='Inactivo' WHERE id=$id");
    echo json_encode(['success' => true]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
$db->closeConnection();
?>