<?php
/**
 * Perfil do Aluno — GET / PUT
 * GET  ?alunoId=X  → devolve dados actuais do aluno
 * PUT               → actualiza nome, telefone, data_nascimento ou senha
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('aluno');
$db   = new Database();
$conn = $db->connect();

$alunoId = intval($auth['id']);

// ─── GET: devolver perfil actualizado ────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->prepare("
        SELECT a.id, a.numero, a.nome, a.email, a.telefone,
               a.data_nascimento, a.foto, a.estado,
               a.turma_id, t.nome AS turma, t.ano,
               c.nome AS curso, c.sigla AS curso_sigla
        FROM alunos a
        LEFT JOIN turmas t ON a.turma_id = t.id
        LEFT JOIN cursos c ON t.curso_id = c.id
        WHERE a.id = ?
    ");
    $stmt->bind_param('i', $alunoId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'Aluno não encontrado']);
        exit();
    }

    unset($row['password']);
    echo json_encode(['success' => true, 'data' => $row]);
    exit();
}

// ─── PUT: actualizar perfil ───────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Determinar o tipo de operação
    $operacao = trim($data['operacao'] ?? 'perfil'); // 'perfil' | 'senha'

    // ── Alterar senha ────────────────────────────────────────
    if ($operacao === 'senha') {
        $senhaAtual  = $data['senha_atual']    ?? '';
        $novaSenha   = $data['nova_senha']      ?? '';
        $confirmar   = $data['confirmar_senha'] ?? '';

        if (!$senhaAtual || !$novaSenha || !$confirmar) {
            http_response_code(400);
            echo json_encode(['error' => 'Todos os campos de senha são obrigatórios']);
            exit();
        }

        if ($novaSenha !== $confirmar) {
            http_response_code(400);
            echo json_encode(['error' => 'A nova senha e a confirmação não coincidem']);
            exit();
        }

        if (strlen($novaSenha) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'A nova senha deve ter pelo menos 8 caracteres']);
            exit();
        }

        // Verificar senha actual
        $stmt = $conn->prepare('SELECT password FROM alunos WHERE id = ?');
        $stmt->bind_param('i', $alunoId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();

        if (!$row || !password_verify($senhaAtual, $row['password'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Senha actual incorrecta']);
            exit();
        }

        $hash = password_hash($novaSenha, PASSWORD_BCRYPT);
        $upd  = $conn->prepare('UPDATE alunos SET password = ? WHERE id = ?');
        $upd->bind_param('si', $hash, $alunoId);
        $upd->execute();

        echo json_encode(['success' => true, 'message' => 'Senha alterada com sucesso']);
        exit();
    }

    // ── Actualizar dados pessoais ─────────────────────────────
    $nome      = trim($data['nome']             ?? '');
    $telefone  = trim($data['telefone']         ?? '') ?: null;
    $dataNasc  = trim($data['data_nascimento']  ?? '') ?: null;

    if (!$nome) {
        http_response_code(400);
        echo json_encode(['error' => 'O nome é obrigatório']);
        exit();
    }

    // Validar data se fornecida
    if ($dataNasc && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dataNasc)) {
        http_response_code(400);
        echo json_encode(['error' => 'Formato de data inválido (use YYYY-MM-DD)']);
        exit();
    }

    $stmt = $conn->prepare(
        'UPDATE alunos SET nome = ?, telefone = ?, data_nascimento = ? WHERE id = ?'
    );
    $stmt->bind_param('sssi', $nome, $telefone, $dataNasc, $alunoId);
    $stmt->execute();

    // Devolver dados actualizados
    $get = $conn->prepare("
        SELECT a.id, a.numero, a.nome, a.email, a.telefone,
               a.data_nascimento, a.foto, a.estado,
               a.turma_id, t.nome AS turma, t.ano,
               c.nome AS curso, c.sigla AS curso_sigla
        FROM alunos a
        LEFT JOIN turmas t ON a.turma_id = t.id
        LEFT JOIN cursos c ON t.curso_id = c.id
        WHERE a.id = ?
    ");
    $get->bind_param('i', $alunoId);
    $get->execute();
    $updated = $get->get_result()->fetch_assoc();
    unset($updated['password']);

    echo json_encode(['success' => true, 'message' => 'Perfil actualizado com sucesso', 'data' => $updated]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
$db->closeConnection();
?>
