#!/bin/bash

# Wait for SQL Server to be ready
echo "Waiting for SQL Server to start..."
sleep 20s

# Create database if it doesn't exist
echo "Creating softball database if it doesn't exist..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'softball') CREATE DATABASE softball"

echo "Database initialization complete"
