<?php
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('professor', 'admin');
$db   = new Database();
$conn = $db->connect();

$method      = $_SERVER['REQUEST_METHOD'];
$professorId = intval($auth['id']);
$isAdmin     = $auth['type'] === 'admin';

// ─── GET: listar avaliações ──────────────────────────────────
if ($method === 'GET') {

    $disciplinaId = intval($_GET['disciplinaId'] ?? 0);
    $turmaId      = intval($_GET['turmaId']      ?? 0);
    $trimestreId  = intval($_GET['trimestreId']  ?? 0);
    $search       = trim($_GET['search']         ?? '');

    $where  = [];
    $params = [];
    $types  = '';

    // Professor só vê as suas próprias avaliações
    if (!$isAdmin) {
        $where[]  = 'av.professor_id = ?';
        $params[] = $professorId;
        $types   .= 'i';
    }

    if ($disciplinaId > 0) {
        $where[]  = 'av.disciplina_id = ?';
        $params[] = $disciplinaId;
        $types   .= 'i';
    }
    if ($turmaId > 0) {
        $where[]  = 'av.turma_id = ?';
        $params[] = $turmaId;
        $types   .= 'i';
    }
    if ($trimestreId > 0) {
        $where[]  = 'av.trimestre_id = ?';
        $params[] = $trimestreId;
        $types   .= 'i';
    }
    if ($search !== '') {
        $like     = '%' . $search . '%';
        $where[]  = 'av.nome LIKE ?';
        $params[] = $like;
        $types   .= 's';
    }

    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $sql = "
        SELECT
            av.id, av.nome, av.tipo, av.peso, av.data_entrega, av.descricao, av.estado,
            d.id   AS disciplina_id,
            d.nome AS disciplina_nome,
            t.id   AS turma_id,
            t.nome AS turma_nome,
            p.nome AS professor_nome,
            tr.id   AS trimestre_id,
            tr.nome AS trimestre_nome
        FROM avaliacoes av
        JOIN disciplinas d  ON av.disciplina_id = d.id
        JOIN turmas t        ON av.turma_id      = t.id
        JOIN professores p   ON av.professor_id  = p.id
        JOIN trimestres tr   ON av.trimestre_id  = tr.id
        $whereSQL
        ORDER BY av.criado_em DESC
    ";

    $stmt = $conn->prepare($sql);
    if ($types !== '') $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $avaliacoes = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    foreach ($avaliacoes as &$a) {
        $a['id']            = intval($a['id']);
        $a['disciplina_id'] = intval($a['disciplina_id']);
        $a['turma_id']      = intval($a['turma_id']);
        $a['trimestre_id']  = intval($a['trimestre_id']);
        $a['peso']          = floatval($a['peso']);
    }

    // Estatísticas para o professor
    $totalQuery = $isAdmin
        ? "SELECT COUNT(*) AS c FROM avaliacoes"
        : "SELECT COUNT(*) AS c FROM avaliacoes WHERE professor_id = $professorId";
    $total = intval($conn->query($totalQuery)->fetch_assoc()['c']);

    $pendentesConfig = $isAdmin
        ? "SELECT COUNT(DISTINCT turma_id) AS c FROM avaliacoes WHERE peso = 0"
        : "SELECT COUNT(DISTINCT turma_id) AS c FROM avaliacoes WHERE professor_id = $professorId AND peso = 0";
    $pendentes = intval($conn->query($pendentesConfig)->fetch_assoc()['c']);

    echo json_encode([
        'success'   => true,
        'data'      => $avaliacoes,
        'stats'     => [
            'total'             => $total,
            'pendentes_config'  => $pendentes,
            'total_turmas'      => $isAdmin ? null : count(array_unique(array_column($avaliacoes, 'turma_id'))),
        ],
    ]);
    exit();
}

// ─── POST: criar avaliação ───────────────────────────────────
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $nome         = trim($data['nome']          ?? '');
    $tipo         = trim($data['tipo']          ?? 'Prova');
    $disciplinaId = intval($data['disciplina_id'] ?? 0);
    $turmaId      = intval($data['turma_id']    ?? 0);
    $trimestreId  = intval($data['trimestre_id'] ?? 0);
    $peso         = floatval($data['peso']      ?? 0);
    $dataEntrega  = trim($data['data_entrega']  ?? '') ?: null;
    $descricao    = trim($data['descricao']     ?? '') ?: null;

    // Professor só pode criar nas suas turmas
    if (!$isAdmin) {
        $chk = $conn->prepare("
            SELECT id FROM professor_disciplina_turma
            WHERE professor_id=? AND disciplina_id=? AND turma_id=?
        ");
        $chk->bind_param('iii', $professorId, $disciplinaId, $turmaId);
        $chk->execute();
        if ($chk->get_result()->num_rows === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Não tem permissão para esta turma/disciplina']);
            exit();
        }
    }

    if (!$nome || !$disciplinaId || !$turmaId || !$trimestreId) {
        http_response_code(400);
        echo json_encode(['error' => 'nome, disciplina_id, turma_id e trimestre_id são obrigatórios']);
        exit();
    }

    $tipos_validos = ['Prova', 'Trabalho', 'Seminario', 'Projecto', 'Exame', 'Outro'];
    if (!in_array($tipo, $tipos_validos)) $tipo = 'Prova';

    if ($peso < 0 || $peso > 100) {
        http_response_code(400);
        echo json_encode(['error' => 'Peso deve estar entre 0 e 100']);
        exit();
    }

    // Verificar se a soma dos pesos não ultrapassa 100 para esta turma/disciplina/trimestre
    $somaPesos = $conn->prepare("
        SELECT COALESCE(SUM(peso), 0) AS soma
        FROM avaliacoes
        WHERE disciplina_id=? AND turma_id=? AND trimestre_id=? AND professor_id=?
    ");
    $somaPesos->bind_param('iiii', $disciplinaId, $turmaId, $trimestreId, $professorId);
    $somaPesos->execute();
    $soma = floatval($somaPesos->get_result()->fetch_assoc()['soma']);

    if ($soma + $peso > 100) {
        http_response_code(400);
        echo json_encode([
            'error'         => 'A soma dos pesos ultrapassaria 100%. Peso disponível: ' . (100 - $soma) . '%',
            'peso_disponivel' => 100 - $soma,
        ]);
        exit();
    }

    $stmt = $conn->prepare("
        INSERT INTO avaliacoes
            (nome, tipo, disciplina_id, turma_id, professor_id, trimestre_id, peso, data_entrega, descricao)
        VALUES (?,?,?,?,?,?,?,?,?)
    ");
    $stmt->bind_param('ssiiiidss', $nome, $tipo, $disciplinaId, $turmaId, $professorId, $trimestreId, $peso, $dataEntrega, $descricao);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao criar avaliação: ' . $conn->error]);
    }
    exit();
}

// ─── PUT: editar avaliação ───────────────────────────────────
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = intval($data['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id é obrigatório']);
        exit();
    }

    // Verificar propriedade
    if (!$isAdmin) {
        $chk = $conn->prepare('SELECT id FROM avaliacoes WHERE id=? AND professor_id=?');
        $chk->bind_param('ii', $id, $professorId);
        $chk->execute();
        if ($chk->get_result()->num_rows === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Acesso negado']);
            exit();
        }
    }

    $nome        = trim($data['nome']         ?? '');
    $tipo        = trim($data['tipo']         ?? 'Prova');
    $peso        = floatval($data['peso']     ?? 0);
    $dataEntrega = trim($data['data_entrega'] ?? '') ?: null;
    $descricao   = trim($data['descricao']    ?? '') ?: null;
    $estado      = $data['estado'] ?? 'Activa';

    $stmt = $conn->prepare(
        'UPDATE avaliacoes SET nome=?, tipo=?, peso=?, data_entrega=?, descricao=?, estado=? WHERE id=?'
    );
    $stmt->bind_param('ssdsssi', $nome, $tipo, $peso, $dataEntrega, $descricao, $estado, $id);
    $stmt->execute();

    echo json_encode(['success' => true]);
    exit();
}

// ─── DELETE: eliminar avaliação ──────────────────────────────
if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id é obrigatório']);
        exit();
    }

    if (!$isAdmin) {
        $chk = $conn->prepare('SELECT id FROM avaliacoes WHERE id=? AND professor_id=?');
        $chk->bind_param('ii', $id, $professorId);
        $chk->execute();
        if ($chk->get_result()->num_rows === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Acesso negado']);
            exit();
        }
    }

    $conn->query("DELETE FROM avaliacoes WHERE id=$id");
    echo json_encode(['success' => true]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
$db->closeConnection();
?>