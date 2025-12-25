#!/bin/sh
# Database initialization entrypoint script
# Runs migrations and seed data automatically on container startup

set -e

echo "🔄 Starting database initialization..."

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" 2>/dev/null; do
  echo "  Database not ready, waiting..."
  sleep 2
done

echo "✅ Database is ready!"

# Run migrations
echo "📦 Running migrations..."
for migration in /migrations/*.sql; do
  if [ -f "$migration" ]; then
    echo "  Applying: $(basename "$migration")"
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$migration" > /dev/null
  fi
done
echo "✅ Migrations completed!"

# Run seed data
echo "🌱 Running seed data..."
if [ -f /seeds/seed_data.sql ]; then
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /seeds/seed_data.sql > /dev/null
  echo "✅ Seed data loaded!"
else
  echo "⚠️  Seed data file not found, skipping..."
fi

echo "🎉 Database initialization complete!"
echo ""

# Start the application
echo "🚀 Starting application..."
exec node dist/server.js
