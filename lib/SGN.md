Análise do Sistema de Gestão de Notas (SGN) - Angola

Resumo Executivo

O sistema atual é funcional para gestão básica de notas, mas apresenta inconsistências críticas e funcionalidades essenciais em falta para ser considerado um sistema completo adaptado ao contexto educativo de Angola.



Problemas Críticos Identificados

1. Inconsistência na Estrutura de Notas (CRÍTICO)

Problema: O schema da base de dados e o código da API usam campos diferentes:





Schema (01_schema.sql): Usa p1, p2, trabalho, exame



API (backend/api/notas/submit.php): Usa prova_professor, avaliacao, prova_trimestre



Fórmula no schema: P1×20% + P2×20% + Trabalho×20% + Exame×40%



Fórmula no frontend (lib/export-utils.tsx): P1×25% + P2×25% + Trabalho×10% + Exame×40%

Impacto: O sistema não funciona corretamente - há uma desconexão entre o que o frontend envia e o que a base de dados espera.

Um Sistema de Gestão de Notas (SGN) para escolas em Angola deve ter funcionalidades que garantam registo correto das avaliações, cálculo automático das médias e acompanhamento do desempenho dos alunos. Além disso, deve seguir práticas usadas pelo Ministério da Educação de Angola.

Abaixo estão os elementos essenciais que não devem faltar.



1️⃣ Gestão de Alunos

Base de todo o sistema.

Funcionalidades:





Cadastro de alunos



Número de processo/matrícula



Classe e turma



Ano letivo



Histórico escolar



Situação do aluno (ativo, transferido, desistente)



2️⃣ Gestão de Professores

Permite associar professores às disciplinas.

Funcionalidades:





Cadastro de professores



Disciplinas que leciona



Turmas atribuídas



Controle de acesso ao sistema



3️⃣ Gestão de Turmas e Classes

Organiza os alunos dentro da escola.

Exemplo:





Classe (7ª, 8ª, 9ª, etc.)



Turma (A, B, C)



Ano letivo

Funções:





Criar turmas



Atribuir alunos



Atribuir professores



4️⃣ Gestão de Disciplinas

Controla todas as matérias ensinadas.

Exemplo:





Matemática



Português



Física



Química

Funções:





Criar disciplinas



Associar disciplinas às classes



Definir professores responsáveis



5️⃣ Lançamento de Avaliações

Parte mais importante do sistema.

Tipos de avaliação:





Testes



Trabalhos



Exercícios



Provas trimestrais



Exames

O sistema deve permitir:





Inserir notas por aluno



Editar notas



Controlar limites (0–20 valores)



6️⃣ Cálculo Automático das Médias

O sistema deve calcular automaticamente:

Média de Avaliação Contínua (MAC)

MAC=T1+T2+T3+TrabalhosnMAC = \frac{T1 + T2 + T3 + Trabalhos}{n}MAC=nT1+T2+T3+Trabalhos​

Média Trimestral

MT=MAC+PT2MT = \frac{MAC + PT}{2}MT=2MAC+PT​

Média Anual

MA=MT1+MT2+MT33MA = \frac{MT1 + MT2 + MT3}{3}MA=3MT1+MT2+MT3​

Média Final (com exame)

MF=MA+EX2MF = \frac{MA + EX}{2}MF=2MA+EX​



7️⃣ Boletim de Notas

Deve gerar automaticamente:





Boletim trimestral



Boletim anual



Classificação final



Situação do aluno (Aprovado/Reprovado)

Pode exportar em:





PDF



Impressão



8️⃣ Relatórios Académicos

Importante para direção da escola.

Exemplos:





Lista de melhores alunos



Alunos reprovados



Estatísticas por disciplina



Média da turma



Desempenho por professor



9️⃣ Perfis de Utilizador (Controle de Acesso)

Perfis comuns:

Administrador





Controle total do sistema

Direção pedagógica





Ver relatórios



Aprovar notas

Professor





Lançar notas

Secretaria





Gerir alunos e turmas



🔟 Histórico Académico

Cada aluno deve ter:





Histórico de notas



Turmas anteriores



Médias de anos anteriores



Situação final



1️⃣1️⃣ Segurança e Auditoria

Muito importante.

O sistema deve:





Registar quem alterou notas



Data da alteração



Evitar alterações após fechamento do trimestre



1️⃣2️⃣ Configuração do Ano Letivo

O sistema deve permitir:





Abrir novo ano letivo



Criar trimestres



Fechar períodos de avaliação



⭐ Funcionalidades modernas (recomendadas)





Portal do aluno



Portal do encarregado de educação



Notificações de notas



Gráficos de desempenho



Exportação para Excel



Backup automático



✅ Resumo:
Um bom sistema de gestão de notas deve ter:





Gestão de alunos



Gestão de professores



Gestão de turmas



Gestão de disciplinas



Lançamento de avaliações



Cálculo automático de médias



Boletins de notas



Relatórios



Controle de acesso



Histórico académico



Segurança



Gestão do ano letivo


Abaixo estão as ações completas dos principais intervenientes num SGN usado em escolas, alinhado com práticas do Ministério da Educação de Angola.



1️⃣ Administrador do Sistema

Responsável pela gestão técnica e configuração do sistema.

Ações





Criar contas de utilizadores



Definir perfis e permissões



Configurar o ano letivo



Criar classes e turmas



Cadastrar disciplinas



Associar professores às disciplinas



Abrir e fechar períodos de avaliação



Configurar fórmulas de cálculo de notas



Fazer backup do sistema



Restaurar dados



Monitorar atividades do sistema



Gerir logs de alterações



Bloquear ou desbloquear utilizadores



2️⃣ Direção Pedagógica

Responsável pelo controle académico da escola.

Ações





Consultar turmas e disciplinas



Monitorar desempenho dos alunos



Aprovar ou validar notas lançadas



Bloquear alteração de notas após validação



Consultar estatísticas de aproveitamento



Analisar médias por disciplina



Ver lista de alunos aprovados/reprovados



Emitir relatórios académicos



Autorizar correções de notas



Acompanhar desempenho de professores



3️⃣ Professor

Responsável pela avaliação dos alunos.

Ações





Consultar turmas atribuídas



Consultar lista de alunos



Registar avaliações contínuas



Lançar notas de testes



Lançar notas de trabalhos



Lançar notas de participação



Lançar notas da prova trimestral



Lançar notas de exame



Editar notas antes da validação



Consultar médias da turma



Consultar desempenho individual dos alunos



Gerar relatório da disciplina



Imprimir pauta de notas



4️⃣ Secretaria Académica

Responsável pela gestão administrativa dos alunos.

Ações





Cadastrar alunos



Atualizar dados de alunos



Transferir alunos de turma



Matricular alunos em classes



Gerir turmas



Associar alunos às turmas



Emitir boletins de notas



Emitir histórico escolar



Consultar desempenho dos alunos



Gerir documentos escolares



5️⃣ Aluno

Utilizador que consulta o seu desempenho escolar.

Ações





Consultar notas por disciplina



Consultar média trimestral



Consultar média anual



Consultar boletim de notas



Consultar histórico académico



Ver desempenho por trimestre



Ver ranking na turma (se permitido)



6️⃣ Encarregado de Educação

Responsável por acompanhar o aluno.

Ações





Consultar notas do educando



Consultar boletim trimestral



Consultar média anual



Ver desempenho por disciplina



Receber notificações de notas



Acompanhar evolução do aluno



7️⃣ Diretor da Escola

Responsável pela gestão geral da escola.

Ações





Consultar relatórios gerais



Ver estatísticas de aprovação



Ver estatísticas de reprovação



Monitorar desempenho global da escola



Comparar desempenho entre turmas



Analisar desempenho por disciplina



Emitir relatórios institucionais



📊 Resumo dos Intervenientes







Interveniente



Função Principal





Administrador



Configuração e gestão do sistema





Direção pedagógica



Supervisão académica





Professor



Avaliação e lançamento de notas





Secretaria



Gestão de alunos e documentos





Aluno



Consulta de notas





Encarregado



Acompanhamento do aluno





Diretor



Análise estratégica

Aplique o seguinte:
Em Angola, o cálculo de notas nas escolas (ensino primário, I e II ciclo do ensino secundário) normalmente segue regras definidas pelo Ministério da Educação de Angola. A base costuma ser a média entre avaliação contínua (MAC) e prova do trimestre, com resultados numa escala de 0 a 20 valores.

Vou explicar as fórmulas mais usadas.



1️⃣ Média do Trimestre

Durante o trimestre o aluno faz testes, trabalhos, participação, exercícios, que formam a MAC (Média de Avaliação Contínua).

Fórmula

MT=MAC+PT2MT = \frac{MAC + PT}{2}MT=2MAC+PT​

Onde:





MT = Média do Trimestre



MAC = Média de Avaliação Contínua



PT = Prova do Trimestre

Exemplo

MAC = 14
Prova Trimestral = 12

MT=14+122=13MT = \frac{14 + 12}{2} = 13MT=214+12​=13

Média do trimestre = 13 valores



2️⃣ Média Anual (3 Trimestres)

No final do ano calcula-se a média das 3 médias trimestrais.

Fórmula

MA=MT1+MT2+MT33MA = \frac{MT1 + MT2 + MT3}{3}MA=3MT1+MT2+MT3​

Onde:





MA = Média Anual



MT1 = Média do 1º trimestre



MT2 = Média do 2º trimestre



MT3 = Média do 3º trimestre

Exemplo

MT1 = 12
MT2 = 14
MT3 = 13

MA=12+14+133=13MA = \frac{12 + 14 + 13}{3} = 13MA=312+14+13​=13

Média anual = 13 valores



3️⃣ Média Final (quando há exame)

Em algumas classes há exame final.

Fórmula comum

MF=MA+EX2MF = \frac{MA + EX}{2}MF=2MA+EX​

Onde:





MF = Média Final



MA = Média Anual



EX = Nota do exame

Exemplo

MA = 13
Exame = 12

MF=13+122=12.5MF = \frac{13 + 12}{2} = 12.5MF=213+12​=12.5



4️⃣ Regra de Aprovação (geral)

Normalmente:





≥ 10 valores → Aprovado



< 10 valores → Reprovado



✅ Resumo das fórmulas

Média trimestral:

MT=(MAC+PT)/2MT = (MAC + PT) / 2MT=(MAC+PT)/2

Média anual:

MA=(MT1+MT2+MT3)/3MA = (MT1 + MT2 + MT3) / 3MA=(MT1+MT2+MT3)/3

Média final com exame:

MF=(MA+EX)/2MF = (MA + EX) / 2MF=(MA+EX)/2

Solução: Padronizar para uma estrutura única. Recomendação: usar p1, p2, trabalho, exame conforme o schema, e confirmar a fórmula oficial do Ministério da Educação de Angola.

2. Tabelas em Falta no Schema

Tabelas referenciadas no código mas ausentes no schema:





avaliacoes - Referenciada em backend/api/professor/avaliacoes.php



auditoria_notas - Referenciada em backend/api/notas/submit.php e backend/api/admin/auditoria.php



Campo bloqueado na tabela trimestres - Usado no código mas não definido no schema

Impacto: Queries SQL falham ao tentar aceder a estas tabelas/campos.



Funcionalidades Implementadas

✅ Gestão de Notas





Lançamento de notas por professores



Validação de notas por administradores



Cálculo automático de médias



Estados: Rascunho → Pendente → Aprovado/Rejeitado



Histórico académico por ano lectivo

✅ Estrutura Académica





Anos lectivos e trimestres



Cursos (Contabilidade, Informática de Gestão)



Turmas por curso e ano (10º, 11º, 12º)



Disciplinas por curso e ano



Atribuição professor-disciplina-turma

✅ Utilizadores e Perfis





4 perfis: Aluno, Professor, Encarregado, Admin



Autenticação JWT



Gestão de utilizadores (CRUD)



Importação CSV de alunos/professores

✅ Relatórios e Boletins





Geração de boletins por trimestre



Envio automático de boletins por email aos encarregados



Relatórios estatísticos



Exportação PDF/CSV

✅ Auditoria





Registo de alterações de notas



Histórico de validações



Funcionalidades em Falta (Essenciais)

🔴 1. Controlo de Frequências/Presenças

Prioridade: ALTA

O que falta:





Tabela frequencias ou presencas



Registo de faltas justificadas/justificadas



Cálculo de percentagem de presenças



Relação com aprovação/reprovação (normalmente requer 75% de presenças)



Relatórios de faltas para encarregados

Impacto: Sistema incompleto sem controlo de assiduidade, essencial no sistema educativo angolano.

🔴 2. Horários de Aulas

Prioridade: ALTA

O que falta:





Tabela horarios ou horarios_aulas



Definição de horários semanais por turma/disciplina



Visualização de horários para alunos/professores



Gestão de salas e recursos

Impacto: Professores e alunos não sabem quando são as aulas.

🔴 3. Calendário Académico

Prioridade: MÉDIA-ALTA

O que falta:





Tabela calendario_academico ou eventos



Feriados nacionais e regionais



Datas importantes (início/fim de períodos, exames, matrículas)



Prazos de entrega de trabalhos



Integração com notificações

Impacto: Falta de organização temporal do ano lectivo.

🔴 4. Gestão de Matrículas/Inscrições

Prioridade: MÉDIA

O que falta:





Processo de matrícula anual



Renovação de matrículas



Transferências entre turmas/cursos



Documentos necessários para matrícula



Histórico de matrículas

Impacto: Gestão manual de processos administrativos importantes.

🔴 5. Sistema de Exames de Recuperação/Recurso

Prioridade: MÉDIA-ALTA

O que falta:





Registo de exames de recuperação



Cálculo de média final considerando recuperação



Pautas de recuperação



Notificações para alunos com média < 10

Impacto: Sistema incompleto sem gestão de recuperação, comum no sistema angolano.

🔴 6. Gestão de Pagamentos/Propinas

Prioridade: MÉDIA (se aplicável)

O que falta:





Tabela pagamentos ou propinas



Registo de pagamentos



Estados de pagamento (pendente/pago/atrasado)



Relação com matrícula/inscrição



Relatórios financeiros

Impacto: Se a escola cobra propinas, falta gestão financeira integrada.

🔴 7. Comunicação/Mensagens

Prioridade: MÉDIA

O que falta:





Sistema de mensagens interno



Notificações push/email



Comunicação professor-encarregado



Avisos gerais da escola



Notificações de eventos importantes

Impacto: Comunicação fragmentada, dependente de email externo.

🔴 8. Gestão de Documentos Oficiais

Prioridade: MÉDIA

O que falta:





Geração de certificados de conclusão



Histórico académico completo (transcrição)



Declarações de frequência



Documentos oficiais com assinaturas digitais



Arquivo de documentos dos alunos

Impacto: Necessidade de gerar documentos oficiais manualmente.

🔴 9. Biblioteca/Documentação

Prioridade: BAIXA-MÉDIA

O que falta:





Catálogo de livros



Empréstimos



Reservas



Multas por atraso

Impacto: Gestão separada da biblioteca.

🔴 10. Sistema de Avisos/Disciplina

Prioridade: MÉDIA

O que falta:





Registo de ocorrências disciplinares



Avisos formais



Suspensões



Comunicação com encarregados sobre problemas disciplinares

Impacto: Gestão disciplinar não integrada.

🔴 11. Relatórios Avançados

Prioridade: MÉDIA

O que falta:





Relatórios por curso/turma/disciplina



Análise de desempenho comparativo



Taxa de aprovação/reprovação



Gráficos de evolução temporal



Exportação para Excel avançada

Impacto: Análise de dados limitada.

🔴 12. Configurações do Sistema

Prioridade: BAIXA-MÉDIA

O que falta:





Configuração de fórmulas de cálculo (pesos)



Configuração de períodos lectivos



Configuração de regras de aprovação



Personalização de boletins



Configuração de email SMTP na interface

Impacto: Alterações requerem modificação de código.

🔴 13. Backup e Exportação de Dados

Prioridade: ALTA (Segurança)

O que falta:





Sistema de backup automático



Exportação completa da base de dados



Restauração de backups



Logs de sistema



Política de retenção de dados

Impacto: Risco de perda de dados.

🔴 14. Multilíngua

Prioridade: BAIXA (se necessário)

O que falta:





Suporte para Português de Angola e outras línguas



Interface traduzível



Documentos em múltiplas línguas

Impacto: Limitado se necessário suportar outras línguas.




Recomendações Prioritárias

Fase 1 - Correções Críticas (Urgente)





Corrigir inconsistência de campos de notas - Unificar p1/p2/trabalho/exame vs prova_professor/avaliacao/prova_trimestre



Criar tabelas em falta - avaliacoes, auditoria_notas, adicionar campo bloqueado em trimestres



Confirmar e padronizar fórmula de cálculo - Verificar com Ministério da Educação de Angola

Fase 2 - Funcionalidades Essenciais (1-3 meses)





Controlo de Frequências - Sistema completo de presenças/faltas



Horários de Aulas - Gestão e visualização de horários



Calendário Académico - Eventos e datas importantes



Sistema de Backup - Backup automático e restauração

Fase 3 - Melhorias Importantes (3-6 meses)





Exames de Recuperação - Gestão completa de recuperação



Comunicação - Sistema de mensagens e notificações



Documentos Oficiais - Certificados e transcrições



Relatórios Avançados - Análises e estatísticas detalhadas

Fase 4 - Funcionalidades Complementares (6+ meses)





Gestão de Pagamentos - Se aplicável



Biblioteca - Se necessário



App Móvel - Se houver necessidade



Multilíngua - Se necessário



Conclusão

O sistema atual é uma base sólida para gestão de notas, mas está incompleto para ser considerado um sistema completo de gestão escolar adaptado a Angola. As principais lacunas são:





Problemas técnicos críticos que impedem o funcionamento correto



Funcionalidades essenciais em falta (frequências, horários, calendário)



Falta de integração de processos administrativos importantes
Criar turmas no sistema, disciciplinas, associar alunos a turmas e disciplinas, lançar notas, etc.