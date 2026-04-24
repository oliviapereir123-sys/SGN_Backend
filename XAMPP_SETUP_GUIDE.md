# IPM Maiombe - XAMPP Backend Setup Guide

This guide explains how to set up the backend for the IPM Maiombe education management system using XAMPP.

## Prerequisites

- XAMPP installed (download from https://www.apachefriends.org)
- MySQL running in XAMPP
- Node.js installed for the Next.js frontend

## Database Setup

### Step 1: Start XAMPP Services

1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL** services
3. Verify both show "Running"

### Step 2: Create Database

1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Click "New" in the left sidebar
3. Create a new database named **ipm_maiombe**
4. Set collation to **utf8mb4_unicode_ci**
5. Click "Create"

### Step 3: Import Database Schema

1. Select the **ipm_maiombe** database
2. Click the "Import" tab
3. Click "Choose File" and select: `scripts/01-create-ipm-database.sql`
4. Click "Go"
5. Verify all tables are created successfully
6. Repeat steps 2-4 for `scripts/02-populate-ipm-data.sql`

### Step 4: Verify Database Structure

In phpMyAdmin, verify these tables exist:

- utilizadores (users)
- alunos (students)
- professores (teachers)
- encarregados (parents/guardians)
- cursos (courses)
- disciplinas (subjects)
- turmas (classes)
- notas (grades)
- boletins (report cards)
- mensagens (messages)
- avisos (announcements)
- horarios (schedules)
- aulas (classes with assignments)

### Step 5: Create API User (Optional but Recommended)

For security in production, create a dedicated user:

```sql
CREATE USER 'ipm_app'@'localhost' IDENTIFIED BY 'secure_password_123';
GRANT ALL PRIVILEGES ON ipm_maiombe.* TO 'ipm_app'@'localhost';
FLUSH PRIVILEGES;
```

Then update database configuration to use this user.

## Backend Configuration

### Database Connection String

For XAMPP with default settings:

```
mysql://root:@localhost:3306/ipm_maiombe
```

### Two Programs Supported

The system is configured for two academic programs:

1. **Contabilidade (Accounting)**
   - Years: 10°, 11°, 12° (3 years)
   - Subjects available per year

2. **Informática de Gestão (IT Management)**
   - Years: 10°, 11°, 12° (3 years)
   - Subjects available per year

## Demo Accounts

For testing the system:

### Student Account
- Email: joao.silva@aluno.ipMaiombe.ao
- Password: aluno123
- Course: Informática de Gestão (Year 3)

### Teacher Account
- Email: maria.santos@ipMaiombe.ao
- Password: prof123
- Department: Ciências e Tecnologia

### Admin Account
- Email: admin@ipMaiombe.ao
- Password: admin123

## API Endpoints

### Courses
```
GET /api/cursos
Returns list of available courses
```

### Disciplines
```
GET /api/disciplinas?ano=1&curso=contabilidade
GET /api/disciplinas?ano=1&curso=informatica
Returns disciplines for specified year and course
```

### Authentication
```
POST /api/auth/login
Body: { email, password, tipo }
Returns user data if credentials valid
```

## Troubleshooting

### "Can't connect to MySQL server"
- Check MySQL is running in XAMPP
- Verify port 3306 is not blocked
- Check MySQL config in XAMPP

### "Database not found"
- Verify database was created in phpMyAdmin
- Check database name spelling: ipm_maiombe
- Ensure SQL scripts were imported successfully

### Tables missing
- Go to phpMyAdmin → ipm_maiombe → click Import
- Select 01-create-ipm-database.sql
- Click Go
- Then repeat for 02-populate-ipm-data.sql

## Frontend Connection

The Next.js frontend automatically uses:
- Localhost environment for development
- API endpoints at `/api/*`
- Demo accounts for authentication testing

For production deployment, update:
1. Database credentials in environment variables
2. API endpoints to production server
3. Add proper authentication and security

## File Locations

- Database scripts: `/scripts/` folder
- API routes: `/app/api/` folder
- Mock data: `/lib/mock-data.ts`

## Next Steps

1. ✅ Database created and populated
2. ✅ API routes configured
3. ⭕ Connect Node.js app to real database (update `/app/api` to use mysql2/promise)
4. ⭕ Update mock data with real queries
5. ⭕ Implement proper authentication with sessions
6. ⭕ Add role-based access control (RBAC)
7. ⭕ Implement data validation and error handling

## Notes

- Current API routes use mock data for demo
- Replace with actual MySQL queries using mysql2/promise package
- Add prepared statements to prevent SQL injection
- Implement proper error handling and logging
- Consider caching frequently accessed data
