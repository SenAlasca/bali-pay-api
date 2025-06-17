# Bali Pay Transaction Network API

A secure interbank transfer system for Indonesian banks, enabling seamless fund transfers between registered financial institutions.

## Overview

The Bali Pay Transaction Network API serves as a centralized platform where banks can register and execute secure fund transfers between customer wallets. The system uses temporary transfer wallets and token-based authentication to ensure secure and traceable transactions.

## Features

- 🏦 **Multi-Bank Support**: Support for multiple registered Indonesian banks
- 💰 **Secure Transfers**: Temporary transfer wallets with token-based security
- 🔐 **API Key Authentication**: Bank-level authentication for all operations
- 📊 **Transaction Tracking**: Complete transaction history and status tracking
- ⚡ **Real-time Processing**: Immediate transfer initiation and status updates
- 🛡️ **Security First**: Comprehensive validation and error handling

## Architecture

### Core Components

1. **Banks**: Registered financial institutions with unique codes and API keys
2. **Wallets**: Customer accounts belonging to specific banks
3. **Transfer Wallets**: Temporary escrow accounts for secure fund transfers
4. **Transactions**: Complete transfer records with step-by-step tracking
5. **Tokens**: Unique identifiers for secure transfer completion

### Transfer Flow

1. **Initiation**: Source bank initiates transfer with wallet and amount details
2. **Validation**: System validates both banks, wallets, and sufficient funds
3. **Transfer Wallet Creation**: Temporary wallet created with unique token
4. **Fund Transfer**: Funds moved from source wallet to transfer wallet
5. **Notification**: Destination bank notified of incoming transfer
6. **Completion**: Destination bank completes transfer using token
7. **Settlement**: Funds credited to destination wallet

## API Endpoints

### Public Endpoints

- `GET /` - API welcome and basic information
- `GET /api/health` - Health check endpoint
- `GET /api/network/status` - Network status and registered banks
- `GET /api/bank/:bankCode/validate` - Validate bank registration
- `GET /api/wallet/:walletId/validate` - Validate wallet existence
- `GET /api/airtable/status` - Check Airtable integration status and configuration
- `GET /api/airtable/transactions/:bankCode` - Get transactions from Airtable for a specific bank

### Protected Endpoints (Require Authentication)

#### Bank Management
- `GET /api/bank/info` - Get authenticated bank information
- `GET /api/bank/wallets` - Get all wallets for authenticated bank

#### Wallet Management
- `GET /api/wallet/:walletId` - Get specific wallet information

#### Transfer Operations
- `POST /api/transfer/initiate` - Initiate a new transfer
- `POST /api/transfer/:transactionId/execute` - Execute fund transfer to transfer wallet
- `POST /api/transfer/complete` - Complete transfer to destination wallet
- `GET /api/transaction/:transactionId/status` - Get transaction status
- `GET /api/transactions` - Get all transactions for authenticated bank

## Authentication

All protected endpoints require two headers:
- `x-api-key`: Your bank's API key
- `x-bank-code`: Your bank's unique code (e.g., BCA, BRI, MANDIRI)

## Sample Request

### Initiate Transfer

```bash
curl -X POST http://localhost:3000/api/transfer/initiate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -H "x-bank-code: BCA" \
  -d '{
    "fromWalletId": "wallet-bca-001",
    "toWalletId": "wallet-bri-001", 
    "toBankCode": "BRI",
    "amount": 100000,
    "currency": "IDR",
    "reference": "Transfer to BRI account",
    "description": "Monthly payment"
  }'
```

### Sample Response

```json
{
  "success": true,
  "data": {
    "transactionId": "txn-uuid-here",
    "status": "going",
    "transferWallet": {
      "id": "tw-uuid-here",
      "token": "tok-uuid-here", 
      "expiresAt": "2025-06-16T12:30:00.000Z"
    },
    "estimatedCompletionTime": "2025-06-16T12:05:00.000Z",
    "message": "Transfer initiated successfully. Transfer wallet created and ready for fund transfer."
  },
  "timestamp": "2025-06-16T12:00:00.000Z"
}
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd bali-pay-api
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start development server
```bash
npm run dev
```

5. Build for production
```bash
npm run build
npm start
```

## Environment Variables

```env
NODE_ENV=development
PORT=3000
# Add database URL when implementing persistence
DATABASE_URL=your_database_url_here
```

## Test Banks and Wallets

The system comes pre-configured with test banks and wallets:

### Banks
- **BCA** (Bank Central Asia) - API Key: `bca-api-key-123`
- **BRI** (Bank Rakyat Indonesia) - API Key: `bri-api-key-456`  
- **MANDIRI** (Bank Mandiri) - API Key: `mandiri-api-key-789`

### Sample Wallets
- `wallet-bca-001` (BCA) - Balance: 1,000,000 IDR
- `wallet-bri-001` (BRI) - Balance: 750,000 IDR
- `wallet-mandiri-001` (MANDIRI) - Balance: 2,000,000 IDR

## Deployment

### Render Deployment

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables in Render dashboard

### Docker Deployment

```bash
docker build -t bali-pay-api .
docker run -p 3000:3000 bali-pay-api
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please contact the development team.