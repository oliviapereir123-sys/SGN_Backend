<?php
/**
 * API Backup — Gerar e listar backups da base de dados
 * GET  — listar backups disponíveis
 * POST — criar backup agora (admin only)
 * DELETE ?ficheiro=X — apagar backup
 */
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

Auth::requireRole('admin');
$db     = new Database();
$conn   = $db->connect();
$method = $_SERVER['REQUEST_METHOD'];

// Diretório de backups (fora do webroot idealmente)
$backupDir = __DIR__ . '/../../../../backups';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0750, true);
}

// ─── GET: listar backups ─────────────────────────────────────
if ($method === 'GET') {
    $ficheiros = glob($backupDir . '/sgn_backup_*.sql.gz') ?: [];
    rsort($ficheiros); // mais recente primeiro

    $lista = [];
    foreach (array_slice($ficheiros, 0, 30) as $f) { // max 30 listados
        $nome    = basename($f);
        $tamanho = filesize($f);
        $data    = filemtime($f);
        $lista[] = [
            'nome'      => $nome,
            'tamanho'   => $tamanho,
            'tamanho_fmt' => $tamanho > 1024*1024
                ? round($tamanho/1024/1024, 2) . ' MB'
                : round($tamanho/1024, 1) . ' KB',
            'data_criacao' => date('Y-m-d H:i:s', $data),
        ];
    }

    // Estatísticas
    $total = count(glob($backupDir . '/sgn_backup_*.sql.gz') ?: []);
    $ultimo = $total > 0 ? date('Y-m-d H:i:s', filemtime($ficheiros[0])) : null;

    echo json_encode([
        'success'       => true,
        'data'          => $lista,
        'total'         => $total,
        'ultimo_backup' => $ultimo,
    ]);
    exit();
}

// ─── POST: criar backup agora ─────────────────────────────────
if ($method === 'POST') {
    // Ler credenciais da BD (de config ou variáveis de ambiente)
    $host   = defined('DB_HOST') ? DB_HOST : 'localhost';
    $dbname = defined('DB_NAME') ? DB_NAME : 'sgn_ipm';
    $dbuser = defined('DB_USER') ? DB_USER : 'root';
    $dbpass = defined('DB_PASS') ? DB_PASS : '';

    $timestamp  = date('Ymd_His');
    $filename   = "sgn_backup_{$timestamp}.sql";
    $filepath   = "$backupDir/$filename";
    $filegz     = "$filepath.gz";

    // Verificar se mysqldump está disponível
    exec('which mysqldump 2>/dev/null', $out, $code);
    if ($code !== 0) {
        // Fallback: dump via PHP se mysqldump não disponível
        $success = dumpViaPHP($conn, $filepath, $dbname);
    } else {
        $passFlag = $dbpass ? "-p" . escapeshellarg($dbpass) : '';
        $cmd = "mysqldump -h " . escapeshellarg($host)
             . " -u " . escapeshellarg($dbuser)
             . " $passFlag "
             . escapeshellarg($dbname)
             . " --single-transaction --routines --triggers 2>/dev/null";

        exec($cmd, $sqlLines, $exitCode);
        if ($exitCode !== 0 || empty($sqlLines)) {
            // Também tentar fallback PHP
            $success = dumpViaPHP($conn, $filepath, $dbname);
        } else {
            file_put_contents($filepath, implode("\n", $sqlLines));
            $success = file_exists($filepath);
        }
    }

    if (!$success) {
        http_response_code(500);
        echo json_encode(['error' => 'Falha ao criar backup. Verifique as permissões do directório.']);
        exit();
    }

    // Comprimir
    $gz = gzopen($filegz, 'wb9');
    gzwrite($gz, file_get_contents($filepath));
    gzclose($gz);
    unlink($filepath); // remover .sql não comprimido

    // Limpar backups antigos (manter apenas os últimos 15)
    $todos = glob($backupDir . '/sgn_backup_*.sql.gz') ?: [];
    rsort($todos);
    foreach (array_slice($todos, 15) as $old) {
        unlink($old);
    }

    // Registar no log
    $adminId = 0; // ID do admin que fez o backup
    $tamanho = filesize($filegz);
    $conn->query("
        INSERT INTO configuracoes (chave, valor, descricao, tipo, grupo)
        VALUES ('ultimo_backup', '" . date('Y-m-d H:i:s') . "', 'Data do último backup', 'texto', 'backup')
        ON DUPLICATE KEY UPDATE valor = '" . date('Y-m-d H:i:s') . "'
    ");

    echo json_encode([
        'success'     => true,
        'ficheiro'    => basename($filegz),
        'tamanho'     => $tamanho,
        'tamanho_fmt' => $tamanho > 1024*1024
            ? round($tamanho/1024/1024, 2) . ' MB'
            : round($tamanho/1024, 1) . ' KB',
        'criado_em'   => date('Y-m-d H:i:s'),
    ]);
    exit();
}

// ─── DELETE: apagar backup ────────────────────────────────────
if ($method === 'DELETE') {
    $ficheiro = basename($_GET['ficheiro'] ?? '');
    if (!$ficheiro || !preg_match('/^sgn_backup_\d{8}_\d{6}\.sql\.gz$/', $ficheiro)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nome de ficheiro inválido']);
        exit();
    }
    $path = "$backupDir/$ficheiro";
    if (file_exists($path)) unlink($path);
    echo json_encode(['success' => true]);
    exit();
}

// ─── Função: dump via PHP puro ────────────────────────────────
function dumpViaPHP(mysqli $conn, string $filepath, string $dbname): bool {
    $sql  = "-- SGN Backup gerado em " . date('Y-m-d H:i:s') . "\n";
    $sql .= "-- Base de dados: $dbname\n\n";
    $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

    // Listar todas as tabelas
    $tables = $conn->query("SHOW TABLES")->fetch_all(MYSQLI_NUM);
    foreach ($tables as [$table]) {
        // Estrutura
        $create = $conn->query("SHOW CREATE TABLE `$table`")->fetch_row()[1];
        $sql .= "DROP TABLE IF EXISTS `$table`;\n$create;\n\n";

        // Dados (em lotes de 500)
        $res = $conn->query("SELECT * FROM `$table`");
        if (!$res || $res->num_rows === 0) continue;

        $cols = [];
        foreach ($res->fetch_fields() as $field) $cols[] = "`{$field->name}`";

        $lote = [];
        while ($row = $res->fetch_row()) {
            $vals = array_map(fn($v) => $v === null ? 'NULL' : "'" . $conn->real_escape_string($v) . "'", $row);
            $lote[] = '(' . implode(',', $vals) . ')';
            if (count($lote) === 500) {
                $sql .= "INSERT INTO `$table` (" . implode(',', $cols) . ") VALUES\n" . implode(",\n", $lote) . ";\n";
                $lote = [];
            }
        }
        if ($lote) {
            $sql .= "INSERT INTO `$table` (" . implode(',', $cols) . ") VALUES\n" . implode(",\n", $lote) . ";\n";
        }
        $sql .= "\n";
    }
    $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
    return file_put_contents($filepath, $sql) !== false;
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
$db->closeConnection();
?>
