<?php
/**
 * API Documentos Oficiais — certificados, histórico, declarações
 * GET  ?alunoId=X&tipo=certificado|historico|declaracao — gerar dados
 * POST — registar emissão
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('admin', 'aluno');
$db   = new Database();
$conn = $db->connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $alunoId = intval($_GET['alunoId'] ?? ($auth['type'] === 'aluno' ? $auth['id'] : 0));
    $tipo    = trim($_GET['tipo'] ?? 'historico');

    if (!$alunoId) {
        http_response_code(400); echo json_encode(['error' => 'alunoId obrigatório']); exit();
    }
    if ($auth['type'] === 'aluno' && intval($auth['id']) !== $alunoId) {
        http_response_code(403); echo json_encode(['error' => 'Acesso negado']); exit();
    }

    // Dados do aluno
    $stmtA = $conn->prepare("
        SELECT a.id, a.nome, a.numero, a.email,
               t.nome AS turma_nome, t.ano AS turma_ano,
               c.nome AS curso_nome, c.sigla AS curso_sigla
        FROM alunos a
        JOIN turmas t ON a.turma_id = t.id
        JOIN cursos c ON t.curso_id = c.id
        WHERE a.id = ?
    ");
    $stmtA->bind_param('i', $alunoId);
    $stmtA->execute();
    $aluno = $stmtA->get_result()->fetch_assoc();
    if (!$aluno) { http_response_code(404); echo json_encode(['error' => 'Aluno não encontrado']); exit(); }

    // Histórico completo de notas
    $stmtN = $conn->prepare("
        SELECT
            al.nome AS ano_lectivo,
            tr.nome AS trimestre,
            d.nome  AS disciplina,
            d.sigla,
            d.creditos,
            n.p1, n.p2, n.trabalho, n.exame,
            n.media AS media_trimestral,
            n.nota_recuperacao
        FROM notas n
        JOIN trimestres tr    ON n.trimestre_id  = tr.id
        JOIN anos_lectivos al ON tr.ano_lectivo_id = al.id
        JOIN disciplinas d   ON n.disciplina_id  = d.id
        WHERE n.aluno_id = ? AND n.estado = 'Aprovado'
        ORDER BY al.nome, tr.id, d.nome
    ");
    $stmtN->bind_param('i', $alunoId);
    $stmtN->execute();
    $notas = $stmtN->get_result()->fetch_all(MYSQLI_ASSOC);

    // Agrupar por ano lectivo → disciplina → trimestres
    $historico = [];
    foreach ($notas as $n) {
        $ano = $n['ano_lectivo'];
        $disc= $n['disciplina'];
        if (!isset($historico[$ano])) $historico[$ano] = [];
        if (!isset($historico[$ano][$disc])) {
            $historico[$ano][$disc] = [
                'disciplina' => $disc,
                'sigla'      => $n['sigla'],
                'creditos'   => intval($n['creditos']),
                'trimestres' => [],
            ];
        }
        $mf = $n['media_trimestral'];
        if ($n['nota_recuperacao'] !== null && $mf !== null) {
            $mf = round((floatval($mf) + floatval($n['nota_recuperacao'])) / 2, 2);
        }
        $historico[$ano][$disc]['trimestres'][] = [
            'trimestre'  => $n['trimestre'],
            'media'      => $mf !== null ? floatval($mf) : null,
        ];
    }

    // Calcular média anual por disciplina e situação
    $anosFormatados = [];
    foreach ($historico as $ano => $disciplinas) {
        $discs = [];
        foreach ($disciplinas as $disc) {
            $medias = array_filter(array_column($disc['trimestres'], 'media'), fn($v) => $v !== null);
            $mediaAnual = count($medias) > 0 ? round(array_sum($medias) / count($medias), 2) : null;
            $discs[] = [
                ...$disc,
                'media_anual' => $mediaAnual,
                'situacao'    => $mediaAnual !== null ? ($mediaAnual >= 10 ? 'Aprovado' : 'Reprovado') : 'Pendente',
            ];
        }
        usort($discs, fn($a,$b) => strcmp($a['disciplina'], $b['disciplina']));
        $mediasAno = array_filter(array_column($discs, 'media_anual'), fn($v) => $v !== null);
        $anosFormatados[] = [
            'ano_lectivo'  => $ano,
            'disciplinas'  => $discs,
            'media_anual'  => count($mediasAno) > 0 ? round(array_sum($mediasAno)/count($mediasAno),2) : null,
            'aprovado'     => count(array_filter($discs, fn($d) => $d['situacao'] === 'Reprovado')) === 0,
        ];
    }

    // Config escola
    $cfgQuery = $conn->query("SELECT chave, valor FROM configuracoes WHERE grupo='escola'");
    $cfg = [];
    while ($row = $cfgQuery->fetch_assoc()) $cfg[$row['chave']] = $row['valor'];

    echo json_encode([
        'success'      => true,
        'tipo'         => $tipo,
        'aluno'        => $aluno,
        'historico'    => $anosFormatados,
        'escola'       => $cfg,
        'gerado_em'    => date('Y-m-d H:i:s'),
    ]);
    exit();
}

// POST: registar emissão
if ($method === 'POST') {
    if ($auth['type'] !== 'admin') {
        http_response_code(403); echo json_encode(['error' => 'Sem permissão']); exit();
    }
    $input   = json_decode(file_get_contents('php://input'), true);
    $alunoId = intval($input['aluno_id']       ?? 0);
    $tipo    = trim($input['tipo']             ?? 'historico');
    $anoId   = intval($input['ano_lectivo_id'] ?? 0) ?: null;
    $obs     = trim($input['observacoes']      ?? '') ?: null;
    $adminId = intval($auth['id']);

    if (!$alunoId) { http_response_code(400); echo json_encode(['error' => 'aluno_id obrigatório']); exit(); }

    $stmt = $conn->prepare("INSERT INTO documentos_oficiais (aluno_id, tipo, ano_lectivo_id, emitido_por, observacoes) VALUES (?,?,?,?,?)");
    $stmt->bind_param('isiss', $alunoId, $tipo, $anoId, $adminId, $obs);
    $stmt->execute();
    echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
$db->closeConnection();
?>
