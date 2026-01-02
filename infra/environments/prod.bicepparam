using './..\main.bicep'

param location = 'eastus'
param namePrefix = 'softball-digisign'
param regionCode = 'prod'

// Backend image hosted in GHCR (adjust owner/repo:tag)
param containerImage = 'ghcr.io/OWNER/softball-digital-sign-server:prod'

// GHCR credentials (consider using Key Vault or GitHub secrets)
param ghcrUsername = 'OWNER'
param ghcrPassword = 'REPLACE_WITH_GHCR_TOKEN'

// Allow CORS from the Static Web App default hostname (update after first deploy if needed)
param corsOrigin = 'https://softball-digisign-swa-prod.azurestaticapps.net'

// SWA SKU (Standard recommended for production)
param swaSku = 'Standard'
