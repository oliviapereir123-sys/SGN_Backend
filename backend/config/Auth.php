<?php
/**
 * Auth.php — Autenticação JWT (sem bibliotecas externas)
 * O segredo é lido do ficheiro .env para não ficar exposto no código fonte.
 */

class Auth {

    private static function getSecret(): string {
        $envPaths = [
            __DIR__ . '/../.env',
            __DIR__ . '/../../.env',
        ];
        foreach ($envPaths as $path) {
            if (file_exists($path)) {
                $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    if (str_starts_with(trim($line), 'JWT_SECRET=')) {
                        $val = trim(substr($line, strlen('JWT_SECRET=')));
                        $val = trim($val, '"\'');
                        if ($val !== '') return $val;
                    }
                }
            }
        }
        $envVar = getenv('JWT_SECRET');
        if ($envVar) return $envVar;

        return 'SGN_IPM_Maiombe_SECRET_CHANGE_ME_IN_PRODUCTION';
    }

    private static int $ttl = 86400 * 7; // 7 dias

    // ─── Gerar token ────────────────────────────────────────

    public static function generateToken(array $payload): string {
        $secret  = self::getSecret();
        $header  = self::b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload['iat'] = time();
        $payload['exp'] = time() + self::$ttl;
        $body    = self::b64url(json_encode($payload));
        $sig     = self::b64url(hash_hmac('sha256', "$header.$body", $secret, true));
        return "$header.$body.$sig";
    }

    // ─── Validar token ──────────────────────────────────────

    public static function validateToken(string $token): ?array {
        $secret = self::getSecret();
        $parts  = explode('.', $token);
        if (count($parts) !== 3) return null;

        [$header, $body, $sig] = $parts;
        $expectedSig = self::b64url(hash_hmac('sha256', "$header.$body", $secret, true));

        if (!hash_equals($expectedSig, $sig)) return null;

        $payload = json_decode(self::b64url_decode($body), true);
        if (!$payload) return null;

        if (isset($payload['exp']) && $payload['exp'] < time()) return null;

        return $payload;
    }

    // ─── Extrair token do header Authorization ───────────────
    // Solução robusta para XAMPP/Windows que bloqueia o header Authorization

    public static function getTokenFromRequest(): ?string {
        $auth = '';

        // 1. Forma padrão
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $auth = $_SERVER['HTTP_AUTHORIZATION'];
        }
        // 2. Apache mod_rewrite via .htaccess (REDIRECT_ prefix)
        elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        // 3. Variável de ambiente injectada pelo .htaccess
        elseif (!empty(getenv('HTTP_AUTHORIZATION'))) {
            $auth = getenv('HTTP_AUTHORIZATION');
        }
        // 4. getallheaders() — lê directamente os headers HTTP
        elseif (function_exists('getallheaders')) {
            foreach (getallheaders() as $name => $value) {
                if (strtolower($name) === 'authorization') {
                    $auth = $value;
                    break;
                }
            }
        }
        // 5. apache_request_headers() — alias de getallheaders()
        elseif (function_exists('apache_request_headers')) {
            foreach (apache_request_headers() as $name => $value) {
                if (strtolower($name) === 'authorization') {
                    $auth = $value;
                    break;
                }
            }
        }

        // 6. Fallback via query string ?_token=... (XAMPP último recurso)
        if (empty($auth) && !empty($_GET['_token'])) {
            $auth = 'Bearer ' . $_GET['_token'];
        }

        if (preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) {
            return $m[1];
        }

        return null;
    }

    // ─── Middleware: exige login (qualquer perfil) ───────────

    public static function requireLogin(): array {
        $token   = self::getTokenFromRequest();
        $payload = $token ? self::validateToken($token) : null;

        if (!$payload) {
            http_response_code(401);
            echo json_encode(['error' => 'Autenticação necessária. Faça login primeiro.']);
            exit();
        }

        return $payload;
    }

    // ─── Middleware: exige perfil específico ─────────────────

    public static function requireRole(string ...$roles): array {
        $payload = self::requireLogin();

        if (!in_array($payload['type'] ?? '', $roles)) {
            http_response_code(403);
            echo json_encode([
                'error' => 'Acesso negado. Perfil necessário: ' . implode(' ou ', $roles)
            ]);
            exit();
        }

        return $payload;
    }

    // ─── Helpers Base64URL ───────────────────────────────────

    private static function b64url(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function b64url_decode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
    }
}
?>