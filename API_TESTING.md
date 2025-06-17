# Bali Pay Transaction Network API - Test Examples

This file contains example requests to test the Bali Pay Transaction Network API.

## Prerequisites

Start the development server:
```bash
npm run dev
```

The API will be available at: http://localhost:3000

## 1. Health Check

```bash
curl http://localhost:3000/api/health
```

## 2. Network Status (Public)

```bash
curl http://localhost:3000/api/network/status
```

## 3. Bank Validation (Public)

```bash
curl http://localhost:3000/api/bank/BCA/validate
curl http://localhost:3000/api/bank/BRI/validate
curl http://localhost:3000/api/bank/MANDIRI/validate
```

## 4. Wallet Validation (Public)

```bash
curl http://localhost:3000/api/wallet/wallet-bca-001/validate
curl http://localhost:3000/api/wallet/wallet-bri-001/validate
```

## 5. Authenticated Requests

### Get Bank Information (BCA)
```bash
curl -X GET http://localhost:3000/api/bank/info \
  -H "x-api-key: bca-api-key-123" \
  -H "x-bank-code: BCA"
```

### Get Bank Wallets (BCA)
```bash
curl -X GET http://localhost:3000/api/bank/wallets \
  -H "x-api-key: bca-api-key-123" \
  -H "x-bank-code: BCA"
```

### Get Specific Wallet (BCA)
```bash
curl -X GET http://localhost:3000/api/wallet/wallet-bca-001 \
  -H "x-api-key: bca-api-key-123" \
  -H "x-bank-code: BCA"
```

## 6. Transfer Operations

### Initiate Transfer (BCA to BRI)
```bash
curl -X POST http://localhost:3000/api/transfer/initiate \
  -H "Content-Type: application/json" \
  -H "x-api-key: bca-api-key-123" \
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

### Execute Transfer (Replace TRANSACTION_ID with actual ID from previous response)
```bash
curl -X POST http://localhost:3000/api/transfer/TRANSACTION_ID/execute \
  -H "x-api-key: bca-api-key-123" \
  -H "x-bank-code: BCA"
```

### Complete Transfer (BRI side - Replace TOKEN with actual token)
```bash
curl -X POST http://localhost:3000/api/transfer/complete \
  -H "Content-Type: application/json" \
  -H "x-api-key: bri-api-key-456" \
  -H "x-bank-code: BRI" \
  -d '{
    "transferWalletToken": "TRANSFER_WALLET_TOKEN",
    "destinationWalletId": "wallet-bri-001"
  }'
```

### Get Transaction Status
```bash
curl -X GET http://localhost:3000/api/transaction/TRANSACTION_ID/status \
  -H "x-api-key: bca-api-key-123" \
  -H "x-bank-code: BCA"
```

### Get All Bank Transactions
```bash
curl -X GET http://localhost:3000/api/transactions \
  -H "x-api-key: bca-api-key-123" \
  -H "x-bank-code: BCA"
```

## Test Banks and API Keys

- **BCA**: API Key = `bca-api-key-123`
- **BRI**: API Key = `bri-api-key-456`
- **MANDIRI**: API Key = `mandiri-api-key-789`

## Test Wallets

- `wallet-bca-001` (BCA) - Balance: 1,000,000 IDR
- `wallet-bca-002` (BCA) - Balance: 500,000 IDR
- `wallet-bri-001` (BRI) - Balance: 750,000 IDR
- `wallet-mandiri-001` (MANDIRI) - Balance: 2,000,000 IDR

## Transfer Flow Example

1. **Initiate**: BCA initiates transfer from `wallet-bca-001` to BRI's `wallet-bri-001`
2. **Response**: API returns transaction ID and transfer wallet token with status "going"
3. **Execute**: BCA calls execute endpoint to move funds to transfer wallet
4. **Notify**: API automatically notifies BRI of incoming transfer
5. **Complete**: BRI calls complete endpoint with the token to finalize transfer
6. **Settlement**: Funds are credited to BRI wallet and transaction marked as completed
