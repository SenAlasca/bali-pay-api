import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import controllers and middleware
import { TransactionController } from './controllers/TransactionController';
import { BankController, WalletController } from './controllers/BankController';
import { AirtableController } from './controllers/AirtableController';
import { authenticateBank, authenticateBankAirtableOnly, validateTransferRequest } from './middleware/auth';
import { ApiResponse } from './types';
import { AirtableService } from './services/AirtableService';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Basic routes
app.get('/', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      message: 'Welcome to Bali Pay Transaction Network API',
      version: '1.0.0',
      status: 'healthy',
      description: 'Interbank transfer system for Indonesian banks',
      endpoints: {
        health: '/api/health',
        network: '/api/network/status',
        transfer: '/api/transfer/initiate',
        status: '/api/transaction/:id/status'
      }
    },
    timestamp: new Date().toISOString()
  };
  res.json(response);
});

app.get('/api/health', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    },
    message: 'Bali Pay Transaction Network is healthy',
    timestamp: new Date().toISOString()
  };
  res.json(response);
});

// Public routes (no authentication required)
app.get('/api/network/status', BankController.getNetworkStatus);
app.get('/api/bank/:bankCode/validate', BankController.validateBank);
app.get('/api/wallet/:walletId/validate', WalletController.validateWallet);

// Airtable status endpoint
app.get('/api/airtable/status', AirtableController.getStatus);

// Protected routes (require bank authentication via Airtable only)
// Bank management routes
app.get('/api/bank/info', authenticateBankAirtableOnly, BankController.getBankInfo);
app.get('/api/bank/wallets', authenticateBankAirtableOnly, WalletController.getBankWallets);
app.get('/api/wallet/:walletId', authenticateBankAirtableOnly, WalletController.getWalletInfo);

// Transaction routes
app.post('/api/transfer/initiate', authenticateBankAirtableOnly, validateTransferRequest, TransactionController.initiateTransfer);
app.post('/api/transfer/:transactionId/execute', authenticateBankAirtableOnly, TransactionController.executeTransfer);
app.post('/api/transfer/complete', authenticateBankAirtableOnly, TransactionController.completeTransfer);
app.post('/api/transaction/:transactionId/cancel', authenticateBankAirtableOnly, TransactionController.cancelTransaction);
app.get('/api/transaction/:transactionId/status', authenticateBankAirtableOnly, TransactionController.getTransactionStatus);
app.get('/api/transactions', authenticateBankAirtableOnly, TransactionController.getBankTransactions);

// Airtable transaction retrieval endpoint
app.get('/api/airtable/transactions/:bankCode', AirtableController.getTransactionsByBank);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Handle 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

app.listen(port, async () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Validate Airtable connection
  if (process.env.AIRTABLE_ACCESS_TOKEN && process.env.AIRTABLE_BASE_ID) {
    console.log('🔗 Validating Airtable connection...');
    const airtableConnected = await AirtableService.validateConnection();
    if (airtableConnected) {
      console.log('✅ Airtable integration enabled and connected');
    } else {
      console.log('⚠️ Airtable connection failed - transactions will not be logged to Airtable');
      console.log('📋 Required Airtable table structure:');
      console.log(JSON.stringify(AirtableService.getRequiredTableStructure(), null, 2));
    }
  } else {
    console.log('⚠️ Airtable configuration missing - set AIRTABLE_ACCESS_TOKEN and AIRTABLE_BASE_ID');
  }
});

export default app;
