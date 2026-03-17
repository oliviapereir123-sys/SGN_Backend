<?php
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('admin');
$db   = new Database();
$conn = $db->connect();

$method = $_SERVER['REQUEST_METHOD'];

// ─── GET: listar disciplinas ─────────────────────────────────
if ($method === 'GET') {

    // Sub-acção: listar professores disponíveis para associação
    if (isset($_GET['action']) && $_GET['action'] === 'professores') {
        $result = $conn->query("SELECT id, nome, email, departamento FROM professores WHERE estado='Activo' ORDER BY nome");
        echo json_encode(['success' => true, 'data' => $result->fetch_all(MYSQLI_ASSOC)]);
        exit();
    }

    $search   = trim($_GET['search']   ?? '');
    $cursoId  = intval($_GET['cursoId'] ?? 0);
    $ano      = intval($_GET['ano']     ?? 0);
    $status   = trim($_GET['status']   ?? ''); // Ativa | Pendente

    $where  = ['1=1'];
    $params = [];
    $types  = '';

    if ($search !== '') {
        $like     = '%' . $search . '%';
        $where[]  = '(d.nome LIKE ? OR d.sigla LIKE ? OR d.codigo LIKE ?)';
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $types   .= 'sss';
    }
    if ($cursoId > 0) {
        $where[]  = 'd.curso_id = ?';
        $params[] = $cursoId;
        $types   .= 'i';
    }
    if ($ano > 0) {
        $where[]  = 'd.ano = ?';
        $params[] = $ano;
        $types   .= 'i';
    }

    $whereSQL = implode(' AND ', $where);

    $sql = "
        SELECT
            d.id, d.nome, d.sigla, d.codigo, d.ano, d.carga_horaria, d.creditos,
            c.id   AS curso_id,
            c.nome AS curso_nome,
            -- Professor mais recente vinculado (qualquer turma, ano lectivo activo)
            (SELECT p.id
             FROM professor_disciplina_turma pdt
             JOIN professores p ON pdt.professor_id = p.id
             JOIN anos_lectivos al ON pdt.ano_lectivo_id = al.id
             WHERE pdt.disciplina_id = d.id AND al.estado = 'Activo'
             ORDER BY pdt.id DESC LIMIT 1) AS professor_id,
            (SELECT p.nome
             FROM professor_disciplina_turma pdt
             JOIN professores p ON pdt.professor_id = p.id
             JOIN anos_lectivos al ON pdt.ano_lectivo_id = al.id
             WHERE pdt.disciplina_id = d.id AND al.estado = 'Activo'
             ORDER BY pdt.id DESC LIMIT 1) AS professor_nome,
            (SELECT p.foto
             FROM professor_disciplina_turma pdt
             JOIN professores p ON pdt.professor_id = p.id
             JOIN anos_lectivos al ON pdt.ano_lectivo_id = al.id
             WHERE pdt.disciplina_id = d.id AND al.estado = 'Activo'
             ORDER BY pdt.id DESC LIMIT 1) AS professor_foto
        FROM disciplinas d
        JOIN cursos c ON d.curso_id = c.id
        WHERE $whereSQL
        ORDER BY c.nome, d.ano, d.nome
    ";

    $stmt = $conn->prepare($sql);
    if ($types !== '') $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $disciplinas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Calcular status e aplicar filtro de status
    $resultado = [];
    foreach ($disciplinas as $d) {
        $d['status']       = $d['professor_id'] ? 'Ativa' : 'Pendente';
        $d['id']           = intval($d['id']);
        $d['ano']          = intval($d['ano']);
        $d['carga_horaria'] = $d['carga_horaria'] ? intval($d['carga_horaria']) : null;
        $d['professor_id'] = $d['professor_id']  ? intval($d['professor_id'])  : null;

        if ($status !== '' && $d['status'] !== $status) continue;
        $resultado[] = $d;
    }

    // Estatísticas
    $ativas       = count(array_filter($resultado, fn($d) => $d['status'] === 'Ativa'));
    $semProf      = count(array_filter($resultado, fn($d) => $d['status'] === 'Pendente'));
    $professores  = count(array_unique(array_filter(array_column($resultado, 'professor_id'))));

    echo json_encode([
        'success' => true,
        'data'    => $resultado,
        'stats'   => [
            'total'                => count($resultado),
            'ativas'               => $ativas,
            'sem_professor'        => $semProf,
            'professores_vinculados' => $professores,
        ],
    ]);
    exit();
}

// ─── POST: criar disciplina ──────────────────────────────────
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Sub-acção: associar professor a uma disciplina (em todas as turmas do ano lectivo activo)
    if (isset($data['action']) && $data['action'] === 'associar_professor') {
        $disciplinaId = intval($data['disciplina_id'] ?? 0);
        $professorId  = intval($data['professor_id']  ?? 0);

        if (!$disciplinaId || !$professorId) {
            http_response_code(400);
            echo json_encode(['error' => 'disciplina_id e professor_id são obrigatórios']);
            exit();
        }

        // Obter ano lectivo activo
        $anoActivo = $conn->query("SELECT id FROM anos_lectivos WHERE estado='Activo' LIMIT 1")->fetch_assoc();
        if (!$anoActivo) {
            http_response_code(400);
            echo json_encode(['error' => 'Nenhum ano lectivo activo encontrado']);
            exit();
        }
        $anoId = intval($anoActivo['id']);

        // Obter turmas onde esta disciplina está (pelo ano da disciplina e curso)
        $discInfo = $conn->query("SELECT ano, curso_id FROM disciplinas WHERE id=$disciplinaId")->fetch_assoc();
        if (!$discInfo) {
            http_response_code(404);
            echo json_encode(['error' => 'Disciplina não encontrada']);
            exit();
        }

        $turmas = $conn->query("
            SELECT id FROM turmas
            WHERE curso_id = {$discInfo['curso_id']} AND ano = {$discInfo['ano']}
        ")->fetch_all(MYSQLI_ASSOC);

        if (empty($turmas)) {
            http_response_code(404);
            echo json_encode(['error' => 'Nenhuma turma encontrada para esta disciplina']);
            exit();
        }

        $associados = 0;
        $stmt = $conn->prepare("
            INSERT INTO professor_disciplina_turma
                (professor_id, disciplina_id, turma_id, ano_lectivo_id)
            VALUES (?,?,?,?)
            ON DUPLICATE KEY UPDATE professor_id = VALUES(professor_id)
        ");

        foreach ($turmas as $turma) {
            $turmaId = intval($turma['id']);
            $stmt->bind_param('iiii', $professorId, $disciplinaId, $turmaId, $anoId);
            $stmt->execute();
            $associados++;
        }

        echo json_encode([
            'success'    => true,
            'message'    => "Professor associado a $associados turma(s) com sucesso",
            'associados' => $associados,
        ]);
        exit();
    }

    // Criar disciplina
    $nome         = trim($data['nome']          ?? '');
    $sigla        = trim($data['sigla']         ?? '') ?: null;
    $cursoId      = intval($data['curso_id']    ?? 0);
    $ano          = intval($data['ano']         ?? 0);
    $cargaHoraria = intval($data['carga_horaria'] ?? 0) ?: null;
    $creditos     = intval($data['creditos']    ?? 0) ?: null;

    if (!$nome || !$cursoId || !$ano) {
        http_response_code(400);
        echo json_encode(['error' => 'nome, curso_id e ano são obrigatórios']);
        exit();
    }

    // Gerar código automático
    $maxId = $conn->query("SELECT MAX(id) AS m FROM disciplinas")->fetch_assoc()['m'] ?? 0;
    $codigo = ($sigla ?? strtoupper(substr($nome, 0, 3))) . '-' . str_pad($maxId + 1, 3, '0', STR_PAD_LEFT);

    $stmt = $conn->prepare(
        'INSERT INTO disciplinas (nome, sigla, codigo, curso_id, ano, carga_horaria, creditos) VALUES (?,?,?,?,?,?,?)'
    );
    $stmt->bind_param('ssssiis', $nome, $sigla, $codigo, $cursoId, $ano, $cargaHoraria, $creditos);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $conn->insert_id, 'codigo' => $codigo]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao criar disciplina: ' . $conn->error]);
    }
    exit();
}

// ─── PUT: editar disciplina ──────────────────────────────────
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = intval($data['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id é obrigatório']);
        exit();
    }

    $nome         = trim($data['nome']            ?? '');
    $sigla        = trim($data['sigla']           ?? '') ?: null;
    $cursoId      = intval($data['curso_id']      ?? 0);
    $ano          = intval($data['ano']           ?? 0);
    $cargaHoraria = intval($data['carga_horaria'] ?? 0) ?: null;
    $creditos     = intval($data['creditos']      ?? 0) ?: null;

    $stmt = $conn->prepare(
        'UPDATE disciplinas SET nome=?, sigla=?, curso_id=?, ano=?, carga_horaria=?, creditos=? WHERE id=?'
    );
    $stmt->bind_param('ssiiii' . 'i', $nome, $sigla, $cursoId, $ano, $cargaHoraria, $creditos, $id);
    $stmt->execute();

    echo json_encode(['success' => true]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
$db->closeConnection();
?>