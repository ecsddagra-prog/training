# Vercel Deployment via GitHub

## Steps:

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Serverless HR Exam System"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Vercel Setup
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. Environment Variables (Add in Vercel Dashboard)
```
NEXT_PUBLIC_SUPABASE_URL=https://cgpwrlclywbahahrcaov.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncHdybGNseXdiYWhhaHJjYW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE4MDAsImV4cCI6MjA3ODA4NzgwMH0.Tu-Vzoq93J67YM-3bqWPZq0vHi_6AWcYvgu3kwtltq4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncHdybGNseXdiYWhhaHJjYW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxMTgwMCwiZXhwIjoyMDc4MDg3ODAwfQ.r97D_QMgTtepBP3EaEL1kaIatH_gjBqhsws46lJDzT0
JWT_SECRET=6I17MFg37ELmfXmMiDg3tPZVXOUYZBUoAuBj8SqSJVheri5/y3wq9vn0xJKfZd9bJuTSlUl9cBBO8K7I4MfL2g==
```

### 4. Deploy
Click "Deploy" button

## Auto-Deploy
Har GitHub push pe automatically deploy hoga! 🚀