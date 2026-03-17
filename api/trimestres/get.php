<?php
require_once '../../config/Headers.php';
require_once '../../config/Database.php';
require_once '../../config/Auth.php';

Auth::requireLogin();

$db   = new Database();
$conn = $db->connect();

$result    = $conn->query("SELECT id, nome, estado FROM trimestres ORDER BY id");
$trimestres = $result->fetch_all(MYSQLI_ASSOC);

echo json_encode(['success' => true, 'data' => $trimestres]);
$db->closeConnection();
?>
