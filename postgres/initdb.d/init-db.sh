#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "hstore";
    
    -- Grant privileges to the actual database user
    ALTER DATABASE $POSTGRES_DB OWNER TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON SCHEMA public TO $POSTGRES_USER;
EOSQL