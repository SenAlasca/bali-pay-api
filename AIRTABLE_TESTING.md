# Airtable Integration Testing Guide

This guide explains how to test the complete Airtable integration with the Bali Pay Transaction Network API.

## Overview

The API now uses Airtable to determine which banks are "connected" to the Bali Pay network. A bank is considered connected if:
1. It exists in the local bank registry (hardcoded for demo)
2. It has an active status
3. **It has a corresponding table in your Airtable base**

## Prerequisites

### Airtable Setup

1. **Airtable Base ID**: `appOstcmBVuedYn0c` (already configured in .env)
2. **Access Token**: `patYKkp4riGG9QbRE.012c9bcbc41bd472dc43c6dbda0f1260496f65618e42aa83c0ad611126df50c2` (already configured)

### Required Airtable Table Structure

Create a table named **DLB** in your Airtable base with these fields:

| Field Name | Field Type | Description |
|------------|------------|-------------|
| Transaction ID | Single line text | Unique transaction identifier |
| Bank Code | Single line text | Source bank code (BCA, BRI, MANDIRI, DLB) |
| Wallet From | Single line text | Source wallet ID |
| Wallet To | Single line text | Destination wallet ID |
| Amount | Number | Transaction amount |
| Currency | Single line text | Currency (IDR) |
| Reference | Single line text | Transaction reference |
| Description | Long text | Transaction description |
| Status | Single select | Options: Received, Done, Canceled |

## Testing Steps

### 1. Test Airtable Connection

First, verify your Airtable connection:

```powershell
node test-airtable.js
```

**Expected Output:**
```
🔍 Testing Airtable Connection...
Base ID: appOstcmBVuedYn0c
Access Token: ***configured***

📋 Testing access to DLB table...
✅ Successfully connected to Airtable!
📊 DLB table has 0 records (showing max 1)
```

### 2. Start the Development Server

```powershell
npm run dev
```

**Expected Output:**
```
🚀 Server is running on port 3000
📱 Environment: development
🔗 Validating Airtable connection...
✅ Airtable integration enabled and connected
```

### 3. Test Bank Connectivity Validation

#### Test Network Status (shows connected banks)
```powershell
curl http://localhost:3000/api/network/status
```

**Expected Response:**
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
        "registeredAt": "..."
      }
    ],
    "inactiveBanks": [
      {
        "code": "BCA",
        "name": "Bank Central Asia",
        "isActive": true,
        "isConnected": false,
        "registeredAt": "..."
      }
    ]
  },
  "message": "Network online with 1 connected banks",
  "timestamp": "..."
}
```

#### Test Individual Bank Validation
```powershell
# Test DLB (should be connected if table exists)
curl http://localhost:3000/api/bank/DLB/validate

# Test BCA (should be disconnected if no table)
curl http://localhost:3000/api/bank/BCA/validate
```

### 4. Test Airtable Status Endpoint

```powershell
curl http://localhost:3000/api/airtable/status
```

**Expected Response:**
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
      "fields": [...]
    }
  },
  "message": "Airtable integration is working properly",
  "timestamp": "..."
}
```

### 5. Test Transaction Flow with Airtable Logging

#### Initiate a Transfer (DLB Bank)
```powershell
curl -X POST http://localhost:3000/api/transfer/initiate `
-H "Content-Type: application/json" `
-H "X-API-Key: dlb-api-key-2024" `
-H "X-Bank-Code: DLB" `
-d '{
  "fromWalletId": "wallet-dlb-001",
  "toWalletId": "wallet-dlb-002", 
  "amount": 100000,
  "currency": "IDR",
  "toBankCode": "DLB",
  "reference": "TEST-AIRTABLE-001",
  "description": "Testing Airtable integration with DLB bank"
}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "...",
    "transferToken": "...",
    "status": "pending",
    "expiresAt": "...",
    "transferWallet": {
      "id": "...",
      "balance": 100000
    }
  },
  "message": "Transfer initiated successfully",
  "timestamp": "..."
}
```

#### Check Airtable for Logged Transaction
```powershell
curl http://localhost:3000/api/airtable/transactions/DLB
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "bankCode": "DLB",
    "transactions": [
      {
        "Transaction ID": "...",
        "Bank Code": "DLB",
        "Wallet From": "wallet-dlb-001",
        "Wallet To": "wallet-dlb-002",
        "Amount": 100000,
        "Currency": "IDR",
        "Reference": "TEST-AIRTABLE-001",
        "Description": "Testing Airtable integration with DLB bank",
        "Status": "Received"
      }
    ],
    "count": 1
  },
  "message": "Retrieved 1 transactions from Airtable for DLB",
  "timestamp": "..."
}
```

### 6. Test Authentication with Non-Connected Banks

Try to make a request with a bank that doesn't have an Airtable table:

```powershell
curl -X POST http://localhost:3000/api/transfer/initiate `
-H "Content-Type: application/json" `
-H "X-API-Key: bca-api-key-123" `
-H "X-Bank-Code: BCA" `
-d '{
  "fromWalletId": "wallet-bca-001",
  "toWalletId": "wallet-bca-002", 
  "amount": 50000,
  "currency": "IDR",
  "toBankCode": "BCA",
  "reference": "TEST-FAIL",
  "description": "This should fail"
}'
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "error": "Bank not connected",
  "message": "Bank is not connected to the Bali Pay transaction network. Please ensure your bank table exists in Airtable.",
  "timestamp": "..."
}
```

## What This Demonstrates

1. **Dynamic Bank Validation**: Banks are validated against Airtable tables rather than hardcoded lists
2. **Network Status**: Shows which banks are actually connected to the network
3. **Transaction Logging**: All transactions are automatically logged to the DLB table
4. **Security**: Only banks with Airtable tables can process transactions
5. **Unified Storage**: All bank transactions go to one DLB table with Bank Code differentiation

## Troubleshooting

### "Table not found" errors
- Ensure the DLB table exists in your Airtable base
- Check that all required fields are created with correct types

### "Unauthorized" errors
- Verify your AIRTABLE_ACCESS_TOKEN is correct
- Ensure the token has read/write permissions to your base

### "Bank not connected" errors
- This is expected behavior for banks without Airtable tables
- Create a table named after the bank code to "connect" them to the network

## Next Steps

To connect additional banks:
1. Create tables named after their bank codes (BCA, BRI, MANDIRI)
2. Use the same field structure as the DLB table
3. The banks will automatically appear as "connected" in network status

This system makes the Bali Pay network truly dynamic - any bank can join by having their table created in Airtable!
