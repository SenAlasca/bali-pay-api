import { Request, Response, NextFunction } from 'express';
import { BankModel } from '../models/Bank';
import { AirtableService } from '../services/AirtableService';
import { ApiResponse } from '../types';

// Extend Request interface to include bank information
declare global {
  namespace Express {
    interface Request {
      bank?: {
        id: string;
        code: string;
        name: string;
      };
    }
  }
}

export const authenticateBank = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const bankCode = req.headers['x-bank-code'] as string;

  if (!apiKey || !bankCode) {
    const response: ApiResponse = {
      success: false,
      error: 'Missing authentication headers',
      message: 'x-api-key and x-bank-code headers are required',
      timestamp: new Date().toISOString()
    };
    res.status(401).json(response);
    return;
  }

  const bank = BankModel.getBankByCode(bankCode);
  
  if (!bank) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid bank code',
      message: 'Bank is not registered in the Bali Pay network',
      timestamp: new Date().toISOString()
    };
    res.status(401).json(response);
    return;
  }

  if (bank.apiKey !== apiKey) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid API key',
      message: 'The provided API key is invalid',
      timestamp: new Date().toISOString()
    };
    res.status(401).json(response);
    return;
  }

  if (!bank.isActive) {
    const response: ApiResponse = {
      success: false,
      error: 'Bank inactive',
      message: 'Bank is not active in the Bali Pay network',
      timestamp: new Date().toISOString()
    };
    res.status(403).json(response);
    return;
  }

  // Attach bank information to request
  req.bank = {
    id: bank.id,
    code: bank.code,
    name: bank.name
  };

  next();
};

export const validateTransferRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { fromWalletId, toWalletId, amount, currency, toBankCode } = req.body;

  if (!fromWalletId || !toWalletId || !amount || !currency || !toBankCode) {
    const response: ApiResponse = {
      success: false,
      error: 'Missing required fields',
      message: 'fromWalletId, toWalletId, amount, currency, and toBankCode are required',
      timestamp: new Date().toISOString()
    };
    res.status(400).json(response);
    return;
  }

  if (typeof amount !== 'number' || amount <= 0) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid amount',
      message: 'Amount must be a positive number',
      timestamp: new Date().toISOString()
    };
    res.status(400).json(response);
    return;
  }

  if (currency !== 'IDR') {
    const response: ApiResponse = {
      success: false,
      error: 'Unsupported currency',
      message: 'Only IDR currency is currently supported',
      timestamp: new Date().toISOString()
    };
    res.status(400).json(response);
    return;
  }

  next();
};

/**
 * Authenticate bank using only Airtable table existence
 * Banks no longer need to be registered locally - only need to have a table in Airtable
 */
export const authenticateBankAirtableOnly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const apiKey = req.headers['x-api-key'] as string;
  const bankCode = req.headers['x-bank-code'] as string;

  if (!apiKey || !bankCode) {
    const response: ApiResponse = {
      success: false,
      error: 'Missing authentication headers',
      message: 'x-api-key and x-bank-code headers are required',
      timestamp: new Date().toISOString()
    };
    res.status(401).json(response);
    return;
  }

  // Validate bank code format (should be uppercase alphanumeric)
  if (!/^[A-Z0-9]+$/.test(bankCode)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid bank code format',
      message: 'Bank code must be uppercase alphanumeric (e.g., BCA, DLB, MANDIRI)',
      timestamp: new Date().toISOString()
    };
    res.status(400).json(response);
    return;
  }

  // Validate API key format (should be a non-empty string)
  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid API key format',
      message: 'API key must be a non-empty string',
      timestamp: new Date().toISOString()
    };
    res.status(400).json(response);
    return;
  }

  // Check if bank is connected to network via Airtable (table exists)
  try {
    const isConnected = await AirtableService.isBankConnected(bankCode);
    if (!isConnected) {
      const response: ApiResponse = {
        success: false,
        error: 'Bank not connected',
        message: `Bank ${bankCode} is not connected to the Bali Pay transaction network. Please ensure your bank table exists in Airtable.`,
        timestamp: new Date().toISOString()
      };
      res.status(403).json(response);
      return;
    }

    // Attach bank information to request (simplified - only what we know from headers)
    req.bank = {
      id: bankCode, // Use bank code as ID since we don't have local registry
      code: bankCode,
      name: bankCode // Use bank code as name since we don't have local registry
    };

    console.log(`✅ Bank ${bankCode} authenticated successfully via Airtable`);
    next();

  } catch (error) {
    console.error('❌ Error validating bank connection:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Authentication error',
      message: 'Unable to validate bank connection. Please try again.',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
    return;
  }
};
