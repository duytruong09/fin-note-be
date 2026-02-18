#!/bin/sh
# Render migration script
# This script runs migrations with direct connection, then starts app with pooler

set -e

echo "🔍 Checking environment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "✅ DATABASE_URL is set"

# For migrations, we need direct connection (port 5432)
# Replace pooler port 6543 with direct port 5432 and remove pgbouncer flag
MIGRATION_URL=$(echo $DATABASE_URL | sed 's/:6543\//:5432\//g' | sed 's/&pgbouncer=true//g' | sed 's/?pgbouncer=true&/?/g')

echo "🔄 Running migrations with direct connection..."
DATABASE_URL="$MIGRATION_URL" npx prisma migrate deploy

echo "✅ Migrations completed successfully"

echo "🚀 Starting application with pooler connection..."
# Start the app with the original DATABASE_URL (pooler)
exec node dist/main
