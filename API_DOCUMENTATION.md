# Bali Pay Transaction Network API Documentation

## Overview

The Bali Pay Transaction Network API is a secure interbank transfer system for Indonesian banks. It enables banks to process transfers between registered institutions using temporary transfer wallets and token-based authentication. The system integrates with Airtable for transaction logging and uses dynamic bank validation based on Airtable table existence.

**Base URL**: `http://localhost:3000` (Development)  
**Version**: 1.0.0  
**Protocol**: HTTP/HTTPS  
**Content Type**: `application/json`

## Authentication

All protected endpoints require authentication headers:

| Header | Description | Required |
|--------|-------------|----------|
| `x-api-key` | Bank's API key | Yes |
| `x-bank-code` | Bank's 3-letter code | Yes |

### Supported Banks

| Bank Code | Bank Name | API Key | Status |
|-----------|-----------|---------|---------|
| `BCA` | Bank Central Asia | `bca-api-key-123` | Registered |
| `BRI` | Bank Rakyat Indonesia | `bri-api-key-456` | Registered |
| `MANDIRI` | Bank Mandiri | `mandiri-api-key-789` | Registered |
| `DLB` | DLB Bank | `dlb-api-key-2024` | Registered & Connected |

**Note**: Banks are only considered "connected" to the network if they have corresponding tables in the Airtable base. Currently, only DLB is connected.

## Response Format

All API responses follow this consistent format:

```json
{
  "success": boolean,
  "data": object | null,
  "message": string,
  "error": string | null,
  "timestamp": string (ISO 8601)
}
```

## Endpoints

### Public Endpoints

#### 1. Health Check

Check if the API is running and healthy.

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2025-06-17T10:00:00.000Z",
    "uptime": 123.456,
    "environment": "development",
    "version": "1.0.0"
  },
  "message": "Bali Pay Transaction Network is healthy",
  "timestamp": "2025-06-17T10:00:00.000Z"
}
```

#### 2. Network Status

Get the status of the Bali Pay network and connected banks.

**Request:**
```http
GET /api/network/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBanks": 4,
    "activeBanks": 4,
    "connectedBanks": 1,
    "networkStatus": "online",
    "banks": [
      {
        "code": "DLB",
        "name": "DLB Bank",
        "isActive": true,
        "isConnected": true,
        "registeredAt": "2025-06-17T10:00:00.000Z"
      }
    ],
    "inactiveBanks": [
      {
        "code": "BCA",
        "name": "Bank Central Asia",
        "isActive": true,
        "isConnected": false,
        "registeredAt": "2025-06-17T10:00:00.000Z"
      }
    ]
  },
  "message": "Network online with 1 connected banks",
  "timestamp": "2025-06-17T10:00:00.000Z"
}
```

#### 3. Bank Validation

Validate if a bank is registered, active, and connected to the network.

**Request:**
```http
GET /api/bank/{bankCode}/validate
```

**Parameters:**
- `bankCode` (path): Bank code (BCA, BRI, MANDIRI, DLB)

**Response:**
```json
{
  "success": true,
  "data": {
    "bankCode": "DLB",
    "isRegistered": true,
    "isActive": true,
    "isConnected": true,
    "bankName": "DLB Bank",
    "networkStatus": "connected",
    "message": "Bank is connected to Bali Pay network"
  },
  "message": "Bank DLB validation completed",
  "timestamp": "2025-06-17T10:00:00.000Z"
}
```

#### 4. Wallet Validation

Validate if a wallet exists and is accessible.

**Request:**
```http
GET /api/wallet/{walletId}/validate
```

**Parameters:**
- `walletId` (path): Wallet identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "walletId": "wallet-dlb-001",
    "exists": true,
    "isActive": true,
    "bankCode": "DLB"
  },
  "message": "Wallet validation completed",
  "timestamp": "2025-06-17T10:00:00.000Z"
}
```

### Airtable Integration Endpoints

#### 5. Airtable Status

Check the status of Airtable integration.

**Request:**
```http
GET /api/airtable/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "baseId": "***configured***",
    "accessToken": "***configured***",
    "requiredTables": ["DLB"],
    "tableStructure": {
      "name": "DLB (Transaction Table)",
      "fields": [
        { "name": "Transaction ID", "type": "singleLineText" },
        { "name": "Bank-code", "type": "singleLineText" },
        { "name": "Wallet-from", "type": "singleLineText" },
        { "name": "Wallet-to", "type": "singleLineText" },
        { "name": "Amount", "type": "number" },
        { "name": "Currency", "type": "singleLineText" },
        { "name": "Reference", "type": "singleLineText" },
        { "name": "Description", "type": "multilineText" },
        { "name": "Status", "type": "singleSelect" }
      ]
    }
  },
  "message": "Airtable integration is working properly",
  "timestamp": "2025-06-17T10:00:00.000Z"
}
```

#### 6. Get Transactions from Airtable

Retrieve transactions for a specific bank from Airtable.

**Request:**
```http
GET /api/airtable/transactions/{bankCode}
```

**Parameters:**
- `bankCode` (path): Bank code (BCA, BRI, MANDIRI, DLB, ALL)

**Response:**
```json
{
  "success": true,
  "data": {
    "bankCode": "DLB",
    "transactions": [
      {
        "Transaction ID": "txn-123",
        "Bank-code": "DLB",
        "Wallet-from": "wallet-dlb-001",
        "Wallet-to": "wallet-dlb-002",
        "Amount": 100000,
        "Currency": "IDR",
        "Reference": "TEST-001",
        "Description": "Test transaction",
        "Status": "Recieved"
      }
    ],
    "count": 1
  },
  "message": "Retrieved 1 transactions from Airtable for DLB",
  "timestamp": "2025-06-17T10:00:00.000Z"
}
```

### Protected Endpoints (Require Authentication)

#### 7. Get Bank Information

Get information about the authenticated bank.

**Request:**
```http
GET /api/bank/info
Headers:
  x-api-key: dlb-api-key-2024
  x-bank-code: DLB
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bank": {
      "id": "bank-4",
      "name": "DLB Bank",
      "code": "DLB",
      "isActive": true,
      "registeredAt": "2025-06-17T10:00:00.000Z"
    },
    "wallets": [
      {
        "id": "wallet-dlb-001",
        "accountNumber": "DLB001001",
        "balance": 1500000,
        "currency": "IDR",
        "isActive": true
      }
    ],
    "walletCount": 2
  },
  "message": "Bank information retrieved successfully",
  "timestamp": "2025-06-17T10:00:00.000Z"
}
```

#### 8. Get Bank Wallets

Get all wallets belonging to the authenticated bank.

**Request:**
```http
GET /api/bank/wallets
Headers:
  x-api-key: dlb-api-key-2024
  x-bank-code: DLB
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bankCode": "DLB",
    "wallets": [
      {
        "id": "wallet-dlb-001",
        "accountNumber": "DLB001001",
        "balance": 1500000,
        "currency": "IDR",
        "isActive": true
      },
      {
        "id": "wallet-dlb-002",
        "accountNumber": "DLB001002",
        "balance": 800000,
        "currency": "IDR",
        "isActive": true
      }
    ],
    "totalWallets": 2,
    "totalBalance": 2300000
  },
  "message": "Bank wallets retrieved successfully",
  "timestamp": "2025-06-17T10:00:00.000Z"
}
```

#### 9. Get Specific Wallet

Get information about a specific wallet.

**Request:**
```http
GET /api/wallet/{walletId}
Headers:
  x-api-key: dlb-api-key-2024
  x-bank-code: DLB
```

**Parameters:**
- `walletId` (path): Wallet identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "id": "wallet-dlb-001",
      "accountNumber": "DLB001001",
      "balance": 1500000,
      "currency": "IDR",
      "isActive": true,
      "bankId": "bank-4"
    }
  },
  "message": "Wallet information retrieved successfully",
  "timestamp": "2025-06-17T10:00:00.000Z"
}
```

### Transaction Endpoints

#### 10. Initiate Transfer

Initiate a new transfer between banks.

**Request:**
```http
POST /api/transfer/initiate
Headers:
  Content-Type: application/json
  x-api-key: dlb-api-key-2024
  x-bank-code: DLB

Body:
{
  "fromWalletId": "wallet-dlb-001",
  "toWalletId": "wallet-dlb-002",
  "toBankCode": "DLB",
  "amount": 100000,
  "currency": "IDR",
  "reference": "Monthly payment",
  "description": "Payment for services"
}
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fromWalletId` | string | Yes | Source wallet ID |
| `toWalletId` | string | Yes | Destination wallet ID |
| `toBankCode` | string | Yes | Destination bank code |
| `amount` | number | Yes | Transfer amount (positive number) |
| `currency` | string | Yes | Currency code (only IDR supported) |
| `reference` | string | No | Transfer reference |
| `description` | string | No | Transfer description |

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn-abc123",
    "transferToken": "tok-xyz789",
    "status": "pending",
    "expiresAt": "2025-06-17T11:00:00.000Z",
    "transferWallet": {
      "id": "transfer-wallet-001",
      "balance": 100000
    }
  },
  "message": "Transfer initiated successfully",
  "timestamp": "2025-06-17T10:00:00.000Z"
}
```

**Note**: This endpoint automatically logs the transaction to Airtable with status "Recieved".

#### 11. Execute Transfer

Execute a previously initiated transfer.

**Request:**
```http
POST /api/transfer/{transactionId}/execute
Headers:
  x-api-key: dlb-api-key-2024
  x-bank-code: DLB
```

**Parameters:**
- `transactionId` (path): Transaction identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn-abc123",
    "status": "executed",
    "executedAt": "2025-06-17T10:05:00.000Z"
  },
  "message": "Transfer executed successfully",
  "timestamp": "2025-06-17T10:05:00.000Z"
}
```

#### 12. Complete Transfer

Complete a transfer using the transfer token.

**Request:**
```http
POST /api/transfer/complete
Headers:
  Content-Type: application/json
  x-api-key: dlb-api-key-2024
  x-bank-code: DLB

Body:
{
  "transferWalletToken": "tok-xyz789",
  "destinationWalletId": "wallet-dlb-002"
}
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `transferWalletToken` | string | Yes | Transfer wallet token |
| `destinationWalletId` | string | Yes | Final destination wallet |

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn-abc123",
    "status": "completed",
    "completedAt": "2025-06-17T10:10:00.000Z",
    "finalBalance": 900000
  },
  "message": "Transfer completed successfully",
  "timestamp": "2025-06-17T10:10:00.000Z"
}
```

**Note**: This endpoint updates the transaction status to "Done" in Airtable.

#### 13. Cancel Transaction

Cancel a pending transaction.

**Request:**
```http
POST /api/transaction/{transactionId}/cancel
Headers:
  x-api-key: dlb-api-key-2024
  x-bank-code: DLB
```

**Parameters:**
- `transactionId` (path): Transaction identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn-abc123",
    "status": "canceled",
    "canceledAt": "2025-06-17T10:15:00.000Z"
  },
  "message": "Transaction canceled successfully",
  "timestamp": "2025-06-17T10:15:00.000Z"
}
```

**Note**: This endpoint updates the transaction status to "Canceled" in Airtable.

#### 14. Get Transaction Status

Get the current status of a transaction.

**Request:**
```http
GET /api/transaction/{transactionId}/status
Headers:
  x-api-key: dlb-api-key-2024
  x-bank-code: DLB
```

**Parameters:**
- `transactionId` (path): Transaction identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn-abc123",
    "status": "completed",
    "amount": 100000,
    "currency": "IDR",
    "fromWalletId": "wallet-dlb-001",
    "toWalletId": "wallet-dlb-002",
    "createdAt": "2025-06-17T10:00:00.000Z",
    "completedAt": "2025-06-17T10:10:00.000Z",
    "steps": [
      {
        "step": "validation",
        "status": "success",
        "timestamp": "2025-06-17T10:00:00.000Z"
      }
    ]
  },
  "message": "Transaction status retrieved successfully",
  "timestamp": "2025-06-17T10:15:00.000Z"
}
```

#### 15. Get Bank Transactions

Get all transactions for the authenticated bank.

**Request:**
```http
GET /api/transactions
Headers:
  x-api-key: dlb-api-key-2024
  x-bank-code: DLB
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bankCode": "DLB",
    "transactions": [
      {
        "id": "txn-abc123",
        "fromBankCode": "DLB",
        "toBankCode": "DLB",
        "amount": 100000,
        "currency": "IDR",
        "status": "completed",
        "createdAt": "2025-06-17T10:00:00.000Z"
      }
    ],
    "totalTransactions": 1,
    "totalAmount": 100000
  },
  "message": "Bank transactions retrieved successfully",
  "timestamp": "2025-06-17T10:15:00.000Z"
}
```

## Error Responses

### Common Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request parameters or body |
| 401 | Unauthorized | Missing or invalid authentication headers |
| 403 | Forbidden | Bank not connected to network or insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation errors or business logic errors |
| 500 | Internal Server Error | Server-side errors |
| 503 | Service Unavailable | Airtable integration not available |

### Error Response Format

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2025-06-17T10:00:00.000Z"
}
```

### Common Errors

#### Authentication Errors

```json
{
  "success": false,
  "error": "Missing authentication headers",
  "message": "x-api-key and x-bank-code headers are required",
  "timestamp": "2025-06-17T10:00:00.000Z"
}
```

```json
{
  "success": false,
  "error": "Bank not connected",
  "message": "Bank is not connected to the Bali Pay transaction network. Please ensure your bank table exists in Airtable.",
  "timestamp": "2025-06-17T10:00:00.000Z"
}
```

#### Validation Errors

```json
{
  "success": false,
  "error": "Invalid amount",
  "message": "Amount must be a positive number",
  "timestamp": "2025-06-17T10:00:00.000Z"
}
```

```json
{
  "success": false,
  "error": "Insufficient funds",
  "message": "Insufficient funds in source wallet",
  "timestamp": "2025-06-17T10:00:00.000Z"
}
```

## Transaction Flow

### Complete Transfer Process

1. **Initiate Transfer**
   - Call `POST /api/transfer/initiate`
   - System creates transaction and transfer wallet
   - Transaction logged to Airtable with status "Recieved"
   - Returns transaction ID and transfer token

2. **Execute Transfer**
   - Call `POST /api/transfer/{transactionId}/execute`
   - Funds moved from source wallet to transfer wallet
   - Status updated to "executed"

3. **Complete Transfer**
   - Call `POST /api/transfer/complete` with transfer token
   - Funds moved from transfer wallet to destination wallet
   - Transaction status updated to "completed"
   - Airtable status updated to "Done"

### Transaction States

| State | Description |
|-------|-------------|
| `pending` | Transfer initiated, waiting for execution |
| `executed` | Funds moved to transfer wallet |
| `completed` | Transfer completed successfully |
| `canceled` | Transfer canceled before completion |
| `failed` | Transfer failed due to error |

## Rate Limiting

Currently, no rate limiting is implemented. This may be added in future versions.

## Airtable Integration

### Overview

The API integrates with Airtable for:
- **Transaction Logging**: All transactions are automatically logged
- **Bank Validation**: Banks are considered "connected" only if they have corresponding Airtable tables
- **Audit Trail**: Complete transaction history stored in Airtable

### Airtable Table Structure

**Table Name**: `DLB`

| Field Name | Type | Description |
|------------|------|-------------|
| Transaction ID | Single line text | Unique transaction identifier |
| Bank-code | Single line text | Source bank code |
| Wallet-from | Single line text | Source wallet ID |
| Wallet-to | Single line text | Destination wallet ID |
| Amount | Number | Transaction amount |
| Currency | Single line text | Currency code |
| Reference | Single line text | Transaction reference |
| Description | Long text | Transaction description |
| Status | Single select | Transaction status (Recieved, Done, Canceled) |

### Status Mapping

| API Status | Airtable Status | When Updated |
|------------|-----------------|--------------|
| `pending` | `Recieved` | Transaction initiated |
| `completed` | `Done` | Transfer completed |
| `canceled` | `Canceled` | Transaction canceled |

## Testing

### Test Data

**Test Wallets:**
- `wallet-dlb-001` (DLB) - Balance: 1,500,000 IDR
- `wallet-dlb-002` (DLB) - Balance: 800,000 IDR
- `wallet-bca-001` (BCA) - Balance: 1,000,000 IDR (Not connected)
- `wallet-bri-001` (BRI) - Balance: 750,000 IDR (Not connected)

### PowerShell Examples

```powershell
# Health Check
Invoke-WebRequest -Uri "http://localhost:3000/api/health"

# Network Status
Invoke-WebRequest -Uri "http://localhost:3000/api/network/status"

# Initiate Transfer
Invoke-WebRequest -Uri "http://localhost:3000/api/transfer/initiate" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "X-API-Key" = "dlb-api-key-2024"
    "X-Bank-Code" = "DLB"
  } `
  -Body '{"fromWalletId": "wallet-dlb-001", "toWalletId": "wallet-dlb-002", "amount": 100000, "currency": "IDR", "toBankCode": "DLB", "reference": "TEST-001", "description": "Test transfer"}'

# Check Airtable Transactions
Invoke-WebRequest -Uri "http://localhost:3000/api/airtable/transactions/DLB"
```

## Security Considerations

1. **API Keys**: Store API keys securely and rotate regularly
2. **HTTPS**: Use HTTPS in production
3. **Rate Limiting**: Implement rate limiting for production use
4. **Input Validation**: All inputs are validated server-side
5. **Bank Validation**: Only connected banks (with Airtable tables) can process transactions
6. **Transfer Tokens**: Tokens expire and are single-use

## Environment Variables

```bash
NODE_ENV=development
PORT=3000
AIRTABLE_ACCESS_TOKEN=your_airtable_token
AIRTABLE_BASE_ID=your_airtable_base_id
```

## Support

For technical support or API questions, please refer to the project documentation or contact the development team.

---

**Last Updated**: June 17, 2025  
**API Version**: 1.0.0
