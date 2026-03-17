<?php
/**
 * API Boletim Anual — médias dos 3 trimestres + situação final
 * GET ?alunoId=X&anoLectivoId=Y
 * Acessível: aluno (só o próprio), encarregado (só o seu educando), admin, professor
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('aluno', 'encarregado', 'admin', 'professor');
$db   = new Database();
$conn = $db->connect();

$alunoId = intval($_GET['alunoId']       ?? 0);
$anoId   = intval($_GET['anoLectivoId']  ?? 0);

if (!$alunoId) {
    http_response_code(400);
    echo json_encode(['error' => 'alunoId é obrigatório']);
    exit();
}

// Controlo de acesso
if ($auth['type'] === 'aluno' && intval($auth['id']) !== $alunoId) {
    http_response_code(403); echo json_encode(['error' => 'Acesso negado']); exit();
}
if ($auth['type'] === 'encarregado') {
    $chk = $conn->prepare("SELECT id FROM encarregados WHERE id = ? AND aluno_id = ?");
    $chk->bind_param('ii', $auth['id'], $alunoId);
    $chk->execute();
    if ($chk->get_result()->num_rows === 0) {
        http_response_code(403); echo json_encode(['error' => 'Acesso negado']); exit();
    }
}

// Se não especificado, usar ano lectivo activo
if (!$anoId) {
    $r = $conn->query("SELECT id FROM anos_lectivos WHERE estado='Activo' LIMIT 1")->fetch_assoc();
    $anoId = $r ? intval($r['id']) : 0;
}

// Dados do aluno
$stmtAluno = $conn->prepare("
    SELECT a.id, a.nome, a.numero, a.foto,
           t.nome AS turma_nome, t.ano AS turma_ano,
           c.nome AS curso_nome, c.sigla AS curso_sigla,
           al.nome AS ano_lectivo
    FROM alunos a
    JOIN turmas t        ON a.turma_id = t.id
    JOIN cursos c        ON t.curso_id = c.id
    JOIN anos_lectivos al ON al.id = ?
    WHERE a.id = ?
");
$stmtAluno->bind_param('ii', $anoId, $alunoId);
$stmtAluno->execute();
$aluno = $stmtAluno->get_result()->fetch_assoc();

if (!$aluno) {
    http_response_code(404);
    echo json_encode(['error' => 'Aluno não encontrado']);
    exit();
}

// Buscar notas aprovadas dos 3 trimestres do ano
$stmtNotas = $conn->prepare("
    SELECT
        n.disciplina_id,
        d.nome      AS disciplina_nome,
        d.sigla     AS disciplina_sigla,
        d.creditos,
        tr.id       AS trimestre_id,
        tr.nome     AS trimestre_nome,
        n.p1, n.p2, n.trabalho, n.exame,
        -- MAC = (P1 + P2 + Trabalho) / 3
        CASE WHEN n.p1 IS NOT NULL AND n.p2 IS NOT NULL AND n.trabalho IS NOT NULL
             THEN ROUND((n.p1 + n.p2 + n.trabalho) / 3.0, 2)
             ELSE NULL END AS mac,
        n.media     AS media_trimestral,
        n.nota_recuperacao,
        -- Média final do trimestre (se tiver recuperação)
        CASE WHEN n.nota_recuperacao IS NOT NULL AND n.media IS NOT NULL
             THEN ROUND((n.media + n.nota_recuperacao) / 2.0, 2)
             ELSE n.media END AS media_final_trimestral
    FROM notas n
    JOIN disciplinas d  ON n.disciplina_id  = d.id
    JOIN trimestres tr  ON n.trimestre_id   = tr.id
    JOIN anos_lectivos al ON tr.ano_lectivo_id = al.id
    WHERE n.aluno_id = ?
      AND al.id      = ?
      AND n.estado   = 'Aprovado'
    ORDER BY d.nome, tr.id
");
$stmtNotas->bind_param('ii', $alunoId, $anoId);
$stmtNotas->execute();
$notas = $stmtNotas->get_result()->fetch_all(MYSQLI_ASSOC);

// Agrupar por disciplina
$disciplinas = [];
foreach ($notas as $n) {
    $did = intval($n['disciplina_id']);
    if (!isset($disciplinas[$did])) {
        $disciplinas[$did] = [
            'disciplina_id'    => $did,
            'disciplina_nome'  => $n['disciplina_nome'],
            'disciplina_sigla' => $n['disciplina_sigla'],
            'creditos'         => intval($n['creditos']),
            'trimestres'       => [],
        ];
    }
    $disciplinas[$did]['trimestres'][$n['trimestre_id']] = [
        'trimestre_id'          => intval($n['trimestre_id']),
        'trimestre_nome'        => $n['trimestre_nome'],
        'p1'                    => $n['p1'] !== null ? floatval($n['p1']) : null,
        'p2'                    => $n['p2'] !== null ? floatval($n['p2']) : null,
        'trabalho'              => $n['trabalho'] !== null ? floatval($n['trabalho']) : null,
        'exame'                 => $n['exame'] !== null ? floatval($n['exame']) : null,
        'mac'                   => $n['mac'] !== null ? floatval($n['mac']) : null,
        'media_trimestral'      => $n['media_trimestral'] !== null ? floatval($n['media_trimestral']) : null,
        'nota_recuperacao'      => $n['nota_recuperacao'] !== null ? floatval($n['nota_recuperacao']) : null,
        'media_final_trimestral'=> $n['media_final_trimestral'] !== null ? floatval($n['media_final_trimestral']) : null,
    ];
}

// Calcular média anual por disciplina
$resumo = [];
foreach ($disciplinas as $did => $d) {
    $medias = array_filter(
        array_column($d['trimestres'], 'media_final_trimestral'),
        fn($v) => $v !== null
    );
    $mediaAnual = count($medias) > 0
        ? round(array_sum($medias) / count($medias), 2)
        : null;

    $situacao = $mediaAnual !== null
        ? ($mediaAnual >= 10 ? 'Aprovado' : 'Reprovado')
        : 'Pendente';

    $resumo[] = [
        ...$d,
        'trimestres'   => array_values($d['trimestres']),
        'media_anual'  => $mediaAnual,
        'situacao'     => $situacao,
    ];
}

// Ordenar por nome
usort($resumo, fn($a, $b) => strcmp($a['disciplina_nome'], $b['disciplina_nome']));

// Totais
$todasComNota     = array_filter($resumo, fn($r) => $r['media_anual'] !== null);
$mediaGeralAnual  = count($todasComNota) > 0
    ? round(array_sum(array_column($todasComNota, 'media_anual')) / count($todasComNota), 2)
    : null;
$aprovadas   = count(array_filter($resumo, fn($r) => $r['situacao'] === 'Aprovado'));
$reprovadas  = count(array_filter($resumo, fn($r) => $r['situacao'] === 'Reprovado'));
$pendentes   = count(array_filter($resumo, fn($r) => $r['situacao'] === 'Pendente'));
$total       = count($resumo);

// Situação final do aluno: aprovado se média anual geral >= 10 E sem disciplinas reprovadas
$situacaoFinal = 'Pendente';
if ($pendentes === 0) {
    $situacaoFinal = ($reprovadas === 0 && $mediaGeralAnual !== null && $mediaGeralAnual >= 10)
        ? 'Aprovado' : 'Reprovado';
}

echo json_encode([
    'success'  => true,
    'aluno'    => $aluno,
    'ano_lectivo_id' => $anoId,
    'disciplinas' => $resumo,
    'resumo'   => [
        'total_disciplinas' => $total,
        'aprovadas'         => $aprovadas,
        'reprovadas'        => $reprovadas,
        'pendentes'         => $pendentes,
        'media_geral_anual' => $mediaGeralAnual,
        'situacao_final'    => $situacaoFinal,
    ],
]);
$db->closeConnection();
?>
