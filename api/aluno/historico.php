<?php
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('aluno', 'admin');
$db   = new Database();
$conn = $db->connect();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$alunoId = intval($_GET['alunoId'] ?? 0);

if (!$alunoId) {
    http_response_code(400);
    echo json_encode(['error' => 'alunoId é obrigatório']);
    exit();
}

// Aluno só pode ver o seu próprio histórico
if ($auth['type'] === 'aluno' && intval($auth['id']) !== $alunoId) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado']);
    exit();
}

// Verificar se o aluno existe
$check = $conn->prepare('SELECT id, nome, numero, turma_id FROM alunos WHERE id=?');
$check->bind_param('i', $alunoId);
$check->execute();
$aluno = $check->get_result()->fetch_assoc();

if (!$aluno) {
    http_response_code(404);
    echo json_encode(['error' => 'Aluno não encontrado']);
    exit();
}

// ─── Histórico por ano lectivo ───────────────────────────────
// Agrupa as notas aprovadas por ano lectivo, calcula média geral
// e determina o status final (Aprovado / Reprovado / Em Curso)
$sql = "
    SELECT
        al.id              AS ano_lectivo_id,
        al.nome            AS ano_lectivo,
        al.estado          AS ano_estado,
        t.nome             AS turma_nome,
        c.nome             AS curso_nome,
        COUNT(n.id)        AS total_disciplinas,
        ROUND(AVG(CASE WHEN n.estado = 'Aprovado' AND n.media IS NOT NULL THEN n.media END), 1)
                           AS media_geral,
        SUM(CASE WHEN n.estado = 'Aprovado' AND n.media >= 10 THEN 1 ELSE 0 END)
                           AS aprovadas,
        SUM(CASE WHEN n.estado = 'Aprovado' AND n.media  < 10 THEN 1 ELSE 0 END)
                           AS reprovadas
    FROM trimestres tr
    JOIN anos_lectivos al ON tr.ano_lectivo_id = al.id
    JOIN notas n           ON n.trimestre_id   = tr.id
                          AND n.aluno_id       = ?
    LEFT JOIN alunos a     ON a.id             = ?
    LEFT JOIN turmas t     ON a.turma_id       = t.id
    LEFT JOIN cursos c     ON t.curso_id       = c.id
    WHERE n.estado IN ('Aprovado', 'Rejeitado', 'Pendente')
    GROUP BY al.id, al.nome, al.estado, t.nome, c.nome
    ORDER BY al.id DESC
    LIMIT 6
";

$stmt = $conn->prepare($sql);
$stmt->bind_param('ii', $alunoId, $alunoId);
$stmt->execute();
$anos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

// Determinar status final de cada ano
foreach ($anos as &$ano) {
    $ano['ano_lectivo_id'] = intval($ano['ano_lectivo_id']);
    $ano['total_disciplinas'] = intval($ano['total_disciplinas']);
    $ano['aprovadas']  = intval($ano['aprovadas']);
    $ano['reprovadas'] = intval($ano['reprovadas']);
    $ano['media_geral'] = $ano['media_geral'] !== null ? floatval($ano['media_geral']) : null;

    if ($ano['ano_estado'] === 'Activo') {
        $ano['status'] = 'Em Curso';
    } elseif ($ano['reprovadas'] > 0) {
        $ano['status'] = 'Reprovado';
    } else {
        $ano['status'] = 'Aprovado';
    }
}

// ─── Notas detalhadas do ano lectivo activo (para perfil) ────
$anoActivo = $conn->query("SELECT id FROM anos_lectivos WHERE estado='Activo' LIMIT 1")->fetch_assoc();
$notasActuais = [];

if ($anoActivo) {
    $anoId = intval($anoActivo['id']);
    $stmtN = $conn->prepare("
        SELECT
            d.nome  AS disciplina_nome,
            d.sigla AS disciplina_sigla,
            p.nome  AS professor_nome,
            tr.nome AS trimestre_nome,
            n.media, n.estado, n.prova_professor, n.avaliacao, n.prova_trimestre
        FROM notas n
        JOIN disciplinas d  ON n.disciplina_id = d.id
        JOIN professores p  ON n.professor_id  = p.id
        JOIN trimestres tr  ON n.trimestre_id  = tr.id
        JOIN anos_lectivos al ON tr.ano_lectivo_id = al.id
        WHERE n.aluno_id = ? AND al.id = ? AND n.estado = 'Aprovado'
        ORDER BY tr.id, d.nome
    ");
    $stmtN->bind_param('ii', $alunoId, $anoId);
    $stmtN->execute();
    $notasActuais = $stmtN->get_result()->fetch_all(MYSQLI_ASSOC);
    foreach ($notasActuais as &$n) {
        $n['media']           = $n['media']           !== null ? floatval($n['media'])           : null;
        $n['prova_professor'] = $n['prova_professor']  !== null ? floatval($n['prova_professor']) : null;
        $n['avaliacao']       = $n['avaliacao']        !== null ? floatval($n['avaliacao'])       : null;
        $n['prova_trimestre'] = $n['prova_trimestre']  !== null ? floatval($n['prova_trimestre']) : null;
    }
}

echo json_encode([
    'success'       => true,
    'aluno'         => [
        'id'     => intval($aluno['id']),
        'nome'   => $aluno['nome'],
        'numero' => $aluno['numero'],
    ],
    'data'          => $anos,
    'notas_actuais' => $notasActuais,
]);
$db->closeConnection();
?>