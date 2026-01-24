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
- `staticWebAppHostname`: Frontend URL
- `storageAccountName`: Storage account for file shares

> **Note:** Volume mounts and storage are automatically configured via Bicep. No manual script execution needed.

## Update CORS and Redeploy

- [ ] Update `corsOrigin` in `dev.bicepparam` with `staticWebAppHostname` from outputs
- [ ] Redeploy with updated parameter file

## GitHub Actions Configuration

### Create GitHub Container Registry (GHCR) Tokens

#### For Azure Container Apps (Pull Images)

This token allows Azure to pull your container images from GHCR. Add it to `infra/environments/dev.bicepparam`:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Configure token:
   - **Note:** "Azure GHCR Pull for softball-digital-sign"
   - **Expiration:** 1 year (set a calendar reminder to rotate)
   - **Select scopes:**
     - `read:packages` (to download container images)
4. Click "Generate token" and copy it immediately
5. Add to `infra/environments/dev.bicepparam`:
   ```bicep
   registryPassword: '<your-token-here>'
   ```

#### For Local Development (Push Images)

Only needed if building and pushing images manually (not required for GitHub Actions):

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Configure token:
   - **Note:** "GHCR Push for softball-digital-sign"
   - **Expiration:** 90 days
   - **Select scopes:**
     - `write:packages` (to upload container images)
     - `read:packages` (to download container images)
4. Generate and save to environment variable:
   ```powershell
   $env:GHCR_TOKEN = "<your-token-here>"
   ```

> **Note:** GitHub Actions uses the automatic `GITHUB_TOKEN` which already has push permissions.

### Repository Secrets to Add

**Backend CI Workflow (`.github/workflows/backend-ci.yml`):**

```
GITHUB_TOKEN=<automatically-provided-by-github>
```

> Note: GITHUB_TOKEN is automatically available and used for GHCR authentication. No additional secrets needed for CI.

**Backend CD Workflow (`.github/workflows/backend-cd.yml`):**

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
VITE_AUTH_AUTHORITY=https://<tenant>.ciamlogin.com/<tenant-id>
VITE_AUTH_CLIENT_ID=<spa-client-id>
VITE_AUTH_REDIRECTS=[{"origin":"https://<app-host>","redirectUri":"https://<app-host>","postLogoutRedirectUri":"https://<app-host>"}]
VITE_AUTH_API_SCOPE=api://<api-app-id>/<scope-name>   # optional if you don't request API access
VITE_AUTH_REQUIRED_CLAIM=roles
VITE_AUTH_REQUIRED_CLAIM_VALUE=Admin
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
  --parameters '{\"name\":\"github-main\",\"issuer\":\"https://token.actions.githubusercontent.com\",\"subject\":\"repo:<owner>/<repo>:ref:refs/heads/main\",\"audiences\":[\"api://AzureADTokenExchange\"]}'

# Add federated credential for dev environment (workflow_dispatch)
az ad app federated-credential create `
  --id $sp.appId `
  --parameters '{\"name\":\"github-workflow_dispatch-dev\",\"issuer\":\"https://token.actions.githubusercontent.com\",\"subject\":\"repo:<owner>/<repo>:environment:dev\",\"audiences\":[\"api://AzureADTokenExchange\"]}'

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
- [ ] Monitor costs in Azure portal
- [ ] Set up alerts for container app errors
