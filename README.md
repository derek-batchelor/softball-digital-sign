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
- **Real-time Updates**: WebSocket notifications for session transitions

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
