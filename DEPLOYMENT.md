# Deployment Guide

## Overview

This guide covers deploying Cubiqo to various environments. Choose the deployment method that best fits your needs.

## 🚀 Quick Deployment (Vercel)

### 1. One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thecubiqo/thecubiqo)

### 2. Manual Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### 3. Environment Variables
Set these in Vercel project settings:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# Other
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
```

## 🐳 Docker Deployment

### 1. Build Docker Image
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

### 2. Build and Run
```bash
# Build image
docker build -t cubiqo .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  cubiqo
```

### 3. Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  cubiqo:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped
```

## ☁️ Cloud Providers

### AWS (Elastic Beanstalk)
```bash
# Initialize EB
eb init -p node.js cubiqo-app

# Create environment
eb create cubiqo-prod

# Deploy
eb deploy
```

### Google Cloud Run
```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT_ID/cubiqo

# Deploy to Cloud Run
gcloud run deploy cubiqo \
  --image gcr.io/PROJECT_ID/cubiqo \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure App Service
```bash
# Create web app
az webapp up \
  --name cubiqo-app \
  --runtime "NODE:18-lts" \
  --sku B1
```

## 🏗️ Manual Deployment

### 1. Server Requirements
- **Node.js:** 18.x or higher
- **npm:** 8.x or higher
- **Memory:** 1GB minimum (2GB recommended)
- **Storage:** 10GB minimum

### 2. Installation Steps
```bash
# Clone repository
git clone https://github.com/thecubiqo/thecubiqo.git
cd thecubiqo

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL=your-url
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
# ... other variables

# Start production server
npm start
```

### 3. Process Manager (PM2)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "cubiqo" -- start

# Save process list
pm2 save

# Set up startup script
pm2 startup
```

## 🔧 Environment Configuration

### Required Variables
```env
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
OPENAI_API_KEY=sk-...

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-with: openssl rand -base64 32

# Optional
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### Environment-Specific Configs
Create these files:
- `.env.local` - Local development
- `.env.production` - Production
- `.env.staging` - Staging

## 📊 Database Setup

### 1. Supabase Setup
1. Create new project at [supabase.com](https://supabase.com)
2. Run migrations:
```bash
# Apply migrations
npx supabase db push
```

### 2. Required Extensions
Enable these in Supabase SQL editor:
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## 🔐 Security Configuration

### 1. SSL/TLS
- Use Let's Encrypt for free certificates
- Configure automatic renewal
- Force HTTPS redirects

### 2. Firewall Rules
```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### 3. Security Headers
Configure in `next.config.js`:
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  }
];
```

## 📈 Monitoring & Logging

### 1. Application Monitoring
- **Sentry:** Error tracking
- **LogRocket:** Session replay
- **Datadog:** Performance monitoring

### 2. Server Monitoring
- **New Relic:** Application performance
- **Prometheus + Grafana:** Metrics dashboard
- **Uptime Robot:** Availability monitoring

### 3. Log Management
```bash
# View PM2 logs
pm2 logs cubiqo

# Log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 🚨 Disaster Recovery

### 1. Backup Strategy
```bash
# Database backup (Supabase)
# Use Supabase dashboard or API

# File backup
tar -czf backup-$(date +%Y%m%d).tar.gz /path/to/app
```

### 2. Rollback Procedure
```bash
# Revert to previous deployment
vercel --prod --rollback

# Or deploy specific version
vercel --prod --target=previous-deployment-id
```

### 3. Incident Response
1. **Identify:** Check monitoring alerts
2. **Contain:** Isolate affected components
3. **Resolve:** Apply fixes
4. **Recover:** Restore service
5. **Learn:** Post-mortem analysis

## 📝 Maintenance

### Regular Tasks
- **Daily:** Check error logs and monitoring
- **Weekly:** Review performance metrics
- **Monthly:** Update dependencies
- **Quarterly:** Security audit

### Dependency Updates
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update with breaking changes review
npm install package@latest
```

## 🆘 Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check logs
pm2 logs cubiqo --lines 100

# Check port usage
sudo lsof -i :3000

# Check memory
free -h
```

#### 2. Database Connection Issues
- Verify Supabase URL and keys
- Check network connectivity
- Verify database migrations applied

#### 3. Build Failures
```bash
# Clear cache
rm -rf .next node_modules

# Reinstall
npm ci

# Rebuild
npm run build
```

### Getting Help
1. Check application logs
2. Review error messages
3. Search existing issues
4. Contact support

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Docker Documentation](https://docs.docker.com/)

---

**Last Updated:** 2026-02-19  
**Deployment Version:** 1.0.0