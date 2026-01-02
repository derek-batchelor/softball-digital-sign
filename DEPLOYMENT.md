# Deployment Checklist

## Pre-Deployment

- [ ] Update `infra/environments/dev.bicepparam`:
  - [ ] Replace `OWNER` with your GitHub username/org
  - [ ] Replace `REPLACE_WITH_GHCR_TOKEN` with a valid GHCR token
  - [ ] Set `containerImage` to your registry path

- [ ] Verify Azure CLI is installed and authenticated:
  ```powershell
  az account show
  ```

## Deploy Infrastructure

```powershell
# Create resource group if needed
az group create --name softball-dev-rg --location eastus

# Deploy Bicep template
az deployment group create `
  --resource-group softball-dev-rg `
  --template-file infra/main.bicep `
  --parameters @infra/environments/dev.bicepparam
```

## Capture Deployment Outputs

```powershell
# Save outputs to file
az deployment group show `
  --name main `
  --resource-group softball-dev-rg `
  --query properties.outputs > outputs.json
```

**Key Outputs:**

- `containerAppFqdn`: Backend API URL
- `containerAppName`: For GitHub Actions
- `containerAppPrincipalId`: Managed identity ID
- `managedEnvironmentName`: For volume mount script
- `staticWebAppHostname`: Frontend URL
- `storageAccountName`: For volume mounts (authenticated via managed identity)

## Configure Volume Mounts

```powershell
pwsh infra/scripts/mount-volumes.ps1 `
  -SubscriptionId "<sub-id>" `
  -ResourceGroupName "softball-dev-rg" `
  -EnvironmentName "<managedEnvironmentName-from-outputs>" `
  -ContainerAppName "<containerAppName-from-outputs>" `
  -StorageAccountName "<storageAccountName-from-outputs>"
```

> **Security Note:** Volume mounts use the Container App's system-assigned managed identity with RBAC permissions. No storage keys required.

## Update CORS and Redeploy

- [ ] Update `corsOrigin` in `dev.bicepparam` with `staticWebAppHostname` from outputs
- [ ] Redeploy with updated parameter file

## GitHub Actions Configuration

### Repository Secrets to Add

**Backend Workflow (`.github/workflows/backend.yml`):**

```
AZURE_CLIENT_ID=<service-principal-client-id>
AZURE_TENANT_ID=<azure-tenant-id>
AZURE_SUBSCRIPTION_ID=<azure-subscription-id>
AZURE_RESOURCE_GROUP=softball-dev-rg
AZURE_CONTAINERAPP_NAME=<containerAppName-from-outputs>
```

**Frontend Workflow (`.github/workflows/frontend.yml`):**

```
AZURE_STATIC_WEB_APPS_API_TOKEN=<swa-deployment-token>
VITE_API_URL=https://<containerAppFqdn-from-outputs>
VITE_WS_URL=wss://<containerAppFqdn-from-outputs>
```

### Get SWA Deployment Token

```powershell
az staticwebapp secrets list `
  --name <staticWebAppName-from-outputs> `
  --resource-group softball-dev-rg `
  --query properties.apiKey -o tsv
```

### Create Azure Service Principal for GitHub OIDC

```powershell
# Create SP
$sp = az ad sp create-for-rbac `
  --name "github-actions-softball-dev" `
  --role contributor `
  --scopes "/subscriptions/<subscription-id>/resourceGroups/softball-dev-rg" `
  --json | ConvertFrom-Json

# Add federated credential for main branch
az ad app federated-credential create `
  --id $sp.appId `
  --parameters '{
    "name": "github-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:<owner>/<repo>:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Save these values as GitHub secrets:
Write-Host "AZURE_CLIENT_ID: $($sp.appId)"
Write-Host "AZURE_TENANT_ID: $($sp.tenant)"
```

## Build and Push Initial Backend Image

```powershell
# Login to GHCR
echo $env:GHCR_TOKEN | docker login ghcr.io -u <owner> --password-stdin

# Build and push
docker build -t ghcr.io/<owner>/softball-digital-sign-server:latest -f docker/server/Dockerfile .
docker push ghcr.io/<owner>/softball-digital-sign-server:latest
```

## Verify Deployment

- [ ] Test backend API: `https://<containerAppFqdn>/api`
- [ ] Check container logs:
  ```powershell
  az containerapp logs show --name <containerAppName> --resource-group softball-dev-rg --follow
  ```
- [ ] Test frontend: `https://<staticWebAppHostname>`
- [ ] Verify volume mounts:
  ```powershell
  az containerapp show --name <containerAppName> --resource-group softball-dev-rg --query template.volumes
  ```

## Post-Deployment

- [ ] Test file uploads (media)
- [ ] Verify SQLite database persistence
- [ ] Test WebSocket connections
- [ ] Monitor costs in Azure portal
- [ ] Set up alerts for container app errors
