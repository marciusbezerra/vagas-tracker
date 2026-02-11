#!/bin/sh
set -e

# Default DB file path: /data/dev.db (volume
DB_PATH=${DATABASE_URL:-file:/data/dev.db}

# If MIGRATE=1 environment variable set, try to apply migrations in production
if [ "${MIGRATE}" = "1" ] || [ "${MIGRATE}" = "true" ]; then
  echo "🔧 Checking database connection..."
  STATUS_OUTPUT=$(npx prisma migrate status 2>&1 || true)
  echo "$STATUS_OUTPUT"
  if ! npx prisma migrate status >/dev/null 2>&1; then
    echo "❌ prisma migrate status failed. Exiting."
    exit 1
  fi

  echo "🔧 Running Prisma migrations..."
  if ! npx prisma migrate deploy; then
    echo "❌ Failed to run migrations. Exiting."
    exit 1
  fi
  echo "✅ Migrations applied."

  echo "🔧 Generating Prisma client..."
  npx prisma generate
fi

# Start the app on the configured port
echo "🚀 Starting app on port ${PORT:-3001}"
exec npm run start -- -p ${PORT:-3001}
