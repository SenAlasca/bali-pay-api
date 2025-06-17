// Bank Registration Types
export interface Bank {
  id: string;
  name: string;
  code: string; // Bank identifier code (e.g., BCA, BRI, MANDIRI)
  apiKey: string;
  isActive: boolean;
  registeredAt: Date;
  endpoints: {
    incoming: string; // URL where we notify the bank of incoming transfers
    status: string; // URL to check bank status
  };
}

// Wallet Types
export interface Wallet {
  id: string;
  bankId: string;
  accountNumber: string;
  balance: number;
  currency: string;
  isActive: boolean;
}

// Transfer Types
export interface TransferRequest {
  fromBankCode: string;
  toBankCode: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: string;
  reference?: string;
  description?: string;
}

export interface TransferWallet {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  token: string;
  status: 'created' | 'funds_received' | 'funds_sent' | 'completed' | 'failed';
  createdAt: Date;
  expiresAt: Date;
}

export interface Transaction {
  id: string;
  fromBankCode: string;
  toBankCode: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'going' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transferWalletId?: string;
  reference?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  steps: TransactionStep[];
}

export interface TransactionStep {
  id: string;
  transactionId: string;
  step: 'validation' | 'transfer_wallet_created' | 'funds_transferred' | 'notification_sent' | 'completed';
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
  details?: any;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface TransferResponse {
  transactionId: string;
  status: 'going' | 'failed';
  transferWallet?: {
    id: string;
    token: string;
    expiresAt: string;
  };
  estimatedCompletionTime?: string;
  message: string;
}

// Bank Notification Types
export interface IncomingTransferNotification {
  transactionId: string;
  fromBankCode: string;
  toWalletId: string;
  amount: number;
  currency: string;
  transferWalletToken: string;
  reference?: string;
  description?: string;
}

// Authentication Types
export interface BankAuthRequest {
  bankCode: string;
  apiKey: string;
}
