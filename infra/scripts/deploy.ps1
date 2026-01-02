param(
  [Parameter(Mandatory=$true)] [string] $SubscriptionId,
  [Parameter(Mandatory=$true)] [string] $ResourceGroupName,
  [Parameter(Mandatory=$true)] [string] $Location,
  [Parameter(Mandatory=$false)] [string] $ParamFile = "$(Split-Path $PSScriptRoot -Parent)\environments\dev.bicepparam"
)

Write-Host "Setting subscription $SubscriptionId"
az account set --subscription $SubscriptionId

if (-not (az group exists --name $ResourceGroupName)) {
  Write-Host "Creating resource group $ResourceGroupName in $Location"
  az group create --name $ResourceGroupName --location $Location | Out-Null
}

Write-Host "Validating Bicep deployment..."
az deployment group validate `
  --resource-group $ResourceGroupName `
  --template-file "$(Split-Path $PSScriptRoot -Parent)\main.bicep" `
  "--parameters @$ParamFile"

Write-Host "Deploying infrastructure..."
az deployment group create `
  --resource-group $ResourceGroupName `
  --template-file "$(Split-Path $PSScriptRoot -Parent)\main.bicep" `
  "--parameters @$ParamFile" `
  --query properties.outputs
