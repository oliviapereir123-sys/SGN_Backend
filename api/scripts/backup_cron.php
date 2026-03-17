#!/usr/bin/env php
<?php
/**
 * Script de Backup Automático — executar via cron
 *
 * Configurar no crontab do servidor:
 *   # Backup diário às 02:00
 *   0 2 * * * php /var/www/html/sgn/backend/scripts/backup_cron.php >> /var/log/sgn_backup.log 2>&1
 *
 *   # Backup semanal completo (domingo às 03:00)
 *   0 3 * * 0 php /var/www/html/sgn/backend/scripts/backup_cron.php full >> /var/log/sgn_backup.log 2>&1
 *
 * Instalação:
 *   1. Copiar para /var/www/html/sgn/backend/scripts/backup_cron.php
 *   2. chmod +x backup_cron.php
 *   3. crontab -e  (e adicionar as linhas acima)
 */

define('SGN_ROOT', dirname(__DIR__));

// Carregar configurações de BD
require_once SGN_ROOT . '/config/Database.php';

$host   = defined('DB_HOST') ? DB_HOST : 'localhost';
$dbname = defined('DB_NAME') ? DB_NAME : 'sgn_ipm';
$dbuser = defined('DB_USER') ? DB_USER : 'root';
$dbpass = defined('DB_PASS') ? DB_PASS : '';

$modo      = $argv[1] ?? 'daily';
$timestamp = date('Ymd_His');
$backupDir = SGN_ROOT . '/../../backups';

if (!is_dir($backupDir)) {
    mkdir($backupDir, 0750, true);
}

echo "[" . date('Y-m-d H:i:s') . "] SGN Backup ($modo) a iniciar...\n";

// ── Executar dump ─────────────────────────────────────────────
$filename = "sgn_backup_{$timestamp}.sql";
$filepath = "$backupDir/$filename";
$filegz   = "$filepath.gz";

$passFlag = $dbpass ? "-p" . escapeshellarg($dbpass) : '';
$cmd = "mysqldump -h " . escapeshellarg($host)
     . " -u " . escapeshellarg($dbuser)
     . " $passFlag "
     . escapeshellarg($dbname)
     . " --single-transaction --routines --triggers --add-drop-table 2>&1";

exec($cmd, $output, $exitCode);

if ($exitCode !== 0) {
    echo "[" . date('Y-m-d H:i:s') . "] ERRO: mysqldump falhou (código $exitCode)\n";
    echo implode("\n", $output) . "\n";
    exit(1);
}

// Escrever e comprimir
file_put_contents($filepath, implode("\n", $output));
$gz = gzopen($filegz, 'wb9');
gzwrite($gz, file_get_contents($filepath));
gzclose($gz);
unlink($filepath);

$tamanho = round(filesize($filegz) / 1024, 1);
echo "[" . date('Y-m-d H:i:s') . "] Backup criado: $filename.gz ($tamanho KB)\n";

// ── Política de retenção ──────────────────────────────────────
$maxBackups = $modo === 'full' ? 8 : 14; // manter 14 diários, 8 semanais
$todos = glob($backupDir . '/sgn_backup_*.sql.gz') ?: [];
rsort($todos); // mais recente primeiro
$apagados = 0;
foreach (array_slice($todos, $maxBackups) as $old) {
    unlink($old);
    $apagados++;
}
if ($apagados > 0) {
    echo "[" . date('Y-m-d H:i:s') . "] $apagados backup(s) antigo(s) removido(s)\n";
}

// ── Actualizar configuração com data do último backup ─────────
try {
    $db   = new Database();
    $conn = $db->connect();
    $agora = date('Y-m-d H:i:s');
    $conn->query("
        INSERT INTO configuracoes (chave, valor, descricao, tipo, grupo)
        VALUES ('ultimo_backup', '$agora', 'Data do último backup automático', 'texto', 'backup')
        ON DUPLICATE KEY UPDATE valor = '$agora'
    ");
    $db->closeConnection();
} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] Aviso: não foi possível actualizar configurações: " . $e->getMessage() . "\n";
}

echo "[" . date('Y-m-d H:i:s') . "] Backup concluído com sucesso.\n";
exit(0);
