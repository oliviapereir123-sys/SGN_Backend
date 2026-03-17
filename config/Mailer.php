<?php
/**
 * Mailer.php — Envio de email via SMTP com PHPMailer
 * Instituto Politécnico do Mayombe
 *
 * Dependência: composer require phpmailer/phpmailer
 * Depois de instalar: o ficheiro vendor/autoload.php fica disponível
 */

// Carregar PHPMailer via Composer
$autoload = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoload)) {
    // Fallback: tentar caminho alternativo do XAMPP
    $autoload = __DIR__ . '/../../vendor/autoload.php';
}
if (!file_exists($autoload)) {
    throw new RuntimeException(
        'PHPMailer não instalado. Execute: cd backend && composer install'
    );
}
require_once $autoload;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception as MailerException;

class Mailer {

    private static function createMailer(): PHPMailer {
        $cfg    = require __DIR__ . '/email.php';
        $mailer = new PHPMailer(true);

        $mailer->isSMTP();
        $mailer->Host        = $cfg['host'];
        $mailer->SMTPAuth    = true;
        $mailer->Username    = $cfg['username'];
        $mailer->Password    = $cfg['password'];
        $mailer->SMTPSecure  = $cfg['encryption'] === 'ssl'
            ? PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer::ENCRYPTION_STARTTLS;
        $mailer->Port        = $cfg['port'];
        $mailer->CharSet     = $cfg['charset'] ?? 'UTF-8';
        $mailer->SMTPDebug   = ($cfg['debug'] ?? false) ? SMTP::DEBUG_SERVER : SMTP::DEBUG_OFF;

        $mailer->setFrom($cfg['from_email'], $cfg['from_name']);

        return $mailer;
    }

    /**
     * Envia o boletim HTML a um encarregado
     *
     * @param string $toEmail     Email do encarregado
     * @param string $toNome      Nome do encarregado
     * @param string $assunto     Assunto do email
     * @param string $htmlBody    Corpo HTML gerado por EmailTemplate
     * @return array { success: bool, error?: string }
     */
    public static function enviarBoletim(
        string $toEmail,
        string $toNome,
        string $assunto,
        string $htmlBody
    ): array {
        try {
            $mailer = self::createMailer();
            $mailer->addAddress($toEmail, $toNome);
            $mailer->isHTML(true);
            $mailer->Subject = $assunto;
            $mailer->Body    = $htmlBody;
            // Versão texto simples para clientes que não suportam HTML
            $mailer->AltBody = strip_tags(str_replace(['<br>', '<br/>', '</p>', '</tr>'], "\n", $htmlBody));
            $mailer->send();
            return ['success' => true];
        } catch (MailerException $e) {
            return ['success' => false, 'error' => $mailer->ErrorInfo ?? $e->getMessage()];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
?>
