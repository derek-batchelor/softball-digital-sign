This folder can host custom wrapper modules if you prefer to abstract Azure Verified Modules (AVM) usage. The current setup references AVM directly from infra/main.bicep for simplicity.

Suggested wrappers (optional):

- managedenv.bicep: wrap br/public:avm/res/app/managed-environment
- containerapp.bicep: wrap br/public:avm/res/app/container-app
- storage.bicep: wrap br/public:avm/res/storage/storage-account
- loganalytics.bicep: wrap br/public:avm/res/operational-insights/workspace
- staticwebapp.bicep: wrap br/public:avm/res/web/static-site
