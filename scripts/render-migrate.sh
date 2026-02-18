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

# Check if using pooler or direct connection
if echo "$DATABASE_URL" | grep -q "6543"; then
  echo "🔄 Using pooler connection for migrations (session mode)..."
  # Pooler with session mode works for migrations
  # Just ensure pgbouncer=true is NOT set (or use session mode)
  MIGRATION_URL=$(echo $DATABASE_URL | sed 's/&pgbouncer=true//g' | sed 's/?pgbouncer=true&/?/g')
else
  echo "🔄 Using direct connection for migrations..."
  MIGRATION_URL="$DATABASE_URL"
fi

echo "📊 Migration URL (host hidden for security)"
DATABASE_URL="$MIGRATION_URL" npx prisma migrate deploy

echo "✅ Migrations completed successfully"

echo "🚀 Starting application with pooler connection..."
# Start the app with the original DATABASE_URL (pooler)
exec node dist/main
