<?php
require_once '../../config/Headers.php';
require_once '../../config/Database.php';
require_once '../../config/Auth.php';

$auth = Auth::requireRole('professor');
$db   = new Database();
$conn = $db->connect();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error' => 'Método não permitido']); exit();
}

$data  = json_decode(file_get_contents("php://input"), true);
$notas = isset($data[0]) ? $data : [$data];

$conn->begin_transaction();
$erros = [];

// Função auxiliar para registar auditoria
function registarAuditoria($conn, $notaId, $alunoNome, $disciplina, $trimestre, $campo, $antes, $depois, $utilizador, $tipo) {
    $stmt = $conn->prepare("INSERT INTO auditoria_notas (nota_id, aluno_nome, disciplina, trimestre, campo, valor_antes, valor_depois, alterado_por, tipo_user) VALUES (?,?,?,?,?,?,?,?,?)");
    $stmt->bind_param("issssssss", $notaId, $alunoNome, $disciplina, $trimestre, $campo, $antes, $depois, $utilizador, $tipo);
    $stmt->execute();
}

try {
    $stmtCheck = $conn->prepare("SELECT id, estado, p1, p2, trabalho, exame FROM notas WHERE aluno_id = ? AND disciplina_id = ? AND trimestre_id = ?");
    $stmtCheckBloq = $conn->prepare("SELECT bloqueado FROM trimestres WHERE id = ?");
    $stmtMeta = $conn->prepare("SELECT a.nome AS aluno, d.nome AS disciplina, t.nome AS trimestre FROM alunos a, disciplinas d, trimestres t WHERE a.id=? AND d.id=? AND t.id=?");

    $stmtInsert = $conn->prepare("INSERT INTO notas (aluno_id, disciplina_id, professor_id, trimestre_id, p1, p2, trabalho, exame, feedback, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendente')");
    $stmtUpdate = $conn->prepare("UPDATE notas SET professor_id=?, p1=?, p2=?, trabalho=?, exame=?, feedback=?, estado='Pendente', data_lancamento=CURRENT_TIMESTAMP WHERE id=? AND estado NOT IN ('Aprovado')");

    foreach ($notas as $nota) {
        if (empty($nota['alunoId']) || empty($nota['disciplinaId']) || empty($nota['professorId']) || empty($nota['trimestreId'])) {
            $erros[] = "Campos obrigatórios em falta"; continue;
        }
        $alunoId      = intval($nota['alunoId']);
        $disciplinaId = intval($nota['disciplinaId']);
        $professorId  = intval($nota['professorId']);
        $trimestreId  = intval($nota['trimestreId']);
        $feedback     = ($nota['feedback'] ?? '') !== '' ? $nota['feedback'] : null;

        // Verificar bloqueio do período
        $stmtCheckBloq->bind_param("i", $trimestreId);
        $stmtCheckBloq->execute();
        $trimInfo = $stmtCheckBloq->get_result()->fetch_assoc();
        if ($trimInfo && !empty($trimInfo['bloqueado'])) {
            $erros[] = "Este período está bloqueado para lançamento de notas"; continue;
        }

        $p1 = ($nota['p1'] ?? null) !== null && ($nota['p1'] ?? '') !== '' ? floatval($nota['p1']) : null;
        $p2 = ($nota['p2'] ?? null) !== null && ($nota['p2'] ?? '') !== '' ? floatval($nota['p2']) : null;
        $trabalho = ($nota['trabalho'] ?? null) !== null && ($nota['trabalho'] ?? '') !== '' ? floatval($nota['trabalho']) : null;
        $exame = ($nota['exame'] ?? null) !== null && ($nota['exame'] ?? '') !== '' ? floatval($nota['exame']) : null;

        foreach (['p1' => $p1, 'p2' => $p2, 'trabalho' => $trabalho, 'exame' => $exame] as $campo => $val) {
            if ($val !== null && ($val < 0 || $val > 20)) { $erros[] = "Nota '$campo' fora do intervalo (0-20)"; continue 2; }
        }

        $stmtCheck->bind_param("iii", $alunoId, $disciplinaId, $trimestreId);
        $stmtCheck->execute();
        $existing = $stmtCheck->get_result()->fetch_assoc();

        // Buscar metadados para auditoria
        $stmtMeta->bind_param("iii", $alunoId, $disciplinaId, $trimestreId);
        $stmtMeta->execute();
        $meta = $stmtMeta->get_result()->fetch_assoc();
        $authUser = $auth['nome'] ?? ('professor#' . $auth['id']);

        if ($existing) {
            // Registar auditoria dos campos que mudaram
            $campos = ['p1' => $p1, 'p2' => $p2, 'trabalho' => $trabalho, 'exame' => $exame];
            foreach ($campos as $c => $novoVal) {
                $antigo = $existing[$c];
                if (strval($antigo ?? '') !== strval($novoVal ?? '')) {
                    registarAuditoria($conn, $existing['id'], $meta['aluno'] ?? '', $meta['disciplina'] ?? '', $meta['trimestre'] ?? '', $c, $antigo !== null ? strval($antigo) : '', $novoVal !== null ? strval($novoVal) : '', $authUser, 'professor');
                }
            }
            $stmtUpdate->bind_param("iddddsi", $professorId, $p1, $p2, $trabalho, $exame, $feedback, $existing['id']);
            $stmtUpdate->execute();
        } else {
            $stmtInsert->bind_param("iiiidddds", $alunoId, $disciplinaId, $professorId, $trimestreId, $p1, $p2, $trabalho, $exame, $feedback);
            $stmtInsert->execute();
            $novoId = $conn->insert_id;
            registarAuditoria($conn, $novoId, $meta['aluno'] ?? '', $meta['disciplina'] ?? '', $meta['trimestre'] ?? '', 'criacao', '', 'Pendente', $authUser, 'professor');
        }
    }

    if (!empty($erros)) { $conn->rollback(); http_response_code(400); echo json_encode(['error' => implode('; ', $erros)]); exit(); }
    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Notas guardadas com sucesso']);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno: ' . $e->getMessage()]);
}
$db->closeConnection();
?>