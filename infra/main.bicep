@description('Deployment location')
param location string

@description('Name prefix used for all resources')
param namePrefix string

@description('Container App image (e.g., ghcr.io/owner/repo:tag)')
param containerImage string

@description('GitHub Container Registry username')
param ghcrUsername string

@secure()
@description('GitHub Container Registry password/token')
param ghcrPassword string

@description('CORS origin to allow from frontend (e.g., https://<swa>.azurestaticapps.net)')
param corsOrigin string

@description('Static Web App SKU (Free or Standard)')
@allowed([
  'Free'
  'Standard'
])
param swaSku string = 'Free'

@description('Azure region short code for unique names (e.g., eastus)')
param regionCode string

// Derived names
var workspaceName = '${namePrefix}-log-${regionCode}'
var storageAccountName = toLower(replace('${namePrefix}${regionCode}', '-', ''))
var managedEnvName = '${namePrefix}-env-${regionCode}'
var containerAppName = '${namePrefix}-api-${regionCode}'
var staticSiteName = '${namePrefix}-swa-${regionCode}'

// Log Analytics Workspace
resource law 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: workspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Storage Account with File Shares
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: true
    publicNetworkAccess: 'Enabled'
  }
}

resource fileServices 'Microsoft.Storage/storageAccounts/fileServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource dataShare 'Microsoft.Storage/storageAccounts/fileServices/shares@2023-05-01' = {
  parent: fileServices
  name: 'data'
  properties: {
    accessTier: 'TransactionOptimized'
  }
}

resource mediaShare 'Microsoft.Storage/storageAccounts/fileServices/shares@2023-05-01' = {
  parent: fileServices
  name: 'media'
  properties: {
    accessTier: 'TransactionOptimized'
  }
}

// Container Apps Managed Environment
resource env 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: managedEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: law.properties.customerId
        sharedKey: law.listKeys().primarySharedKey
      }
    }
  }
}

// Environment Storage for Azure Files
resource envStorageData 'Microsoft.App/managedEnvironments/storages@2024-03-01' = {
  parent: env
  name: 'data-storage'
  properties: {
    azureFile: {
      accountName: storage.name
      accountKey: storage.listKeys().keys[0].value
      shareName: dataShare.name
      accessMode: 'ReadWrite'
    }
  }
}

resource envStorageMedia 'Microsoft.App/managedEnvironments/storages@2024-03-01' = {
  parent: env
  name: 'media-storage'
  properties: {
    azureFile: {
      accountName: storage.name
      accountKey: storage.listKeys().keys[0].value
      shareName: mediaShare.name
      accessMode: 'ReadWrite'
    }
  }
}

// Container App
resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: env.id
    configuration: {
      activeRevisionsMode: 'Single'
      secrets: [
        {
          name: 'ghcr-password'
          value: ghcrPassword
        }
        {
          name: 'storage-account-key'
          value: storage.listKeys().keys[0].value
        }
      ]
      registries: [
        {
          server: 'ghcr.io'
          username: ghcrUsername
          passwordSecretRef: 'ghcr-password'
        }
      ]
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
        allowInsecure: false
      }
    }
    template: {
      volumes: [
        {
          name: 'data'
          storageType: 'AzureFile'
          storageName: envStorageData.name
        }
        {
          name: 'media'
          storageType: 'AzureFile'
          storageName: envStorageMedia.name
        }
      ]
      containers: [
        {
          name: 'api'
          image: containerImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '3000'
            }
            {
              name: 'CORS_ORIGIN'
              value: corsOrigin
            }
            {
              name: 'DATABASE_PATH'
              value: '/mounts/data/database.sqlite'
            }
            {
              name: 'MEDIA_PATH'
              value: '/mounts/media'
            }
          ]
          volumeMounts: [
            {
              volumeName: 'data'
              mountPath: '/mounts/data'
            }
            {
              volumeName: 'media'
              mountPath: '/mounts/media'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 1
      }
    }
  }
}

// Static Web App
resource swa 'Microsoft.Web/staticSites@2024-04-01' = {
  name: staticSiteName
  location: location
  sku: {
    name: swaSku
    tier: swaSku
  }
  properties: {}
}

// RBAC: Grant Container App managed identity access to Storage Account
resource storageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: storage
  name: guid(storage.id, app.id, 'Storage File Data Privileged Contributor')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '69566ab7-960f-475b-8e7c-b3118f30c6bd') // Storage File Data Privileged Contributor
    principalId: app.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Outputs
output containerAppFqdn string = app.properties.configuration.ingress.fqdn
output containerAppName string = app.name
output containerAppResourceId string = app.id
output managedEnvironmentId string = env.id
output managedEnvironmentName string = env.name
output staticWebAppHostname string = swa.properties.defaultHostname
output staticWebAppName string = swa.name
output storageAccountId string = storage.id
output storageAccountName string = storage.name
output containerAppPrincipalId string = app.identity.principalId
output fileShareData string = dataShare.name
output fileShareMedia string = mediaShare.name
output logAnalyticsWorkspaceId string = law.properties.customerId
