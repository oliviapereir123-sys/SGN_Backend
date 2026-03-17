<?php
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

$auth = Auth::requireRole('admin');
$db   = new Database();
$conn = $db->connect();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$tipo = $_GET['tipo'] ?? ''; // professores | alunos

if (!isset($_FILES['ficheiro']) || $_FILES['ficheiro']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Ficheiro não recebido ou com erro']);
    exit();
}

$ext = strtolower(pathinfo($_FILES['ficheiro']['name'], PATHINFO_EXTENSION));
if (!in_array($ext, ['csv', 'txt'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Apenas ficheiros CSV são aceites']);
    exit();
}

$handle = fopen($_FILES['ficheiro']['tmp_name'], 'r');
if (!$handle) {
    http_response_code(500);
    echo json_encode(['error' => 'Não foi possível abrir o ficheiro']);
    exit();
}

// Detectar separador (vírgula ou ponto-e-vírgula)
$primeiraLinha = fgets($handle);
rewind($handle);
$sep = substr_count($primeiraLinha, ';') > substr_count($primeiraLinha, ',') ? ';' : ',';

$header  = fgetcsv($handle, 0, $sep);
$header  = array_map('trim', $header);
$header  = array_map('strtolower', $header);

$inseridos = 0;
$erros     = [];
$linha     = 1;

$conn->begin_transaction();

try {
    while (($row = fgetcsv($handle, 0, $sep)) !== false) {
        $linha++;
        if (count($row) < 2) continue;
        $dados = array_combine(array_slice($header, 0, count($row)), $row);
        $dados = array_map('trim', $dados);

        if ($tipo === 'professores') {
            // Colunas esperadas: nome, email, departamento (opcional), password (opcional)
            $nome  = $dados['nome']  ?? '';
            $email = $dados['email'] ?? '';
            $dept  = $dados['departamento'] ?? '';
            $pass  = $dados['password'] ?? 'Prof@IPM2025';

            if (!$nome || !$email) { $erros[] = "Linha $linha: nome e email obrigatórios"; continue; }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { $erros[] = "Linha $linha: email inválido ($email)"; continue; }

            $hash = password_hash($pass, PASSWORD_BCRYPT);
            $stmt = $conn->prepare("INSERT IGNORE INTO professores (nome, email, password, departamento) VALUES (?,?,?,?)");
            $stmt->bind_param("ssss", $nome, $email, $hash, $dept);
            $stmt->execute();
            if ($stmt->affected_rows > 0) $inseridos++;

        } elseif ($tipo === 'alunos') {
            // Colunas esperadas: numero, nome, email, turma (nome da turma), password (opcional)
            // enc_nome, enc_email, enc_parentesco (opcionais para criar encarregado)
            $numero  = $dados['numero']  ?? $dados['nº'] ?? '';
            $nome    = $dados['nome']    ?? '';
            $email   = $dados['email']   ?? '';
            $turmaN  = $dados['turma']   ?? '';
            $pass    = $dados['password'] ?? 'Aluno@2025';

            if (!$nome || !$email || !$numero) { $erros[] = "Linha $linha: numero, nome e email obrigatórios"; continue; }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { $erros[] = "Linha $linha: email inválido ($email)"; continue; }

            // Resolver turma_id pelo nome
            $turmaId = null;
            if ($turmaN) {
                $stmtT = $conn->prepare("SELECT id FROM turmas WHERE nome = ? LIMIT 1");
                $stmtT->bind_param("s", $turmaN);
                $stmtT->execute();
                $tResult = $stmtT->get_result()->fetch_assoc();
                if ($tResult) $turmaId = $tResult['id'];
                else $erros[] = "Linha $linha: turma '$turmaN' não encontrada (aluno inserido sem turma)";
            }

            $hash = password_hash($pass, PASSWORD_BCRYPT);
            $stmt = $conn->prepare("INSERT IGNORE INTO alunos (numero, nome, email, password, turma_id) VALUES (?,?,?,?,?)");
            $stmt->bind_param("ssssi", $numero, $nome, $email, $hash, $turmaId);
            $stmt->execute();

            if ($stmt->affected_rows > 0) {
                $alunoId = $conn->insert_id;
                $inseridos++;
                // Criar encarregado se fornecido
                $encNome   = $dados['enc_nome']       ?? '';
                $encEmail  = $dados['enc_email']      ?? '';
                $encParent = $dados['enc_parentesco'] ?? 'Encarregado';
                if ($encNome && $encEmail && filter_var($encEmail, FILTER_VALIDATE_EMAIL)) {
                    $encPass = 'Enc@' . rand(1000,9999);
                    $encHash = password_hash($encPass, PASSWORD_BCRYPT);
                    $stmtEnc = $conn->prepare("INSERT IGNORE INTO encarregados (nome, email, password, aluno_id, parentesco) VALUES (?,?,?,?,?)");
                    $stmtEnc->bind_param("ssssi", $encNome, $encEmail, $encHash, $alunoId, $encParent);
                    $stmtEnc->execute();
                }
            }
        }
    }

    $conn->commit();
    fclose($handle);

    echo json_encode([
        'success'   => true,
        'inseridos' => $inseridos,
        'erros'     => $erros,
        'message'   => "$inseridos registos importados" . (count($erros) > 0 ? ' com ' . count($erros) . ' aviso(s)' : ' com sucesso'),
    ]);

} catch (Exception $e) {
    $conn->rollback();
    fclose($handle);
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno: ' . $e->getMessage()]);
}

$db->closeConnection();
?>