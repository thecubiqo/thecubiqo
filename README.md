# Web Portal Admin

A Next.js 16 admin panel for managing multi-tenant website deployments with custom domains, SSL certificates, and NGINX reverse proxy configuration.

## Features

- **Domain Management** - Register and manage custom domains with DNS instructions
- **Template System** - Create and manage website templates for deployments
- **Automated Deployments** - Full deployment pipeline: config → build → Nginx → SSL
- **SSL Certificates** - Automatic SSL via Certbot/Let's Encrypt
- **NGINX Configuration** - Auto-generated reverse proxy configs with HTTP/2 support
- **Google Analytics** - Per-domain analytics integration
- **Cubiqo Generator** - Custom content generation tool
- **File Uploads** - Image, video, and logo uploads for deployments
- **PM2 Process Management** - Production-ready server management

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: MySQL with Prisma ORM
- **Process Manager**: PM2
- **Web Server**: NGINX
- **SSL**: Let's Encrypt with Certbot
- **Charts**: Recharts
- **Validation**: Zod

## Project Structure

```
webportal/
├── admin/                    # Next.js admin panel
│   ├── prisma/               # Database schema
│   │   └── schema.prisma     # Prisma models (Domain, Template, Deployment, etc.)
│   ├── scripts/              # Utility scripts
│   │   ├── setup-env.js      # Environment setup
│   │   ├── debug-deploy.ts   # Deployment debugger
│   │   └── fix-paths.ts      # Path correction utility
│   └── src/
│       ├── app/
│       │   ├── (dashboard)/  # Dashboard pages
│       │   │   ├── analytics/
│       │   │   ├── cubiqo-generator/
│       │   │   ├── deployments/
│       │   │   ├── domains/
│       │   │   ├── settings/
│       │   │   └── templates/
│       │   ├── api/          # API routes
│       │   │   ├── auth/     # Authentication
│       │   │   ├── build/    # Build triggers
│       │   │   ├── deployments/
│       │   │   ├── domains/
│       │   │   ├── nginx/
│       │   │   ├── regions/
│       │   │   ├── settings/
│       │   │   ├── ssl/
│       │   │   ├── templates/
│       │   │   ├── upload/
│       │   │   ├── uploads/
│       │   │   └── worlds/
│       │   └── login/
│       ├── components/       # Reusable UI components
│       └── lib/              # Core business logic
│           ├── auth.ts       # Authentication
│           ├── build.ts      # Build orchestration
│           ├── certbot.ts    # SSL certificate management
│           ├── db.ts         # Database connection
│           ├── deployment.ts # Deployment orchestration
│           ├── env.ts        # Environment configuration
│           ├── nginx.ts      # NGINX config generation
│           ├── settings.ts   # App settings
│           ├── template-builder.ts
│           ├── template-config-schema.ts
│           └── template-scaffold.ts
└── data/
    └── templates/            # Website templates
        └── template1/        # Example template
```

## Database Models

| Model | Description |
|-------|-------------|
| **Domain** | Custom domains with status (PENDING, ACTIVE, DEPLOYED) and GA tracking |
| **Template** | Website templates with paths and descriptions |
| **Deployment** | Connects domains to templates, tracks build status and ports |
| **TemplateConfig** | JSON configuration for each deployment |
| **Upload** | Uploaded files (images, videos, logos) |
| **Setting** | Key-value app settings (e.g., Certbot email) |
| **Region** | Region-specific configurations |
| **World** | World/locale configurations |

## Setup

### Prerequisites

- Node.js 18+
- MySQL database
- NGINX (for production)
- Certbot (for SSL)
- PM2 (for process management)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd webportal/admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:
   ```env
   DB_USER="your_user"
   DB_PASS="your_password"
   DB_NAME="webportal"
   DB_HOST="localhost"
   
   UPLOADS_DIR=/path/to/uploads
   DEPLOYMENTS_DIR=/path/to/deployments
   TEMPLATES_DIR=/path/to/templates
   
   NGINX_CONFIG_DIR=/etc/nginx/sites-available
   NGINX_ENABLED_DIR=/etc/nginx/sites-enabled
   
   NEXT_PUBLIC_API_URL=http://localhost:3000
   PORT=3000
   BASE_DEPLOYMENT_PORT=3001
   ```

4. **Setup database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start with PM2**
   ```bash
   pm2 start npm --name "webportal-admin" -- start
   ```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run setup:env` | Setup environment variables |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Prisma Studio |

## Deployment Workflow

The deployment process follows these stages:

```
1. CONFIG    → Validate and prepare configuration
2. BUILD     → Build Next.js standalone output
3. NGINX     → Generate and apply NGINX config
4. SSL       → Obtain SSL certificate (optional)
5. START     → Start deployment via PM2
```

Each deployment runs on a unique port and is proxied through NGINX.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user info

### Domains
- `GET /api/domains` - List all domains
- `POST /api/domains` - Create domain
- `GET /api/domains/[id]` - Get domain
- `PUT /api/domains/[id]` - Update domain
- `DELETE /api/domains/[id]` - Delete domain

### Templates
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create template
- `GET /api/templates/[id]` - Get template
- `PUT /api/templates/[id]` - Update template

### Deployments
- `GET /api/deployments` - List deployments
- `POST /api/deployments` - Create deployment
- `GET /api/deployments/[id]` - Get deployment
- `PUT /api/deployments/[id]` - Update deployment
- `DELETE /api/deployments/[id]` - Delete deployment
- `POST /api/deployments/[id]/config` - Update config
- `POST /api/deployments/[id]/deploy` - Trigger deployment

### Build & SSL
- `POST /api/build` - Trigger build
- `POST /api/ssl` - Enable SSL

### Uploads
- `POST /api/upload` - Upload file
- `GET /api/uploads/[...path]` - Serve uploaded file

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

### Regions & Worlds
- `GET /api/regions` - List regions
- `PUT /api/regions/[id]` - Update region
- `GET /api/worlds` - List worlds
- `PUT /api/worlds/[id]` - Update world

## Dashboard Pages

| Page | Path | Description |
|------|------|-------------|
| Domains | `/domains` | Manage custom domains |
| Templates | `/templates` | Manage website templates |
| Deployments | `/deployments` | Manage and trigger deployments |
| Cubiqo Generator | `/cubiqo-generator` | Content generation tool |
| Analytics | `/analytics` | Google Analytics dashboard |
| Settings | `/settings` | Application settings |

## NGINX Configuration

Auto-generated NGINX configs include:
- HTTP to HTTPS redirect (when SSL enabled)
- Reverse proxy to Next.js standalone server
- WebSocket support for hot reloading
- Static file caching with `Cache-Control` headers
- HTTP/2 support

## SSL Certificates

SSL certificates are obtained via Certbot with the `--nginx` plugin:
- Automatic certificate renewal
- Standard Let's Encrypt paths: `/etc/letsencrypt/live/<domain>/`
- Certificate expiration checking

## License

Private - All Rights Reserved
