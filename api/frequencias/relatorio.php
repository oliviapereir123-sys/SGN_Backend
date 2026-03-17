<?php
/**
 * GET: Relatório de frequências.
 * - alunoId + dataInicio + dataFim: encarregado/aluno (próprio), admin (qualquer)
 * - turmaId + dataInicio + dataFim: admin (resumo por turma)
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('aluno', 'encarregado', 'admin');
$db   = new Database();
$conn = $db->connect();

$alunoId   = isset($_GET['alunoId']) ? intval($_GET['alunoId']) : null;
$turmaId   = isset($_GET['turmaId']) ? intval($_GET['turmaId']) : null;
$dataInicio = trim($_GET['dataInicio'] ?? '');
$dataFim   = trim($_GET['dataFim'] ?? '');

if ($dataInicio === '' || $dataFim === '') {
    http_response_code(400);
    echo json_encode(['error' => 'dataInicio e dataFim são obrigatórios (YYYY-MM-DD)']);
    exit();
}

// Relatório por aluno
if ($alunoId !== null && $alunoId > 0) {
    if ($auth['type'] === 'aluno' && intval($auth['id']) !== $alunoId) {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        exit();
    }
    if ($auth['type'] === 'encarregado') {
        $enc = $conn->prepare("SELECT id FROM encarregados WHERE id = ? AND aluno_id = ?");
        $enc->bind_param("ii", $auth['id'], $alunoId);
        $enc->execute();
        if ($enc->get_result()->num_rows === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Acesso negado']);
            exit();
        }
    }

    $stmt = $conn->prepare("
        SELECT p.data, p.presente, p.justificada, p.observacao
        FROM presencas p
        WHERE p.aluno_id = ? AND p.data BETWEEN ? AND ?
        ORDER BY p.data
    ");
    $stmt->bind_param("iss", $alunoId, $dataInicio, $dataFim);
    $stmt->execute();
    $lista = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $total = count($lista);
    $presentes = count(array_filter($lista, fn($r) => (int)$r['presente'] === 1));
    $faltas = $total - $presentes;
    $justificadas = count(array_filter($lista, fn($r) => (int)$r['justificada'] === 1));
    $percentagem = $total > 0 ? round(100 * $presentes / $total, 1) : 0;

    $aluno = $conn->query("SELECT id, numero, nome, turma_id FROM alunos WHERE id = $alunoId")->fetch_assoc();
    $turmaNome = null;
    if ($aluno && $aluno['turma_id']) {
        $t = $conn->query("SELECT nome FROM turmas WHERE id = " . intval($aluno['turma_id']))->fetch_assoc();
        $turmaNome = $t['nome'] ?? null;
    }

    echo json_encode([
        'success' => true,
        'tipo'    => 'aluno',
        'aluno'   => $aluno ? ['id' => (int)$aluno['id'], 'numero' => $aluno['numero'], 'nome' => $aluno['nome'], 'turma_nome' => $turmaNome] : null,
        'dataInicio' => $dataInicio,
        'dataFim'   => $dataFim,
        'resumo'  => [
            'total_dias' => $total,
            'presentes'  => $presentes,
            'faltas'     => $faltas,
            'justificadas' => $justificadas,
            'percentagem_presencas' => $percentagem,
        ],
        'dados'   => $lista,
    ]);
    $db->closeConnection();
    exit();
}

// Relatório por turma (só admin)
if ($turmaId !== null && $turmaId > 0) {
    if ($auth['type'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Apenas administrador pode consultar relatório por turma']);
        exit();
    }

    $stmtAlunos = $conn->prepare("SELECT id, numero, nome FROM alunos WHERE turma_id = ? AND estado = 'Activo' ORDER BY nome");
    $stmtAlunos->bind_param("i", $turmaId);
    $stmtAlunos->execute();
    $alunos = $stmtAlunos->get_result()->fetch_all(MYSQLI_ASSOC);
    $alunoIds = array_column($alunos, 'id');

    if (empty($alunoIds)) {
        echo json_encode(['success' => true, 'tipo' => 'turma', 'turma_id' => $turmaId, 'resumo' => [], 'alunos' => []]);
        $db->closeConnection();
        exit();
    }

    $placeholders = implode(',', array_fill(0, count($alunoIds), '?'));
    $types = str_repeat('i', count($alunoIds)) . 'ss';
    $params = array_merge($alunoIds, [$dataInicio, $dataFim]);
    $stmt = $conn->prepare("
        SELECT aluno_id, data, presente, justificada
        FROM presencas
        WHERE aluno_id IN ($placeholders) AND data BETWEEN ? AND ?
    ");
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $porAluno = [];
    foreach ($alunos as $a) {
        $porAluno[$a['id']] = ['aluno_id' => (int)$a['id'], 'numero' => $a['numero'], 'nome' => $a['nome'], 'total' => 0, 'presentes' => 0, 'faltas' => 0, 'justificadas' => 0];
    }
    foreach ($rows as $r) {
        $id = (int)$r['aluno_id'];
        if (!isset($porAluno[$id])) continue;
        $porAluno[$id]['total']++;
        if ((int)$r['presente'] === 1) $porAluno[$id]['presentes']++;
        else {
            $porAluno[$id]['faltas']++;
            if ((int)$r['justificada'] === 1) $porAluno[$id]['justificadas']++;
        }
    }
    foreach ($porAluno as &$v) {
        $v['percentagem'] = $v['total'] > 0 ? round(100 * $v['presentes'] / $v['total'], 1) : 0;
    }

    $turma = $conn->query("SELECT nome FROM turmas WHERE id = $turmaId")->fetch_assoc();

    echo json_encode([
        'success' => true,
        'tipo' => 'turma',
        'turma_id' => $turmaId,
        'turma_nome' => $turma['nome'] ?? '',
        'dataInicio' => $dataInicio,
        'dataFim' => $dataFim,
        'resumo' => array_values($porAluno),
        'alunos' => $alunos,
    ]);
    $db->closeConnection();
    exit();
}

http_response_code(400);
echo json_encode(['error' => 'Indique alunoId ou turmaId']);
$db->closeConnection();
