#!/bin/sh
set -e

# Default DB file path: /data/dev.db (volume
DB_PATH=${DATABASE_URL:-file:/data/dev.db}

# If MIGRATE=1 environment variable set, try to apply migrations in production
if [ "${MIGRATE}" = "1" ] || [ "${MIGRATE}" = "true" ]; then
  echo "🔧 Running Prisma migrations..."
  # Ensure prisma binary is available via node_modules
  npx prisma migrate deploy || {
    echo "⚠️ Failed to run migrations; continue starting anyway"
  }
fi

# Start the app on the configured port
echo "🚀 Starting app on port ${PORT:-3001}"
exec npm run start -- -p ${PORT:-3001}
