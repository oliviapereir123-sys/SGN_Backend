-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 23-Abr-2026 às 00:13
-- Versão do servidor: 10.4.32-MariaDB
-- versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `sgn_ipm`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `admin`
--

INSERT INTO `admin` (`id`, `nome`, `email`, `password`, `criado_em`) VALUES
(1, 'Walter Monteiro', 'admin@ipMaiombe.ao', '$2y$12$rE2a3X14dBuDdrw.jgPrOuZcoyHhUTYS7LKd13NBjJDRSz1PUbBlS', '2026-04-22 21:09:31');

-- --------------------------------------------------------

--
-- Estrutura da tabela `alunos`
--

CREATE TABLE `alunos` (
  `id` int(11) NOT NULL,
  `numero` varchar(20) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `turma_id` int(11) DEFAULT NULL,
  `estado` enum('Activo','Inactivo') DEFAULT 'Activo',
  `foto` varchar(255) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `alunos`
--

INSERT INTO `alunos` (`id`, `numero`, `nome`, `email`, `telefone`, `data_nascimento`, `password`, `turma_id`, `estado`, `foto`, `criado_em`) VALUES
(1, '932754931', 'Pedro Espirito', 'pedro.espirito18@gmail.com', NULL, NULL, '$2y$10$j9CfUnjEFqRQY3LVV/NGl.MN0EW8DtLIVzuENHWPbiNbo3Q8VScmG', 1, 'Activo', NULL, '2026-04-22 21:09:31'),
(2, '0252855', 'Sebastião Gabriel', 'sebastiao@gmail.com', NULL, NULL, '$2y$10$2ZYU/22S1xSFmbuAMh.EeefJPLLlLRh/O9oZunEfGQc.3bdXqmEHa', 1, 'Activo', NULL, '2026-04-22 21:09:31'),
(3, '8574963', 'Amaro Francisco', 'amaro@gmail.com', NULL, NULL, '$2y$10$Vl5u0ApCBc3xJYwmQ5/pLOalLgkaDcJUQP4l.vl85rk1BHc9eAOkK', 1, 'Activo', NULL, '2026-04-22 21:09:31');

-- --------------------------------------------------------

--
-- Estrutura da tabela `anos_lectivos`
--

CREATE TABLE `anos_lectivos` (
  `id` int(11) NOT NULL,
  `nome` varchar(10) NOT NULL,
  `inicio` date NOT NULL,
  `fim` date NOT NULL,
  `estado` enum('Activo','Encerrado','Pendente') DEFAULT 'Activo',
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `anos_lectivos`
--

INSERT INTO `anos_lectivos` (`id`, `nome`, `inicio`, `fim`, `estado`, `criado_em`) VALUES
(1, '2024/2025', '2024-09-02', '2025-07-25', 'Activo', '2026-04-22 21:09:30');

-- --------------------------------------------------------

--
-- Estrutura da tabela `auditoria`
--

CREATE TABLE `auditoria` (
  `id` int(11) NOT NULL,
  `utilizador_id` int(11) DEFAULT NULL COMMENT 'utilizadores.id',
  `tipo_utilizador` varchar(20) DEFAULT NULL,
  `acao` varchar(100) NOT NULL,
  `detalhes` text DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `auditoria_notas`
--

CREATE TABLE `auditoria_notas` (
  `id` int(11) NOT NULL,
  `nota_id` int(11) NOT NULL,
  `aluno_nome` varchar(100) NOT NULL,
  `disciplina` varchar(100) NOT NULL,
  `trimestre` varchar(30) NOT NULL,
  `campo` varchar(50) NOT NULL,
  `valor_antes` varchar(50) DEFAULT NULL,
  `valor_depois` varchar(50) DEFAULT NULL,
  `alterado_por` varchar(100) NOT NULL,
  `tipo_user` varchar(20) NOT NULL COMMENT 'professor, admin',
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `avaliacoes`
--

CREATE TABLE `avaliacoes` (
  `id` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `tipo` varchar(30) NOT NULL DEFAULT 'Prova' COMMENT 'Prova, Trabalho, Seminario, Projecto, Exame, Outro',
  `disciplina_id` int(11) NOT NULL,
  `turma_id` int(11) NOT NULL,
  `professor_id` int(11) NOT NULL,
  `trimestre_id` int(11) NOT NULL,
  `peso` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT '0-100',
  `data_entrega` date DEFAULT NULL,
  `descricao` text DEFAULT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'Activa',
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `calendario_academico`
--

CREATE TABLE `calendario_academico` (
  `id` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `tipo` enum('feriado','evento','exame','matricula','encerramento','outro') NOT NULL DEFAULT 'evento',
  `data_inicio` date NOT NULL,
  `data_fim` date DEFAULT NULL COMMENT 'opcional para evento de um dia use data_inicio=data_fim',
  `descricao` text DEFAULT NULL,
  `ano_lectivo_id` int(11) DEFAULT NULL COMMENT 'NULL = aplica a todos os anos',
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `cursos`
--

CREATE TABLE `cursos` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `sigla` varchar(10) NOT NULL,
  `estado` enum('Activo','Inactivo') DEFAULT 'Activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `cursos`
--

INSERT INTO `cursos` (`id`, `nome`, `sigla`, `estado`) VALUES
(1, 'Informática de Gestão', 'IG', 'Activo');

-- --------------------------------------------------------

--
-- Estrutura da tabela `disciplinas`
--

CREATE TABLE `disciplinas` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `sigla` varchar(10) DEFAULT NULL,
  `codigo` varchar(20) DEFAULT NULL,
  `curso_id` int(11) NOT NULL,
  `ano` int(11) NOT NULL,
  `carga_horaria` int(11) DEFAULT NULL,
  `creditos` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `disciplinas`
--

INSERT INTO `disciplinas` (`id`, `nome`, `sigla`, `codigo`, `curso_id`, `ano`, `carga_horaria`, `creditos`) VALUES
(1, 'Técnicas de Linguagem de Programação', 'TLP', NULL, 1, 13, 4, 5);

-- --------------------------------------------------------

--
-- Estrutura da tabela `encarregados`
--

CREATE TABLE `encarregados` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `aluno_id` int(11) NOT NULL,
  `parentesco` varchar(30) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `horarios`
--

CREATE TABLE `horarios` (
  `id` int(11) NOT NULL,
  `turma_id` int(11) NOT NULL,
  `disciplina_id` int(11) NOT NULL,
  `professor_id` int(11) NOT NULL,
  `ano_lectivo_id` int(11) NOT NULL,
  `dia_semana` tinyint(4) NOT NULL COMMENT '1=Segunda a 5=Sexta',
  `hora_inicio` time NOT NULL,
  `hora_fim` time NOT NULL,
  `sala` varchar(50) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `horarios`
--

INSERT INTO `horarios` (`id`, `turma_id`, `disciplina_id`, `professor_id`, `ano_lectivo_id`, `dia_semana`, `hora_inicio`, `hora_fim`, `sala`, `criado_em`) VALUES
(1, 1, 1, 1, 1, 2, '08:00:00', '09:30:00', 'Lab 301', '2026-04-22 21:09:31'),
(2, 1, 1, 1, 1, 4, '08:00:00', '09:30:00', 'Lab 301', '2026-04-22 21:09:31');

-- --------------------------------------------------------

--
-- Estrutura da tabela `matriculas`
--

CREATE TABLE `matriculas` (
  `id` int(11) NOT NULL,
  `aluno_id` int(11) NOT NULL,
  `turma_id` int(11) NOT NULL,
  `ano_lectivo_id` int(11) NOT NULL,
  `data_matricula` date NOT NULL DEFAULT '2024-09-02',
  `tipo` varchar(20) NOT NULL DEFAULT 'Normal' COMMENT 'Normal, Transferência, Repetente',
  `estado` varchar(20) NOT NULL DEFAULT 'Activa' COMMENT 'Activa, Cancelada, Concluída',
  `observacoes` text DEFAULT NULL,
  `registado_por` int(11) DEFAULT NULL COMMENT 'admin.id',
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `matriculas`
--

INSERT INTO `matriculas` (`id`, `aluno_id`, `turma_id`, `ano_lectivo_id`, `data_matricula`, `tipo`, `estado`, `observacoes`, `registado_por`, `criado_em`) VALUES
(1, 1, 1, 1, '2024-09-02', 'Normal', 'Activa', NULL, 1, '2026-04-22 21:09:31'),
(2, 2, 1, 1, '2024-09-02', 'Normal', 'Activa', NULL, 1, '2026-04-22 21:09:31'),
(3, 3, 1, 1, '2024-09-02', 'Normal', 'Activa', NULL, 1, '2026-04-22 21:09:31');

-- --------------------------------------------------------

--
-- Estrutura da tabela `notas`
--

CREATE TABLE `notas` (
  `id` int(11) NOT NULL,
  `aluno_id` int(11) NOT NULL,
  `disciplina_id` int(11) NOT NULL,
  `professor_id` int(11) NOT NULL,
  `trimestre_id` int(11) NOT NULL,
  `p1` decimal(4,2) DEFAULT NULL,
  `p2` decimal(4,2) DEFAULT NULL,
  `trabalho` decimal(4,2) DEFAULT NULL,
  `exame` decimal(4,2) DEFAULT NULL,
  `media` decimal(4,2) GENERATED ALWAYS AS (case when `p1` is not null and `p2` is not null and `trabalho` is not null and `exame` is not null then round(`p1` * 0.20 + `p2` * 0.20 + `trabalho` * 0.20 + `exame` * 0.40,2) else NULL end) STORED,
  `nota_recuperacao` decimal(4,2) DEFAULT NULL COMMENT 'Exame de recuperação; media_final = (media+nota_recuperacao)/2',
  `estado` enum('Rascunho','Pendente','Aprovado','Rejeitado') DEFAULT 'Rascunho',
  `observacoes` text DEFAULT NULL,
  `data_lancamento` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_validacao` timestamp NULL DEFAULT NULL,
  `validado_por` int(11) DEFAULT NULL,
  `feedback` text DEFAULT NULL COMMENT 'Observações do professor ao aluno'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `notas`
--

INSERT INTO `notas` (`id`, `aluno_id`, `disciplina_id`, `professor_id`, `trimestre_id`, `p1`, `p2`, `trabalho`, `exame`, `nota_recuperacao`, `estado`, `observacoes`, `data_lancamento`, `data_validacao`, `validado_por`, `feedback`) VALUES
(1, 1, 1, 1, 1, 14.00, 13.00, 15.00, 12.00, NULL, 'Aprovado', NULL, '2026-04-22 21:09:31', '2026-04-22 21:09:31', 1, NULL),
(2, 1, 1, 1, 2, 15.00, 14.00, 16.00, 13.00, NULL, 'Aprovado', NULL, '2026-04-22 21:09:31', '2026-04-22 21:09:31', 1, NULL),
(3, 1, 1, 1, 3, 16.00, 15.00, 17.00, 14.00, NULL, 'Aprovado', NULL, '2026-04-22 21:09:31', '2026-04-22 21:09:31', 1, NULL),
(4, 2, 1, 1, 1, 12.00, 11.00, 13.00, 10.00, NULL, 'Aprovado', NULL, '2026-04-22 21:09:31', '2026-04-22 21:09:31', 1, NULL),
(5, 2, 1, 1, 2, 13.00, 12.00, 14.00, 11.00, NULL, 'Aprovado', NULL, '2026-04-22 21:09:31', '2026-04-22 21:09:31', 1, NULL),
(6, 2, 1, 1, 3, 14.00, 13.00, 15.00, 12.00, NULL, 'Aprovado', NULL, '2026-04-22 21:09:31', '2026-04-22 21:09:31', 1, NULL),
(7, 3, 1, 1, 1, 17.00, 16.00, 18.00, 15.00, NULL, 'Aprovado', NULL, '2026-04-22 21:09:31', '2026-04-22 21:09:31', 1, NULL),
(8, 3, 1, 1, 2, 18.00, 17.00, 19.00, 16.00, NULL, 'Aprovado', NULL, '2026-04-22 21:09:31', '2026-04-22 21:09:31', 1, NULL),
(9, 3, 1, 1, 3, 17.00, 18.00, 16.00, 17.00, NULL, 'Aprovado', NULL, '2026-04-22 21:09:31', '2026-04-22 21:09:31', 1, NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `presencas`
--

CREATE TABLE `presencas` (
  `id` int(11) NOT NULL,
  `aluno_id` int(11) NOT NULL,
  `data` date NOT NULL,
  `presente` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1=presente, 0=falta',
  `justificada` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1=falta justificada',
  `observacao` varchar(255) DEFAULT NULL,
  `registado_por` int(11) DEFAULT NULL COMMENT 'professor_id ou admin id conforme tipo_registado',
  `tipo_registado` enum('professor','admin') DEFAULT 'professor',
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `presencas`
--

INSERT INTO `presencas` (`id`, `aluno_id`, `data`, `presente`, `justificada`, `observacao`, `registado_por`, `tipo_registado`, `criado_em`) VALUES
(1, 1, '2025-01-14', 1, 0, NULL, 1, 'professor', '2026-04-22 21:09:31'),
(2, 1, '2025-01-21', 1, 0, NULL, 1, 'professor', '2026-04-22 21:09:31'),
(3, 1, '2025-01-28', 1, 0, NULL, 1, 'professor', '2026-04-22 21:09:31'),
(4, 2, '2025-01-14', 1, 0, NULL, 1, 'professor', '2026-04-22 21:09:31'),
(5, 2, '2025-01-21', 1, 0, NULL, 1, 'professor', '2026-04-22 21:09:31'),
(6, 2, '2025-01-28', 1, 0, NULL, 1, 'professor', '2026-04-22 21:09:31'),
(7, 3, '2025-01-14', 1, 0, NULL, 1, 'professor', '2026-04-22 21:09:31'),
(8, 3, '2025-01-21', 1, 0, NULL, 1, 'professor', '2026-04-22 21:09:31'),
(9, 3, '2025-01-28', 1, 0, NULL, 1, 'professor', '2026-04-22 21:09:31');

-- --------------------------------------------------------

--
-- Estrutura da tabela `professores`
--

CREATE TABLE `professores` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `departamento` varchar(100) DEFAULT NULL,
  `estado` enum('Activo','Inactivo') DEFAULT 'Activo',
  `foto` varchar(255) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `professores`
--

INSERT INTO `professores` (`id`, `nome`, `email`, `password`, `departamento`, `estado`, `foto`, `criado_em`) VALUES
(1, 'Ramos Panzo', 'ramos@panzo.ao', '$2y$10$/8ZCqCC051MJ6x6o2wM5uOsGrP53WkRp/V5FKEqBFKNsNuQZsSJ6m', 'TI', 'Activo', NULL, '2026-04-22 21:09:31');

-- --------------------------------------------------------

--
-- Estrutura da tabela `professor_disciplina_turma`
--

CREATE TABLE `professor_disciplina_turma` (
  `id` int(11) NOT NULL,
  `professor_id` int(11) NOT NULL,
  `disciplina_id` int(11) NOT NULL,
  `turma_id` int(11) NOT NULL,
  `ano_lectivo_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `professor_disciplina_turma`
--

INSERT INTO `professor_disciplina_turma` (`id`, `professor_id`, `disciplina_id`, `turma_id`, `ano_lectivo_id`) VALUES
(1, 1, 1, 1, 1);

-- --------------------------------------------------------

--
-- Estrutura da tabela `trimestres`
--

CREATE TABLE `trimestres` (
  `id` int(11) NOT NULL,
  `nome` varchar(30) NOT NULL,
  `ano_lectivo_id` int(11) NOT NULL,
  `inicio` date NOT NULL,
  `fim` date NOT NULL,
  `estado` enum('Activo','Encerrado','Pendente') DEFAULT 'Pendente',
  `bloqueado` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1=bloqueado para lançamento de notas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `trimestres`
--

INSERT INTO `trimestres` (`id`, `nome`, `ano_lectivo_id`, `inicio`, `fim`, `estado`, `bloqueado`) VALUES
(1, '1º Trimestre', 1, '2024-09-02', '2024-12-13', 'Encerrado', 0),
(2, '2º Trimestre', 1, '2025-01-06', '2025-04-04', 'Encerrado', 0),
(3, '3º Trimestre', 1, '2025-04-22', '2025-07-25', 'Pendente', 0);

-- --------------------------------------------------------

--
-- Estrutura da tabela `turmas`
--

CREATE TABLE `turmas` (
  `id` int(11) NOT NULL,
  `nome` varchar(20) NOT NULL,
  `curso_id` int(11) NOT NULL,
  `ano` int(11) NOT NULL COMMENT '10, 11 ou 12',
  `turno` varchar(10) DEFAULT NULL,
  `sala` varchar(30) DEFAULT NULL,
  `periodo` varchar(20) DEFAULT 'Matutino',
  `capacidade` int(11) DEFAULT 30,
  `estado` enum('Activa','Inactiva') DEFAULT 'Activa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `turmas`
--

INSERT INTO `turmas` (`id`, `nome`, `curso_id`, `ano`, `turno`, `sala`, `periodo`, `capacidade`, `estado`) VALUES
(1, 'IG-13A', 1, 13, 'Manhã', 'Lab 301', 'Matutino', 30, 'Activa');

-- --------------------------------------------------------

--
-- Estrutura da tabela `utilizadores`
--

CREATE TABLE `utilizadores` (
  `id` int(11) NOT NULL,
  `ref_id` int(11) NOT NULL COMMENT 'ID na tabela de origem',
  `tipo` varchar(20) NOT NULL COMMENT 'professor, aluno, admin, encarregado',
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'Activo',
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `utilizadores`
--

INSERT INTO `utilizadores` (`id`, `ref_id`, `tipo`, `nome`, `email`, `estado`, `criado_em`) VALUES
(1, 1, 'professor', 'Ramos Panzo', 'ramos@panzo.ao', 'Activo', '2026-04-22 21:09:31'),
(2, 1, 'aluno', 'Pedro Espirito', 'pedro.espirito18@gmail.com', 'Activo', '2026-04-22 21:09:31'),
(3, 2, 'aluno', 'Sebastião Gabriel', 'sebastiao@gmail.com', 'Activo', '2026-04-22 21:09:31'),
(4, 3, 'aluno', 'Amaro Francisco', 'amaro@gmail.com', 'Activo', '2026-04-22 21:09:31'),
(5, 1, 'admin', 'António Ferreira', 'admin@ipMaiombe.ao', 'Activo', '2026-04-22 21:09:31');

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Índices para tabela `alunos`
--
ALTER TABLE `alunos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero` (`numero`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_alunos_turma` (`turma_id`);

--
-- Índices para tabela `anos_lectivos`
--
ALTER TABLE `anos_lectivos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`);

--
-- Índices para tabela `auditoria`
--
ALTER TABLE `auditoria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_utilizador` (`utilizador_id`),
  ADD KEY `idx_criado` (`criado_em`);

--
-- Índices para tabela `auditoria_notas`
--
ALTER TABLE `auditoria_notas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_auditoria_nota` (`nota_id`),
  ADD KEY `idx_auditoria_criado` (`criado_em`);

--
-- Índices para tabela `avaliacoes`
--
ALTER TABLE `avaliacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `disciplina_id` (`disciplina_id`),
  ADD KEY `turma_id` (`turma_id`),
  ADD KEY `professor_id` (`professor_id`),
  ADD KEY `trimestre_id` (`trimestre_id`);

--
-- Índices para tabela `calendario_academico`
--
ALTER TABLE `calendario_academico`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_calendario_data` (`data_inicio`),
  ADD KEY `idx_calendario_ano` (`ano_lectivo_id`);

--
-- Índices para tabela `cursos`
--
ALTER TABLE `cursos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`),
  ADD UNIQUE KEY `sigla` (`sigla`);

--
-- Índices para tabela `disciplinas`
--
ALTER TABLE `disciplinas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `curso_id` (`curso_id`);

--
-- Índices para tabela `encarregados`
--
ALTER TABLE `encarregados`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `aluno_id` (`aluno_id`);

--
-- Índices para tabela `horarios`
--
ALTER TABLE `horarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `disciplina_id` (`disciplina_id`),
  ADD KEY `ano_lectivo_id` (`ano_lectivo_id`),
  ADD KEY `idx_horarios_turma` (`turma_id`),
  ADD KEY `idx_horarios_professor` (`professor_id`),
  ADD KEY `idx_horarios_dia` (`dia_semana`);

--
-- Índices para tabela `matriculas`
--
ALTER TABLE `matriculas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_matricula` (`aluno_id`,`ano_lectivo_id`),
  ADD KEY `idx_aluno` (`aluno_id`),
  ADD KEY `idx_turma` (`turma_id`),
  ADD KEY `idx_estado` (`estado`),
  ADD KEY `fk_mat_ano` (`ano_lectivo_id`),
  ADD KEY `fk_mat_admin` (`registado_por`);

--
-- Índices para tabela `notas`
--
ALTER TABLE `notas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_nota` (`aluno_id`,`disciplina_id`,`trimestre_id`),
  ADD KEY `disciplina_id` (`disciplina_id`),
  ADD KEY `professor_id` (`professor_id`),
  ADD KEY `validado_por` (`validado_por`),
  ADD KEY `idx_notas_aluno` (`aluno_id`),
  ADD KEY `idx_notas_estado` (`estado`),
  ADD KEY `idx_notas_trimestre` (`trimestre_id`);

--
-- Índices para tabela `presencas`
--
ALTER TABLE `presencas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_presenca` (`aluno_id`,`data`),
  ADD KEY `idx_presencas_aluno` (`aluno_id`),
  ADD KEY `idx_presencas_data` (`data`);

--
-- Índices para tabela `professores`
--
ALTER TABLE `professores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Índices para tabela `professor_disciplina_turma`
--
ALTER TABLE `professor_disciplina_turma`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_atribuicao` (`professor_id`,`disciplina_id`,`turma_id`,`ano_lectivo_id`),
  ADD KEY `disciplina_id` (`disciplina_id`),
  ADD KEY `turma_id` (`turma_id`),
  ADD KEY `ano_lectivo_id` (`ano_lectivo_id`);

--
-- Índices para tabela `trimestres`
--
ALTER TABLE `trimestres`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_trimestre` (`nome`,`ano_lectivo_id`),
  ADD KEY `ano_lectivo_id` (`ano_lectivo_id`);

--
-- Índices para tabela `turmas`
--
ALTER TABLE `turmas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`),
  ADD KEY `curso_id` (`curso_id`);

--
-- Índices para tabela `utilizadores`
--
ALTER TABLE `utilizadores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tipo` (`tipo`),
  ADD KEY `idx_estado` (`estado`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `alunos`
--
ALTER TABLE `alunos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `anos_lectivos`
--
ALTER TABLE `anos_lectivos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `auditoria`
--
ALTER TABLE `auditoria`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `auditoria_notas`
--
ALTER TABLE `auditoria_notas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `avaliacoes`
--
ALTER TABLE `avaliacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `calendario_academico`
--
ALTER TABLE `calendario_academico`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `cursos`
--
ALTER TABLE `cursos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `disciplinas`
--
ALTER TABLE `disciplinas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `encarregados`
--
ALTER TABLE `encarregados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `horarios`
--
ALTER TABLE `horarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `matriculas`
--
ALTER TABLE `matriculas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `notas`
--
ALTER TABLE `notas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de tabela `presencas`
--
ALTER TABLE `presencas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de tabela `professores`
--
ALTER TABLE `professores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `professor_disciplina_turma`
--
ALTER TABLE `professor_disciplina_turma`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `trimestres`
--
ALTER TABLE `trimestres`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `turmas`
--
ALTER TABLE `turmas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `utilizadores`
--
ALTER TABLE `utilizadores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Restrições para despejos de tabelas
--

--
-- Limitadores para a tabela `alunos`
--
ALTER TABLE `alunos`
  ADD CONSTRAINT `alunos_ibfk_1` FOREIGN KEY (`turma_id`) REFERENCES `turmas` (`id`);

--
-- Limitadores para a tabela `auditoria`
--
ALTER TABLE `auditoria`
  ADD CONSTRAINT `fk_aud_utilizador` FOREIGN KEY (`utilizador_id`) REFERENCES `utilizadores` (`id`) ON DELETE SET NULL;

--
-- Limitadores para a tabela `avaliacoes`
--
ALTER TABLE `avaliacoes`
  ADD CONSTRAINT `avaliacoes_ibfk_1` FOREIGN KEY (`disciplina_id`) REFERENCES `disciplinas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `avaliacoes_ibfk_2` FOREIGN KEY (`turma_id`) REFERENCES `turmas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `avaliacoes_ibfk_3` FOREIGN KEY (`professor_id`) REFERENCES `professores` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `avaliacoes_ibfk_4` FOREIGN KEY (`trimestre_id`) REFERENCES `trimestres` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `calendario_academico`
--
ALTER TABLE `calendario_academico`
  ADD CONSTRAINT `calendario_academico_ibfk_1` FOREIGN KEY (`ano_lectivo_id`) REFERENCES `anos_lectivos` (`id`) ON DELETE SET NULL;

--
-- Limitadores para a tabela `disciplinas`
--
ALTER TABLE `disciplinas`
  ADD CONSTRAINT `disciplinas_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`);

--
-- Limitadores para a tabela `encarregados`
--
ALTER TABLE `encarregados`
  ADD CONSTRAINT `encarregados_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `horarios`
--
ALTER TABLE `horarios`
  ADD CONSTRAINT `horarios_ibfk_1` FOREIGN KEY (`turma_id`) REFERENCES `turmas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `horarios_ibfk_2` FOREIGN KEY (`disciplina_id`) REFERENCES `disciplinas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `horarios_ibfk_3` FOREIGN KEY (`professor_id`) REFERENCES `professores` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `horarios_ibfk_4` FOREIGN KEY (`ano_lectivo_id`) REFERENCES `anos_lectivos` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `matriculas`
--
ALTER TABLE `matriculas`
  ADD CONSTRAINT `fk_mat_admin` FOREIGN KEY (`registado_por`) REFERENCES `admin` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_mat_aluno` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_mat_ano` FOREIGN KEY (`ano_lectivo_id`) REFERENCES `anos_lectivos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_mat_turma` FOREIGN KEY (`turma_id`) REFERENCES `turmas` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `notas`
--
ALTER TABLE `notas`
  ADD CONSTRAINT `notas_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notas_ibfk_2` FOREIGN KEY (`disciplina_id`) REFERENCES `disciplinas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notas_ibfk_3` FOREIGN KEY (`professor_id`) REFERENCES `professores` (`id`),
  ADD CONSTRAINT `notas_ibfk_4` FOREIGN KEY (`trimestre_id`) REFERENCES `trimestres` (`id`),
  ADD CONSTRAINT `notas_ibfk_5` FOREIGN KEY (`validado_por`) REFERENCES `admin` (`id`) ON DELETE SET NULL;

--
-- Limitadores para a tabela `presencas`
--
ALTER TABLE `presencas`
  ADD CONSTRAINT `presencas_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `professor_disciplina_turma`
--
ALTER TABLE `professor_disciplina_turma`
  ADD CONSTRAINT `professor_disciplina_turma_ibfk_1` FOREIGN KEY (`professor_id`) REFERENCES `professores` (`id`),
  ADD CONSTRAINT `professor_disciplina_turma_ibfk_2` FOREIGN KEY (`disciplina_id`) REFERENCES `disciplinas` (`id`),
  ADD CONSTRAINT `professor_disciplina_turma_ibfk_3` FOREIGN KEY (`turma_id`) REFERENCES `turmas` (`id`),
  ADD CONSTRAINT `professor_disciplina_turma_ibfk_4` FOREIGN KEY (`ano_lectivo_id`) REFERENCES `anos_lectivos` (`id`);

--
-- Limitadores para a tabela `trimestres`
--
ALTER TABLE `trimestres`
  ADD CONSTRAINT `trimestres_ibfk_1` FOREIGN KEY (`ano_lectivo_id`) REFERENCES `anos_lectivos` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `turmas`
--
ALTER TABLE `turmas`
  ADD CONSTRAINT `turmas_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
