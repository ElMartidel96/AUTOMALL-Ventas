# CryptoGift DAO Ranking Backend

A real-time ranking system backend for the CryptoGift Wallets DAO, featuring blockchain event monitoring, WebSocket updates, and Redis caching.

## Features

- **Real-time Blockchain Monitoring**: Watches Base blockchain for DAO events
- **WebSocket Real-time Updates**: Live ranking and activity updates
- **Redis Caching**: High-performance data caching and pub/sub
- **Supabase Integration**: Persistent data storage and analytics
- **Rate Limiting**: API protection and abuse prevention
- **Health Monitoring**: System health checks and metrics
- **TypeScript**: Full type safety and excellent DX

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Base Chain    │───▶│   Blockchain    │───▶│   Database      │
│   (Events)      │    │   Service       │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │◀───│   WebSocket     │◀───│   Redis Cache   │
│   Clients       │    │   Service       │    │   & Pub/Sub     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   REST API      │
                       │   (Express)     │
                       └─────────────────┘
```

## Smart Contract Integration

Monitors these contract events:

### MilestoneEscrow
- `BatchDeposited`: New escrow batches
- `MilestoneCreated`: New milestone tasks
- `FundsReleased`: Completed task payments
- `DisputeInitiated` / `DisputeResolved`: Dispute management

### TaskRulesEIP712
- `TaskCreated`: New task assignments
- `TaskCompleted`: Task submissions
- `RewardReleased`: Task reward payments

### CGCToken
- `Transfer`: Token movements
- `BatchTransfer`: Bulk token operations
- `HolderAdded` / `HolderRemoved`: Holder tracking

## API Endpoints

### Core Endpoints
- `GET /api/health` - System health check
- `GET /api/rankings` - Paginated rankings list
- `GET /api/collaborator/:address` - Individual collaborator data
- `GET /api/stats` - System-wide statistics
- `GET /api/leaderboard` - Top performers

### Real-time Data
- `GET /api/recent-activity` - Latest blockchain activity
- `GET /api/websocket/stats` - WebSocket connection stats

### Administration
- `POST /api/broadcast` - Send WebSocket broadcasts
- `GET /api/cache/status` - Cache status check
- `DELETE /api/cache/:key` - Clear cache entries

## WebSocket Events

### Client → Server
- `subscribe` - Subscribe to event channels
- `unsubscribe` - Unsubscribe from channels
- `get-rankings` - Request current rankings
- `get-stats` - Request system stats
- `get-collaborator` - Request collaborator data

### Server → Client
- `ranking-update` - Live ranking changes
- `task-update` - Task status changes
- `transaction-update` - New blockchain transactions
- `stats-update` - System statistics updates
- `live-update` - Real-time activity feed

## Installation

1. **Clone and install dependencies**:
```bash
cd ranking-backend
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start development server**:
```bash
npm run dev
```

4. **Build for production**:
```bash
npm run build
npm start
```

## Environment Configuration

### Required Variables
```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Redis
REDIS_URL=redis://localhost:6379

# Blockchain
BASE_RPC_URL=https://mainnet.base.org
CGC_TOKEN_ADDRESS=0x...
MILESTONE_ESCROW_ADDRESS=0x...
TASK_RULES_ADDRESS=0x...
MASTER_CONTROLLER_ADDRESS=0x...

# Security
JWT_SECRET=your-super-secret-key
CORS_ORIGINS=http://localhost:3000,https://dao.cryptogift.com
```

## Database Schema

### Tables
- `collaborators` - User profiles and statistics
- `tasks` - Task assignments and completions
- `transactions` - Blockchain transaction records
- `collaborator_rankings` - Ranking calculations
- `system_stats` - System-wide metrics

### Views
- `rankings_view` - Computed rankings with scores
- `system_stats_view` - Aggregated system statistics

## Performance Features

- **Redis Caching**: 30-60 second cache TTLs for hot data
- **Connection Pooling**: Efficient database connections
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Batch Processing**: Efficient blockchain event handling
- **Memory Management**: Automatic cleanup and garbage collection

## Monitoring & Health

- **Health Checks**: `/api/health` endpoint with service status
- **Metrics**: Connection counts, cache hit rates, response times
- **Logging**: Structured logging with Winston
- **Error Tracking**: Comprehensive error handling and reporting

## Security

- **Rate Limiting**: API and WebSocket connection limits
- **CORS Protection**: Configured allowed origins
- **Input Validation**: Zod schema validation
- **Error Sanitization**: No sensitive data in error responses
- **Connection Security**: Redis AUTH and TLS support

## Development

### Scripts
- `npm run dev` - Development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run lint` - Code linting
- `npm run type-check` - TypeScript validation

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Production Deployment

1. **Build the application**:
```bash
npm run build
```

2. **Set production environment variables**
3. **Start with process manager**:
```bash
pm2 start dist/index.js --name ranking-backend
```

4. **Configure reverse proxy** (Nginx/Cloudflare)
5. **Set up monitoring and alerts**

## Integration with Frontend

The backend provides real-time data to the ranking frontend via:

- **REST API**: Initial data loading and on-demand requests
- **WebSocket**: Real-time updates and live activity feed
- **Event Stream**: Structured blockchain event notifications

Example frontend integration:
```javascript
// Connect to WebSocket
const socket = io('ws://localhost:3001')

// Subscribe to live rankings
socket.emit('subscribe', 'rankings')
socket.on('ranking-update', (data) => {
  updateUI(data)
})

// Get initial data
fetch('/api/rankings')
  .then(response => response.json())
  .then(data => initializeRankings(data))
```

## Contributing

1. Follow TypeScript strict mode
2. Add tests for new features
3. Update documentation
4. Follow conventional commits
5. Ensure all health checks pass

## License

MIT - See LICENSE file for details