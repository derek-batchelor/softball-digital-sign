# Infrastructure Deployment Guide

This directory contains Bicep templates and scripts to provision the Azure resources for the Softball Digital Sign application.

## Architecture Overview

- **Azure Container Apps (ACA)**: Hosts the NestJS backend with single replica for SQLite safety
- **Azure Static Web Apps (SWA)**: Hosts the Vite/React frontend
- **Azure Storage Account**: File shares for SQLite database and media uploads
- **Log Analytics Workspace**: Centralized logging for Container Apps

## Prerequisites

- Azure CLI (`az`) installed and authenticated
- Bicep CLI (included with Azure CLI)
- PowerShell 7+
- GitHub Container Registry (GHCR) credentials
- Azure subscription with Contributor access

## Deployment Steps

### 1. Initial Infrastructure Deployment

```powershell
# Deploy to dev environment
pwsh infra/scripts/deploy.ps1 `
  -SubscriptionId "<your-subscription-id>" `
  -ResourceGroupName "softball-dev-rg" `
  -Location "eastus" `
  -ParamFile "infra/environments/dev.bicepparam"
```

**Before deploying**, update `infra/environments/dev.bicepparam`:

- Replace `OWNER` with your GitHub username/org
- Replace `REPLACE_WITH_GHCR_TOKEN` with your GHCR token
- Update `corsOrigin` after first deploy (see outputs)

### 2. Configure Volume Mounts (Post-Deploy)

After the initial deployment, configure Azure Files volume mounts using managed identity authentication:

```powershell
# Get outputs from deployment
$outputs = az deployment group show `
  --name <deployment-name> `
  --resource-group softball-dev-rg `
  --query properties.outputs

# Run mount-volumes script (no storage key needed - uses managed identity)
pwsh infra/scripts/mount-volumes.ps1 `
  -SubscriptionId "<your-subscription-id>" `
  -ResourceGroupName "softball-dev-rg" `
  -EnvironmentName "<managedEnvironmentName-from-outputs>" `
  -ContainerAppName "<containerAppName-from-outputs>" `
  -StorageAccountName "<storageAccountName-from-outputs>"
```

> **Note:** The Container App uses its system-assigned managed identity with RBAC (Storage File Data Privileged Contributor role) to access Azure Files. No access keys are required.

### 3. Update CORS Origin

After first deploy, update the `corsOrigin` parameter in your `.bicepparam` file with the actual Static Web App hostname from outputs:

```bicep
param corsOrigin = 'https://<staticWebAppHostname-from-outputs>'
```

Redeploy to apply the CORS update.

### 4. Configure GitHub Actions Secrets

Set the following secrets in your GitHub repository (Settings → Secrets and variables → Actions):

#### Backend Workflow Secrets

- `AZURE_CLIENT_ID`: Service Principal client ID (for OIDC)
- `AZURE_TENANT_ID`: Azure tenant ID
- `AZURE_SUBSCRIPTION_ID`: Azure subscription ID
- `AZURE_RESOURCE_GROUP`: Resource group name (e.g., `softball-dev-rg`)
- `AZURE_CONTAINERAPP_NAME`: Container app name from outputs

#### Frontend Workflow Secrets

- `AZURE_STATIC_WEB_APPS_API_TOKEN`: Deployment token from SWA (get via portal or CLI)
- `VITE_API_URL`: Backend API URL (e.g., `https://<containerAppFqdn>`)
- `VITE_WS_URL`: WebSocket URL (e.g., `wss://<containerAppFqdn>`)

**Get SWA deployment token:**

```powershell
az staticwebapp secrets list `
  --name <staticWebAppName-from-outputs> `
  --resource-group softball-dev-rg `
  --query properties.apiKey
```

**Configure Azure OIDC for GitHub Actions:**

```powershell
# Create service principal with federated credentials
az ad sp create-for-rbac `
  --name "github-actions-softball" `
  --role contributor `
  --scopes /subscriptions/<subscription-id>/resourceGroups/softball-dev-rg `
  --create-cert `
  --years 1

# Add federated credential for GitHub
az ad app federated-credential create `
  --id <app-id-from-sp> `
  --parameters '{
    "name": "github-actions-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:<owner>/<repo>:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

## Deployment Outputs

The deployment produces the following outputs:

| Output                    | Description                             | Usage                                   |
| ------------------------- | --------------------------------------- | --------------------------------------- |
| `containerAppFqdn`        | Backend API fully qualified domain name | Set as `VITE_API_URL` and `VITE_WS_URL` |
| `containerAppName`        | Container App resource name             | GitHub Actions secret                   |
| `containerAppPrincipalId` | Managed identity principal ID           | Reference/RBAC                          |
| `managedEnvironmentName`  | ACA environment name                    | Volume mount script                     |
| `staticWebAppHostname`    | Frontend default hostname               | Update `corsOrigin` parameter           |
| `storageAccountName`      | Storage account name                    | Volume mount script                     |
| `fileShareData`           | Data file share name                    | Reference                               |
| `fileShareMedia`          | Media file share name                   | Reference                               |
| `logAnalyticsWorkspaceId` | Log Analytics workspace customer ID     | Reference                               |

## Environment Management

Three environments are pre-configured:

- **dev** (`infra/environments/dev.bicepparam`): Development with Free tier SWA
- **test** (`infra/environments/test.bicepparam`): Testing/staging environment
- **prod** (`infra/environments/prod.bicepparam`): Production with Standard tier SWA

Deploy to different environments by changing the `ParamFile` argument.

## Teardown

To delete all resources:

```powershell
pwsh infra/scripts/destroy.ps1 `
  -SubscriptionId "<your-subscription-id>" `
  -ResourceGroupName "softball-dev-rg"
```

## Troubleshooting

### Volume Mount Issues

Verify mounts are configured:

```powershell
az containerapp show `
  --name <containerAppName> `
  --resource-group <rg> `
  --query template.volumes
```

### Container App Logs

```powershell
az containerapp logs show `
  --name <containerAppName> `
  --resource-group <rg> `
  --follow
```

### Static Web App Deployment Token

If token is missing or expired, regenerate:

```powershell
az staticwebapp secrets reset-api-key `
  --name <staticWebAppName> `
  --resource-group <rg>
```

## Cost Optimization

- **ACA Consumption**: Billed per vCPU-second and memory GB-second
- **SWA Free Tier**: 100 GB bandwidth/month, suitable for dev/test
- **SWA Standard Tier**: Production features, ~$9/month base + bandwidth
- **Storage Account**: Pay-as-you-go for file shares (minimal for SQLite + media)
- **Log Analytics**: First 5 GB/month free, then ~$2.30/GB

Estimated monthly cost (dev): **$5-15** | Estimated monthly cost (prod): **$15-40**
