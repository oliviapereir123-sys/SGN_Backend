<?php
require_once __DIR__ . '/../../config/Headers.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Auth.php';

Auth::requireRole('professor');
$db   = new Database();
$conn = $db->connect();
$prof = Auth::getUser();
$pid  = intval($prof['id']);

// Turmas do professor com contagem de alunos
$turmas = $conn->prepare("
    SELECT DISTINCT t.id, t.nome AS turma_nome,
           d.id AS disciplina_id, d.nome AS disciplina_nome,
           (SELECT COUNT(*) FROM alunos a WHERE a.turma_id = t.id AND a.estado = 'Activo') AS total_alunos
    FROM professor_disciplina_turma pdt
    JOIN turmas t  ON t.id  = pdt.turma_id
    JOIN disciplinas d ON d.id = pdt.disciplina_id
    WHERE pdt.professor_id = ?
    ORDER BY t.nome, d.nome
");
$turmas->bind_param("i", $pid);
$turmas->execute();
$turmasData = $turmas->get_result()->fetch_all(MYSQLI_ASSOC);

$totalAlunos  = array_sum(array_column($turmasData, 'total_alunos'));
$totalTurmas  = count(array_unique(array_column($turmasData, 'id')));

// Notas pendentes de validação lançadas por este professor
$pendentesR = $conn->prepare("
    SELECT COUNT(*) AS total FROM notas
    WHERE professor_id = ? AND estado = 'Pendente'
");
$pendentesR->bind_param("i", $pid);
$pendentesR->execute();
$pendentes = intval($pendentesR->get_result()->fetch_assoc()['total']);

// Média geral das notas aprovadas deste professor
$mediaR = $conn->prepare("
    SELECT ROUND(AVG(media), 1) AS media FROM notas
    WHERE professor_id = ? AND estado = 'Aprovado' AND media IS NOT NULL
");
$mediaR->bind_param("i", $pid);
$mediaR->execute();
$media = floatval($mediaR->get_result()->fetch_assoc()['media']);

// Evolução das médias por trimestre
$evolucaoR = $conn->prepare("
    SELECT tr.nome AS trimestre,
           ROUND(AVG(n.media), 1) AS media,
           SUM(CASE WHEN n.media >= 10 THEN 1 ELSE 0 END) AS aprovados,
           COUNT(*) AS total
    FROM notas n
    JOIN trimestres tr ON n.trimestre_id = tr.id
    WHERE n.professor_id = ? AND n.estado = 'Aprovado' AND n.media IS NOT NULL
    GROUP BY tr.id, tr.nome ORDER BY tr.id
");
$evolucaoR->bind_param("i", $pid);
$evolucaoR->execute();
$evolucao = $evolucaoR->get_result()->fetch_all(MYSQLI_ASSOC);

echo json_encode([
    'success'      => true,
    'total_alunos' => $totalAlunos,
    'total_turmas' => $totalTurmas,
    'pendentes'    => $pendentes,
    'media_geral'  => $media,
    'turmas'       => $turmasData,
    'evolucao'     => $evolucao,
]);
$db->closeConnection();