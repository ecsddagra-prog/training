# Serverless Migration Guide

## Changes Made

### 1. Architecture
- **Before**: Separate Express.js server + Next.js client
- **After**: Single Next.js project with API routes

### 2. API Routes Migration
- `server/src/routes/auth.js` → `client/api/auth/`
- `server/src/routes/admin.js` → `client/api/admin/`
- `server/src/routes/contributor.js` → `client/api/contributor/`
- `server/src/routes/employee.js` → `client/api/employee/`
- `server/src/routes/exam.js` → `client/api/exam/`

### 3. Dependencies
Added to client package.json:
- bcrypt (password hashing)
- jsonwebtoken (JWT auth)
- multer (file uploads)
- xlsx (Excel processing)
- pdfkit (certificate generation)
- qrcode (QR code generation)

### 4. Environment Variables
Updated `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
```

### 5. API Client Updates
- Changed base URL from external server to `/api`
- All existing API calls work without modification

## Deployment Steps

1. **Install dependencies**:
   ```bash
   cd client
   npm install
   ```

2. **Set environment variables**:
   ```bash
   cp .env.example .env.local
   # Add your Supabase credentials
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

4. **Set Vercel environment variables**:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY  
   - SUPABASE_SERVICE_ROLE_KEY
   - JWT_SECRET

## Benefits

✅ **Single deployment** - No separate backend server
✅ **Cost effective** - Serverless functions scale to zero
✅ **Simplified architecture** - One codebase to maintain
✅ **Auto-scaling** - Handles traffic spikes automatically
✅ **Global CDN** - Fast worldwide performance
✅ **Zero maintenance** - No server management needed

## File Structure
```
client/
├── api/                    # Serverless API routes
│   ├── auth/
│   ├── admin/
│   ├── contributor/
│   ├── employee/
│   └── exam/
├── app/                    # Next.js pages
├── lib/                    # Utilities
│   ├── supabase.js        # Database client
│   └── auth.js            # Auth middleware
└── components/            # React components
```