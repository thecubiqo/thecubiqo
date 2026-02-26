
# QUICK START COMMANDS

## 1. Check Current Deployment Status:
curl -I https://www.cubiqo.ai

## 2. Trigger Vercel Deployment (if needed):
# Go to: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo
# Click "Deployments" → "Redeploy"

## 3. Generate More Encryption Keys (if needed):
node -e "console.log('ENCRYPTION_KEY:', require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('CRON_SECRET:', require('crypto').randomBytes(32).toString('hex'))"

## 4. Check Social Army Status:
# After Railway deployment
curl https://your-railway-app.up.railway.app/health

## 5. Test Core Features:
# 1. Open: https://cubiqo.ai
# 2. Check EnergyCube animations
# 3. Go to: https://www.cubiqo.ai/founderspass
# 4. Enter PIN: 2026
# 5. Test chat functionality
# 6. Test code panel: https://cubiqo.ai/demo

## 6. Monitor Logs:
# Vercel logs: Dashboard → Deployments → Logs
# Railway logs: Dashboard → Service → Logs
# Supabase logs: Dashboard → Logs
