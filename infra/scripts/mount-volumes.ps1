param(
  [Parameter(Mandatory=$true)] [string] $SubscriptionId,
  [Parameter(Mandatory=$true)] [string] $ResourceGroupName,
  [Parameter(Mandatory=$true)] [string] $EnvironmentName,
  [Parameter(Mandatory=$true)] [string] $ContainerAppName,
  [Parameter(Mandatory=$true)] [string] $StorageAccountName
)

Write-Host "Setting subscription $SubscriptionId"
az account set --subscription $SubscriptionId

Write-Host "Configuring environment storages (Azure Files) in $EnvironmentName using Managed Identity"
az containerapp env storage set `
  --name $EnvironmentName `
  --resource-group $ResourceGroupName `
  --storage-name data-storage `
  --azure-file-account-name $StorageAccountName `
  --azure-file-share-name data `
  --access-mode ReadWrite `
  --storage-type AzureFile `
  --enable-managed-identity true

az containerapp env storage set `
  --name $EnvironmentName `
  --resource-group $ResourceGroupName `
  --storage-name media-storage `
  --azure-file-account-name $StorageAccountName `
  --azure-file-share-name media `
  --access-mode ReadWrite `
  --storage-type AzureFile `
  --enable-managed-identity true

Write-Host "Adding volume mounts to Container App $ContainerAppName"
# Patch volumes and mounts using az CLI --set
az containerapp update `
  --name $ContainerAppName `
  --resource-group $ResourceGroupName `
  --set `
    template.volumes[0].name=data `
    template.volumes[0].storageType=AzureFile `
    template.volumes[0].storageName=data-storage `
    template.volumes[1].name=media `
    template.volumes[1].storageType=AzureFile `
    template.volumes[1].storageName=media-storage `
    template.containers[0].volumeMounts[0].volumeName=data `
    template.containers[0].volumeMounts[0].mountPath=/mounts/data `
    template.containers[0].volumeMounts[1].volumeName=media `
    template.containers[0].volumeMounts[1].mountPath=/mounts/media

Write-Host "Volume mounts configured. Verify with: az containerapp show --name $ContainerAppName --resource-group $ResourceGroupName --query template.volumes"
