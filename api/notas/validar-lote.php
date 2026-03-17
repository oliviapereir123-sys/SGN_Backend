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

// Campos obrigatórios: turmaId, disciplinaId, trimestreId
if (empty($data['turmaId']) || empty($data['disciplinaId']) || empty($data['trimestreId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'turmaId, disciplinaId e trimestreId são obrigatórios']);
    exit();
}

$turmaId      = intval($data['turmaId']);
$disciplinaId = intval($data['disciplinaId']);
$trimestreId  = intval($data['trimestreId']);
$adminId      = intval($auth['id']);

// ─── 1. Aprovar todas as notas pendentes desta turma/disciplina/trimestre ────

$stmtAprovar = $conn->prepare("
    UPDATE notas n
    JOIN alunos a ON n.aluno_id = a.id
    SET n.estado = 'Aprovado',
        n.data_validacao = NOW(),
        n.validado_por   = ?
    WHERE a.turma_id      = ?
      AND n.disciplina_id = ?
      AND n.trimestre_id  = ?
      AND n.estado        = 'Pendente'
");
$stmtAprovar->bind_param("iiii", $adminId, $turmaId, $disciplinaId, $trimestreId);
$stmtAprovar->execute();
$aprovadas = $stmtAprovar->affected_rows;

if ($aprovadas === 0) {
    echo json_encode([
        'success'   => true,
        'aprovadas' => 0,
        'emails'    => [],
        'message'   => 'Nenhuma nota pendente encontrada para esta turma/disciplina/trimestre.',
    ]);
    $db->closeConnection();
    exit();
}

// ─── 2. Para cada aluno da turma: verificar se TODAS as disciplinas do trimestre estão aprovadas ─

// Buscar info do trimestre e ano lectivo
$trimestreInfo = $conn->query("
    SELECT t.nome AS trimestre_nome, al.nome AS ano_lectivo
    FROM trimestres t
    JOIN anos_lectivos al ON t.ano_lectivo_id = al.id
    WHERE t.id = $trimestreId
")->fetch_assoc();

// Buscar info da turma e curso
$turmaInfo = $conn->query("
    SELECT tu.nome AS turma_nome, tu.ano, c.nome AS curso_nome
    FROM turmas tu
    JOIN cursos c ON tu.curso_id = c.id
    WHERE tu.id = $turmaId
")->fetch_assoc();

// Disciplinas atribuídas a esta turma neste trimestre (via professor_disciplina_turma)
// Vamos usar as disciplinas do curso/ano da turma
$cursoId = null;
$anoTurma = null;
$turmaRow = $conn->query("SELECT curso_id, ano FROM turmas WHERE id = $turmaId")->fetch_assoc();
if ($turmaRow) {
    $cursoId  = intval($turmaRow['curso_id']);
    $anoTurma = intval($turmaRow['ano']);
}

// Total de disciplinas deste curso/ano que têm atribuição de professor para esta turma
$stmtTotalDisc = $conn->prepare("
    SELECT COUNT(DISTINCT pdt.disciplina_id) AS total
    FROM professor_disciplina_turma pdt
    WHERE pdt.turma_id = ?
");
$stmtTotalDisc->bind_param("i", $turmaId);
$stmtTotalDisc->execute();
$totalDisciplinas = intval($stmtTotalDisc->get_result()->fetch_assoc()['total']);

// Buscar alunos desta turma com os seus encarregados
$stmtAlunos = $conn->prepare("
    SELECT a.id, a.nome, a.numero,
           e.nome   AS enc_nome,
           e.email  AS enc_email,
           e.parentesco
    FROM alunos a
    JOIN encarregados e ON e.aluno_id = a.id
    WHERE a.turma_id = ? AND a.estado = 'Activo'
");
$stmtAlunos->bind_param("i", $turmaId);
$stmtAlunos->execute();
$alunos = $stmtAlunos->get_result()->fetch_all(MYSQLI_ASSOC);

$emailsEnviados  = [];
$emailsFalhados  = [];

foreach ($alunos as $aluno) {
    $alunoId = intval($aluno['id']);

    // Contar quantas disciplinas deste aluno estão aprovadas neste trimestre
    $stmtAprov = $conn->prepare("
        SELECT COUNT(*) AS total_aprovadas
        FROM notas
        WHERE aluno_id    = ?
          AND trimestre_id = ?
          AND estado       = 'Aprovado'
    ");
    $stmtAprov->bind_param("ii", $alunoId, $trimestreId);
    $stmtAprov->execute();
    $totalAprovadas = intval($stmtAprov->get_result()->fetch_assoc()['total_aprovadas']);

    // Só envia o boletim se TODAS as disciplinas estiverem aprovadas
    if ($totalAprovadas < $totalDisciplinas || $totalDisciplinas === 0) {
        continue;
    }

    // Buscar todas as notas aprovadas deste aluno neste trimestre
    $stmtNotas = $conn->prepare("
        SELECT d.nome AS disciplina_nome,
               p.nome AS professor_nome,
               n.p1, n.p2, n.trabalho, n.exame, n.media
        FROM notas n
        JOIN disciplinas d ON n.disciplina_id = d.id
        JOIN professores p ON n.professor_id  = p.id
        WHERE n.aluno_id    = ?
          AND n.trimestre_id = ?
          AND n.estado       = 'Aprovado'
        ORDER BY d.nome
    ");
    $stmtNotas->bind_param("ii", $alunoId, $trimestreId);
    $stmtNotas->execute();
    $notasAluno = $stmtNotas->get_result()->fetch_all(MYSQLI_ASSOC);

    // Converter strings para float
    foreach ($notasAluno as &$n) {
        $n['p1']       = $n['p1']       !== null ? floatval($n['p1'])       : null;
        $n['p2']       = $n['p2']       !== null ? floatval($n['p2'])       : null;
        $n['trabalho'] = $n['trabalho'] !== null ? floatval($n['trabalho']) : null;
        $n['exame']    = $n['exame']    !== null ? floatval($n['exame'])    : null;
        $n['media']    = $n['media']    !== null ? floatval($n['media'])    : null;
    }

    // Gerar HTML do boletim
    $alunoData = [
        'nome'   => $aluno['nome'],
        'numero' => $aluno['numero'],
        'turma'  => $turmaInfo['turma_nome'] ?? '—',
        'curso'  => $turmaInfo['curso_nome'] ?? '—',
        'ano'    => $turmaInfo['ano'] ?? '—',
    ];
    $trimestreData = [
        'nome'        => $trimestreInfo['trimestre_nome'] ?? '—',
        'ano_lectivo' => $trimestreInfo['ano_lectivo'] ?? '2024/2025',
    ];
    $encData = [
        'nome'       => $aluno['enc_nome'],
        'parentesco' => $aluno['parentesco'] ?? 'Encarregado de Educação',
    ];

    $html    = EmailTemplate::boletim($alunoData, $notasAluno, $trimestreData, $encData);
    $assunto = EmailTemplate::assunto($alunoData, $trimestreData);

    // Enviar email
    $resultado = Mailer::enviarBoletim(
        $aluno['enc_email'],
        $aluno['enc_nome'],
        $assunto,
        $html
    );

    if ($resultado['success']) {
        $emailsEnviados[] = [
            'aluno'       => $aluno['nome'],
            'encarregado' => $aluno['enc_nome'],
            'email'       => $aluno['enc_email'],
        ];
    } else {
        $emailsFalhados[] = [
            'aluno' => $aluno['nome'],
            'email' => $aluno['enc_email'],
            'erro'  => $resultado['error'],
        ];
    }
}

echo json_encode([
    'success'          => true,
    'aprovadas'        => $aprovadas,
    'emails_enviados'  => count($emailsEnviados),
    'emails_falhados'  => count($emailsFalhados),
    'detalhes_enviados'=> $emailsEnviados,
    'detalhes_falhados'=> $emailsFalhados,
    'message'          => "$aprovadas notas aprovadas. " . count($emailsEnviados) . " boletins enviados por email.",
]);

$db->closeConnection();
?>
