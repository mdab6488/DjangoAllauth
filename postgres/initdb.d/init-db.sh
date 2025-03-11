#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "hstore";
    
    -- Ensure the database is owned by postgres
    ALTER DATABASE $POSTGRES_DB OWNER TO postgres;
    
    -- Ensure privileges are granted
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO postgres;
    GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
EOSQL

# Set proper permissions for the script
chmod -R 755 /docker-entrypoint-initdb.d/