<?php
/**
 * GET: Listar eventos do calendário académico.
 * Query: anoLectivoId (opcional), dataInicio, dataFim (opcional, intervalo)
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

Auth::requireLogin();
$db   = new Database();
$conn = $db->connect();

$anoLectivoId = isset($_GET['anoLectivoId']) ? intval($_GET['anoLectivoId']) : null;
$dataInicio   = trim($_GET['dataInicio'] ?? '');
$dataFim      = trim($_GET['dataFim'] ?? '');

$where = ['1=1'];
$params = [];
$types = '';

if ($anoLectivoId) {
    $where[] = '(ano_lectivo_id IS NULL OR ano_lectivo_id = ?)';
    $params[] = $anoLectivoId;
    $types .= 'i';
}
// Overlap with [dataInicio, dataFim]: event.data_inicio <= dataFim AND (event.data_fim IS NULL OR event.data_fim >= dataInicio)
if ($dataInicio !== '') {
    $where[] = '(data_fim IS NULL OR data_fim >= ?)';
    $params[] = $dataInicio;
    $types .= 's';
}
if ($dataFim !== '') {
    $where[] = 'data_inicio <= ?';
    $params[] = $dataFim;
    $types .= 's';
}

$sql = "
    SELECT id, titulo, tipo, data_inicio, data_fim, descricao, ano_lectivo_id, criado_em
    FROM calendario_academico
    WHERE " . implode(' AND ', $where) . "
    ORDER BY data_inicio, titulo
";
if ($params) {
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
} else {
    $rows = $conn->query($sql)->fetch_all(MYSQLI_ASSOC);
}

foreach ($rows as &$r) {
    $r['id'] = intval($r['id']);
    $r['ano_lectivo_id'] = $r['ano_lectivo_id'] ? intval($r['ano_lectivo_id']) : null;
}

echo json_encode(['success' => true, 'data' => $rows]);
$db->closeConnection();
