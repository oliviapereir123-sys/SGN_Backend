# IPM Maiombe - Backend API

## Setup XAMPP

### 1. Database Setup
1. Abra **phpMyAdmin** (http://localhost/phpmyadmin)
2. Crie uma nova base de dados chamada `ipm_maiombe`
3. Importe o arquivo `database/schema.sql` para criar as tabelas

### 2. Backend Files
1. Copie a pasta `backend` para `htdocs` do XAMPP
2. Estrutura do backend:
```
backend/
├── config/
│   ├── Database.php
│   └── Headers.php
├── api/
│   ├── auth/
│   │   └── login.php
│   ├── cursos/
│   │   └── get.php
│   ├── disciplinas/
│   │   └── get.php
│   ├── alunos/
│   │   └── get.php
│   └── notas/
│       └── submit.php
├── database/
│   └── schema.sql
└── README.md
```

### 3. URLs da API
- **Login**: `http://localhost/backend/api/auth/login.php` (POST)
- **Cursos**: `http://localhost/backend/api/cursos/get.php` (GET)
- **Disciplinas**: `http://localhost/backend/api/disciplinas/get.php?curso=Informática` (GET)
- **Alunos**: `http://localhost/backend/api/alunos/get.php` (GET)
- **Submeter Notas**: `http://localhost/backend/api/notas/submit.php` (POST)

### 4. Configuração no Next.js
Atualize o `lib/api.ts` com:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/backend/api';
```

### 5. Credenciais Padrão
- Admin: admin@ipmayombe.ao / admin123
- Professor: maria.santos@ipmayombe.ao / prof123
- Aluno: joao.silva@aluno.ipmayombe.ao / aluno123
