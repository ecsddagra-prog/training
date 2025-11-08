# HR Training & Examination System (Serverless)

## Stack
- Frontend: Next.js 14 (App Router) + Tailwind CSS
- Backend: Next.js API Routes (Serverless)
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth + JWT
- Storage: Supabase Storage
- Deployment: Vercel (Single Project)

## Setup

### 1. Supabase Setup
1. Create account at https://supabase.com
2. Create new project
3. Copy Project URL and anon key
4. Run SQL migrations from `server/migrations/`

### 2. Project Setup
```bash
cd client
npm install
cp .env.example .env.local
# Add Supabase credentials and JWT secret
npm run dev
```

### 3. Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
```

## Deployment
```bash
cd client
vercel --prod
```

## API Routes (Serverless)
- `/api/auth/login` - User authentication
- `/api/auth/reset-password` - Password reset
- `/api/admin/*` - Admin functions
- `/api/contributor/*` - Contributor functions  
- `/api/employee/*` - Employee functions
- `/api/exam/*` - Exam operations

## Features
✅ Excel employee import
✅ Role-based access (Admin/Contributor/Employee)
✅ Forced password reset on first login
✅ Minimal server hits (3 per exam)
✅ Auto rank & certificate generation
✅ QR verification for certificates
✅ Serverless architecture (No separate backend needed)

## Migration from Server
The project has been converted to serverless architecture:
- Express.js routes → Next.js API routes
- Single deployment on Vercel
- No separate backend server required
- All functionality preserved