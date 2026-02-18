# Admin & Social Army Deployment Guide

## 1. Credentials Setup (REQUIRED)
You must set up the `.env.local` file with the following keys for the system to work:

```bash
# Social Army Auth
CUBIQO_ADMIN_USER=admin@cubiqo.ai
CUBIQO_ADMIN_PASS=secure_password

# GFXToolz API (For content generation)
GFX_TOOLZ_USER=av.loy07@gmail.com
GFX_TOOLZ_PASS=Antigravity26

# Social Platforms (Add your own)
TWITTER_USER=...
TIKTOK_USER=...
```

## 2. Infrastructure Deployment (Social Army Worker)
The Social Army runs as a separate Node.js process.
1.  **Clone Repo**: `git clone https://github.com/thecubiqo/thecubiqo.git`
2.  **Navigate**: `cd social-army`
3.  **Install**: `npm install`
4.  **Run**: `npm start` (This will start the 10-minute loop)

## 3. Web App Deployment (Vercel)
The main application (Admin Dashboard) is deployed via Vercel.
*   Push to `main` triggers auto-deployment.
*   Admin URL: `https://cubiqo.ai/admin`
*   Army Console: `https://cubiqo.ai/admin/social-army`
