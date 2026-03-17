# SGN — Sistema de Gestão de Notas
### Instituto Politécnico do Mayombe

Sistema focado exclusivamente na gestão de notas académicas, com 4 perfis de utilizadores.

---

## Perfis de Utilizadores

| Perfil | O que pode fazer |
|--------|-----------------|
| **Professor** | Lançar notas (P1, P2, Trabalho, Exame) por turma e trimestre |
| **Admin** | Validar ou rejeitar notas submetidas pelos professores; ver relatórios e estatísticas |
| **Aluno** | Consultar as suas notas e boletim |
| **Encarregado** | Consultar as notas do seu educando |

## Fórmula de Cálculo da Média

```
Média = P1×20% + P2×20% + Trabalho×20% + Exame×40%
```

---

## Tecnologias

- **Frontend**: Next.js 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: PHP (Apache/XAMPP), MySQL
- **Autenticação**: Sessão local (frontend) + PHP

---

## Estrutura do Projecto

```
app/
├── login/                    # Páginas de login (aluno, professor, encarregado)
│   ├── aluno/
│   ├── professor/
│   └── encarregado/
└── dashboard/
    ├── admin/
    │   ├── validacao-notas/  # Aprovar/rejeitar notas
    │   ├── relatorios/       # Relatórios de notas
    │   └── estatisticas/     # Gráficos e estatísticas
    ├── professor/
    │   ├── notas/            # Lançar notas
    │   └── turmas/           # Ver turmas e alunos
    ├── aluno/
    │   ├── notas/            # Consultar notas
    │   └── boletim/          # Ver boletim completo
    └── encarregado/
        └── notas/            # Notas do educando

backend/
├── api/
│   ├── auth/login.php        # Login dos 4 perfis
│   └── notas/
│       ├── submit.php        # Submeter notas (professor)
│       ├── validar.php       # Validar/rejeitar notas (admin)
│       ├── get.php           # Buscar notas de um aluno
│       └── pendentes.php     # Listar notas para validação
├── config/
│   ├── Database.php
│   └── Headers.php
└── database/
    └── schema.sql            # Estrutura da base de dados
```

---

## Configuração Rápida

### 1. Base de Dados (XAMPP)
```sql
-- Executar no phpMyAdmin ou MySQL:
source backend/database/schema.sql
```

### 2. Frontend
```bash
pnpm install
pnpm dev
```

### 3. Variável de Ambiente
Criar `.env.local` na raiz:
```
NEXT_PUBLIC_API_URL=http://localhost/sgn/backend/api
```

---

## Contas de Demonstração (mock)

| Perfil | Credencial | Senha |
|--------|-----------|-------|
| Admin | admin@ipmayombe.ao | admin123 |
| Professor | maria.santos@ipmayombe.ao | prof123 |
| Aluno | Nº 2024001234 | aluno123 |
| Encarregado | maria.silva@email.ao | enc123 |

> ⚠️ Para produção, substituir os dados mock por chamadas reais à API backend.
