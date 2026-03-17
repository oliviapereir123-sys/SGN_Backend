<?php
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

Auth::requireLogin();
$db   = new Database();
$conn = $db->connect();

$result = $conn->query("SELECT id, nome, inicio, fim, estado FROM anos_lectivos ORDER BY inicio DESC");
$data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];

foreach ($data as &$row) {
    $row['id'] = intval($row['id']);
}

echo json_encode(['success' => true, 'data' => $data]);
$db->closeConnection();
