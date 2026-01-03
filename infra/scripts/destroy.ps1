param(
  [Parameter(Mandatory=$true)] [string] $SubscriptionId,
  [Parameter(Mandatory=$true)] [string] $ResourceGroupName
)

Write-Host "Setting subscription $SubscriptionId"
az account set --subscription $SubscriptionId

Write-Host "Deleting resource group $ResourceGroupName"
az group delete --name $ResourceGroupName --yes --no-wait
