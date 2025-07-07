# AI Agent Marketplace - Setup Guide

## Overview

This is a comprehensive AI Agent marketplace built with Next.js, TypeScript, and SQLite. Users can buy and sell AI agents using a credit-based system.

## Features

### For Buyers
- Browse AI agents by category, search, and price filters
- Purchase agents using three pricing models:
  - **Per-use**: Pay credits each time you use the agent
  - **Subscription**: Monthly unlimited access 
  - **One-time**: Permanent access with single payment
- Manage wallet and credit balance
- View purchase history and transaction logs
- Rate and review agents

### For Sellers
- List AI agents with detailed descriptions
- Set multiple pricing options (per-use, subscription, one-time)
- Track earnings and sales analytics
- Manage agent status (active/inactive)

### Platform Features
- **Credit System**: 1 Credit = $1 USD equivalent
- **Commission Structure**: 10% platform fee on all transactions
- **Secure Transactions**: All purchases tracked with detailed transaction logs
- **User Roles**: Admin, Seller, and Buyer accounts
- **SQLite Database**: Lightweight, file-based database for testing

## Database Schema

The marketplace uses 7 main tables:

### Users
- `id`: Unique user identifier
- `email`: User email (unique)
- `name`: User display name
- `role`: admin | seller | buyer
- `created_at`: Account creation timestamp

### Agents
- `id`: Unique agent identifier
- `owner_id`: Reference to seller
- `name`: Agent name
- `description`: Agent description
- `price_per_use_credits`: Cost per usage
- `price_subscription_credits`: Monthly subscription cost (optional)
- `price_one_time_credits`: One-time purchase cost (optional)
- `category`: Agent category (e.g., "Text Processing", "Development")
- `tags`: Comma-separated tags for search
- `status`: active | inactive | deleted

### Wallets
- `id`: Unique wallet identifier
- `user_id`: Reference to user
- `balance`: Current credit balance
- `updated_at`: Last update timestamp

### Credit Transactions
- `id`: Unique transaction identifier
- `from_user_id`: Sender (for purchases)
- `to_user_id`: Recipient (for earnings)
- `agent_id`: Related agent (optional)
- `amount`: Transaction amount in credits
- `type`: purchase | use | commission | payout | promo
- `metadata`: Additional transaction data (JSON)

### Purchases
- `id`: Unique purchase identifier
- `user_id`: Buyer reference
- `agent_id`: Purchased agent reference
- `purchase_type`: per_use | subscription | one_time
- `created_at`: Purchase timestamp

### Reviews
- `id`: Unique review identifier
- `user_id`: Reviewer reference
- `agent_id`: Reviewed agent reference
- `rating`: 1-5 star rating
- `comment`: Review text
- `created_at`: Review timestamp

### Payout Requests
- `id`: Unique payout identifier
- `user_id`: Seller requesting payout
- `amount`: Requested amount
- `status`: pending | approved | rejected | paid
- `created_at`: Request timestamp
- `processed_at`: Processing timestamp

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
The database will be automatically initialized when you first run the API. You can test it by visiting:

```
http://localhost:3000/api/test-db
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access the Application
- Homepage: http://localhost:3000
- Marketplace: http://localhost:3000/marketplace
- Dashboard: http://localhost:3000/dashboard

## Sample Data

The database comes pre-seeded with:

### Users
- **Admin**: admin@agentverse.com (100,000 credits)
- **Seller**: seller@agentverse.com (5,000 credits)
- **Buyer**: buyer@agentverse.com (1,000 credits)

### Sample Agents
1. **Text Summarizer AI** - 10 credits per use, 100 credits one-time
2. **Code Generator AI** - 25 credits per use, 500 credits/month subscription
3. **Data Analyzer AI** - 50 credits per use, 800 credits one-time

## API Endpoints

### Agents
- `GET /api/agents` - List all agents
- `GET /api/agents/[id]` - Get agent details
- `POST /api/agents` - Create new agent (sellers only)
- `PUT /api/agents/[id]` - Update agent
- `DELETE /api/agents/[id]` - Delete agent
- `POST /api/agents/[id]/purchase` - Purchase agent

### Wallet & Credits
- `GET /api/wallet/[userId]` - Get wallet details and transactions
- `POST /api/wallet/[userId]` - Add credits to wallet

### Purchases
- `GET /api/purchases?user_id=[userId]` - Get user's purchases

## Testing Purchase Flow

1. **Sign In** as buyer@agentverse.com
2. **Browse Marketplace** - View available agents
3. **Purchase Agent** - Click "Buy" on any agent card
4. **Check Dashboard** - View your purchases and updated wallet balance
5. **View Transactions** - See detailed transaction history

## Credit Management

### Adding Credits
Users can add credits through the dashboard:
1. Go to Dashboard > Wallet tab
2. Enter desired credit amount
3. Click "Add Credits" (simulated - no real payment processing)

### Purchase Types
- **Per-use**: Charged each time the agent is used
- **Subscription**: Monthly recurring access (simulated)
- **One-time**: Permanent access with single payment

### Commission Structure
- 10% platform commission on all sales
- Sellers receive 90% of purchase price
- Commission tracked in separate transaction records

## File Structure

```
app/
├── api/
│   ├── agents/          # Agent CRUD operations
│   ├── wallet/          # Wallet management
│   └── purchases/       # Purchase history
├── dashboard/           # User dashboard
├── marketplace/         # Agent marketplace
└── layout.tsx          # App layout

lib/
├── database.ts         # SQLite database setup
├── schema.ts          # Database type definitions
└── auth-context.tsx   # Authentication context

components/
├── marketplace/       # Marketplace components
├── ui/               # Shared UI components
└── layout/           # Layout components
```

## Development Notes

### Database File
- SQLite database file: `agentverse.db`
- Automatically created on first run
- Includes foreign key constraints
- Pre-seeded with sample data

### Authentication
- Currently using mock authentication
- User data stored in localStorage
- Ready for integration with real auth providers

### Error Handling
- Comprehensive error handling in API routes
- User-friendly error messages
- Transaction rollback on failures

### Future Enhancements
- Real payment processing integration
- Agent execution sandbox
- Advanced analytics dashboard
- Multi-language support
- Agent versioning system

## Troubleshooting

### Database Issues
If you encounter database errors:
```bash
rm agentverse.db  # Delete existing database
npm run dev       # Restart server (will recreate database)
```

### Missing Dependencies
If you see import errors:
```bash
npm install --legacy-peer-deps
```

### Port Conflicts
If port 3000 is busy:
```bash
npm run dev -- --port 3001
```

## Contributing

1. Follow TypeScript strict mode
2. Use existing component patterns
3. Add error handling for all API calls
4. Test purchase flows thoroughly
5. Document new features in this guide

## License

This project is for educational and demonstration purposes.