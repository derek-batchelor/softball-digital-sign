# Quick Start: SQL Server Testing

## Local Testing with Docker

1. **Install dependencies**:

   ```powershell
   cd c:\Users\derek\Documents\Repos\softball-digital-sign
   npm install
   ```

2. **Start everything**:

   ```powershell
   docker-compose up --build
   ```

3. **Test**:
   - API: http://localhost:3000/api/signage/active
   - Frontend: http://localhost

4. **Stop**:
   ```powershell
   docker-compose down
   ```

## Azure Deployment

1. **Set SQL password** in `infra/environments/dev.bicepparam`:

   ```bicep
   param sqlAdminPassword = 'YourStrongP@ssw0rd123!'
   ```

2. **Deploy**:

   ```powershell
   az deployment group create `
     --resource-group softball-dev-rg `
     --template-file infra/main.bicep `
     --parameters infra/environments/dev.bicepparam
   ```

3. **Push code** to trigger workflows or manually deploy with GitHub Actions

## What Changed

### Infrastructure (infra/main.bicep)

- ✅ Added Azure SQL Server (serverless tier)
- ✅ Added SQL Database `softball` (2GB, auto-pause after 60 min)
- ✅ Removed data file share (database in cloud now)
- ✅ Updated Container App to use DATABASE_URL secret
- ✅ Increased maxReplicas to 10 (no more locking!)

### Backend (src/server)

- ✅ Updated app.module.ts to support both SQLite and SQL Server
- ✅ Added mssql package dependency
- ✅ Updated .env.example with DATABASE_URL

### Docker (docker-compose.yml)

- ✅ Added SQL Server 2022 service
- ✅ Updated backend to connect to SQL Server
- ✅ Removed SQLite data volume

### Parameters (infra/environments/dev.bicepparam)

- ✅ Added sqlAdminUsername
- ✅ Added sqlAdminPassword

## Next Steps

1. **Test locally first**: Run `docker-compose up --build`
2. **Set SQL password**: Update `dev.bicepparam`
3. **Deploy to Azure**: Run the deployment command above
4. **Verify**: Check Container App logs for successful connection

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions and troubleshooting.
