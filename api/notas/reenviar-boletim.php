<?php
require_once '../../config/Headers.php';
require_once '../../config/Database.php';
require_once '../../config/Auth.php';
require_once '../../config/EmailTemplate.php';
require_once '../../config/Mailer.php';

$auth = Auth::requireRole('admin');

$db   = new Database();
$conn = $db->connect();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

// Campos obrigatórios
if (empty($data['alunoId']) || empty($data['trimestreId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'alunoId e trimestreId são obrigatórios']);
    exit();
}

$alunoId     = intval($data['alunoId']);
$trimestreId = intval($data['trimestreId']);

// ─── Buscar dados do aluno + turma + encarregado ────────────────────────────
$stmtAluno = $conn->prepare("
    SELECT a.id, a.nome, a.numero,
           tu.nome AS turma_nome, tu.ano AS turma_ano,
           c.nome  AS curso_nome,
           e.nome  AS enc_nome,
           e.email AS enc_email,
           e.parentesco
    FROM alunos a
    JOIN turmas tu      ON a.turma_id  = tu.id
    JOIN cursos c       ON tu.curso_id = c.id
    JOIN encarregados e ON e.aluno_id  = a.id
    WHERE a.id = ? AND a.estado = 'Activo'
");
$stmtAluno->bind_param("i", $alunoId);
$stmtAluno->execute();
$aluno = $stmtAluno->get_result()->fetch_assoc();

if (!$aluno) {
    http_response_code(404);
    echo json_encode(['error' => 'Aluno não encontrado ou inactivo']);
    exit();
}

if (empty($aluno['enc_email'])) {
    http_response_code(422);
    echo json_encode(['error' => 'O encarregado deste aluno não tem email registado']);
    exit();
}

// ─── Buscar info do trimestre ────────────────────────────────────────────────
$stmtTrimestre = $conn->prepare("
    SELECT t.nome AS trimestre_nome, al.nome AS ano_lectivo
    FROM trimestres t
    JOIN anos_lectivos al ON t.ano_lectivo_id = al.id
    WHERE t.id = ?
");
$stmtTrimestre->bind_param("i", $trimestreId);
$stmtTrimestre->execute();
$trimestreInfo = $stmtTrimestre->get_result()->fetch_assoc();

if (!$trimestreInfo) {
    http_response_code(404);
    echo json_encode(['error' => 'Trimestre não encontrado']);
    exit();
}

// ─── Buscar notas aprovadas do aluno neste trimestre ────────────────────────
$stmtNotas = $conn->prepare("
    SELECT d.nome AS disciplina_nome,
           p.nome AS professor_nome,
           n.p1, n.p2, n.trabalho, n.exame, n.media
    FROM notas n
    JOIN disciplinas d ON n.disciplina_id = d.id
    JOIN professores p ON n.professor_id  = p.id
    WHERE n.aluno_id     = ?
      AND n.trimestre_id = ?
      AND n.estado       = 'Aprovado'
    ORDER BY d.nome
");
$stmtNotas->bind_param("ii", $alunoId, $trimestreId);
$stmtNotas->execute();
$notasAluno = $stmtNotas->get_result()->fetch_all(MYSQLI_ASSOC);

if (empty($notasAluno)) {
    http_response_code(422);
    echo json_encode(['error' => 'Não existem notas aprovadas para este aluno neste trimestre']);
    exit();
}

// Converter strings para float
foreach ($notasAluno as &$n) {
    $n['p1']       = $n['p1']       !== null ? floatval($n['p1'])       : null;
    $n['p2']       = $n['p2']       !== null ? floatval($n['p2'])       : null;
    $n['trabalho'] = $n['trabalho'] !== null ? floatval($n['trabalho']) : null;
    $n['exame']    = $n['exame']    !== null ? floatval($n['exame'])    : null;
    $n['media']    = $n['media']    !== null ? floatval($n['media'])    : null;
}
unset($n);

// ─── Gerar e enviar boletim ──────────────────────────────────────────────────
$alunoData = [
    'nome'   => $aluno['nome'],
    'numero' => $aluno['numero'],
    'turma'  => $aluno['turma_nome'],
    'curso'  => $aluno['curso_nome'],
    'ano'    => $aluno['turma_ano'],
];
$trimestreData = [
    'nome'        => $trimestreInfo['trimestre_nome'],
    'ano_lectivo' => $trimestreInfo['ano_lectivo'],
];
$encData = [
    'nome'       => $aluno['enc_nome'],
    'parentesco' => $aluno['parentesco'] ?? 'Encarregado de Educação',
];

$html    = EmailTemplate::boletim($alunoData, $notasAluno, $trimestreData, $encData);
$assunto = EmailTemplate::assunto($alunoData, $trimestreData) . ' (reenvio)';

$resultado = Mailer::enviarBoletim(
    $aluno['enc_email'],
    $aluno['enc_nome'],
    $assunto,
    $html
);

if ($resultado['success']) {
    echo json_encode([
        'success'     => true,
        'message'     => "Boletim reenviado com sucesso para {$aluno['enc_nome']} ({$aluno['enc_email']})",
        'destinatario' => [
            'nome'  => $aluno['enc_nome'],
            'email' => $aluno['enc_email'],
        ],
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'Falha no envio: ' . ($resultado['error'] ?? 'Erro desconhecido'),
    ]);
}

$db->closeConnection();
?>
