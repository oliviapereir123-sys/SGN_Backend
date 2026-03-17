<?php
require_once '../../config/Headers.php';
require_once '../../config/Database.php';
require_once '../../config/Auth.php';

$db   = new Database();
$conn = $db->connect();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['password']) || empty($data['type'])) {
    http_response_code(400);
    echo json_encode(['error' => 'password e type são obrigatórios']);
    exit();
}

$type     = $data['type'];
$password = $data['password'];

$tipos_validos = ['aluno', 'professor', 'admin', 'encarregado'];
if (!in_array($type, $tipos_validos)) {
    http_response_code(400);
    echo json_encode(['error' => 'Tipo de utilizador inválido']);
    exit();
}

// ─── Aluno — JOIN turmas + cursos ───────────────────────────
if ($type === 'aluno') {
    if (!empty($data['numeroAluno'])) {
        $campo = 'a.numero';
        $valor = $conn->real_escape_string($data['numeroAluno']);
    } elseif (!empty($data['email'])) {
        $campo = 'a.email';
        $valor = $conn->real_escape_string($data['email']);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'numero ou email é obrigatório']);
        exit();
    }
    $result = $conn->query("
        SELECT a.id, a.numero, a.nome, a.email, a.password,
               a.turma_id, a.estado, a.foto,
               t.nome  AS turma,
               t.ano   AS ano,
               c.nome  AS curso,
               c.sigla AS curso_sigla
        FROM alunos a
        LEFT JOIN turmas t ON a.turma_id = t.id
        LEFT JOIN cursos c ON t.curso_id = c.id
        WHERE $campo = '$valor'
        LIMIT 1
    ");

// ─── Encarregado — JOIN alunos ───────────────────────────────
} elseif ($type === 'encarregado') {
    if (empty($data['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'email é obrigatório']);
        exit();
    }
    $email  = $conn->real_escape_string($data['email']);
    $result = $conn->query("
        SELECT e.id, e.nome, e.email, e.password, e.telefone,
               e.aluno_id, e.parentesco,
               a.nome   AS aluno_nome,
               a.numero AS aluno_numero
        FROM encarregados e
        JOIN alunos a ON e.aluno_id = a.id
        WHERE e.email = '$email'
        LIMIT 1
    ");

// ─── Professor ───────────────────────────────────────────────
} elseif ($type === 'professor') {
    if (empty($data['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'email é obrigatório']);
        exit();
    }
    $email  = $conn->real_escape_string($data['email']);
    $result = $conn->query("SELECT * FROM professores WHERE email = '$email' LIMIT 1");

// ─── Admin ───────────────────────────────────────────────────
} else {
    if (empty($data['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'email é obrigatório']);
        exit();
    }
    $email  = $conn->real_escape_string($data['email']);
    $result = $conn->query("SELECT * FROM admin WHERE email = '$email' LIMIT 1");
}

if (!$result || $result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'Utilizador não encontrado']);
    exit();
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Palavra-passe incorrecta']);
    exit();
}

// Remover senha da resposta
unset($user['password']);

// Gerar token JWT com informação mínima necessária
$token = Auth::generateToken([
    'id'   => $user['id'],
    'type' => $type,
    'nome' => $user['nome'],
]);

http_response_code(200);
echo json_encode([
    'success' => true,
    'token'   => $token,
    'user'    => $user,
]);

$db->closeConnection();
?>
