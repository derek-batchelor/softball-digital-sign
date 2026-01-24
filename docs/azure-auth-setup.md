# Azure External Identities Configuration

## Prerequisites

1. Access to the Azure portal for the External Identities tenant.
2. Permission to create and edit app registrations, app roles, and user flows.

## App registrations

1. Create **Softball DigiSign API Dev** (resource app).
   - Supported account type: single tenant (External Identities tenant).
   - Expose an API: set Application ID URI to `api://{api-client-id}`.
   - Add scope `Manage.All`. No admin consent required.
   - Under **App roles**, create role **Admin** (value `Admin`, allowed member type = Users/Groups).
   - Record the **Application (client) ID** (e.g. `460bde16-ddf3-49fc-9af1-1f83a982c1cf`).
2. Create **Softball DigiSign SPA Dev** (public client).
   - Redirect URI type: SPA, value `http://localhost:5173`.
   - Under **API permissions**, add delegated permission `api://{api-client-id}/Manage.All`.
   - Record the **Application (client) ID** (e.g. `d984a708-b02e-41ef-8958-8a8e2a6b9f1a`).
3. Create **Softball DigiSign Tooling Dev** (local testing client for Bruno).
   - Platform: **Mobile and desktop applications** with redirect URI `https://oauth.usebruno.com/callback` (or the tooling callback you prefer).
   - If Bruno fails the authorization code exchange, create a client secret and capture the value for later.
   - Under **API permissions**, add delegated permission `api://{api-client-id}/Manage.All` and grant admin consent.
   - Record the **Application (client) ID** for Bruno.

## Authorized client applications

1. Open the API app registration **Expose an API** page.
2. Under **Authorized client applications**, add both SPA and Bruno client IDs and select the `Manage.All` scope for each.

## Role assignments

1. Navigate to **Enterprise applications**.
2. Open **Softball DigiSign API Dev** service principal.
3. Assign users/groups who need admin access to the **Admin** app role.

## User flow

1. Custom Attributes, add Display Name.
2. Open the user flow used by the SPA.
3. Under **Applications**, add the SPA and Bruno registrations, then enable issuing access tokens for both.

## Environment variables

### SPA (`src/client/.env`)

1. `VITE_AZURE_AUTHORITY` → Issuer root, e.g. `https://joebelltrainingdev.ciamlogin.com/b2e17ba3-82a3-463e-8a97-8a053bb2f3db`.
2. `VITE_AZURE_CLIENT_ID` → SPA client ID.
3. `VITE_AZURE_REDIRECTS` → JSON array of objects defining origin, redirectUri, and postLogoutRedirectUri.
4. `VITE_AZURE_API_SCOPE` → `api://460bde16-ddf3-49fc-9af1-1f83a982c1cf/Manage.All`.
5. `VITE_AZURE_REQUIRED_CLAIM` → `roles`.
6. `VITE_AZURE_REQUIRED_CLAIM_VALUE` → `Admin`.

### API (`src/server/.env`)

1. `AUTH_METADATA_URL` → Metadata document URL (e.g. `https://joebelltrainingdev.ciamlogin.com/b2e17ba3-82a3-463e-8a97-8a053bb2f3db/.well-known/openid-configuration`).
2. `AUTH_AUDIENCE` → `460bde16-ddf3-49fc-9af1-1f83a982c1cf`.
3. `AUTH_REQUIRED_CLAIM` → `roles`.
4. `AUTH_REQUIRED_CLAIM_VALUE` → `Admin`.

## Bruno local testing

1. Configure Bruno’s OAuth 2.0 client to use the **Softball DigiSign Tooling Dev** registration.
2. Authorization endpoint → copy from the tooling app metadata document (`/.well-known/openid-configuration`, `authorization_endpoint`).
3. Token endpoint → same metadata, `token_endpoint`.
4. Client ID → tooling client ID; Client secret → tooling secret (omit if you did not create one).
5. Redirect URI → `https://oauth.usebruno.com/callback` (matches the tooling registration).
6. Scope list → `openid profile email offline_access api://{api-client-id}/Manage.All`.
7. Enable PKCE (S256) and run the auth code flow; Bruno will store the access token for local API calls.

## Verification steps

1. Run the SPA and sign in as an Admin-assigned account.
2. Confirm the admin routes load and the access token contains `roles: ["Admin"]`.
3. Call protected API endpoints and verify the Nest guards allow only tokens with the required claim.
