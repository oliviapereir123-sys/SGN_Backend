-- ============================================================
-- SGN — Migração Correctiva v3
-- Instituto Politécnico do Mayombe
-- Corrige inconsistências e adiciona tabelas/campos em falta
-- Executar APÓS 01_schema.sql e 02_missing_tables.sql
-- ============================================================

USE sgn_ipm;

-- ─── 1. CORRIGIR TABELA notas ────────────────────────────────
-- A base de dados em produção usa prova_professor/avaliacao/prova_trimestre
-- O backend PHP e o frontend usam p1/p2/trabalho/exame
-- Esta migração unifica para p1/p2/trabalho (=MAC) com exame separado
-- Fórmula oficial Angola (MED): MT = (MAC + PT) / 2
-- onde MAC = (p1 + p2 + trabalho) / 3  e  PT = exame (prova trimestral)

-- 1a. Adicionar colunas novas se não existirem
ALTER TABLE notas
    ADD COLUMN IF NOT EXISTS p1       DECIMAL(4,2) NULL COMMENT 'Prova 1 (componente MAC)',
    ADD COLUMN IF NOT EXISTS p2       DECIMAL(4,2) NULL COMMENT 'Prova 2 (componente MAC)',
    ADD COLUMN IF NOT EXISTS trabalho DECIMAL(4,2) NULL COMMENT 'Trabalho/Participação (componente MAC)',
    ADD COLUMN IF NOT EXISTS exame    DECIMAL(4,2) NULL COMMENT 'Prova Trimestral / Exame Final';

-- 1b. Migrar dados antigos para os novos campos
UPDATE notas
SET
    p1       = prova_professor,
    p2       = avaliacao,
    trabalho = prova_trimestre,
    exame    = NULL   -- prova_trimestre era o 3.º componente MAC, não o exame
WHERE p1 IS NULL
  AND prova_professor IS NOT NULL;

-- NOTA: Se já existia exame preenchido manualmente, preservar.
-- Para registos onde prova_trimestre era já o exame final, ajustar manualmente.

-- 1c. Remover colunas antigas (fazer backup antes em produção!)
-- Comentar estas linhas se quiser manter as colunas antigas por segurança
-- ALTER TABLE notas DROP COLUMN IF EXISTS prova_professor;
-- ALTER TABLE notas DROP COLUMN IF EXISTS avaliacao;
-- ALTER TABLE notas DROP COLUMN IF EXISTS prova_trimestre;
-- ALTER TABLE notas DROP COLUMN IF EXISTS avaliacao_id;

-- 1d. Adicionar campo feedback se não existir
ALTER TABLE notas
    ADD COLUMN IF NOT EXISTS feedback TEXT NULL COMMENT 'Observações do professor ao aluno';

-- 1e. Garantir nota_recuperacao existe
ALTER TABLE notas
    ADD COLUMN IF NOT EXISTS nota_recuperacao DECIMAL(4,2) NULL
    COMMENT 'Exame de recuperação; media_final = (media + nota_recuperacao) / 2';

-- ─── 2. RECALCULAR MÉDIA com fórmula correcta ───────────────
-- Fórmula Angola: MT = ((p1+p2+trabalho)/3 + exame) / 2
-- Se exame NULL: MT = (p1+p2+trabalho) / 3  (média parcial MAC)
-- A coluna media é GENERATED STORED, por isso precisamos de a recriar
-- com a fórmula correcta. Primeiro removemos e recriamos.

-- Passo 1: Remover a coluna gerada antiga (se existir com nome media)
ALTER TABLE notas DROP COLUMN IF EXISTS media;

-- Passo 2: Recriar com a fórmula oficial do MED Angola
ALTER TABLE notas ADD COLUMN media DECIMAL(4,2) GENERATED ALWAYS AS (
    CASE
        -- Todos os 4 campos preenchidos: MT = (MAC + PT) / 2
        WHEN p1 IS NOT NULL AND p2 IS NOT NULL AND trabalho IS NOT NULL AND exame IS NOT NULL
        THEN ROUND((((p1 + p2 + trabalho) / 3.0) + exame) / 2.0, 2)
        -- Só MAC sem exame: média parcial
        WHEN p1 IS NOT NULL AND p2 IS NOT NULL AND trabalho IS NOT NULL
        THEN ROUND((p1 + p2 + trabalho) / 3.0, 2)
        ELSE NULL
    END
) STORED COMMENT 'Média trimestral calculada automaticamente (fórmula MED Angola)';

-- ─── 3. TABELA auditoria_notas ───────────────────────────────
CREATE TABLE IF NOT EXISTS auditoria_notas (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    nota_id      INT NOT NULL,
    aluno_nome   VARCHAR(100) NOT NULL,
    disciplina   VARCHAR(100) NOT NULL,
    trimestre    VARCHAR(30)  NOT NULL,
    campo        VARCHAR(50)  NOT NULL,
    valor_antes  VARCHAR(50)  NULL,
    valor_depois VARCHAR(50)  NULL,
    alterado_por VARCHAR(100) NOT NULL,
    tipo_user    VARCHAR(20)  NOT NULL COMMENT 'professor, admin',
    criado_em    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_auditoria_nota   (nota_id),
    INDEX idx_auditoria_criado (criado_em)
);

-- ─── 4. TABELA avaliacoes ────────────────────────────────────
CREATE TABLE IF NOT EXISTS avaliacoes (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    nome          VARCHAR(150) NOT NULL,
    tipo          VARCHAR(30)  NOT NULL DEFAULT 'Prova'
                  COMMENT 'Prova, Trabalho, Seminario, Projecto, Exame, Outro',
    disciplina_id INT NOT NULL,
    turma_id      INT NOT NULL,
    professor_id  INT NOT NULL,
    trimestre_id  INT NOT NULL,
    peso          DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '0-100',
    data_entrega  DATE NULL,
    descricao     TEXT NULL,
    estado        VARCHAR(20)  NOT NULL DEFAULT 'Activa',
    criado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE CASCADE,
    FOREIGN KEY (turma_id)      REFERENCES turmas(id)      ON DELETE CASCADE,
    FOREIGN KEY (professor_id)  REFERENCES professores(id) ON DELETE CASCADE,
    FOREIGN KEY (trimestre_id)  REFERENCES trimestres(id)  ON DELETE CASCADE
);

-- ─── 5. TABELA presencas ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS presencas (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    aluno_id        INT NOT NULL,
    disciplina_id   INT NULL COMMENT 'NULL = presença geral do dia',
    data            DATE NOT NULL,
    presente        TINYINT(1)   NOT NULL DEFAULT 1  COMMENT '1=presente, 0=falta',
    justificada     TINYINT(1)   NOT NULL DEFAULT 0  COMMENT '1=falta justificada',
    observacao      VARCHAR(255) NULL,
    registado_por   INT NULL     COMMENT 'professor_id ou admin_id',
    tipo_registado  ENUM('professor','admin') DEFAULT 'professor',
    criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_presenca (aluno_id, disciplina_id, data),
    FOREIGN KEY (aluno_id)      REFERENCES alunos(id)      ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE SET NULL,
    INDEX idx_presencas_aluno (aluno_id),
    INDEX idx_presencas_data  (data)
);

-- ─── 6. TABELA horarios ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS horarios (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    turma_id        INT     NOT NULL,
    disciplina_id   INT     NOT NULL,
    professor_id    INT     NOT NULL,
    ano_lectivo_id  INT     NOT NULL,
    dia_semana      TINYINT NOT NULL COMMENT '1=Segunda … 5=Sexta',
    hora_inicio     TIME    NOT NULL,
    hora_fim        TIME    NOT NULL,
    sala            VARCHAR(50) NULL,
    criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id)       REFERENCES turmas(id)        ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id)  REFERENCES disciplinas(id)   ON DELETE CASCADE,
    FOREIGN KEY (professor_id)   REFERENCES professores(id)   ON DELETE CASCADE,
    FOREIGN KEY (ano_lectivo_id) REFERENCES anos_lectivos(id) ON DELETE CASCADE,
    INDEX idx_horarios_turma     (turma_id),
    INDEX idx_horarios_professor (professor_id),
    INDEX idx_horarios_dia       (dia_semana)
);

-- ─── 7. TABELA calendario_academico ─────────────────────────
CREATE TABLE IF NOT EXISTS calendario_academico (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    titulo          VARCHAR(150) NOT NULL,
    tipo            ENUM('feriado','evento','exame','matricula','encerramento','outro')
                    NOT NULL DEFAULT 'evento',
    data_inicio     DATE NOT NULL,
    data_fim        DATE NULL COMMENT 'NULL = evento de um só dia',
    descricao       TEXT NULL,
    ano_lectivo_id  INT  NULL COMMENT 'NULL = aplica a todos os anos',
    criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ano_lectivo_id) REFERENCES anos_lectivos(id) ON DELETE SET NULL,
    INDEX idx_calendario_data (data_inicio),
    INDEX idx_calendario_ano  (ano_lectivo_id)
);

-- ─── 8. TABELA notificacoes ──────────────────────────────────
CREATE TABLE IF NOT EXISTS notificacoes (
    id                 INT PRIMARY KEY AUTO_INCREMENT,
    destinatario_id    INT NOT NULL,
    destinatario_tipo  ENUM('aluno','professor','admin','encarregado') NOT NULL,
    titulo             VARCHAR(200) NOT NULL,
    mensagem           TEXT NOT NULL,
    tipo               ENUM('info','aviso','sucesso','erro') DEFAULT 'info',
    lida               TINYINT(1) DEFAULT 0,
    criado_em          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notif_destinatario (destinatario_id, destinatario_tipo),
    INDEX idx_notif_lida         (lida)
);

-- ─── 9. COLUNA bloqueado em trimestres ──────────────────────
ALTER TABLE trimestres
    ADD COLUMN IF NOT EXISTS bloqueado TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '1 = bloqueado para lançamento de notas';

-- ─── 10. ÍNDICES adicionais em notas ────────────────────────
-- Índice para média (relatórios de aprovação/reprovação)
CREATE INDEX IF NOT EXISTS idx_notas_media    ON notas(media);
CREATE INDEX IF NOT EXISTS idx_notas_aluno    ON notas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_notas_estado   ON notas(estado);
CREATE INDEX IF NOT EXISTS idx_notas_trimestre ON notas(trimestre_id);

-- ─── 11. VIEW: média anual por aluno ─────────────────────────
CREATE OR REPLACE VIEW vw_media_anual AS
SELECT
    n.aluno_id,
    a.nome                              AS aluno_nome,
    a.numero                            AS aluno_numero,
    n.disciplina_id,
    d.nome                              AS disciplina_nome,
    al.id                               AS ano_lectivo_id,
    al.nome                             AS ano_lectivo,
    ROUND(AVG(n.media), 2)              AS media_anual,
    COUNT(DISTINCT n.trimestre_id)      AS trimestres_lancados,
    -- Média final com exame de recuperação (se houver)
    MAX(n.nota_recuperacao)             AS nota_recuperacao,
    CASE
        WHEN MAX(n.nota_recuperacao) IS NOT NULL
        THEN ROUND((AVG(n.media) + MAX(n.nota_recuperacao)) / 2.0, 2)
        ELSE ROUND(AVG(n.media), 2)
    END                                 AS media_final,
    CASE
        WHEN MAX(n.nota_recuperacao) IS NOT NULL
             AND ROUND((AVG(n.media) + MAX(n.nota_recuperacao)) / 2.0, 2) >= 10 THEN 'Aprovado'
        WHEN MAX(n.nota_recuperacao) IS NULL
             AND ROUND(AVG(n.media), 2) >= 10 THEN 'Aprovado'
        ELSE 'Reprovado'
    END                                 AS situacao
FROM notas n
JOIN alunos a       ON n.aluno_id      = a.id
JOIN disciplinas d  ON n.disciplina_id = d.id
JOIN trimestres t   ON n.trimestre_id  = t.id
JOIN anos_lectivos al ON t.ano_lectivo_id = al.id
WHERE n.estado = 'Aprovado'
GROUP BY n.aluno_id, n.disciplina_id, al.id;

-- ─── 12. VIEW: percentagem de presenças ─────────────────────
CREATE OR REPLACE VIEW vw_percentagem_presencas AS
SELECT
    p.aluno_id,
    a.nome                              AS aluno_nome,
    a.numero                            AS aluno_numero,
    p.disciplina_id,
    d.nome                              AS disciplina_nome,
    COUNT(*)                            AS total_aulas,
    SUM(p.presente)                     AS presencas,
    SUM(1 - p.presente)                 AS faltas,
    SUM(CASE WHEN p.presente = 0 AND p.justificada = 1 THEN 1 ELSE 0 END) AS faltas_justificadas,
    ROUND(SUM(p.presente) * 100.0 / COUNT(*), 1) AS percentagem_presenca,
    CASE WHEN ROUND(SUM(p.presente) * 100.0 / COUNT(*), 1) >= 75 THEN 'OK' ELSE 'Risco' END AS estado_frequencia
FROM presencas p
JOIN alunos a      ON p.aluno_id      = a.id
LEFT JOIN disciplinas d ON p.disciplina_id = d.id
GROUP BY p.aluno_id, p.disciplina_id;

-- ─── Concluído ───────────────────────────────────────────────
-- Resumo do que foi feito:
-- ✅ Campos p1/p2/trabalho/exame adicionados à tabela notas
-- ✅ Dados migrados de prova_professor/avaliacao/prova_trimestre
-- ✅ Fórmula da média corrigida (fórmula MED Angola)
-- ✅ Tabelas auditoria_notas, avaliacoes, presencas, horarios criadas
-- ✅ Tabelas calendario_academico, notificacoes criadas
-- ✅ Campo bloqueado em trimestres garantido
-- ✅ Views vw_media_anual e vw_percentagem_presencas criadas
