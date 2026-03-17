<?php
/**
 * GET: Listar horários.
 * - turmaId: horário da turma (aluno, encarregado, admin, professor)
 * - professorId: horário do professor (professor ou admin)
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('aluno', 'encarregado', 'professor', 'admin');
$db   = new Database();
$conn = $db->connect();

$turmaId     = isset($_GET['turmaId']) ? intval($_GET['turmaId']) : null;
$professorId = isset($_GET['professorId']) ? intval($_GET['professorId']) : null;
$anoLectivoId = isset($_GET['anoLectivoId']) ? intval($_GET['anoLectivoId']) : null;

if ($turmaId === null && $professorId === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Indique turmaId ou professorId']);
    exit();
}

// Ano lectivo activo se não indicado
if (!$anoLectivoId) {
    $row = $conn->query("SELECT id FROM anos_lectivos WHERE estado = 'Activo' LIMIT 1")->fetch_assoc();
    $anoLectivoId = $row ? intval($row['id']) : null;
}

$where = ['h.ano_lectivo_id = ?'];
$params = [$anoLectivoId];
$types = 'i';

if ($turmaId !== null) {
    $where[] = 'h.turma_id = ?';
    $params[] = $turmaId;
    $types .= 'i';
}
if ($professorId !== null) {
    if ($auth['type'] === 'professor' && intval($auth['id']) !== $professorId) {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        exit();
    }
    $where[] = 'h.professor_id = ?';
    $params[] = $professorId;
    $types .= 'i';
}

$sql = "
    SELECT h.id, h.turma_id, h.disciplina_id, h.professor_id, h.dia_semana,
           h.hora_inicio, h.hora_fim, h.sala,
           d.nome AS disciplina_nome, d.sigla AS disciplina_sigla,
           t.nome AS turma_nome,
           p.nome AS professor_nome
    FROM horarios h
    JOIN disciplinas d ON h.disciplina_id = d.id
    JOIN turmas t      ON h.turma_id = t.id
    JOIN professores p ON h.professor_id = p.id
    WHERE " . implode(' AND ', $where) . "
    ORDER BY h.dia_semana, h.hora_inicio
";
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($rows as &$r) {
    $r['id'] = intval($r['id']);
    $r['turma_id'] = intval($r['turma_id']);
    $r['disciplina_id'] = intval($r['disciplina_id']);
    $r['professor_id'] = intval($r['professor_id']);
    $r['dia_semana'] = intval($r['dia_semana']);
    $r['hora_inicio'] = $r['hora_inicio'];
    $r['hora_fim'] = $r['hora_fim'];
}

echo json_encode(['success' => true, 'data' => $rows]);
$db->closeConnection();
