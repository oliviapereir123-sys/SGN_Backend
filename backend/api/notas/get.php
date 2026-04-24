<?php
require_once '../../config/Headers.php';
require_once '../../config/Database.php';
require_once '../../config/Auth.php';

$auth = Auth::requireRole('aluno', 'encarregado', 'admin');
$db   = new Database();
$conn = $db->connect();

$alunoId     = intval($_GET['alunoId']     ?? 0);
$trimestreId = isset($_GET['trimestreId']) ? intval($_GET['trimestreId']) : null;

if (!$alunoId) {
    http_response_code(400);
    echo json_encode(['error' => 'alunoId é obrigatório']);
    exit();
}

// Verificação de acesso
if ($auth['type'] === 'aluno' && intval($auth['id']) !== $alunoId) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado']);
    exit();
}
if ($auth['type'] === 'encarregado') {
    $stmt = $conn->prepare("SELECT id FROM encarregados WHERE id = ? AND aluno_id = ?");
    $stmt->bind_param("ii", $auth['id'], $alunoId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        exit();
    }
}

$sql = "
    SELECT n.id, n.disciplina_id, d.nome AS disciplina_nome, d.sigla,
           p.nome AS professor_nome,
           n.trimestre_id, t.nome AS trimestre_nome,
           n.p1, n.p2, n.trabalho, n.exame,
           n.media, n.nota_recuperacao, n.estado,
           n.observacoes, n.feedback
    FROM notas n
    JOIN disciplinas d  ON n.disciplina_id = d.id
LEFT JOIN professores p  ON n.professor_id  = p.id
    JOIN trimestres  t  ON n.trimestre_id  = t.id
    WHERE n.aluno_id = ? AND n.estado = 'Aprovado'
";
$params = [$alunoId];
$types  = "i";

if ($trimestreId) {
    $sql    .= " AND n.trimestre_id = ?";
    $params[] = $trimestreId;
    $types  .= "i";
}
$sql .= " ORDER BY t.id, d.nome";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$notas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($notas as &$nota) {
    $nota['p1']              = $nota['p1']              !== null ? floatval($nota['p1'])              : null;
    $nota['p2']              = $nota['p2']              !== null ? floatval($nota['p2'])              : null;
    $nota['trabalho']        = $nota['trabalho']        !== null ? floatval($nota['trabalho'])        : null;
    $nota['exame']           = $nota['exame']           !== null ? floatval($nota['exame'])           : null;
    $nota['media']           = $nota['media']           !== null ? floatval($nota['media'])           : null;
    $nota['nota_recuperacao']= $nota['nota_recuperacao']!== null ? floatval($nota['nota_recuperacao']): null;

    if ($nota['media'] !== null && $nota['nota_recuperacao'] !== null) {
        $nota['media_final'] = round(($nota['media'] + $nota['nota_recuperacao']) / 2, 2);
    } else {
        $nota['media_final'] = $nota['media'];
    }
}

echo json_encode(['success' => true, 'data' => $notas]);
$db->closeConnection();
?>
