<?php
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('admin');
$db   = new Database();
$conn = $db->connect();

$method = $_SERVER['REQUEST_METHOD'];
$tipo   = $_GET['tipo'] ?? ''; // professores | alunos

// ─── GET: listar ─────────────────────────────────────────────
if ($method === 'GET') {
    if ($tipo === 'professores') {
        $r = $conn->query("SELECT id, nome, email, departamento, estado, criado_em FROM professores ORDER BY nome");
        echo json_encode(['success' => true, 'data' => $r->fetch_all(MYSQLI_ASSOC)]);
    } elseif ($tipo === 'alunos') {
        $r = $conn->query("
            SELECT a.id, a.numero, a.nome, a.email, a.estado, a.turma_id,
                   t.nome AS turma, c.nome AS curso
            FROM alunos a
            LEFT JOIN turmas t ON a.turma_id = t.id
            LEFT JOIN cursos c ON t.curso_id = c.id
            ORDER BY a.nome
        ");
        echo json_encode(['success' => true, 'data' => $r->fetch_all(MYSQLI_ASSOC)]);
    } elseif ($tipo === 'turmas') {
        $r = $conn->query("SELECT t.id, t.nome, t.ano, t.turno, c.nome AS curso FROM turmas t JOIN cursos c ON t.curso_id = c.id ORDER BY t.nome");
        echo json_encode(['success' => true, 'data' => $r->fetch_all(MYSQLI_ASSOC)]);
    } elseif ($tipo === 'disciplinas') {
        $r = $conn->query("SELECT d.id, d.nome, d.sigla, d.ano, c.nome AS curso FROM disciplinas d JOIN cursos c ON d.curso_id = c.id ORDER BY d.nome");
        echo json_encode(['success' => true, 'data' => $r->fetch_all(MYSQLI_ASSOC)]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'tipo inválido (professores|alunos|turmas|disciplinas)']);
    }
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

// ─── POST: criar ─────────────────────────────────────────────
if ($method === 'POST') {
    if ($tipo === 'professores') {
        $nome  = trim($data['nome']  ?? '');
        $email = trim($data['email'] ?? '');
        $dept  = trim($data['departamento'] ?? '');
        $pass  = $data['password'] ?? 'Prof@' . rand(1000,9999);
        if (!$nome || !$email) { http_response_code(400); echo json_encode(['error' => 'nome e email obrigatórios']); exit(); }
        $hash = password_hash($pass, PASSWORD_BCRYPT);
        $stmt = $conn->prepare("INSERT INTO professores (nome, email, password, departamento) VALUES (?,?,?,?)");
        $stmt->bind_param("ssss", $nome, $email, $hash, $dept);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'id' => $conn->insert_id, 'password_gerada' => $pass]);
        } else {
            http_response_code(409); echo json_encode(['error' => 'Email já existe']);
        }
    } elseif ($tipo === 'alunos') {
        $nome     = trim($data['nome']     ?? '');
        $email    = trim($data['email']    ?? '');
        $numero   = trim($data['numero']   ?? '');
        $turmaId  = intval($data['turma_id'] ?? 0);
        $pass     = $data['password'] ?? 'Aluno@' . rand(1000,9999);
        if (!$nome || !$email || !$numero) { http_response_code(400); echo json_encode(['error' => 'nome, email e numero obrigatórios']); exit(); }
        $hash = password_hash($pass, PASSWORD_BCRYPT);
        $stmt = $conn->prepare("INSERT INTO alunos (numero, nome, email, password, turma_id) VALUES (?,?,?,?,?)");
        $stmt->bind_param("ssssi", $numero, $nome, $email, $hash, $turmaId);
        if ($stmt->execute()) {
            $alunoId = $conn->insert_id;
            // Criar encarregado se fornecido
            if (!empty($data['enc_nome']) && !empty($data['enc_email'])) {
                $encNome  = $data['enc_nome'];
                $encEmail = $data['enc_email'];
                $encParent = $data['enc_parentesco'] ?? 'Encarregado';
                $encPass  = 'Enc@' . rand(1000,9999);
                $encHash  = password_hash($encPass, PASSWORD_BCRYPT);
                $stmtEnc = $conn->prepare("INSERT INTO encarregados (nome, email, password, aluno_id, parentesco) VALUES (?,?,?,?,?)");
                $stmtEnc->bind_param("ssssi", $encNome, $encEmail, $encHash, $alunoId, $encParent);
                $stmtEnc->execute();
            }
            echo json_encode(['success' => true, 'id' => $alunoId, 'password_gerada' => $pass]);
        } else {
            http_response_code(409); echo json_encode(['error' => 'Email ou número já existe']);
        }
    }
    exit();
}

// ─── PUT: editar ─────────────────────────────────────────────
if ($method === 'PUT') {
    $id = intval($data['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'id obrigatório']); exit(); }

    if ($tipo === 'professores') {
        $nome  = trim($data['nome']  ?? '');
        $email = trim($data['email'] ?? '');
        $dept  = trim($data['departamento'] ?? '');
        $estado = $data['estado'] ?? 'Activo';
        $stmt = $conn->prepare("UPDATE professores SET nome=?, email=?, departamento=?, estado=? WHERE id=?");
        $stmt->bind_param("ssssi", $nome, $email, $dept, $estado, $id);
        $stmt->execute();
        echo json_encode(['success' => true]);
    } elseif ($tipo === 'alunos') {
        $nome    = trim($data['nome']    ?? '');
        $email   = trim($data['email']   ?? '');
        $numero  = trim($data['numero']  ?? '');
        $turmaId = intval($data['turma_id'] ?? 0);
        $estado  = $data['estado'] ?? 'Activo';
        $stmt = $conn->prepare("UPDATE alunos SET nome=?, email=?, numero=?, turma_id=?, estado=? WHERE id=?");
        $stmt->bind_param("sssisi", $nome, $email, $numero, $turmaId, $estado, $id);
        $stmt->execute();
        echo json_encode(['success' => true]);
    }
    exit();
}

// ─── DELETE: desactivar ─────────────────────────────────────
if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'id obrigatório']); exit(); }
    if ($tipo === 'professores') {
        $conn->query("UPDATE professores SET estado='Inactivo' WHERE id=$id");
    } elseif ($tipo === 'alunos') {
        $conn->query("UPDATE alunos SET estado='Inactivo' WHERE id=$id");
    }
    echo json_encode(['success' => true]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
$db->closeConnection();
?>