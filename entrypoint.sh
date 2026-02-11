#!/bin/sh
set -e

# Default DB file path: /data/dev.db (volume
DB_PATH=${DATABASE_URL:-file:/data/dev.db}

# If MIGRATE=1 environment variable set, try to apply migrations in production
if [ "${MIGRATE}" = "1" ] || [ "${MIGRATE}" = "true" ]; then
  # Ensure DATABASE_URL is set (fall back to DB_PATH if provided)
  export DATABASE_URL=${DATABASE_URL:-$DB_PATH}
  if [ -z "${DATABASE_URL}" ]; then
    echo "❌ DATABASE_URL is not set. Migrations require DATABASE_URL. Exiting."
    exit 1
  fi

  echo "🔧 Waiting for database to be ready..."
  n=0
  until npx prisma migrate status >/dev/null 2>&1 || [ $n -ge 30 ]; do
    n=$((n+1))
    echo "Waiting DB ($n/30)..."
    sleep 1
  done

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
