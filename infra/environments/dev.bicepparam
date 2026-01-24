using './..\main.bicep'

param location = 'eastus'
param namePrefix = 'softball-digisign'
param regionCode = 'eastus'

// Backend image hosted in GHCR (adjust owner/repo:tag)
param containerImage = 'ghcr.io/OWNER/softball-digital-sign-server:latest'

// GHCR credentials (consider using Key Vault or GitHub secrets)
param ghcrUsername = 'OWNER'
param ghcrPassword = 'REPLACE_WITH_GHCR_TOKEN'

// Allow CORS from the Static Web App (wildcard to support preview environments)
// Pattern: https://proud-pond-094ce810f.eastus2.4.azurestaticapps.net (production)
//          https://proud-pond-094ce810f-1.eastus2.4.azurestaticapps.net (preview)
param corsOrigin = 'https://proud-pond-094ce810f.eastus2.4.azurestaticapps.net,https://proud-pond-094ce810f-1.eastus2.4.azurestaticapps.net,https://proud-pond-094ce810f-2.eastus2.4.azurestaticapps.net,https://proud-pond-094ce810f-3.eastus2.4.azurestaticapps.net'

// Backend auth configuration
param authMetadataUrl = 'https://joebelltrainingdev.ciamlogin.com/b2e17ba3-82a3-463e-8a97-8a053bb2f3db/.well-known/openid-configuration'
param authAudience = '460bde16-ddf3-49fc-9af1-1f83a982c1cf'
param authRequiredClaim = 'roles'
param authRequiredClaimValue = 'Admin'

// SWA SKU
param swaSku = 'Free'

// SQL Server credentials (use strong password)
param sqlAdminUsername = 'sqladmin'
param sqlAdminPassword = 'REPLACE_WITH_STRONG_PASSWORD'  // Min 8 chars, must include uppercase, lowercase, number, and special char
