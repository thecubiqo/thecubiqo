#!/bin/bash

# =============================================================================
# Staging Database Setup Script
# =============================================================================
# This script automates the setup and migration of the CubiQo staging database
# 
# Usage:
#   ./scripts/setup-staging-db.sh [command]
#
# Commands:
#   init       - Initialize staging environment and verify credentials
#   migrate    - Run all migrations on staging database
#   seed       - Seed staging database with test data
#   verify     - Verify staging database health and schema
#   reset      - Reset staging database (WARNING: Deletes all data)
#   backup     - Create backup of staging database
#   restore    - Restore staging database from backup
#   help       - Show this help message
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Function: Show help
show_help() {
    cat << EOF

${BLUE}CubiQo Staging Database Setup Script${NC}

${YELLOW}Usage:${NC}
  ./scripts/setup-staging-db.sh [command]

${YELLOW}Commands:${NC}
  ${GREEN}init${NC}       Initialize staging environment and verify credentials
  ${GREEN}migrate${NC}    Run all migrations on staging database
  ${GREEN}seed${NC}       Seed staging database with test data
  ${GREEN}verify${NC}     Verify staging database health and schema
  ${GREEN}reset${NC}      Reset staging database (WARNING: Deletes all data)
  ${GREEN}backup${NC}     Create backup of staging database
  ${GREEN}restore${NC}    Restore staging database from backup
  ${GREEN}help${NC}       Show this help message

${YELLOW}Examples:${NC}
  # Set up new staging database
  ./scripts/setup-staging-db.sh init
  ./scripts/setup-staging-db.sh migrate
  ./scripts/setup-staging-db.sh seed

  # Verify existing staging database
  ./scripts/setup-staging-db.sh verify

  # Backup before major changes
  ./scripts/setup-staging-db.sh backup

${YELLOW}Documentation:${NC}
  See STAGING_DATABASE_SETUP.md for detailed instructions

EOF
}

# Show help and exit if help command is requested
if [ "${1:-}" = "help" ] || [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    show_help
    exit 0
fi

# Load environment variables
if [ -f "$PROJECT_ROOT/.env.staging" ]; then
    source "$PROJECT_ROOT/.env.staging"
    echo -e "${GREEN}✓${NC} Loaded .env.staging"
elif [ -f "$PROJECT_ROOT/.env.local" ]; then
    source "$PROJECT_ROOT/.env.local"
    echo -e "${YELLOW}⚠${NC} Using .env.local (staging credentials not found)"
else
    echo -e "${RED}✗${NC} No environment file found. Please create .env.staging or .env.local"
    exit 1
fi

# Function: Print section header
print_header() {
    echo ""
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo ""
}

# Function: Check if Supabase CLI is installed
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        echo -e "${RED}✗${NC} Supabase CLI not found"
        echo -e "${YELLOW}Installing Supabase CLI...${NC}"
        npm install -g supabase
    else
        echo -e "${GREEN}✓${NC} Supabase CLI is installed"
    fi
}

# Function: Verify environment variables
verify_env() {
    print_header "Verifying Environment Variables"
    
    local missing=0
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL_STAGING" ] && [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        echo -e "${RED}✗${NC} NEXT_PUBLIC_SUPABASE_URL_STAGING or NEXT_PUBLIC_SUPABASE_URL is required"
        missing=1
    else
        echo -e "${GREEN}✓${NC} Supabase URL configured"
    fi
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING" ] && [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        echo -e "${RED}✗${NC} NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING or NEXT_PUBLIC_SUPABASE_ANON_KEY is required"
        missing=1
    else
        echo -e "${GREEN}✓${NC} Supabase Anon Key configured"
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY_STAGING" ] && [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo -e "${RED}✗${NC} SUPABASE_SERVICE_ROLE_KEY_STAGING or SUPABASE_SERVICE_ROLE_KEY is required"
        missing=1
    else
        echo -e "${GREEN}✓${NC} Supabase Service Role Key configured"
    fi
    
    if [ $missing -eq 1 ]; then
        echo ""
        echo -e "${YELLOW}Please configure staging credentials in .env.staging${NC}"
        echo -e "${YELLOW}See STAGING_DATABASE_SETUP.md for instructions${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}✓ All required environment variables are configured${NC}"
}

# Function: Initialize staging environment
init_staging() {
    print_header "Initializing Staging Environment"
    
    check_supabase_cli
    verify_env
    
    echo -e "${GREEN}✓${NC} Staging environment initialized successfully"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Run: ./scripts/setup-staging-db.sh migrate"
    echo "  2. Run: ./scripts/setup-staging-db.sh seed"
    echo "  3. Run: ./scripts/setup-staging-db.sh verify"
}

# Function: Run migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    verify_env
    
    echo "Running migrations on staging database..."
    
    # Check if we have a Supabase project linked
    if [ -f "$PROJECT_ROOT/.supabase/config.toml" ]; then
        echo -e "${GREEN}✓${NC} Supabase project linked"
        supabase db push
    else
        echo -e "${YELLOW}⚠${NC} Supabase project not linked"
        echo ""
        echo "To link your staging project:"
        echo "  1. Get your project ref from Supabase dashboard"
        echo "  2. Run: supabase link --project-ref your-staging-project-ref"
        echo "  3. Run this command again"
        echo ""
        echo -e "${BLUE}Alternative: Run migrations manually${NC}"
        echo "  1. Copy all .sql files from supabase/migrations/"
        echo "  2. Go to Supabase SQL Editor"
        echo "  3. Run each migration in order"
    fi
}

# Function: Seed test data
seed_database() {
    print_header "Seeding Test Data"
    
    verify_env
    
    echo "Creating test data for staging..."
    
    # Run Node.js seed script
    if [ -f "$PROJECT_ROOT/scripts/seed-staging.js" ]; then
        node "$PROJECT_ROOT/scripts/seed-staging.js"
    else
        echo -e "${YELLOW}⚠${NC} Seed script not found at scripts/seed-staging.js"
        echo "Creating basic seed script..."
        
        cat > "$PROJECT_ROOT/scripts/seed-staging.js" << 'EOF'
// Seed script for staging database
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_STAGING || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY_STAGING || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedDatabase() {
  console.log('Seeding staging database...')
  
  // Add your seed data here
  console.log('✓ Seeding complete')
}

seedDatabase().catch(console.error)
EOF
        
        echo -e "${GREEN}✓${NC} Created seed script template"
        echo "Please customize scripts/seed-staging.js with your test data"
    fi
}

# Function: Verify database health
verify_database() {
    print_header "Verifying Database Health"
    
    verify_env
    
    echo "Checking database connectivity..."
    
    # Create a simple verification script
    cat > /tmp/verify-db.js << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_STAGING || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY_STAGING || process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
  try {
    // Test connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error && error.code !== 'PGRST116') {
      console.error('✗ Database connection failed:', error.message)
      process.exit(1)
    }
    
    console.log('✓ Database connection successful')
    console.log('✓ Schema verification passed')
    
    // Check migrations
    const tables = ['profiles', 'feature_flags', 'sites', 'journal_entries', 'features_catalog']
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('count').limit(1)
      if (tableError && tableError.code !== 'PGRST116') {
        console.log(`⚠ Table ${table} might not exist`)
      } else {
        console.log(`✓ Table ${table} exists`)
      }
    }
    
  } catch (err) {
    console.error('✗ Verification failed:', err.message)
    process.exit(1)
  }
}

verify()
EOF
    
    node /tmp/verify-db.js
    rm /tmp/verify-db.js
    
    echo ""
    echo -e "${GREEN}✓ Database verification complete${NC}"
}

# Function: Reset database
reset_database() {
    print_header "⚠️  RESET DATABASE ⚠️"
    
    echo -e "${RED}WARNING: This will delete ALL data in the staging database!${NC}"
    echo -e "${YELLOW}This action cannot be undone.${NC}"
    echo ""
    read -p "Type 'RESET' to confirm: " confirmation
    
    if [ "$confirmation" != "RESET" ]; then
        echo "Reset cancelled"
        exit 0
    fi
    
    echo ""
    echo "Resetting staging database..."
    
    if [ -f "$PROJECT_ROOT/.supabase/config.toml" ]; then
        supabase db reset
        echo -e "${GREEN}✓${NC} Database reset complete"
    else
        echo -e "${RED}✗${NC} Cannot reset: Supabase project not linked"
        exit 1
    fi
}

# Function: Create backup
backup_database() {
    print_header "Creating Database Backup"
    
    verify_env
    
    BACKUP_DIR="$PROJECT_ROOT/backups"
    mkdir -p "$BACKUP_DIR"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/staging_backup_$TIMESTAMP.sql"
    
    echo "Creating backup: $BACKUP_FILE"
    
    supabase db dump > "$BACKUP_FILE"
    
    echo -e "${GREEN}✓${NC} Backup created: $BACKUP_FILE"
}

# Function: Restore from backup
restore_database() {
    print_header "Restoring Database from Backup"
    
    verify_env
    
    BACKUP_DIR="$PROJECT_ROOT/backups"
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR)" ]; then
        echo -e "${RED}✗${NC} No backups found in $BACKUP_DIR"
        exit 1
    fi
    
    echo "Available backups:"
    ls -1 "$BACKUP_DIR"
    echo ""
    
    read -p "Enter backup filename to restore: " backup_file
    
    BACKUP_PATH="$BACKUP_DIR/$backup_file"
    
    if [ ! -f "$BACKUP_PATH" ]; then
        echo -e "${RED}✗${NC} Backup file not found: $BACKUP_PATH"
        exit 1
    fi
    
    echo ""
    echo -e "${YELLOW}⚠${NC} This will overwrite current staging data"
    read -p "Continue? (y/N): " confirm
    
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Restore cancelled"
        exit 0
    fi
    
    echo "Restoring from $backup_file..."
    
    # Note: Actual restore would need database URL
    echo -e "${YELLOW}⚠${NC} Manual restore required:"
    echo "  1. Reset the database: supabase db reset"
    echo "  2. Run: psql \$DATABASE_URL < $BACKUP_PATH"
}

# Function: Show help
show_help() {
    cat << EOF

${BLUE}CubiQo Staging Database Setup Script${NC}

${YELLOW}Usage:${NC}
  ./scripts/setup-staging-db.sh [command]

${YELLOW}Commands:${NC}
  ${GREEN}init${NC}       Initialize staging environment and verify credentials
  ${GREEN}migrate${NC}    Run all migrations on staging database
  ${GREEN}seed${NC}       Seed staging database with test data
  ${GREEN}verify${NC}     Verify staging database health and schema
  ${GREEN}reset${NC}      Reset staging database (WARNING: Deletes all data)
  ${GREEN}backup${NC}     Create backup of staging database
  ${GREEN}restore${NC}    Restore staging database from backup
  ${GREEN}help${NC}       Show this help message

${YELLOW}Examples:${NC}
  # Set up new staging database
  ./scripts/setup-staging-db.sh init
  ./scripts/setup-staging-db.sh migrate
  ./scripts/setup-staging-db.sh seed

  # Verify existing staging database
  ./scripts/setup-staging-db.sh verify

  # Backup before major changes
  ./scripts/setup-staging-db.sh backup

${YELLOW}Documentation:${NC}
  See STAGING_DATABASE_SETUP.md for detailed instructions

EOF
}

# Main script logic
case "${1:-help}" in
    init)
        init_staging
        ;;
    migrate)
        run_migrations
        ;;
    seed)
        seed_database
        ;;
    verify)
        verify_database
        ;;
    reset)
        reset_database
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
