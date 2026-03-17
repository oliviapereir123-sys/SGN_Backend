<?php
/**
 * Database.php — Ligação MySQLi
 * As credenciais são lidas do ficheiro .env para não ficarem no código.
 */

class Database {

    private string  $host;
    private string  $db_name;
    private string  $user;
    private string  $pass;
    private ?mysqli $conn = null;

    public function __construct() {
        $env = $this->loadEnv();
        $this->host    = $env['DB_HOST'] ?? 'localhost';
        $this->db_name = $env['DB_NAME'] ?? 'sgn_ipm';
        $this->user    = $env['DB_USER'] ?? 'root';
        $this->pass    = $env['DB_PASS'] ?? '';
    }

    private function loadEnv(): array {
        $vars     = [];
        $envPaths = [
            __DIR__ . '/../.env',
            __DIR__ . '/../../.env',
        ];

        foreach ($envPaths as $path) {
            if (!file_exists($path)) continue;
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                // Ignorar comentários
                if ($line === '' || str_starts_with($line, '#')) continue;
                if (!str_contains($line, '=')) continue;
                [$key, $val] = explode('=', $line, 2);
                $vars[trim($key)] = trim($val, '"\'');
            }
            break; // Usar o primeiro .env encontrado
        }

        // Fallback para variáveis de ambiente do servidor
        foreach (['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'] as $k) {
            if (!isset($vars[$k]) && getenv($k) !== false) {
                $vars[$k] = getenv($k);
            }
        }

        return $vars;
    }

    public function connect(): mysqli {
        $this->conn = new mysqli($this->host, $this->user, $this->pass, $this->db_name);

        if ($this->conn->connect_error) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro de ligação à base de dados: ' . $this->conn->connect_error]);
            exit();
        }

        $this->conn->set_charset('utf8mb4');
        return $this->conn;
    }

    public function closeConnection(): void {
        if ($this->conn) {
            $this->conn->close();
        }
    }
}
?>