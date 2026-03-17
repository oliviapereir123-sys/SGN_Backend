<?php
/**
 * POST: Lançar/actualizar nota de exame de recuperação.
 * Acessível a admin. Professor só pode ver, não alterar.
 *
 * Body: { notaId, nota_recuperacao }  — 0 a 20, ou null para remover
 *
 * Fórmula final com recuperação (MED Angola):
 *   MF = (media_anual + nota_recuperacao) / 2
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('admin');
$db   = new Database();
$conn = $db->connect();

$method = $_SERVER['REQUEST_METHOD'];

// ─── GET: listar alunos com média < 10 (candidatos a recuperação) ─
if ($method === 'GET') {
    $trimestreId  = intval($_GET['trimestreId']  ?? 0);
    $disciplinaId = intval($_GET['disciplinaId'] ?? 0);
    $turmaId      = intval($_GET['turmaId']      ?? 0);

    $where  = ["n.estado = 'Aprovado'"];
    $params = [];
    $types  = '';

    if ($trimestreId)  { $where[] = 'n.trimestre_id  = ?'; $params[] = $trimestreId;  $types .= 'i'; }
    if ($disciplinaId) { $where[] = 'n.disciplina_id = ?'; $params[] = $disciplinaId; $types .= 'i'; }
    if ($turmaId)      { $where[] = 'a.turma_id      = ?'; $params[] = $turmaId;      $types .= 'i'; }

    $whereSQL = implode(' AND ', $where);

    $sql = "
        SELECT
            n.id          AS nota_id,
            a.id          AS aluno_id,
            a.numero      AS aluno_numero,
            a.nome        AS aluno_nome,
            d.nome        AS disciplina,
            t.nome        AS trimestre,
            n.p1, n.p2, n.trabalho, n.exame,
            n.media,
            n.nota_recuperacao,
            CASE
                WHEN n.nota_recuperacao IS NOT NULL
                THEN ROUND((n.media + n.nota_recuperacao) / 2.0, 2)
                ELSE n.media
            END AS media_final,
            CASE
                WHEN n.nota_recuperacao IS NOT NULL
                THEN (ROUND((n.media + n.nota_recuperacao) / 2.0, 2) >= 10)
                ELSE (n.media >= 10)
            END AS aprovado
        FROM notas n
        JOIN alunos a       ON n.aluno_id      = a.id
        JOIN disciplinas d  ON n.disciplina_id = d.id
        JOIN trimestres t   ON n.trimestre_id  = t.id
        WHERE $whereSQL
        ORDER BY n.media ASC, a.nome
    ";

    $stmt = $conn->prepare($sql);
    if ($types !== '') $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    foreach ($rows as &$r) {
        $r['nota_id']          = intval($r['nota_id']);
        $r['aluno_id']         = intval($r['aluno_id']);
        $r['p1']               = $r['p1']               !== null ? floatval($r['p1'])               : null;
        $r['p2']               = $r['p2']               !== null ? floatval($r['p2'])               : null;
        $r['trabalho']         = $r['trabalho']         !== null ? floatval($r['trabalho'])         : null;
        $r['exame']            = $r['exame']            !== null ? floatval($r['exame'])            : null;
        $r['media']            = $r['media']            !== null ? floatval($r['media'])            : null;
        $r['nota_recuperacao'] = $r['nota_recuperacao'] !== null ? floatval($r['nota_recuperacao']) : null;
        $r['media_final']      = $r['media_final']      !== null ? floatval($r['media_final'])      : null;
        $r['aprovado']         = (bool)$r['aprovado'];
    }

    echo json_encode([
        'success'    => true,
        'data'       => $rows,
        'reprovados' => count(array_filter($rows, fn($r) => !$r['aprovado'])),
    ]);
    exit();
}

// ─── POST: guardar nota de recuperação ──────────────────────
if ($method === 'POST') {
    $input  = json_decode(file_get_contents('php://input'), true);
    $notaId = intval($input['notaId'] ?? 0);
    $notaRecuperacao = isset($input['nota_recuperacao']) && $input['nota_recuperacao'] !== ''
        ? floatval($input['nota_recuperacao'])
        : null;

    if (!$notaId) {
        http_response_code(400);
        echo json_encode(['error' => 'notaId é obrigatório']);
        exit();
    }

    if ($notaRecuperacao !== null && ($notaRecuperacao < 0 || $notaRecuperacao > 20)) {
        http_response_code(400);
        echo json_encode(['error' => 'nota_recuperacao deve estar entre 0 e 20']);
        exit();
    }

    // Verificar se a nota existe e está aprovada
    $check = $conn->prepare("SELECT id, media FROM notas WHERE id = ? AND estado = 'Aprovado'");
    $check->bind_param('i', $notaId);
    $check->execute();
    $nota = $check->get_result()->fetch_assoc();

    if (!$nota) {
        http_response_code(404);
        echo json_encode(['error' => 'Nota não encontrada ou ainda não aprovada']);
        exit();
    }

    $stmt = $conn->prepare("UPDATE notas SET nota_recuperacao = ? WHERE id = ?");
    $stmt->bind_param('di', $notaRecuperacao, $notaId);
    $stmt->execute();

    // Calcular média final para retornar
    $mediaFinal = null;
    if ($notaRecuperacao !== null && $nota['media'] !== null) {
        $mediaFinal = round((floatval($nota['media']) + $notaRecuperacao) / 2.0, 2);
    }

    echo json_encode([
        'success'    => true,
        'message'    => 'Nota de recuperação guardada',
        'media_final' => $mediaFinal,
        'aprovado'   => $mediaFinal !== null ? $mediaFinal >= 10 : null,
    ]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
$db->closeConnection();
?>
