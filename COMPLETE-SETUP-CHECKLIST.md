
🎯 PHASE 1: PRODUCTION DEPLOYMENT (DO THIS FIRST)

[ ] 1. TRIGGER VERCEL DEPLOYMENT:
    • Go to: https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo
    • Click "Deployments"
    • Find latest commit (47185c1 or similar)
    • Click "Redeploy" or "Trigger Deployment"

[ ] 2. ADD SUPABASE KEYS TO VERCEL:
    • Go to: https://app.supabase.com/project/naoxezcmcauecawchgjk/settings/api
    • Copy: NEXT_PUBLIC_SUPABASE_URL (already have: https://naoxezcmcauecawchgjk.supabase.co)
    • Copy: NEXT_PUBLIC_SUPABASE_ANON_KEY
    • Copy: SUPABASE_SERVICE_ROLE_KEY
    • Add to Vercel Environment Variables

[ ] 3. ADD REQUIRED API KEYS TO VERCEL:
    • OpenAI API Key: https://platform.openai.com/api-keys
    • Anthropic API Key: https://console.anthropic.com/
    • ElevenLabs API Key: https://elevenlabs.io/app/settings/api-keys
    • Resend API Key: https://resend.com/api-keys
    • Stripe Keys: https://dashboard.stripe.com/apikeys

🎯 PHASE 2: SOCIAL ARMY RAILWAY DEPLOYMENT

[ ] 1. CREATE RAILWAY PROJECT:
    • Go to: https://railway.app/new
    • Click "Deploy from GitHub repo"
    • Select: thecubiqo/thecubiqo
    • Branch: main
    • Root Directory: social-army

[ ] 2. GET GFXTOOLZ CREDENTIALS:
    • Sign up at: https://gfx.toolz/
    • Get username and password

[ ] 3. GET SOCIAL MEDIA API KEYS (start with Twitter):
    • Twitter/X: https://developer.twitter.com/en/portal/projects-and-apps
    • Get: API Key, API Secret, Access Token, Access Secret

[ ] 4. ADD TO RAILWAY VARIABLES:
    • SOCIAL_ARMY_STATUS=ON
    • GFX_TOOLZ_USER=your_username
    • GFX_TOOLZ_PASS=your_password
    • Twitter API credentials
    • Same Supabase keys as Vercel

[ ] 5. DEPLOY AND TEST:
    • Railway will auto-deploy
    • Check logs for errors
    • Test at: https://cubiqo.ai/admin/social-army

🎯 PHASE 3: ENHANCEMENTS & OPTIMIZATION

[ ] 1. ADDITIONAL AI PROVIDERS:
    • Groq API: https://console.groq.com/keys
    • Google AI: https://makersuite.google.com/app/apikey
    • OpenRouter: https://openrouter.ai/keys

[ ] 2. E-COMMERCE INTEGRATIONS:
    • Shopify Store: Create store and get API keys
    • Printify: https://developers.printify.com/

[ ] 3. OAUTH INTEGRATIONS:
    • GitHub OAuth: https://github.com/settings/developers
    • Vercel OAuth: https://vercel.com/account/tokens

[ ] 4. MONITORING & ANALYTICS:
    • Sentry: https://sentry.io/ (error tracking)
    • Logtail: https://logtail.com/ (logging)

⏱️  ESTIMATED TIMELINE:
• Phase 1: 2-3 hours
• Phase 2: 1-2 hours  
• Phase 3: 1-2 days
• Total: 1-3 days

🎯 SUCCESS METRICS:
• ✅ Production site loads without errors
• ✅ EnergyCube animations work
• ✅ FoundersPass login works (PIN: 2026)
• ✅ Social Army running on Railway
• ✅ Content generation and posting works
• ✅ All core features functional
