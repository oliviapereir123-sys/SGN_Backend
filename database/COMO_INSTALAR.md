# Como Instalar o SGN — Instituto Politécnico do Mayombe

## Requisitos
- XAMPP (ou WAMP/LAMP) com PHP 8.0+ e MySQL 8.0+
- Node.js 18+ e npm
- Pasta do projecto: `C:/xampp/htdocs/sgn/` (Windows) ou `/var/www/html/sgn/` (Linux)

---

## Passo 1 — Base de Dados

### 1a. Criar a estrutura (schema)
1. Abrir o **phpMyAdmin** → `http://localhost/phpmyadmin`
2. Clicar em **"Importar"**
3. Seleccionar o ficheiro: `backend/database/01_schema.sql`
4. Clicar **"Executar"**

Isto cria a base de dados `sgn_ipm` com todas as tabelas, índices e os dados estáticos (anos lectivos, trimestres, cursos, turmas, disciplinas).

### 1b. Tabelas adicionais (avaliacoes, auditoria_notas)
1. No phpMyAdmin, importar também: `backend/database/02_missing_tables.sql`
2. Se a base já foi criada antes (sem a coluna `bloqueado` em trimestres), executar uma vez:  
   `ALTER TABLE trimestres ADD COLUMN bloqueado TINYINT(1) NOT NULL DEFAULT 0;`

### 1c. Popular com utilizadores e dados iniciais
Abrir no browser:
```
http://localhost/sgn/backend/database/02_populate.php
```
(ou `http://localhost/SGN/backend/database/02_populate.php` se a pasta for SGN)
Ou via linha de comandos:
```bash
php backend/database/02_populate.php
```

O script insere com senhas encriptadas (bcrypt):
- 1 administrador
- 8 professores
- 28 alunos (distribuídos por 6 turmas)
- 28 encarregados (1 por aluno)
- Atribuições professor → disciplina → turma
- Notas de exemplo para poder testar o sistema imediatamente

---


## Passo 2 — Frontend (Next.js)
```bash
cd /caminho/para/sgn
npm install
```

Criar ficheiro `.env.local` na raiz:
```env
NEXT_PUBLIC_API_URL=http://localhost/sgn/backend/api
```

Iniciar o servidor de desenvolvimento:
```bash
npm run dev
```

Abrir: `http://localhost:3000`

---

## Passo 3 — Testar o Sistema

### Credenciais de acesso

| Perfil | Email / Nº | Senha |
|--------|-----------|-------|
| **Admin** | `admin@ipmayombe.ao` | `Admin@IPM2024` |
| **Professor** | `maria.santos@ipmayombe.ao` | `Prof@Santos24` |
| **Professor** | `antonio.silva@ipmayombe.ao` | `Prof@Silva24` |
| **Aluno** | `2024010001` (nº) | `Aluno@2024` |
| **Aluno** | `2024020001` (nº) | `Aluno@2024` |
| **Encarregado** | `manuel.silva.enc@email.ao` | `Enc@2024` |

### Fluxo completo para testar

1. **Professor** (`maria.santos`) → Dashboard → Lançar Notas → seleccionar turma IG-10A / TLP / 2º Trimestre → preencher exames → Submeter
2. **Admin** → Validação de Notas → ver notas pendentes → Aprovar
3. **Aluno** (`2024020001`, Esperança Dias) → Notas → ver nota aprovada
4. **Aluno** (`2024010001`, João da Silva) → Boletim → ver 1º Trimestre com notas já aprovadas

---

## Estrutura da Base de Dados

```
sgn_ipm
├── anos_lectivos          — anos lectivos (2022/23, 2023/24, 2024/25)
├── trimestres             — 3 trimestres por ano lectivo
├── cursos                 — Contabilidade, Informática de Gestão
├── turmas                 — CONT-10A/B, CONT-11A/B, CONT-12A, IG-10A/B, IG-11A/B, IG-12A
├── disciplinas            — disciplinas por curso e ano (10º, 11º, 12º)
├── professores            — 8 professores com senhas bcrypt
├── alunos                 — 28 alunos com senhas bcrypt
├── encarregados           — 28 encarregados (1 por aluno)
├── admin                  — 1 administrador
├── professor_disciplina_turma — atribuições professor → disciplina → turma
└── notas                  — p1, p2, trabalho, exame, média (calculada automaticamente)
```

---


---

## Passo 4 — Configurar Envio de Email (SMTP)

O sistema envia boletins automáticos por email aos encarregados quando todas as notas de um trimestre são aprovadas.

### 4a. Instalar PHPMailer
```bash
cd backend
composer install
```
> Se o Composer não estiver instalado: https://getcomposer.org/download/

### 4b. Configurar as credenciais SMTP
Editar o ficheiro `backend/config/email.php`:

**Gmail:**
1. Activar verificação em 2 passos: https://myaccount.google.com/security
2. Gerar palavra-passe de aplicação: https://myaccount.google.com/apppasswords
   - Seleccionar "Mail" → "Outro dispositivo" → nome: "SGN IPM"
   - Copiar as 16 letras geradas (ex: `abcd efgh ijkl mnop`)
3. Preencher em `email.php`:
```php
'username' => 'seuemail@gmail.com',
'password' => 'abcd efgh ijkl mnop',  // sem espaços
'from_email' => 'seuemail@gmail.com',
```

**Outlook/Hotmail:**
```php
'host'       => 'smtp-mail.outlook.com',
'port'       => 587,
'encryption' => 'tls',
'username'   => 'seuemail@outlook.com',
'password'   => 'SuaPasswordNormal',
'from_email' => 'seuemail@outlook.com',
```

### Quando são enviados os boletins?
O email é enviado **automaticamente** quando o admin usa "Aprovar Lote" na página de Validação de Notas,
e **apenas para os alunos** que ficarem com **todas as disciplinas do trimestre aprovadas** após essa operação.
Alunos com disciplinas ainda pendentes não recebem email até que todas estejam aprovadas.

### Reenvio manual de boletins
Se um email falhou (SMTP em baixo, endereço errado, etc.) ou o encarregado solicita uma nova cópia,
o admin pode reenviar o boletim individualmente na tab **"Reenviar"** da página de Validação de Notas.
Aparecem todos os alunos que têm pelo menos uma nota aprovada. O reenvio usa o mesmo template HTML do envio automático.

### O que contém o email?
- Saudação personalizada ao encarregado (com nome e parentesco)
- Dados completos do aluno (nome, número, turma, curso, ano)
- Tabela completa de notas (P1, P2, Trabalho, Exame, Média por disciplina)
- Resultado final: Aprovado / Reprovado
- Estatísticas: disciplinas aprovadas, reprovadas, média geral
- Rodapé institucional com data de emissão

## Resolução de Problemas

**"Não foi possível ligar ao servidor"**
→ Verificar se o XAMPP está a correr (Apache + MySQL)
→ Verificar se o ficheiro `.env.local` tem o URL correcto

**"Utilizador não encontrado"**
→ Confirmar que o `02_populate.php` foi executado com sucesso
→ Verificar se a base de dados `sgn_ipm` existe no phpMyAdmin

**Erro de CORS**
→ Verificar o ficheiro `backend/config/Headers.php` — deve ter `Access-Control-Allow-Origin: *`
