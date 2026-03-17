<?php
/**
 * SGN — Script de Dados Iniciais
 * Instituto Politécnico do Mayombe
 *
 * Executar UMA VEZ após o 01_schema.sql:
 *   php backend/database/02_populate.php
 *
 * Ou via browser:
 *   http://localhost/sgn/backend/database/02_populate.php
 */

$host = 'localhost';
$db   = 'sgn_ipm';
$user = 'root';
$pass = '';  // Alterar se o MySQL tiver palavra-passe

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("❌ Erro de ligação: " . $e->getMessage());
}

$log = [];
$erros = 0;

function inserir(PDO $pdo, string $tabela, array $dados, array &$log, int &$erros): ?int {
    $cols = implode(', ', array_keys($dados));
    $vals = implode(', ', array_fill(0, count($dados), '?'));
    $stmt = $pdo->prepare("INSERT IGNORE INTO $tabela ($cols) VALUES ($vals)");
    try {
        $stmt->execute(array_values($dados));
        $id = (int) $pdo->lastInsertId();
        if ($stmt->rowCount() > 0) {
            $log[] = "✅ [$tabela] Inserido: " . ($dados['nome'] ?? $dados['email'] ?? $dados['numero'] ?? '');
        } else {
            $log[] = "⚠️  [$tabela] Já existe: " . ($dados['nome'] ?? $dados['email'] ?? $dados['numero'] ?? '');
        }
        return $id ?: null;
    } catch (PDOException $e) {
        $log[] = "❌ [$tabela] Erro: " . $e->getMessage();
        $erros++;
        return null;
    }
}

function hash_senha(string $senha): string {
    return password_hash($senha, PASSWORD_BCRYPT);
}

// ─── Admin ──────────────────────────────────────────────────

$log[] = "\n=== ADMIN ===";
inserir($pdo, 'admin', [
    'nome'     => 'António Ferreira',
    'email'    => 'admin@ipmayombe.ao',
    'password' => hash_senha('Admin@IPM2024'),
], $log, $erros);

// ─── Professores ────────────────────────────────────────────

$log[] = "\n=== PROFESSORES ===";

$professores_data = [
    ['nome' => 'Maria dos Santos',    'email' => 'maria.santos@ipmayombe.ao',    'dep' => 'Ciências e Tecnologia', 'senha' => 'Prof@Santos24'],
    ['nome' => 'Carlos Mendes',       'email' => 'carlos.mendes@ipmayombe.ao',   'dep' => 'Ciências e Tecnologia', 'senha' => 'Prof@Mendes24'],
    ['nome' => 'Manuel Gomes',        'email' => 'manuel.gomes@ipmayombe.ao',    'dep' => 'Ciências e Tecnologia', 'senha' => 'Prof@Gomes24'],
    ['nome' => 'Ana Costa',           'email' => 'ana.costa@ipmayombe.ao',       'dep' => 'Ciências Exactas',      'senha' => 'Prof@Costa24'],
    ['nome' => 'Pedro Alves',         'email' => 'pedro.alves@ipmayombe.ao',     'dep' => 'Ciências e Tecnologia', 'senha' => 'Prof@Alves24'],
    ['nome' => 'Teresa Almeida',      'email' => 'teresa.almeida@ipmayombe.ao',  'dep' => 'Ciências Sociais',      'senha' => 'Prof@Almeida24'],
    ['nome' => 'David Sousa',         'email' => 'david.sousa@ipmayombe.ao',     'dep' => 'Ciências Sociais',      'senha' => 'Prof@Sousa24'],
    ['nome' => 'António Silva',       'email' => 'antonio.silva@ipmayombe.ao',   'dep' => 'Ciências Sociais',      'senha' => 'Prof@Silva24'],
];

$prof_ids = [];
foreach ($professores_data as $p) {
    $id = inserir($pdo, 'professores', [
        'nome'         => $p['nome'],
        'email'        => $p['email'],
        'password'     => hash_senha($p['senha']),
        'departamento' => $p['dep'],
        'estado'       => 'Activo',
    ], $log, $erros);
    // Guardar id por email para atribuições
    if ($id) $prof_ids[$p['email']] = $id;
    else {
        $row = $pdo->query("SELECT id FROM professores WHERE email='{$p['email']}'")->fetch();
        if ($row) $prof_ids[$p['email']] = $row['id'];
    }
}

// ─── Alunos ─────────────────────────────────────────────────

$log[] = "\n=== ALUNOS ===";

// Buscar IDs das turmas
$turmas = $pdo->query("SELECT id, nome FROM turmas")->fetchAll(PDO::FETCH_KEY_PAIR);

$alunos_data = [
    // Contabilidade 10º A
    ['num'=>'2024010001','nome'=>'João Manuel da Silva',      'email'=>'joao.silva@aluno.ipmayombe.ao',      'turma'=>'CONT-10A','senha'=>'Aluno@2024'],
    ['num'=>'2024010002','nome'=>'Ana Beatriz Ferreira',      'email'=>'ana.ferreira@aluno.ipmayombe.ao',    'turma'=>'CONT-10A','senha'=>'Aluno@2024'],
    ['num'=>'2024010003','nome'=>'Pedro Miguel Santos',       'email'=>'pedro.santos@aluno.ipmayombe.ao',    'turma'=>'CONT-10A','senha'=>'Aluno@2024'],
    ['num'=>'2024010004','nome'=>'Maria José Costa',          'email'=>'maria.costa@aluno.ipmayombe.ao',     'turma'=>'CONT-10A','senha'=>'Aluno@2024'],
    ['num'=>'2024010005','nome'=>'Carlos Eduardo Gomes',      'email'=>'carlos.gomes@aluno.ipmayombe.ao',    'turma'=>'CONT-10A','senha'=>'Aluno@2024'],
    // Contabilidade 11º A
    ['num'=>'2023010001','nome'=>'Luísa Helena Martins',      'email'=>'luisa.martins@aluno.ipmayombe.ao',   'turma'=>'CONT-11A','senha'=>'Aluno@2024'],
    ['num'=>'2023010002','nome'=>'Ricardo António Sousa',     'email'=>'ricardo.sousa@aluno.ipmayombe.ao',   'turma'=>'CONT-11A','senha'=>'Aluno@2024'],
    ['num'=>'2023010003','nome'=>'Sofia Margarida Alves',     'email'=>'sofia.alves@aluno.ipmayombe.ao',     'turma'=>'CONT-11A','senha'=>'Aluno@2024'],
    ['num'=>'2023010004','nome'=>'Filipe Augusto Neto',       'email'=>'filipe.neto@aluno.ipmayombe.ao',     'turma'=>'CONT-11A','senha'=>'Aluno@2024'],
    ['num'=>'2023010005','nome'=>'Beatriz Conceição Lima',    'email'=>'beatriz.lima@aluno.ipmayombe.ao',    'turma'=>'CONT-11A','senha'=>'Aluno@2024'],
    // Contabilidade 12º A
    ['num'=>'2022010001','nome'=>'Adelino José Tavares',      'email'=>'adelino.tavares@aluno.ipmayombe.ao', 'turma'=>'CONT-12A','senha'=>'Aluno@2024'],
    ['num'=>'2022010002','nome'=>'Conceição Maria Baptista',  'email'=>'conceicao.baptista@aluno.ipmayombe.ao','turma'=>'CONT-12A','senha'=>'Aluno@2024'],
    ['num'=>'2022010003','nome'=>'Domingos Paulo Lopes',      'email'=>'domingos.lopes@aluno.ipmayombe.ao',  'turma'=>'CONT-12A','senha'=>'Aluno@2024'],
    // Informática 10º A
    ['num'=>'2024020001','nome'=>'Esperança Filomena Dias',   'email'=>'esperanca.dias@aluno.ipmayombe.ao',  'turma'=>'IG-10A','senha'=>'Aluno@2024'],
    ['num'=>'2024020002','nome'=>'Francisco Albino Rocha',    'email'=>'francisco.rocha@aluno.ipmayombe.ao', 'turma'=>'IG-10A','senha'=>'Aluno@2024'],
    ['num'=>'2024020003','nome'=>'Graça Isabelina Pinto',     'email'=>'graca.pinto@aluno.ipmayombe.ao',     'turma'=>'IG-10A','senha'=>'Aluno@2024'],
    ['num'=>'2024020004','nome'=>'Hélder Justino Cardoso',    'email'=>'helder.cardoso@aluno.ipmayombe.ao',  'turma'=>'IG-10A','senha'=>'Aluno@2024'],
    ['num'=>'2024020005','nome'=>'Inês Karina Monteiro',      'email'=>'ines.monteiro@aluno.ipmayombe.ao',   'turma'=>'IG-10A','senha'=>'Aluno@2024'],
    // Informática 11º A
    ['num'=>'2023020001','nome'=>'Jorge Lemos Nkosi',         'email'=>'jorge.nkosi@aluno.ipmayombe.ao',     'turma'=>'IG-11A','senha'=>'Aluno@2024'],
    ['num'=>'2023020002','nome'=>'Kátia Mariana Oliveira',    'email'=>'katia.oliveira@aluno.ipmayombe.ao',  'turma'=>'IG-11A','senha'=>'Aluno@2024'],
    ['num'=>'2023020003','nome'=>'Leonel Afonso Queta',       'email'=>'leonel.queta@aluno.ipmayombe.ao',    'turma'=>'IG-11A','senha'=>'Aluno@2024'],
    ['num'=>'2023020004','nome'=>'Marlene Beatriz Teixeira',  'email'=>'marlene.teixeira@aluno.ipmayombe.ao','turma'=>'IG-11A','senha'=>'Aluno@2024'],
    ['num'=>'2023020005','nome'=>'Nelson Cunha Brito',        'email'=>'nelson.brito@aluno.ipmayombe.ao',    'turma'=>'IG-11A','senha'=>'Aluno@2024'],
    // Informática 12º A
    ['num'=>'2022020001','nome'=>'Olga Perpétua Vieira',      'email'=>'olga.vieira@aluno.ipmayombe.ao',     'turma'=>'IG-12A','senha'=>'Aluno@2024'],
    ['num'=>'2022020002','nome'=>'Paulo Quissanga Luvualo',   'email'=>'paulo.luvualo@aluno.ipmayombe.ao',   'turma'=>'IG-12A','senha'=>'Aluno@2024'],
    ['num'=>'2022020003','nome'=>'Quitéria Rosa Mendonça',    'email'=>'quiteria.mendonca@aluno.ipmayombe.ao','turma'=>'IG-12A','senha'=>'Aluno@2024'],
    ['num'=>'2022020004','nome'=>'Raimundo Soba Ntumba',      'email'=>'raimundo.ntumba@aluno.ipmayombe.ao', 'turma'=>'IG-12A','senha'=>'Aluno@2024'],
    ['num'=>'2022020005','nome'=>'Sandra Teresa Muanda',      'email'=>'sandra.muanda@aluno.ipmayombe.ao',   'turma'=>'IG-12A','senha'=>'Aluno@2024'],
];

$aluno_ids = [];
foreach ($alunos_data as $a) {
    $turma_id = $turmas[$a['turma']] ?? null;
    $id = inserir($pdo, 'alunos', [
        'numero'   => $a['num'],
        'nome'     => $a['nome'],
        'email'    => $a['email'],
        'password' => hash_senha($a['senha']),
        'turma_id' => $turma_id,
        'estado'   => 'Activo',
    ], $log, $erros);
    if ($id) $aluno_ids[$a['num']] = $id;
    else {
        $row = $pdo->query("SELECT id FROM alunos WHERE numero='{$a['num']}'")->fetch();
        if ($row) $aluno_ids[$a['num']] = $row['id'];
    }
}

// ─── Encarregados ───────────────────────────────────────────

$log[] = "\n=== ENCARREGADOS ===";

$encarregados_data = [
    ['nome'=>'Manuel da Silva',      'email'=>'manuel.silva.enc@email.ao',     'tel'=>'+244 912 001 001','num_aluno'=>'2024010001','parent'=>'Pai',   'senha'=>'Enc@2024'],
    ['nome'=>'Rosa Ferreira',        'email'=>'rosa.ferreira.enc@email.ao',    'tel'=>'+244 912 001 002','num_aluno'=>'2024010002','parent'=>'Mãe',   'senha'=>'Enc@2024'],
    ['nome'=>'Miguel Santos',        'email'=>'miguel.santos.enc@email.ao',    'tel'=>'+244 912 001 003','num_aluno'=>'2024010003','parent'=>'Pai',   'senha'=>'Enc@2024'],
    ['nome'=>'Fátima Costa',         'email'=>'fatima.costa.enc@email.ao',     'tel'=>'+244 912 001 004','num_aluno'=>'2024010004','parent'=>'Mãe',   'senha'=>'Enc@2024'],
    ['nome'=>'Eduardo Gomes',        'email'=>'eduardo.gomes.enc@email.ao',    'tel'=>'+244 912 001 005','num_aluno'=>'2024010005','parent'=>'Pai',   'senha'=>'Enc@2024'],
    ['nome'=>'Helena Martins',       'email'=>'helena.martins.enc@email.ao',   'tel'=>'+244 912 002 001','num_aluno'=>'2023010001','parent'=>'Mãe',   'senha'=>'Enc@2024'],
    ['nome'=>'António Sousa',        'email'=>'antonio.sousa.enc@email.ao',    'tel'=>'+244 912 002 002','num_aluno'=>'2023010002','parent'=>'Pai',   'senha'=>'Enc@2024'],
    ['nome'=>'Margarida Alves',      'email'=>'margarida.alves.enc@email.ao',  'tel'=>'+244 912 002 003','num_aluno'=>'2023010003','parent'=>'Mãe',   'senha'=>'Enc@2024'],
    ['nome'=>'Augusto Neto',         'email'=>'augusto.neto.enc@email.ao',     'tel'=>'+244 912 002 004','num_aluno'=>'2023010004','parent'=>'Pai',   'senha'=>'Enc@2024'],
    ['nome'=>'Conceição Lima',       'email'=>'conceicao.lima.enc@email.ao',   'tel'=>'+244 912 002 005','num_aluno'=>'2023010005','parent'=>'Mãe',   'senha'=>'Enc@2024'],
    ['nome'=>'José Tavares',         'email'=>'jose.tavares.enc@email.ao',     'tel'=>'+244 912 003 001','num_aluno'=>'2022010001','parent'=>'Pai',   'senha'=>'Enc@2024'],
    ['nome'=>'Maria Baptista',       'email'=>'maria.baptista.enc@email.ao',   'tel'=>'+244 912 003 002','num_aluno'=>'2022010002','parent'=>'Mãe',   'senha'=>'Enc@2024'],
    ['nome'=>'Paulo Lopes',          'email'=>'paulo.lopes.enc@email.ao',      'tel'=>'+244 912 003 003','num_aluno'=>'2022010003','parent'=>'Pai',   'senha'=>'Enc@2024'],
    ['nome'=>'Filomena Dias',        'email'=>'filomena.dias.enc@email.ao',    'tel'=>'+244 912 004 001','num_aluno'=>'2024020001','parent'=>'Mãe',   'senha'=>'Enc@2024'],
    ['nome'=>'Albino Rocha',         'email'=>'albino.rocha.enc@email.ao',     'tel'=>'+244 912 004 002','num_aluno'=>'2024020002','parent'=>'Pai',   'senha'=>'Enc@2024'],
    ['nome'=>'Isabelina Pinto',      'email'=>'isabelina.pinto.enc@email.ao',  'tel'=>'+244 912 004 003','num_aluno'=>'2024020003','parent'=>'Mãe',   'senha'=>'Enc@2024'],
    ['nome'=>'Justino Cardoso',      'email'=>'justino.cardoso.enc@email.ao',  'tel'=>'+244 912 004 004','num_aluno'=>'2024020004','parent'=>'Pai',   'senha'=>'Enc@2024'],
    ['nome'=>'Karina Monteiro',      'email'=>'karina.monteiro.enc@email.ao',  'tel'=>'+244 912 004 005','num_aluno'=>'2024020005','parent'=>'Mãe',   'senha'=>'Enc@2024'],
    ['nome'=>'Lemos Nkosi',          'email'=>'lemos.nkosi.enc@email.ao',      'tel'=>'+244 912 005 001','num_aluno'=>'2023020001','parent'=>'Pai',   'senha'=>'Enc@2024'],
    ['nome'=>'Mariana Oliveira',     'email'=>'mariana.oliveira.enc@email.ao', 'tel'=>'+244 912 005 002','num_aluno'=>'2023020002','parent'=>'Mãe',   'senha'=>'Enc@2024'],
    ['nome'=>'Afonso Queta',         'email'=>'afonso.queta.enc@email.ao',     'tel'=>'+244 912 005 003','num_aluno'=>'2023020003','parent'=>'Pai',   'senha'=>'Enc@2024'],
    ['nome'=>'Beatriz Teixeira',     'email'=>'beatriz.teixeira.enc@email.ao', 'tel'=>'+244 912 005 004','num_aluno'=>'2023020004','parent'=>'Mãe',   'senha'=>'Enc@2024'],
    ['nome'=>'Cunha Brito',          'email'=>'cunha.brito.enc@email.ao',      'tel'=>'+244 912 005 005','num_aluno'=>'2023020005','parent'=>'Pai',   'senha'=>'Enc@2024'],
    ['nome'=>'Perpétua Vieira',      'email'=>'perpetua.vieira.enc@email.ao',  'tel'=>'+244 912 006 001','num_aluno'=>'2022020001','parent'=>'Mãe',   'senha'=>'Enc@2024'],
    ['nome'=>'Quissanga Luvualo',    'email'=>'quissanga.luvualo.enc@email.ao','tel'=>'+244 912 006 002','num_aluno'=>'2022020002','parent'=>'Pai',   'senha'=>'Enc@2024'],
    ['nome'=>'Rosa Mendonça',        'email'=>'rosa.mendonca.enc@email.ao',    'tel'=>'+244 912 006 003','num_aluno'=>'2022020003','parent'=>'Mãe',   'senha'=>'Enc@2024'],
    ['nome'=>'Soba Ntumba',          'email'=>'soba.ntumba.enc@email.ao',      'tel'=>'+244 912 006 004','num_aluno'=>'2022020004','parent'=>'Pai',   'senha'=>'Enc@2024'],
    ['nome'=>'Teresa Muanda',        'email'=>'teresa.muanda.enc@email.ao',    'tel'=>'+244 912 006 005','num_aluno'=>'2022020005','parent'=>'Mãe',   'senha'=>'Enc@2024'],
];

foreach ($encarregados_data as $e) {
    $aluno_row = $pdo->query("SELECT id FROM alunos WHERE numero='{$e['num_aluno']}'")->fetch();
    if (!$aluno_row) { $log[] = "⚠️  Aluno {$e['num_aluno']} não encontrado para encarregado"; continue; }

    inserir($pdo, 'encarregados', [
        'nome'       => $e['nome'],
        'email'      => $e['email'],
        'password'   => hash_senha($e['senha']),
        'telefone'   => $e['tel'],
        'aluno_id'   => $aluno_row['id'],
        'parentesco' => $e['parent'],
    ], $log, $erros);
}

// ─── Atribuições Professor-Disciplina-Turma ─────────────────

$log[] = "\n=== ATRIBUIÇÕES PROFESSOR-DISCIPLINA-TURMA ===";

// Buscar IDs necessários
$al_id = 3; // 2024/2025

function get_disc(PDO $pdo, string $sigla, int $curso_id, int $ano): ?int {
    $r = $pdo->query("SELECT id FROM disciplinas WHERE sigla='$sigla' AND curso_id=$curso_id AND ano=$ano")->fetch();
    return $r ? $r['id'] : null;
}
function get_turma(PDO $pdo, string $nome): ?int {
    $r = $pdo->query("SELECT id FROM turmas WHERE nome='$nome'")->fetch();
    return $r ? $r['id'] : null;
}
function get_prof(PDO $pdo, string $email): ?int {
    $r = $pdo->query("SELECT id FROM professores WHERE email='$email'")->fetch();
    return $r ? $r['id'] : null;
}

$atribuicoes = [
    // Maria dos Santos — Informática (TLP, TIC)
    ['prof'=>'maria.santos@ipmayombe.ao',   'disc_sigla'=>'TLP',  'disc_curso'=>2,'disc_ano'=>10,'turma'=>'IG-10A'],
    ['prof'=>'maria.santos@ipmayombe.ao',   'disc_sigla'=>'TLP',  'disc_curso'=>2,'disc_ano'=>11,'turma'=>'IG-11A'],
    ['prof'=>'maria.santos@ipmayombe.ao',   'disc_sigla'=>'TLP',  'disc_curso'=>2,'disc_ano'=>12,'turma'=>'IG-12A'],
    ['prof'=>'maria.santos@ipmayombe.ao',   'disc_sigla'=>'TIC',  'disc_curso'=>2,'disc_ano'=>10,'turma'=>'IG-10A'],
    // Carlos Mendes — Informática (SEAC, ELET)
    ['prof'=>'carlos.mendes@ipmayombe.ao',  'disc_sigla'=>'SEAC', 'disc_curso'=>2,'disc_ano'=>10,'turma'=>'IG-10A'],
    ['prof'=>'carlos.mendes@ipmayombe.ao',  'disc_sigla'=>'SEAC', 'disc_curso'=>2,'disc_ano'=>11,'turma'=>'IG-11A'],
    ['prof'=>'carlos.mendes@ipmayombe.ao',  'disc_sigla'=>'ELET', 'disc_curso'=>2,'disc_ano'=>10,'turma'=>'IG-10A'],
    ['prof'=>'carlos.mendes@ipmayombe.ao',  'disc_sigla'=>'TREI', 'disc_curso'=>2,'disc_ano'=>12,'turma'=>'IG-12A'],
    // Manuel Gomes — Matemática (IG)
    ['prof'=>'manuel.gomes@ipmayombe.ao',   'disc_sigla'=>'MAT',  'disc_curso'=>2,'disc_ano'=>10,'turma'=>'IG-10A'],
    ['prof'=>'manuel.gomes@ipmayombe.ao',   'disc_sigla'=>'MAT',  'disc_curso'=>2,'disc_ano'=>11,'turma'=>'IG-11A'],
    ['prof'=>'manuel.gomes@ipmayombe.ao',   'disc_sigla'=>'MAT',  'disc_curso'=>2,'disc_ano'=>12,'turma'=>'IG-12A'],
    // Ana Costa — Matemática (Contabilidade)
    ['prof'=>'ana.costa@ipmayombe.ao',      'disc_sigla'=>'MAT',  'disc_curso'=>1,'disc_ano'=>10,'turma'=>'CONT-10A'],
    ['prof'=>'ana.costa@ipmayombe.ao',      'disc_sigla'=>'MAT',  'disc_curso'=>1,'disc_ano'=>11,'turma'=>'CONT-11A'],
    ['prof'=>'ana.costa@ipmayombe.ao',      'disc_sigla'=>'MAT',  'disc_curso'=>1,'disc_ano'=>12,'turma'=>'CONT-12A'],
    // Pedro Alves — Física, FIS
    ['prof'=>'pedro.alves@ipmayombe.ao',    'disc_sigla'=>'FIS',  'disc_curso'=>2,'disc_ano'=>10,'turma'=>'IG-10A'],
    ['prof'=>'pedro.alves@ipmayombe.ao',    'disc_sigla'=>'FIS',  'disc_curso'=>2,'disc_ano'=>11,'turma'=>'IG-11A'],
    // Teresa Almeida — Língua Portuguesa
    ['prof'=>'teresa.almeida@ipmayombe.ao', 'disc_sigla'=>'LP',   'disc_curso'=>2,'disc_ano'=>10,'turma'=>'IG-10A'],
    ['prof'=>'teresa.almeida@ipmayombe.ao', 'disc_sigla'=>'LP',   'disc_curso'=>1,'disc_ano'=>10,'turma'=>'CONT-10A'],
    // David Sousa — Inglês
    ['prof'=>'david.sousa@ipmayombe.ao',    'disc_sigla'=>'ING',  'disc_curso'=>2,'disc_ano'=>10,'turma'=>'IG-10A'],
    ['prof'=>'david.sousa@ipmayombe.ao',    'disc_sigla'=>'ING',  'disc_curso'=>1,'disc_ano'=>10,'turma'=>'CONT-10A'],
    // António Silva — Contabilidade Financeira, OGE
    ['prof'=>'antonio.silva@ipmayombe.ao',  'disc_sigla'=>'CF',   'disc_curso'=>1,'disc_ano'=>10,'turma'=>'CONT-10A'],
    ['prof'=>'antonio.silva@ipmayombe.ao',  'disc_sigla'=>'CF',   'disc_curso'=>1,'disc_ano'=>11,'turma'=>'CONT-11A'],
    ['prof'=>'antonio.silva@ipmayombe.ao',  'disc_sigla'=>'OGE',  'disc_curso'=>1,'disc_ano'=>10,'turma'=>'CONT-10A'],
    ['prof'=>'antonio.silva@ipmayombe.ao',  'disc_sigla'=>'CA',   'disc_curso'=>1,'disc_ano'=>12,'turma'=>'CONT-12A'],
];

foreach ($atribuicoes as $a) {
    $prof_id  = get_prof($pdo, $a['prof']);
    $disc_id  = get_disc($pdo, $a['disc_sigla'], $a['disc_curso'], $a['disc_ano']);
    $turma_id = get_turma($pdo, $a['turma']);
    if (!$prof_id || !$disc_id || !$turma_id) {
        $log[] = "⚠️  Atribuição inválida: prof={$a['prof']} disc={$a['disc_sigla']} turma={$a['turma']}";
        continue;
    }
    inserir($pdo, 'professor_disciplina_turma', [
        'professor_id'   => $prof_id,
        'disciplina_id'  => $disc_id,
        'turma_id'       => $turma_id,
        'ano_lectivo_id' => $al_id,
    ], $log, $erros);
}


// ─── Notas de Exemplo (1º Trimestre — já aprovadas) ────────
// Permite testar o boletim do aluno sem passar pelo fluxo professor→admin

$log[] = "\n=== NOTAS DE EXEMPLO (1º Trimestre) ===";

// Buscar IDs necessários para as notas de exemplo
$trimestre1_id = $pdo->query("SELECT id FROM trimestres WHERE nome = '1º Trimestre' AND ano_lectivo_id = 3")->fetchColumn();
$al_id_notas   = 3; // ano lectivo 2024/2025

// Função auxiliar
function get_aluno_id(PDO $pdo, string $numero): ?int {
    $r = $pdo->query("SELECT id FROM alunos WHERE numero='$numero'")->fetch();
    return $r ? intval($r['id']) : null;
}

// Notas aprovadas para a turma CONT-10A, disciplina CF (Contabilidade Financeira)
// Professor: António Silva
$prof_silva = get_prof($pdo, 'antonio.silva@ipmayombe.ao');
$disc_cf    = get_disc($pdo, 'CF', 1, 10);

$notas_exemplo = [
    ['num'=>'2024010001', 'p1'=>15, 'p2'=>16, 'trabalho'=>17, 'exame'=>15],
    ['num'=>'2024010002', 'p1'=>13, 'p2'=>14, 'trabalho'=>15, 'exame'=>14],
    ['num'=>'2024010003', 'p1'=>12, 'p2'=>11, 'trabalho'=>13, 'exame'=>10],
    ['num'=>'2024010004', 'p1'=>18, 'p2'=>17, 'trabalho'=>19, 'exame'=>18],
    ['num'=>'2024010005', 'p1'=> 9, 'p2'=>10, 'trabalho'=> 8, 'exame'=> 7],
];

if ($prof_silva && $disc_cf && $trimestre1_id) {
    $stmtNota = $pdo->prepare("
        INSERT IGNORE INTO notas
            (aluno_id, disciplina_id, professor_id, trimestre_id, p1, p2, trabalho, exame, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Aprovado')
    ");
    foreach ($notas_exemplo as $n) {
        $aluno_id = get_aluno_id($pdo, $n['num']);
        if (!$aluno_id) continue;
        $stmtNota->execute([$aluno_id, $disc_cf, $prof_silva, $trimestre1_id,
                            $n['p1'], $n['p2'], $n['trabalho'], $n['exame']]);
        $log[] = "✅ [notas] Nota inserida: {$n['num']} — CF 1º Trimestre";
    }
}

// Notas pendentes para a turma IG-10A, disciplina TLP (2º Trimestre)
// Para o admin poder validar
$prof_maria  = get_prof($pdo, 'maria.santos@ipmayombe.ao');
$disc_tlp    = get_disc($pdo, 'TLP', 2, 10);
$trimestre2_id = $pdo->query("SELECT id FROM trimestres WHERE nome = '2º Trimestre' AND ano_lectivo_id = 3")->fetchColumn();

$notas_pendentes_ex = [
    ['num'=>'2024020001', 'p1'=>14, 'p2'=>15, 'trabalho'=>16, 'exame'=>null],
    ['num'=>'2024020002', 'p1'=>16, 'p2'=>17, 'trabalho'=>15, 'exame'=>null],
    ['num'=>'2024020003', 'p1'=>11, 'p2'=>10, 'trabalho'=>12, 'exame'=>null],
];

if ($prof_maria && $disc_tlp && $trimestre2_id) {
    $stmtPend = $pdo->prepare("
        INSERT IGNORE INTO notas
            (aluno_id, disciplina_id, professor_id, trimestre_id, p1, p2, trabalho, exame, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'Pendente')
    ");
    foreach ($notas_pendentes_ex as $n) {
        $aluno_id = get_aluno_id($pdo, $n['num']);
        if (!$aluno_id) continue;
        $stmtPend->execute([$aluno_id, $disc_tlp, $prof_maria, $trimestre2_id,
                            $n['p1'], $n['p2'], $n['trabalho']]);
        $log[] = "✅ [notas] Nota pendente inserida: {$n['num']} — TLP 2º Trimestre";
    }
}

// ─── Saída ──────────────────────────────────────────────────

$total = count($log);
$ok    = count(array_filter($log, fn($l) => str_starts_with($l, '✅')));
$skip  = count(array_filter($log, fn($l) => str_starts_with($l, '⚠️')));

$summary = "\n" . str_repeat('=', 50) . "\n";
$summary .= "CONCLUÍDO: $ok inseridos, $skip ignorados, $erros erros\n";
$summary .= str_repeat('=', 50);

$all_output = implode("\n", $log) . $summary;

// Output para browser ou CLI
if (php_sapi_name() === 'cli') {
    echo $all_output . "\n";
} else {
    header('Content-Type: text/plain; charset=utf-8');
    echo $all_output . "\n";
}
