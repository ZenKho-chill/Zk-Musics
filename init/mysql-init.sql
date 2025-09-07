-- MySQL initialization script
-- This script runs only once when the database is first created

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS zkmusic;

-- Create user zkmusic with password (for any host)
CREATE USER IF NOT EXISTS 'zkmusic'@'%' IDENTIFIED BY 'zkmusic123';

-- Grant all privileges on zkmusic database to user zkmusic
GRANT ALL PRIVILEGES ON zkmusic.* TO 'zkmusic'@'%';

-- Flush privileges to ensure changes take effect
FLUSH PRIVILEGES;

-- Select the zkmusic database
USE zkmusic;

-- Log successful initialization
SELECT 'MySQL user "zkmusic" created successfully for database "zkmusic"' AS message;
