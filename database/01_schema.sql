-- ============================================================
-- SGN — Sistema de Gestão de Notas
-- Instituto Politécnico do Mayombe
-- Ficheiro 1/2: Schema + Dados Estáticos
-- ============================================================

CREATE DATABASE IF NOT EXISTS sgn_ipm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sgn_ipm;

-- ─── Tabelas ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS anos_lectivos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(10) NOT NULL UNIQUE,
    inicio DATE NOT NULL,
    fim DATE NOT NULL,
    estado ENUM('Activo','Encerrado','Pendente') DEFAULT 'Activo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trimestres (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(30) NOT NULL,
    ano_lectivo_id INT NOT NULL,
    inicio DATE NOT NULL,
    fim DATE NOT NULL,
    estado ENUM('Activo','Encerrado','Pendente') DEFAULT 'Pendente',
    bloqueado TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=bloqueado para lançamento de notas',
    FOREIGN KEY (ano_lectivo_id) REFERENCES anos_lectivos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_trimestre (nome, ano_lectivo_id)
);

CREATE TABLE IF NOT EXISTS cursos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL UNIQUE,
    sigla VARCHAR(10) NOT NULL UNIQUE,
    estado ENUM('Activo','Inactivo') DEFAULT 'Activo'
);

CREATE TABLE IF NOT EXISTS turmas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(20) NOT NULL UNIQUE,
    curso_id INT NOT NULL,
    ano INT NOT NULL COMMENT '10, 11 ou 12',
    turno VARCHAR(10),
    sala VARCHAR(30),
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

CREATE TABLE IF NOT EXISTS disciplinas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    sigla VARCHAR(10),
    curso_id INT NOT NULL,
    ano INT NOT NULL,
    carga_horaria INT,
    creditos INT,
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

CREATE TABLE IF NOT EXISTS professores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    departamento VARCHAR(100),
    estado ENUM('Activo','Inactivo') DEFAULT 'Activo',
    foto VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alunos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    turma_id INT,
    estado ENUM('Activo','Inactivo') DEFAULT 'Activo',
    foto VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id) REFERENCES turmas(id)
);

CREATE TABLE IF NOT EXISTS encarregados (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    aluno_id INT NOT NULL,
    parentesco VARCHAR(30),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS professor_disciplina_turma (
    id INT PRIMARY KEY AUTO_INCREMENT,
    professor_id INT NOT NULL,
    disciplina_id INT NOT NULL,
    turma_id INT NOT NULL,
    ano_lectivo_id INT NOT NULL,
    FOREIGN KEY (professor_id) REFERENCES professores(id),
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
    FOREIGN KEY (turma_id) REFERENCES turmas(id),
    FOREIGN KEY (ano_lectivo_id) REFERENCES anos_lectivos(id),
    UNIQUE KEY unique_atribuicao (professor_id, disciplina_id, turma_id, ano_lectivo_id)
);

CREATE TABLE IF NOT EXISTS notas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    aluno_id INT NOT NULL,
    disciplina_id INT NOT NULL,
    professor_id INT NOT NULL,
    trimestre_id INT NOT NULL,
    p1 DECIMAL(4,2),
    p2 DECIMAL(4,2),
    trabalho DECIMAL(4,2),
    exame DECIMAL(4,2),
    media DECIMAL(4,2) GENERATED ALWAYS AS (
        CASE
            WHEN p1 IS NOT NULL AND p2 IS NOT NULL AND trabalho IS NOT NULL AND exame IS NOT NULL
            THEN ROUND(p1 * 0.20 + p2 * 0.20 + trabalho * 0.20 + exame * 0.40, 2)
            ELSE NULL
        END
    ) STORED,
    nota_recuperacao DECIMAL(4,2) NULL COMMENT 'Exame de recuperação; media_final = (media+nota_recuperacao)/2',
    estado ENUM('Rascunho','Pendente','Aprovado','Rejeitado') DEFAULT 'Rascunho',
    observacoes TEXT,
    data_lancamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_validacao TIMESTAMP NULL,
    validado_por INT NULL,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores(id),
    FOREIGN KEY (trimestre_id) REFERENCES trimestres(id),
    FOREIGN KEY (validado_por) REFERENCES admin(id)
        ON DELETE SET NULL,
    UNIQUE KEY unique_nota (aluno_id, disciplina_id, trimestre_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notas_aluno ON notas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_notas_estado ON notas(estado);
CREATE INDEX IF NOT EXISTS idx_notas_trimestre ON notas(trimestre_id);
CREATE INDEX IF NOT EXISTS idx_alunos_turma ON alunos(turma_id);

-- ─── Anos Lectivos ──────────────────────────────────────────

INSERT INTO anos_lectivos (nome, inicio, fim, estado) VALUES
('2022/2023', '2022-09-05', '2023-07-28', 'Encerrado'),
('2023/2024', '2023-09-04', '2024-07-26', 'Encerrado'),
('2024/2025', '2024-09-02', '2025-07-25', 'Activo');

-- ─── Trimestres ─────────────────────────────────────────────

-- 2024/2025 (ano lectivo id=3)
INSERT INTO trimestres (nome, ano_lectivo_id, inicio, fim, estado) VALUES
('1º Trimestre', 3, '2024-09-02', '2024-12-13', 'Encerrado'),
('2º Trimestre', 3, '2025-01-06', '2025-04-04', 'Activo'),
('3º Trimestre', 3, '2025-04-22', '2025-07-25', 'Pendente');

-- ─── Cursos ─────────────────────────────────────────────────

INSERT INTO cursos (nome, sigla) VALUES
('Contabilidade', 'CONT'),
('Informática de Gestão', 'IG');

-- ─── Turmas ─────────────────────────────────────────────────
-- Contabilidade (curso_id=1): anos 10, 11, 12
-- Informática de Gestão (curso_id=2): anos 10, 11, 12

INSERT INTO turmas (nome, curso_id, ano, turno, sala) VALUES
('CONT-10A', 1, 10, 'Manhã',  'Sala 101'),
('CONT-10B', 1, 10, 'Tarde',  'Sala 102'),
('CONT-11A', 1, 11, 'Manhã',  'Sala 103'),
('CONT-11B', 1, 11, 'Tarde',  'Sala 104'),
('CONT-12A', 1, 12, 'Manhã',  'Sala 105'),
('IG-10A',   2, 10, 'Manhã',  'Lab 201'),
('IG-10B',   2, 10, 'Tarde',  'Lab 202'),
('IG-11A',   2, 11, 'Manhã',  'Lab 203'),
('IG-11B',   2, 11, 'Tarde',  'Lab 204'),
('IG-12A',   2, 12, 'Manhã',  'Lab 205');

-- ─── Disciplinas — Contabilidade ────────────────────────────

-- 10º Ano (curso_id=1)
INSERT INTO disciplinas (nome, sigla, curso_id, ano, carga_horaria, creditos) VALUES
('Matemática',                         'MAT',  1, 10, 3, 4),
('Língua Portuguesa',                  'LP',   1, 10, 3, 3),
('Direito Laboral Comercial',          'DLC',  1, 10, 2, 3),
('Contabilidade Financeira',           'CF',   1, 10, 4, 5),
('Organização e Gestão de Empresas',   'OGE',  1, 10, 2, 3),
('Informática',                        'INFO', 1, 10, 3, 3),
('Educação Física',                    'EF',   1, 10, 2, 2),
('Economia',                           'ECON', 1, 10, 3, 4),
('Língua Inglesa',                     'ING',  1, 10, 3, 3),
('Física Aplicada à Indústria',        'FAI',  1, 10, 2, 2);

-- 11º Ano (curso_id=1)
INSERT INTO disciplinas (nome, sigla, curso_id, ano, carga_horaria, creditos) VALUES
('Matemática',                         'MAT',  1, 11, 3, 4),
('Língua Portuguesa',                  'LP',   1, 11, 3, 3),
('Contabilidade Financeira',           'CF',   1, 11, 4, 5),
('Informática',                        'INFO', 1, 11, 3, 3),
('Educação Física',                    'EF',   1, 11, 2, 2),
('Organização e Gestão de Empresas',   'OGE',  1, 11, 2, 3),
('Noções de Direito',                  'ND',   1, 11, 2, 2),
('Língua Inglesa',                     'ING',  1, 11, 3, 3),
('Física Aplicada à Indústria',        'FAI',  1, 11, 2, 2);

-- 12º Ano (curso_id=1)
INSERT INTO disciplinas (nome, sigla, curso_id, ano, carga_horaria, creditos) VALUES
('Matemática',                         'MAT',  1, 12, 3, 4),
('Técnicas Contabilísticas Específicas','TCE',  1, 12, 3, 4),
('Contabilidade Analítica',            'CA',   1, 12, 4, 5),
('Direito Laboral Fiscal',             'DLF',  1, 12, 2, 3),
('Gestão Orçamental',                  'GO',   1, 12, 2, 3),
('Organização e Gestão de Empresas',   'OGE',  1, 12, 2, 3),
('Projecto Tecnológico',               'PT',   1, 12, 2, 3),
('Auditoria, Estatística e Fiscalização','AEF', 1, 12, 3, 4);

-- ─── Disciplinas — Informática de Gestão ────────────────────

-- 10º Ano (curso_id=2)
INSERT INTO disciplinas (nome, sigla, curso_id, ano, carga_horaria, creditos) VALUES
('Técnicas de Linguagem de Programação',           'TLP',  2, 10, 4, 5),
('Tecnologias da Informação e Comunicação',        'TIC',  2, 10, 3, 4),
('Sistemas, Estruturas e Análise de Computadores', 'SEAC', 2, 10, 3, 4),
('Matemática',                                     'MAT',  2, 10, 3, 4),
('Língua Portuguesa',                              'LP',   2, 10, 3, 3),
('Língua Inglesa',                                 'ING',  2, 10, 3, 3),
('Física',                                         'FIS',  2, 10, 3, 4),
('Desenho Técnico',                                'DT',   2, 10, 2, 2),
('Eletrotecnia',                                   'ELET', 2, 10, 2, 3),
('Educação Física',                                'EF',   2, 10, 2, 2);

-- 11º Ano (curso_id=2)
INSERT INTO disciplinas (nome, sigla, curso_id, ano, carga_horaria, creditos) VALUES
('Língua Portuguesa',                              'LP',   2, 11, 3, 3),
('Física',                                         'FIS',  2, 11, 3, 4),
('Matemática',                                     'MAT',  2, 11, 3, 4),
('Sistemas, Estruturas e Análise de Computadores', 'SEAC', 2, 11, 3, 4),
('Física Aplicada à Indústria',                    'FAI',  2, 11, 2, 3),
('Técnicas de Linguagem de Programação',           'TLP',  2, 11, 4, 5),
('Língua Inglesa',                                 'ING',  2, 11, 3, 3),
('Química',                                        'QUIM', 2, 11, 2, 3),
('Eletrotecnia',                                   'ELET', 2, 11, 2, 3),
('Educação Física',                                'EF',   2, 11, 2, 2);

-- 12º Ano (curso_id=2)
INSERT INTO disciplinas (nome, sigla, curso_id, ano, carga_horaria, creditos) VALUES
('Português',                                          'PT',   2, 12, 3, 3),
('Técnicas de Linguagem de Programação',               'TLP',  2, 12, 4, 5),
('Redes, Telecomunicações e Eletrónica Industrial',    'TREI', 2, 12, 3, 4),
('Física Aplicada à Indústria',                        'FAI',  2, 12, 2, 3),
('Sistemas, Estruturas e Análise de Computadores',     'SEAC', 2, 12, 3, 4),
('Matemática',                                         'MAT',  2, 12, 3, 4),
('Química Orgânica',                                   'QO',   2, 12, 2, 3),
('Empreendedorismo',                                   'EMP',  2, 12, 2, 2),
('Organização e Gestão da Informática',                'OGI',  2, 12, 2, 3);
