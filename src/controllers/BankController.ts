import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import { BankModel } from '../models/Bank';
import { WalletModel } from '../models/Wallet';
import { AirtableService } from '../services/AirtableService';

export class BankController {  // Get network status and connected banks (Airtable-only mode)
  static async getNetworkStatus(req: Request, res: Response): Promise<void> {
    try {
      // Get banks that are connected to the network (have Airtable tables)
      const connectedBankCodes = await AirtableService.getConnectedBanks();

      const response: ApiResponse = {
        success: true,
        data: {
          totalBanks: connectedBankCodes.length,
          activeBanks: connectedBankCodes.length,
          connectedBanks: connectedBankCodes.length,
          networkStatus: connectedBankCodes.length > 0 ? 'online' : 'offline',
          banks: connectedBankCodes.map(bankCode => ({
            code: bankCode,
            name: bankCode, // Use bank code as name since no local registry
            isActive: true,
            isConnected: true,
            registeredAt: new Date().toISOString() // Placeholder timestamp
          })),
          airtableMode: true,
          description: 'Banks are validated via Airtable table existence only'
        },
        message: `Network online with ${connectedBankCodes.length} connected banks`,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in getNetworkStatus:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve network status',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }
  // Get bank information (Airtable-only mode)
  static async getBankInfo(req: Request, res: Response): Promise<void> {
    try {
      const bankCode = req.bank!.code;
      
      // In Airtable-only mode, we get basic info from the authenticated request
      // Check if bank is connected (this was already verified in auth middleware)
      const isConnected = await AirtableService.isBankConnected(bankCode);
      
      if (!isConnected) {
        const response: ApiResponse = {
          success: false,
          error: 'Bank not connected',
          message: 'Bank is not connected to the Bali Pay network',
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }

      // Get wallets for this bank (filter by bank code since we don't have bank ID)
      const allWallets = WalletModel.getAllWallets();
      const bankWallets = allWallets.filter(wallet => {
        const bank = BankModel.getBankById(wallet.bankId);
        return bank?.code === bankCode;
      });

      const response: ApiResponse = {
        success: true,
        data: {
          bank: {
            id: bankCode, // Use bank code as ID
            name: bankCode, // Use bank code as name since we don't have local registry
            code: bankCode,
            isActive: true, // If auth passed, bank is active
            isConnected: true,
            registeredAt: new Date().toISOString() // Current time as placeholder
          },
          wallets: bankWallets.map(wallet => ({
            id: wallet.id,
            accountNumber: wallet.accountNumber,
            balance: wallet.balance,
            currency: wallet.currency,
            isActive: wallet.isActive
          })),
          walletCount: bankWallets.length
        },
        message: 'Bank information retrieved successfully',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in getBankInfo:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve bank information',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }  // Validate if a bank is connected to network (Airtable-only mode)
  static async validateBank(req: Request, res: Response): Promise<void> {
    try {
      const { bankCode } = req.params;

      // Check if bank has a table in Airtable (only validation needed now)
      const isConnected = await AirtableService.isBankConnected(bankCode);

      const response: ApiResponse = {
        success: true,
        data: {
          bankCode,
          isRegistered: isConnected, // Bank is "registered" if it has Airtable table
          isActive: isConnected, // Bank is "active" if it has Airtable table
          isConnected: isConnected,
          bankName: bankCode, // Use bank code as name since no local registry
          networkStatus: isConnected ? 'connected' : 'disconnected',
          message: isConnected ? 
            'Bank is connected to Bali Pay network (Airtable table exists)' : 
            'Bank is not connected to network (no Airtable table found)'
        },
        message: `Bank ${bankCode} validation completed`,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in validateBank:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to validate bank',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }
}

export class WalletController {  // Get wallet information (Airtable-only mode)
  static async getWalletInfo(req: Request, res: Response): Promise<void> {
    try {
      const { walletId } = req.params;
      const wallet = WalletModel.getWalletById(walletId);

      if (!wallet) {
        const response: ApiResponse = {
          success: false,
          error: 'Wallet not found',
          message: 'The specified wallet does not exist',
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }

      // Verify the wallet belongs to the requesting bank
      const bank = BankModel.getBankById(wallet.bankId);
      if (!bank || bank.code !== req.bank!.code) {
        const response: ApiResponse = {
          success: false,
          error: 'Unauthorized',
          message: 'You can only view wallets belonging to your bank',
          timestamp: new Date().toISOString()
        };
        res.status(403).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          id: wallet.id,
          accountNumber: wallet.accountNumber,
          balance: wallet.balance,
          currency: wallet.currency,
          isActive: wallet.isActive,
          bankCode: bank.code,
          bankName: bank.code // Use bank code as name since no local registry
        },
        message: 'Wallet information retrieved successfully',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in getWalletInfo:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve wallet information',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }
  // Get all wallets for the authenticated bank (Airtable-only mode)
  static async getBankWallets(req: Request, res: Response): Promise<void> {
    try {
      const bankCode = req.bank!.code;
      
      // Get wallets for this bank (filter by bank code since we don't have bank ID)
      const allWallets = WalletModel.getAllWallets();
      const bankWallets = allWallets.filter(wallet => {
        const bank = BankModel.getBankById(wallet.bankId);
        return bank?.code === bankCode;
      });

      const response: ApiResponse = {
        success: true,
        data: {
          wallets: bankWallets.map(wallet => ({
            id: wallet.id,
            accountNumber: wallet.accountNumber,
            balance: wallet.balance,
            currency: wallet.currency,
            isActive: wallet.isActive
          })),
          count: bankWallets.length,
          totalBalance: bankWallets.reduce((sum, wallet) => sum + wallet.balance, 0)
        },
        message: 'Bank wallets retrieved successfully',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in getBankWallets:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve bank wallets',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  // Validate wallet
  static async validateWallet(req: Request, res: Response): Promise<void> {
    try {
      const { walletId } = req.params;
      const wallet = WalletModel.getWalletById(walletId);
      const isValid = WalletModel.isValidWallet(walletId);

      const response: ApiResponse = {
        success: true,
        data: {
          walletId,
          exists: !!wallet,
          isActive: isValid,
          accountNumber: wallet?.accountNumber || null,
          currency: wallet?.currency || null
        },
        message: `Wallet ${walletId} validation completed`,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in validateWallet:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to validate wallet',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }
}