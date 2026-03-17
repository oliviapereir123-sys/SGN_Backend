<?php
/**
 * Configuração SMTP — SGN IPM Mayombe
 *
 * Para Gmail:
 *  1. Activar verificação em 2 passos na conta Google
 *  2. Gerar "Palavra-passe de aplicação" em: myaccount.google.com/apppasswords
 *  3. Preencher as variáveis abaixo com os dados reais
 *
 * Para Outlook/Hotmail:
 *  - SMTP_HOST = smtp-mail.outlook.com
 *  - SMTP_PORT = 587
 *  - SMTP_ENCRYPTION = tls
 */

return [
    // ─── Servidor SMTP ───────────────────────────────────────
    'host'       => 'smtp.gmail.com',      // ou smtp-mail.outlook.com
    'port'       => 587,
    'encryption' => 'tls',                 // 'tls' (porta 587) ou 'ssl' (porta 465)

    // ─── Credenciais ─────────────────────────────────────────
    'username'   => 'seuemail@gmail.com',  // email da conta Gmail
    'password'   => 'xxxx xxxx xxxx xxxx', // palavra-passe de aplicação (16 chars)

    // ─── Remetente ───────────────────────────────────────────
    'from_email' => 'seuemail@gmail.com',
    'from_name'  => 'Instituto Politécnico do Mayombe',

    // ─── Configurações opcionais ─────────────────────────────
    'debug'      => false,  // true = mostra log SMTP no output (só em desenvolvimento)
    'charset'    => 'UTF-8',
];
?>
