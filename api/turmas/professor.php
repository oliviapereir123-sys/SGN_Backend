<?php
require_once '../../config/Headers.php';
require_once '../../config/Database.php';
require_once '../../config/Auth.php';

$auth = Auth::requireRole('professor', 'admin');

$db   = new Database();
$conn = $db->connect();

// Professor só pode ver as suas próprias turmas; admin pode ver de qualquer professor
$requestedId = intval($_GET['professorId'] ?? 0);

if (!$requestedId) {
    http_response_code(400);
    echo json_encode(['error' => 'professorId é obrigatório']);
    exit();
}

if ($auth['type'] === 'professor' && intval($auth['id']) !== $requestedId) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado — só pode ver as suas próprias turmas']);
    exit();
}

$stmt = $conn->prepare("
    SELECT
        t.id   AS turma_id,
        t.nome AS turma_nome,
        d.id   AS disciplina_id,
        d.nome AS disciplina_nome,
        (SELECT COUNT(*) FROM alunos a WHERE a.turma_id = t.id AND a.estado = 'Activo') AS total_alunos
    FROM professor_disciplina_turma pdt
    JOIN turmas t      ON pdt.turma_id      = t.id
    JOIN disciplinas d ON pdt.disciplina_id = d.id
    WHERE pdt.professor_id = ?
    ORDER BY t.nome, d.nome
");
$stmt->bind_param("i", $requestedId);
$stmt->execute();
$turmas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

echo json_encode(['success' => true, 'data' => $turmas]);
$db->closeConnection();
?>
