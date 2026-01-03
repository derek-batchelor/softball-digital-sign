-- Initialize SQL Server database for Softball Digital Sign
-- This script creates the database if it doesn't exist
-- TypeORM will automatically create tables based on entities

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'softball')
BEGIN
    CREATE DATABASE softball;
    PRINT 'Database [softball] created successfully.';
END
ELSE
BEGIN
    PRINT 'Database [softball] already exists.';
END
GO

USE softball;
GO

PRINT 'Database initialization complete. TypeORM will create tables automatically.';
GO
