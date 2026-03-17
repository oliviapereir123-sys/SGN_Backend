<?php
require_once '../../config/Headers.php';
require_once '../../config/Database.php';
require_once '../../config/Auth.php';

$auth = Auth::requireRole('professor', 'admin');
$db   = new Database();
$conn = $db->connect();

$turmaId      = intval($_GET['turmaId']      ?? 0);
$disciplinaId = intval($_GET['disciplinaId'] ?? 0);
$trimestreId  = intval($_GET['trimestreId']  ?? 0);

if (!$turmaId || !$disciplinaId || !$trimestreId) {
    http_response_code(400);
    echo json_encode(['error' => 'turmaId, disciplinaId e trimestreId são obrigatórios']);
    exit();
}

if ($auth['type'] === 'professor') {
    $chk = $conn->prepare("SELECT id FROM professor_disciplina_turma WHERE professor_id = ? AND turma_id = ? AND disciplina_id = ?");
    $chk->bind_param("iii", $auth['id'], $turmaId, $disciplinaId);
    $chk->execute();
    if ($chk->get_result()->num_rows === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        exit();
    }
}

$stmt = $conn->prepare("
    SELECT a.id, a.numero, a.nome, a.foto,
           n.id       AS nota_id,
           n.p1, n.p2, n.trabalho, n.exame,
           n.media, n.estado, n.feedback
    FROM alunos a
    LEFT JOIN notas n ON n.aluno_id = a.id
                     AND n.disciplina_id = ?
                     AND n.trimestre_id  = ?
    WHERE a.turma_id = ? AND a.estado = 'Activo'
    ORDER BY a.nome
");
$stmt->bind_param("iii", $disciplinaId, $trimestreId, $turmaId);
$stmt->execute();
$alunos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($alunos as &$a) {
    $a['nota_id']   = $a['nota_id']   !== null ? intval($a['nota_id'])   : null;
    $a['p1']        = $a['p1']        !== null ? floatval($a['p1'])      : null;
    $a['p2']        = $a['p2']        !== null ? floatval($a['p2'])      : null;
    $a['trabalho']  = $a['trabalho']  !== null ? floatval($a['trabalho']) : null;
    $a['exame']     = $a['exame']     !== null ? floatval($a['exame'])    : null;
    $a['media']     = $a['media']     !== null ? floatval($a['media'])   : null;
    $a['estado']    = $a['estado']    ?? 'Rascunho';
}

echo json_encode(['success' => true, 'data' => $alunos]);
$db->closeConnection();
?>