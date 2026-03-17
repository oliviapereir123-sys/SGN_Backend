<?php
/**
 * API Relatórios Comparativos
 * GET ?tipo=turmas&trimestreId=X&anoLectivoId=Y
 *     tipo=disciplinas
 *     tipo=aprovacao
 *     tipo=evolucao&turmaId=X
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

Auth::requireRole('admin');
$db   = new Database();
$conn = $db->connect();

$tipo        = trim($_GET['tipo']          ?? 'turmas');
$trimestreId = intval($_GET['trimestreId'] ?? 0);
$anoId       = intval($_GET['anoLectivoId']?? 0);
$turmaId     = intval($_GET['turmaId']     ?? 0);
$cursoId     = intval($_GET['cursoId']     ?? 0);

// Ano activo por defeito
if (!$anoId) {
    $r = $conn->query("SELECT id FROM anos_lectivos WHERE estado='Activo' LIMIT 1")->fetch_assoc();
    $anoId = $r ? intval($r['id']) : 0;
}

// ─── TIPO: comparação entre turmas ──────────────────────────
if ($tipo === 'turmas') {
    $trWhere  = $trimestreId ? "AND n.trimestre_id = $trimestreId" : '';
    $curWhere = $cursoId     ? "AND t.curso_id = $cursoId"          : '';

    $rows = $conn->query("
        SELECT
            t.id    AS turma_id,
            t.nome  AS turma_nome,
            c.sigla AS curso_sigla,
            t.ano,
            COUNT(DISTINCT n.aluno_id)   AS total_alunos,
            COUNT(n.id)                  AS total_notas,
            ROUND(AVG(n.media), 2)       AS media_geral,
            SUM(n.media >= 10)           AS aprovados,
            SUM(n.media < 10)            AS reprovados,
            ROUND(100 * SUM(n.media >= 10) / NULLIF(COUNT(n.id), 0), 1) AS pct_aprovacao
        FROM notas n
        JOIN alunos a     ON n.aluno_id   = a.id
        JOIN turmas t     ON a.turma_id   = t.id
        JOIN cursos c     ON t.curso_id   = c.id
        JOIN trimestres tr ON n.trimestre_id = tr.id
        WHERE tr.ano_lectivo_id = $anoId
          AND n.estado  = 'Aprovado'
          AND n.media IS NOT NULL
          $trWhere $curWhere
        GROUP BY t.id, t.nome, c.sigla, t.ano
        ORDER BY media_geral DESC
    ")->fetch_all(MYSQLI_ASSOC);

    foreach ($rows as &$r) {
        $r['media_geral']  = floatval($r['media_geral']);
        $r['pct_aprovacao']= floatval($r['pct_aprovacao']);
        $r['total_alunos'] = intval($r['total_alunos']);
        $r['aprovados']    = intval($r['aprovados']);
        $r['reprovados']   = intval($r['reprovados']);
    }

    echo json_encode(['success' => true, 'tipo' => 'turmas', 'data' => $rows]);
    exit();
}

// ─── TIPO: ranking de disciplinas ───────────────────────────
if ($tipo === 'disciplinas') {
    $trWhere  = $trimestreId ? "AND n.trimestre_id = $trimestreId" : '';
    $curWhere = $cursoId     ? "AND d.curso_id = $cursoId"          : '';

    $rows = $conn->query("
        SELECT
            d.id    AS disciplina_id,
            d.nome  AS disciplina_nome,
            d.sigla,
            d.ano,
            c.nome  AS curso_nome,
            COUNT(n.id)                  AS total_notas,
            ROUND(AVG(n.media), 2)       AS media_geral,
            ROUND(MIN(n.media), 2)       AS media_min,
            ROUND(MAX(n.media), 2)       AS media_max,
            SUM(n.media >= 10)           AS aprovados,
            SUM(n.media < 10)            AS reprovados,
            ROUND(100 * SUM(n.media >= 10) / NULLIF(COUNT(n.id), 0), 1) AS pct_aprovacao
        FROM notas n
        JOIN disciplinas d ON n.disciplina_id = d.id
        JOIN cursos c      ON d.curso_id       = c.id
        JOIN trimestres tr ON n.trimestre_id   = tr.id
        WHERE tr.ano_lectivo_id = $anoId
          AND n.estado  = 'Aprovado'
          AND n.media IS NOT NULL
          $trWhere $curWhere
        GROUP BY d.id, d.nome, d.sigla, d.ano, c.nome
        ORDER BY media_geral DESC
    ")->fetch_all(MYSQLI_ASSOC);

    foreach ($rows as &$r) {
        $r['media_geral']  = floatval($r['media_geral']);
        $r['media_min']    = floatval($r['media_min']);
        $r['media_max']    = floatval($r['media_max']);
        $r['pct_aprovacao']= floatval($r['pct_aprovacao']);
    }

    echo json_encode(['success' => true, 'tipo' => 'disciplinas', 'data' => $rows]);
    exit();
}

// ─── TIPO: evolução trimestral de uma turma ──────────────────
if ($tipo === 'evolucao') {
    if (!$turmaId) {
        http_response_code(400);
        echo json_encode(['error' => 'turmaId é obrigatório para tipo=evolucao']);
        exit();
    }

    $rows = $conn->query("
        SELECT
            tr.id   AS trimestre_id,
            tr.nome AS trimestre_nome,
            COUNT(DISTINCT n.disciplina_id) AS total_disciplinas,
            ROUND(AVG(n.media), 2)          AS media_trimestre,
            SUM(n.media >= 10)              AS aprovados,
            SUM(n.media < 10)               AS reprovados,
            ROUND(100 * SUM(n.media >= 10) / NULLIF(COUNT(n.id), 0), 1) AS pct_aprovacao
        FROM notas n
        JOIN alunos a      ON n.aluno_id      = a.id
        JOIN trimestres tr ON n.trimestre_id  = tr.id
        WHERE a.turma_id           = $turmaId
          AND tr.ano_lectivo_id    = $anoId
          AND n.estado             = 'Aprovado'
          AND n.media IS NOT NULL
        GROUP BY tr.id, tr.nome
        ORDER BY tr.id
    ")->fetch_all(MYSQLI_ASSOC);

    // Evolução por disciplina dentro da turma
    $porDisc = $conn->query("
        SELECT
            d.nome  AS disciplina,
            tr.nome AS trimestre,
            ROUND(AVG(n.media), 2) AS media
        FROM notas n
        JOIN alunos a      ON n.aluno_id      = a.id
        JOIN disciplinas d ON n.disciplina_id = d.id
        JOIN trimestres tr ON n.trimestre_id  = tr.id
        WHERE a.turma_id           = $turmaId
          AND tr.ano_lectivo_id    = $anoId
          AND n.estado             = 'Aprovado'
          AND n.media IS NOT NULL
        GROUP BY d.id, d.nome, tr.id, tr.nome
        ORDER BY d.nome, tr.id
    ")->fetch_all(MYSQLI_ASSOC);

    foreach ($rows as &$r) {
        $r['media_trimestre'] = floatval($r['media_trimestre']);
        $r['pct_aprovacao']   = floatval($r['pct_aprovacao']);
    }

    echo json_encode(['success' => true, 'tipo' => 'evolucao', 'data' => $rows, 'por_disciplina' => $porDisc]);
    exit();
}

// ─── TIPO: taxa de aprovação geral ──────────────────────────
if ($tipo === 'aprovacao') {
    $trWhere = $trimestreId ? "AND n.trimestre_id = $trimestreId" : '';

    // Por curso
    $porCurso = $conn->query("
        SELECT
            c.nome  AS curso,
            c.sigla,
            COUNT(n.id)            AS total,
            SUM(n.media >= 10)     AS aprovados,
            ROUND(100 * SUM(n.media >= 10) / NULLIF(COUNT(n.id), 0), 1) AS pct
        FROM notas n
        JOIN alunos a     ON n.aluno_id      = a.id
        JOIN turmas t     ON a.turma_id      = t.id
        JOIN cursos c     ON t.curso_id      = c.id
        JOIN trimestres tr ON n.trimestre_id = tr.id
        WHERE tr.ano_lectivo_id = $anoId AND n.media IS NOT NULL $trWhere
        GROUP BY c.id, c.nome, c.sigla
        ORDER BY pct DESC
    ")->fetch_all(MYSQLI_ASSOC);

    // Por ano (10º, 11º, 12º)
    $porAno = $conn->query("
        SELECT
            t.ano,
            COUNT(n.id)            AS total,
            SUM(n.media >= 10)     AS aprovados,
            ROUND(AVG(n.media), 2) AS media,
            ROUND(100 * SUM(n.media >= 10) / NULLIF(COUNT(n.id), 0), 1) AS pct
        FROM notas n
        JOIN alunos a      ON n.aluno_id      = a.id
        JOIN turmas t      ON a.turma_id      = t.id
        JOIN trimestres tr ON n.trimestre_id  = tr.id
        WHERE tr.ano_lectivo_id = $anoId AND n.media IS NOT NULL $trWhere
        GROUP BY t.ano
        ORDER BY t.ano
    ")->fetch_all(MYSQLI_ASSOC);

    // Geral
    $geral = $conn->query("
        SELECT
            COUNT(n.id)            AS total,
            SUM(n.media >= 10)     AS aprovados,
            SUM(n.media < 10)      AS reprovados,
            ROUND(AVG(n.media), 2) AS media_geral,
            ROUND(100 * SUM(n.media >= 10) / NULLIF(COUNT(n.id), 0), 1) AS pct_aprovacao
        FROM notas n
        JOIN trimestres tr ON n.trimestre_id = tr.id
        WHERE tr.ano_lectivo_id = $anoId AND n.media IS NOT NULL $trWhere
    ")->fetch_assoc();

    foreach ($porCurso as &$r) { $r['pct'] = floatval($r['pct']); }
    foreach ($porAno   as &$r) { $r['pct'] = floatval($r['pct']); $r['media'] = floatval($r['media']); $r['ano'] = $r['ano'].'º Ano'; }

    echo json_encode([
        'success'  => true,
        'tipo'     => 'aprovacao',
        'geral'    => $geral,
        'por_curso'=> $porCurso,
        'por_ano'  => $porAno,
    ]);
    exit();
}

http_response_code(400);
echo json_encode(['error' => "Tipo desconhecido: $tipo"]);
$db->closeConnection();
?>
