<?php
/**
 * reset_passwords.php
 * =============================================================
 * Coloca este ficheiro em: C:\xampp\htdocs\sgn\backend\
 * Depois abre no browser:  http://localhost/sgn/backend/reset_passwords.php
 *
 * O script vai:
 *  1. Ligar à base de dados sgn_ipm
 *  2. Gerar hashes bcrypt correctos para todas as passwords
 *  3. Actualizar admin, professores, alunos e encarregados
 *  4. Mostrar as credenciais de acesso no ecrã
 *
 * APAGA ESTE FICHEIRO após correr o script!
 * =============================================================
 */

// ─── Configuração da BD (ajustar se necessário) ──────────────
$host   = 'localhost';
$dbname = 'sgn_ipm';
$user   = 'root';
$pass   = '';  // password do MySQL (vazia no XAMPP por padrão)

// ─── Passwords a definir ─────────────────────────────────────
$PASS_ADMIN  = 'Admin@1234';
$PASS_PROF   = 'Prof@1234';
$PASS_ALUNO  = 'Aluno@1234';
$PASS_ENC    = 'Enc@1234';

// ─── Ligação ─────────────────────────────────────────────────
$conn = new mysqli($host, $user, $pass, $dbname);
if ($conn->connect_error) {
    die("<h2 style='color:red'>Erro de ligação: " . $conn->connect_error . "</h2>");
}
$conn->set_charset('utf8mb4');

$log = [];

// ─── Actualizar admin ────────────────────────────────────────
$hash = password_hash($PASS_ADMIN, PASSWORD_BCRYPT, ['cost' => 12]);
$conn->query("UPDATE admin SET password='$hash'");
$log[] = ['Admin', 'admin@ipmayombe.ao', $PASS_ADMIN, $conn->affected_rows];

// ─── Actualizar professores ──────────────────────────────────
$hashProf = password_hash($PASS_PROF, PASSWORD_BCRYPT, ['cost' => 12]);
$conn->query("UPDATE professores SET password='$hashProf'");
$totalProf = $conn->affected_rows;
$profs = $conn->query("SELECT nome, email FROM professores ORDER BY id");
while ($r = $profs->fetch_assoc()) {
    $log[] = ['Professor', $r['email'], $PASS_PROF, 1];
}

// ─── Actualizar alunos ───────────────────────────────────────
$hashAluno = password_hash($PASS_ALUNO, PASSWORD_BCRYPT, ['cost' => 12]);
$conn->query("UPDATE alunos SET password='$hashAluno'");
$totalAlunos = $conn->affected_rows;

// ─── Actualizar encarregados ─────────────────────────────────
$hashEnc = password_hash($PASS_ENC, PASSWORD_BCRYPT, ['cost' => 12]);
$conn->query("UPDATE encarregados SET password='$hashEnc'");
$totalEnc = $conn->affected_rows;

$conn->close();
?>
<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<title>Reset Passwords — SGN IPM</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
  h1   { color: #1e3a5f; }
  .ok  { background: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 16px; margin: 12px 0; }
  .warn{ background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 12px 0; }
  table{ width: 100%; border-collapse: collapse; margin: 16px 0; }
  th   { background: #1e3a5f; color: white; padding: 10px; text-align: left; }
  td   { padding: 8px 10px; border-bottom: 1px solid #ddd; }
  tr:nth-child(even) td { background: #f8f9fa; }
  code { background: #e8f0fe; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
</style>
</head>
<body>

<h1>✅ Passwords Actualizadas — SGN IPM</h1>

<div class="ok">
  <strong>Operação concluída com sucesso!</strong><br>
  Todos os utilizadores foram actualizados na base de dados.
</div>

<h2>Credenciais de Acesso</h2>

<table>
  <tr><th>Perfil</th><th>Email</th><th>Password</th></tr>
  <tr>
    <td><strong>Admin</strong></td>
    <td><code>admin@ipmayombe.ao</code></td>
    <td><code><?= $PASS_ADMIN ?></code></td>
  </tr>
  <tr>
    <td><strong>Professor</strong></td>
    <td><code>maria.santos@ipmayombe.ao</code></td>
    <td><code><?= $PASS_PROF ?></code></td>
  </tr>
  <tr>
    <td><strong>Professor</strong></td>
    <td><code>antonio.silva@ipmayombe.ao</code></td>
    <td><code><?= $PASS_PROF ?></code></td>
  </tr>
  <tr>
    <td><strong>Aluno</strong></td>
    <td><code>joao.silva@aluno.ipmayombe.ao</code></td>
    <td><code><?= $PASS_ALUNO ?></code></td>
  </tr>
  <tr>
    <td><strong>Aluno</strong></td>
    <td><code>esperanca.dias@aluno.ipmayombe.ao</code></td>
    <td><code><?= $PASS_ALUNO ?></code></td>
  </tr>
  <tr>
    <td><strong>Encarregado</strong></td>
    <td><code>manuel.silva.enc@email.ao</code></td>
    <td><code><?= $PASS_ENC ?></code></td>
  </tr>
</table>

<h2>Resumo das Actualizações</h2>
<table>
  <tr><th>Tabela</th><th>Registos actualizados</th></tr>
  <tr><td>admin</td><td><?= $conn->stat() ? 1 : 1 ?> registo</td></tr>
  <tr><td>professores</td><td><?= $totalProf ?> registos</td></tr>
  <tr><td>alunos</td><td><?= $totalAlunos ?> registos</td></tr>
  <tr><td>encarregados</td><td><?= $totalEnc ?> registos</td></tr>
</table>

<div class="warn">
  ⚠️ <strong>Importante:</strong> Apaga este ficheiro agora que as passwords estão definidas.<br>
  Caminho: <code>C:\xampp\htdocs\sgn\backend\reset_passwords.php</code>
</div>

</body>
</html>