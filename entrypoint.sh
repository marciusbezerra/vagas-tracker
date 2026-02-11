#!/bin/sh
set -e

# Default DB file path: /data/dev.db (volume
DB_PATH=${DATABASE_URL:-file:/data/dev.db}

# If MIGRATE=1 environment variable set, try to apply migrations in production
if [ "${MIGRATE}" = "1" ] || [ "${MIGRATE}" = "true" ]; then
  echo "🔧 Checking database connection..."
  STATUS_OUTPUT=$(npx prisma migrate status 2>&1 || true)
  echo "$STATUS_OUTPUT"

  # If status reports unapplied migrations or status command failed, try to deploy
  if echo "$STATUS_OUTPUT" | grep -q "Following migration have not yet been applied" || ! npx prisma migrate status >/dev/null 2>&1; then
    echo "🔧 Applying pending migrations with prisma migrate deploy..."
    DEPLOY_OUTPUT=$(npx prisma migrate deploy 2>&1 || true)
    echo "$DEPLOY_OUTPUT"
    if echo "$DEPLOY_OUTPUT" | grep -q "error" || echo "$DEPLOY_OUTPUT" | grep -q "Error"; then
      echo "❌ prisma migrate deploy failed. Exiting."
      exit 1
    fi
    echo "✅ Migrations applied."
  else
    echo "✅ No pending migrations."
  fi

  echo "🔧 Generating Prisma client..."
  npx prisma generate
fi

# Start the app on the configured port
echo "🚀 Starting app on port ${PORT:-3001}"
exec npm run start -- -p ${PORT:-3001}
