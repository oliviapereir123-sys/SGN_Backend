<?php
/**
 * SGN — Reset Completo + População Mínima
 * Baseado no schema real de sgn_ipm (7).sql
 *
 * Apaga TODOS os dados e recria apenas:
 *   Admin: António Ferreira
 *   Professor: Ramos Panzo
 *   Alunos: Pedro Espirito, Sebastião Gabriel, Amaro Francisco
 *   Curso: Informática de Gestão — 13ª Classe (IG-13A)
 *   Disciplina: Técnicas de Linguagem de Programação
 */

header('Content-Type: text/html; charset=utf-8');

$host = 'localhost';
$db   = 'sgn_ipm';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    die("<pre>Erro de ligação: " . $e->getMessage() . "</pre>");
}

$log = [];

function exec_sql(PDO $pdo, string $sql, array $params = [], string $desc = ''): ?string {
    global $log;
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        if ($desc) $log[] = "✅ $desc";
        return $pdo->lastInsertId();
    } catch (PDOException $e) {
        $log[] = "❌ ERRO [$desc]: " . $e->getMessage();
        return null;
    }
}

// ── 1. Limpar todas as tabelas ───────────────────────────────────────────────
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

$tabelas = [
    'auditoria_notas', 'auditoria', 'presencas', 'horarios', 'avaliacoes',
    'matriculas', 'notas', 'professor_disciplina_turma', 'utilizadores',
    'encarregados', 'alunos', 'professores', 'admin',
    'disciplinas', 'turmas', 'cursos', 'trimestres', 'anos_lectivos',
    'calendario_academico',
];

foreach ($tabelas as $t) {
    try {
        $pdo->exec("TRUNCATE TABLE `$t`");
        $log[] = "🗑️  Tabela <b>$t</b> limpa";
    } catch (PDOException $e) {
        $log[] = "⚠️  Tabela <b>$t</b> não encontrada (ignorada)";
    }
}

$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

// ── 2. Ano Lectivo ───────────────────────────────────────────────────────────
exec_sql($pdo,
    "INSERT INTO `anos_lectivos` (`nome`, `inicio`, `fim`, `estado`) VALUES (?,?,?,?)",
    ['2024/2025', '2024-09-02', '2025-07-25', 'Activo'],
    "Ano lectivo 2024/2025"
);
$anoId = 3; // forçar ID=3 como no dump original não é possível; usamos o gerado
// Ler ID real
$anoId = $pdo->query("SELECT id FROM anos_lectivos WHERE nome='2024/2025'")->fetchColumn();

// ── 3. Trimestres ────────────────────────────────────────────────────────────
exec_sql($pdo,
    "INSERT INTO `trimestres` (`nome`,`ano_lectivo_id`,`inicio`,`fim`,`estado`,`bloqueado`) VALUES (?,?,?,?,?,?)",
    ['1º Trimestre', $anoId, '2024-09-02', '2024-12-13', 'Encerrado', 0],
    "1º Trimestre"
);
$trim1 = $pdo->query("SELECT id FROM trimestres WHERE nome='1º Trimestre' AND ano_lectivo_id=$anoId")->fetchColumn();

exec_sql($pdo,
    "INSERT INTO `trimestres` (`nome`,`ano_lectivo_id`,`inicio`,`fim`,`estado`,`bloqueado`) VALUES (?,?,?,?,?,?)",
    ['2º Trimestre', $anoId, '2025-01-06', '2025-04-04', 'Encerrado', 0],
    "2º Trimestre"
);
$trim2 = $pdo->query("SELECT id FROM trimestres WHERE nome='2º Trimestre' AND ano_lectivo_id=$anoId")->fetchColumn();

exec_sql($pdo,
    "INSERT INTO `trimestres` (`nome`,`ano_lectivo_id`,`inicio`,`fim`,`estado`,`bloqueado`) VALUES (?,?,?,?,?,?)",
    ['3º Trimestre', $anoId, '2025-04-22', '2025-07-25', 'Pendente', 0],
    "3º Trimestre"
);
$trim3 = $pdo->query("SELECT id FROM trimestres WHERE nome='3º Trimestre' AND ano_lectivo_id=$anoId")->fetchColumn();

// ── 4. Curso ─────────────────────────────────────────────────────────────────
exec_sql($pdo,
    "INSERT INTO `cursos` (`nome`,`sigla`,`estado`) VALUES (?,?,?)",
    ['Informática de Gestão', 'IG', 'Activo'],
    "Curso Informática de Gestão"
);
$cursoId = $pdo->query("SELECT id FROM cursos WHERE sigla='IG'")->fetchColumn();

// ── 5. Turma — 13ª Classe ────────────────────────────────────────────────────
exec_sql($pdo,
    "INSERT INTO `turmas` (`nome`,`curso_id`,`ano`,`turno`,`sala`,`periodo`,`capacidade`,`estado`) VALUES (?,?,?,?,?,?,?,?)",
    ['IG-13A', $cursoId, 13, 'Manhã', 'Lab 301', 'Matutino', 30, 'Activa'],
    "Turma IG-13A (13ª Classe)"
);
$turmaId = $pdo->query("SELECT id FROM turmas WHERE nome='IG-13A'")->fetchColumn();

// ── 6. Disciplina ────────────────────────────────────────────────────────────
exec_sql($pdo,
    "INSERT INTO `disciplinas` (`nome`,`sigla`,`curso_id`,`ano`,`carga_horaria`,`creditos`) VALUES (?,?,?,?,?,?)",
    ['Técnicas de Linguagem de Programação', 'TLP', $cursoId, 13, 4, 5],
    "Disciplina TLP — 13ª Classe"
);
$discId = $pdo->query("SELECT id FROM disciplinas WHERE sigla='TLP' AND ano=13")->fetchColumn();

// ── 7. Admin ─────────────────────────────────────────────────────────────────
$passAdmin = password_hash('Admin123', PASSWORD_BCRYPT, ['cost' => 12]);
exec_sql($pdo,
    "INSERT INTO `admin` (`nome`,`email`,`password`) VALUES (?,?,?)",
    ['António Ferreira', 'admin@ipMaiombe.ao', $passAdmin],
    "Admin: admin@ipMaiombe.ao / Admin123"
);
$adminId = $pdo->query("SELECT id FROM admin WHERE email='admin@ipMaiombe.ao'")->fetchColumn();

// ── 8. Professor ─────────────────────────────────────────────────────────────
$passProf = password_hash('Ramos123', PASSWORD_BCRYPT, ['cost' => 10]);
exec_sql($pdo,
    "INSERT INTO `professores` (`nome`,`email`,`password`,`departamento`,`estado`) VALUES (?,?,?,?,?)",
    ['Ramos Panzo', 'ramos@panzo.ao', $passProf, 'TI', 'Activo'],
    "Professor: ramos@panzo.ao / Ramos123"
);
$profId = $pdo->query("SELECT id FROM professores WHERE email='ramos@panzo.ao'")->fetchColumn();

// Entrada na tabela utilizadores para o professor
exec_sql($pdo,
    "INSERT INTO `utilizadores` (`ref_id`,`tipo`,`nome`,`email`,`estado`) VALUES (?,?,?,?,?)",
    [$profId, 'professor', 'Ramos Panzo', 'ramos@panzo.ao', 'Activo'],
    "utilizadores — professor Ramos"
);

// ── 9. Atribuição professor → disciplina → turma ────────────────────────────
exec_sql($pdo,
    "INSERT INTO `professor_disciplina_turma` (`professor_id`,`disciplina_id`,`turma_id`,`ano_lectivo_id`) VALUES (?,?,?,?)",
    [$profId, $discId, $turmaId, $anoId],
    "Ramos atribuído a TLP / IG-13A"
);

// ── 10. Alunos ───────────────────────────────────────────────────────────────
$alunos = [
    ['numero' => '932754931', 'nome' => 'Pedro Espirito',    'email' => 'pedro.espirito18@gmail.com', 'pass' => 'Pedro123'],
    ['numero' => '0252855',   'nome' => 'Sebastião Gabriel', 'email' => 'sebastiao@gmail.com',        'pass' => 'Sebas123'],
    ['numero' => '8574963',   'nome' => 'Amaro Francisco',   'email' => 'amaro@gmail.com',            'pass' => 'Amaro123'],
];

$alunoIds = [];
foreach ($alunos as $a) {
    $hp = password_hash($a['pass'], PASSWORD_BCRYPT, ['cost' => 10]);
    exec_sql($pdo,
        "INSERT INTO `alunos` (`numero`,`nome`,`email`,`password`,`turma_id`,`estado`) VALUES (?,?,?,?,?,?)",
        [$a['numero'], $a['nome'], $a['email'], $hp, $turmaId, 'Activo'],
        "Aluno: {$a['nome']} (nº {$a['numero']} / {$a['pass']})"
    );
    $aid = $pdo->query("SELECT id FROM alunos WHERE numero='{$a['numero']}'")->fetchColumn();
    $alunoIds[] = $aid;

    // utilizadores
    exec_sql($pdo,
        "INSERT INTO `utilizadores` (`ref_id`,`tipo`,`nome`,`email`,`estado`) VALUES (?,?,?,?,?)",
        [$aid, 'aluno', $a['nome'], $a['email'], 'Activo'],
        "utilizadores — {$a['nome']}"
    );

    // matrícula
    exec_sql($pdo,
        "INSERT INTO `matriculas` (`aluno_id`,`turma_id`,`ano_lectivo_id`,`data_matricula`,`tipo`,`estado`,`registado_por`) VALUES (?,?,?,?,?,?,?)",
        [$aid, $turmaId, $anoId, '2024-09-02', 'Normal', 'Activa', $adminId],
        "Matrícula — {$a['nome']}"
    );
}

// ── 11. Notas — 3 trimestres × 3 alunos ─────────────────────────────────────
// Fórmula DB: media = p1*0.20 + p2*0.20 + trabalho*0.20 + exame*0.40
// Notas realistas entre 10-20
$notasData = [
    // [p1,  p2,  trab, exame]  por trimestre
    // Pedro Espirito
    [[14, 13, 15, 12], [15, 14, 16, 13], [16, 15, 17, 14]],
    // Sebastião Gabriel
    [[12, 11, 13, 10], [13, 12, 14, 11], [14, 13, 15, 12]],
    // Amaro Francisco
    [[17, 16, 18, 15], [18, 17, 19, 16], [17, 18, 16, 17]],
];

$trimestres = [$trim1, $trim2, $trim3];

foreach ($alunoIds as $i => $aid) {
    foreach ($trimestres as $j => $tid) {
        [$p1, $p2, $trab, $exame] = $notasData[$i][$j];
        exec_sql($pdo,
            "INSERT INTO `notas` (`aluno_id`,`disciplina_id`,`professor_id`,`trimestre_id`,`p1`,`p2`,`trabalho`,`exame`,`estado`,`data_validacao`,`validado_por`)
             VALUES (?,?,?,?,?,?,?,?,'Aprovado',NOW(),?)",
            [$aid, $discId, $profId, $tid, $p1, $p2, $trab, $exame, $adminId],
            "Nota aluno_id=$aid trim=$tid (P1=$p1 P2=$p2 T=$trab E=$exame)"
        );
    }
}

// ── 12. Horário (Terça e Quinta, 08h-09h30) ──────────────────────────────────
foreach ([2, 4] as $dia) {
    exec_sql($pdo,
        "INSERT INTO `horarios` (`turma_id`,`disciplina_id`,`professor_id`,`ano_lectivo_id`,`dia_semana`,`hora_inicio`,`hora_fim`,`sala`)
         VALUES (?,?,?,?,?,?,?,?)",
        [$turmaId, $discId, $profId, $anoId, $dia, '08:00:00', '09:30:00', 'Lab 301'],
        "Horário dia=$dia"
    );
}

// ── 13. Presenças (3 aulas para cada aluno) ──────────────────────────────────
$datas = ['2025-01-14', '2025-01-21', '2025-01-28'];
foreach ($alunoIds as $aid) {
    foreach ($datas as $data) {
        exec_sql($pdo,
            "INSERT INTO `presencas` (`aluno_id`,`data`,`presente`,`justificada`,`registado_por`,`tipo_registado`)
             VALUES (?,?,1,0,?,'professor')",
            [$aid, $data, $profId],
            "Presença aluno_id=$aid em $data"
        );
    }
}

// ── 14. Admin na tabela utilizadores ─────────────────────────────────────────
exec_sql($pdo,
    "INSERT INTO `utilizadores` (`ref_id`,`tipo`,`nome`,`email`,`estado`) VALUES (?,?,?,?,?)",
    [$adminId, 'admin', 'António Ferreira', 'admin@ipMaiombe.ao', 'Activo'],
    "utilizadores — admin"
);

// ── Resumo HTML ──────────────────────────────────────────────────────────────
// Calcular médias para tabela de notas
function media($p1,$p2,$t,$e){ return round($p1*0.20+$p2*0.20+$t*0.20+$e*0.40,2); }
$nd = [
    ['Pedro Espirito',    [[14,13,15,12],[15,14,16,13],[16,15,17,14]]],
    ['Sebastião Gabriel', [[12,11,13,10],[13,12,14,11],[14,13,15,12]]],
    ['Amaro Francisco',   [[17,16,18,15],[18,17,19,16],[17,18,16,17]]],
];
?>
<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<title>SGN — Reset</title>
<style>
  body{font-family:monospace;background:#0f172a;color:#e2e8f0;padding:2rem}
  h1{color:#38bdf8}h2{color:#94a3b8;margin-top:2rem}
  pre{background:#1e293b;padding:1rem;border-radius:8px;line-height:1.8;white-space:pre-wrap}
  .box{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:1.5rem;margin-top:1.5rem}
  table{border-collapse:collapse;width:100%}
  th,td{border:1px solid #334155;padding:.4rem .8rem;text-align:left}
  th{background:#0f172a;color:#38bdf8}
  .ok{color:#4ade80}.er{color:#f87171}
</style>
</head>
<body>
<h1>SGN — Reset &amp; População Concluído</h1>

<h2>Log de execução</h2>
<pre><?php foreach($log as $l) echo $l."\n"; ?></pre>

<div class="box">
<h2>Credenciais</h2>
<table>
  <tr><th>Tipo</th><th>Nome</th><th>Login</th><th>Password</th></tr>
  <tr><td>Admin</td><td>António Ferreira</td><td>admin@ipMaiombe.ao</td><td>Admin123</td></tr>
  <tr><td>Professor</td><td>Ramos Panzo</td><td>ramos@panzo.ao</td><td>Ramos123</td></tr>
  <tr><td>Aluno</td><td>Pedro Espirito</td><td>Nº 932754931</td><td>Pedro123</td></tr>
  <tr><td>Aluno</td><td>Sebastião Gabriel</td><td>Nº 0252855</td><td>Sebas123</td></tr>
  <tr><td>Aluno</td><td>Amaro Francisco</td><td>Nº 8574963</td><td>Amaro123</td></tr>
</table>
</div>

<div class="box">
<h2>Estrutura académica</h2>
<table>
  <tr><th>Campo</th><th>Valor</th></tr>
  <tr><td>Curso</td><td>Informática de Gestão (IG)</td></tr>
  <tr><td>Turma</td><td>IG-13A — 13ª Classe — Manhã — Lab 301</td></tr>
  <tr><td>Disciplina</td><td>Técnicas de Linguagem de Programação (TLP)</td></tr>
  <tr><td>Ano Lectivo</td><td>2024/2025</td></tr>
  <tr><td>Trimestres</td><td>1º Encerrado · 2º Encerrado · 3º Pendente</td></tr>
</table>
</div>

<div class="box">
<h2>Notas lançadas (estado: Aprovado)</h2>
<table>
  <tr><th>Aluno</th><th>Trimestre</th><th>P1</th><th>P2</th><th>Trabalho</th><th>Exame</th><th>Média</th></tr>
  <?php foreach($nd as [$nome,$trimestresArr]):
    $ts = ['1º','2º','3º'];
    foreach($trimestresArr as $k=>[$p1,$p2,$t,$e]):
      $m = media($p1,$p2,$t,$e);
  ?>
  <tr><td><?=$nome?></td><td><?=$ts[$k]?></td><td><?=$p1?></td><td><?=$p2?></td><td><?=$t?></td><td><?=$e?></td><td><b><?=$m?></b></td></tr>
  <?php endforeach; endforeach; ?>
</table>
</div>

<p style="color:#f87171;margin-top:2rem;font-size:1.1em">
  ⚠️ <b>APAGUE este ficheiro depois de executar:</b> <code>backend/database/reset_e_popular.php</code>
</p>
</body>
</html>
