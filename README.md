# Softball Digital Signage

A digital signage system for displaying softball player statistics, highlights, and scheduled content.

## Features

- **Time-based Session Scheduling**: Display content based on scheduled sessions with start/end times
- **Player Stats Display**: Show current, previous, and next session player statistics
- **Content Types**:
  - Player + Stats: Combined player photo and statistics
  - Play of the Week: Featured play highlights
  - Weekend Warrior: Player spotlight
- **Auto-rotation**: Content rotates with variable durations and 1s dissolve transitions
- **Admin Dashboard**: Manage schedules, players, tournaments, stats, and content
- **Automatic Refresh**: Background polling keeps signage data current without manual reloads
- **Multi-Display Support**: Interactive positioning and scaling for any screen size (Smart TVs, PCs, Mobile)
  - Adjust scale, position, and rotation
  - Settings saved to local storage
  - See [DISPLAY_SETTINGS.md](DISPLAY_SETTINGS.md) for details

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: NestJS + TypeScript
- **Database**: SQLite + TypeORM
- **Media**: Local file storage
- **Deployment**: Docker + Docker Compose

## Project Structure

```
softball-digital-sign/
├── src/
│   ├── client/          # React frontend
│   └── server/          # NestJS backend
├── shared/
│   └── types/           # Shared TypeScript types
├── docker/              # Docker configuration
└── media/               # Local media storage
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (for deployment)

### Installation

```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

### Development

- Client runs on: http://localhost:5173
- Server runs on: http://localhost:3000

## Authentication

The application uses an Azure External Identities user flow with PKCE for protecting admin routes. Configure the following environment variables to match your tenant settings. All values are required unless marked optional.

### Client (`src/client/.env`)

- `VITE_AUTH_CLIENT_ID` – Application (client) ID from your user flow registration.
- `VITE_AUTH_AUTHORITY` – Authority URL, for example `https://joebelltrainingdev.ciamlogin.com/<tenant-id>/v2.0`.
- `VITE_AUTH_API_SCOPE` – Optional API scope to request access tokens (e.g. `api://<api-app-id>/access_as_user`).
- `VITE_AUTH_REDIRECTS` – JSON array of `{ origin, redirectUri, postLogoutRedirectUri }` objects to pick host-specific callbacks.
- `VITE_AUTH_REQUIRED_CLAIM` / `VITE_AUTH_REQUIRED_CLAIM_VALUE` – Claim name and value users must possess to reach `/admin` routes. Defaults to `roles=Admin`.

### Server (`src/server/.env`)

- `AUTH_METADATA_URL` – OIDC discovery endpoint used to load issuer and JWKS settings.
- `AUTH_AUDIENCE` – Audience claim the backend will accept (API app registration ID or URI).
- `AUTH_REQUIRED_CLAIM` / `AUTH_REQUIRED_CLAIM_VALUE` – Claim gate enforced by the API, matching the client requirement.

All `/admin` UI routes now require a successful sign-in and the configured claim. The same claim check applies to `players`, `sessions`, and `content` API endpoints.

### Building for Production

```bash
npm run build
```

### Docker Deployment

```bash
docker-compose up -d
```

## License

MIT
