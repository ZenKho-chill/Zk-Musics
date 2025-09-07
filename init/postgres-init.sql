-- PostgreSQL initialization script
-- This script runs only once when the database is first created

-- Create user zkmusic with password
CREATE USER zkmusic WITH PASSWORD 'zkmusic123';

-- Grant all privileges on database zkmusic to user zkmusic
GRANT ALL PRIVILEGES ON DATABASE zkmusic TO zkmusic;

-- Grant all privileges on schema public to user zkmusic
GRANT ALL ON SCHEMA public TO zkmusic;

-- Grant all privileges on all tables in schema public to user zkmusic
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO zkmusic;

-- Grant all privileges on all sequences in schema public to user zkmusic
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO zkmusic;
