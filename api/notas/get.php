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

// Campos reais da tabela notas: prova_professor, avaliacao, prova_trimestre
$sql = "
    SELECT n.id, n.disciplina_id, d.nome AS disciplina_nome, d.sigla,
           p.nome AS professor_nome,
           n.trimestre_id, t.nome AS trimestre_nome,
           n.prova_professor, n.avaliacao, n.prova_trimestre,
           n.media, n.nota_recuperacao, n.estado,
           n.observacoes, n.feedback
    FROM notas n
    JOIN disciplinas d  ON n.disciplina_id = d.id
    JOIN professores p  ON n.professor_id  = p.id
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
    $nota['prova_professor'] = $nota['prova_professor'] !== null ? floatval($nota['prova_professor']) : null;
    $nota['avaliacao']       = $nota['avaliacao']       !== null ? floatval($nota['avaliacao'])       : null;
    $nota['prova_trimestre'] = $nota['prova_trimestre'] !== null ? floatval($nota['prova_trimestre']) : null;
    $nota['media']           = $nota['media']           !== null ? floatval($nota['media'])           : null;
    $nota['nota_recuperacao']= $nota['nota_recuperacao']!== null ? floatval($nota['nota_recuperacao']): null;

    // media_final: se houver recuperação, (media + recuperacao) / 2
    if ($nota['media'] !== null && $nota['nota_recuperacao'] !== null) {
        $nota['media_final'] = round(($nota['media'] + $nota['nota_recuperacao']) / 2, 2);
    } else {
        $nota['media_final'] = $nota['media'];
    }

    // Aliases para compatibilidade com o frontend (p1/p2/trabalho/exame)
    $nota['p1']       = $nota['prova_professor'];
    $nota['p2']       = $nota['avaliacao'];
    $nota['trabalho'] = null; // campo não existe na BD
    $nota['exame']    = $nota['prova_trimestre'];
}

echo json_encode(['success' => true, 'data' => $notas]);
$db->closeConnection();
?>