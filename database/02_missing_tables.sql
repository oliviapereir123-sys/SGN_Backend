-- ============================================================
-- SGN — Tabelas em falta (avaliacoes, auditoria_notas, bloqueado)
-- Executar após 01_schema.sql
-- ============================================================

USE sgn_ipm;

-- Para bases de dados já criadas antes de trimestres ter a coluna "bloqueado", executar uma vez:
--   ALTER TABLE trimestres ADD COLUMN bloqueado TINYINT(1) NOT NULL DEFAULT 0;
-- (O schema 01_schema.sql já inclui esta coluna em novas instalações.)

-- ─── Tabela avaliacoes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS avaliacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'Prova' COMMENT 'Prova, Trabalho, Seminario, Projecto, Exame, Outro',
    disciplina_id INT NOT NULL,
    turma_id INT NOT NULL,
    professor_id INT NOT NULL,
    trimestre_id INT NOT NULL,
    peso DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '0-100',
    data_entrega DATE NULL,
    descricao TEXT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activa',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE CASCADE,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE,
    FOREIGN KEY (trimestre_id) REFERENCES trimestres(id) ON DELETE CASCADE
);

-- ─── Tabela auditoria_notas ─────────────────────────────────
CREATE TABLE IF NOT EXISTS auditoria_notas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nota_id INT NOT NULL,
    aluno_nome VARCHAR(100) NOT NULL,
    disciplina VARCHAR(100) NOT NULL,
    trimestre VARCHAR(30) NOT NULL,
    campo VARCHAR(50) NOT NULL,
    valor_antes VARCHAR(50) NULL,
    valor_depois VARCHAR(50) NULL,
    alterado_por VARCHAR(100) NOT NULL,
    tipo_user VARCHAR(20) NOT NULL COMMENT 'professor, admin',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_auditoria_nota (nota_id),
    INDEX idx_auditoria_criado (criado_em)
);

-- ─── Tabela presencas (controlo de frequências) ──────────────
CREATE TABLE IF NOT EXISTS presencas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    aluno_id INT NOT NULL,
    data DATE NOT NULL,
    presente TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=presente, 0=falta',
    justificada TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=falta justificada',
    observacao VARCHAR(255) NULL,
    registado_por INT NULL COMMENT 'professor_id ou admin id conforme tipo_registado',
    tipo_registado ENUM('professor','admin') DEFAULT 'professor',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_presenca (aluno_id, data),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    INDEX idx_presencas_aluno (aluno_id),
    INDEX idx_presencas_data (data)
);

-- ─── Tabela horarios (horários de aulas por turma/disciplina) ─
CREATE TABLE IF NOT EXISTS horarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    turma_id INT NOT NULL,
    disciplina_id INT NOT NULL,
    professor_id INT NOT NULL,
    ano_lectivo_id INT NOT NULL,
    dia_semana TINYINT NOT NULL COMMENT '1=Segunda a 5=Sexta',
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    sala VARCHAR(50) NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE,
    FOREIGN KEY (ano_lectivo_id) REFERENCES anos_lectivos(id) ON DELETE CASCADE,
    INDEX idx_horarios_turma (turma_id),
    INDEX idx_horarios_professor (professor_id),
    INDEX idx_horarios_dia (dia_semana)
);

-- ─── Tabela calendario_academico (eventos, feriados, datas importantes) ─
CREATE TABLE IF NOT EXISTS calendario_academico (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(150) NOT NULL,
    tipo ENUM('feriado','evento','exame','matricula','encerramento','outro') NOT NULL DEFAULT 'evento',
    data_inicio DATE NOT NULL,
    data_fim DATE NULL COMMENT 'opcional para evento de um dia use data_inicio=data_fim',
    descricao TEXT NULL,
    ano_lectivo_id INT NULL COMMENT 'NULL = aplica a todos os anos',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ano_lectivo_id) REFERENCES anos_lectivos(id) ON DELETE SET NULL,
    INDEX idx_calendario_data (data_inicio),
    INDEX idx_calendario_ano (ano_lectivo_id)
);

-- ─── Exames de recuperação: coluna na tabela notas ───────────
-- Média final com recuperação: MF = (media + nota_recuperacao) / 2
ALTER TABLE notas
ADD COLUMN nota_recuperacao DECIMAL(4,2) NULL COMMENT 'Nota do exame de recuperação; quando preenchida, media_final = (media + nota_recuperacao)/2';
