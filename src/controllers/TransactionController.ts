import { Request, Response } from 'express';
import { ApiResponse, TransferRequest } from '../types';
import { TransactionService } from '../services/TransactionService';
import { TransactionModel } from '../models/Transaction';

export class TransactionController {
  // Initiate a transfer between banks
  static async initiateTransfer(req: Request, res: Response): Promise<void> {
    try {
      const { fromWalletId, toWalletId, amount, currency, toBankCode, reference, description } = req.body;
      const fromBankCode = req.bank!.code; // From authenticated bank

      const transferRequest: TransferRequest = {
        fromBankCode,
        toBankCode,
        fromWalletId,
        toWalletId,
        amount,
        currency,
        reference,
        description
      };

      const result = await TransactionService.processTransfer(transferRequest);

      const response: ApiResponse = {
        success: result.status === 'going',
        data: result,
        message: result.message,
        timestamp: new Date().toISOString()
      };

      const statusCode = result.status === 'going' ? 200 : 400;
      res.status(statusCode).json(response);

    } catch (error) {
      console.error('Error in initiateTransfer:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to process transfer request',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  // Execute the actual fund transfer to transfer wallet
  static async executeTransfer(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;

      const transaction = TransactionModel.getTransactionById(transactionId);
      if (!transaction) {
        const response: ApiResponse = {
          success: false,
          error: 'Transaction not found',
          message: 'The specified transaction does not exist',
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }

      // Verify the requesting bank owns the transaction
      if (transaction.fromBankCode !== req.bank!.code) {
        const response: ApiResponse = {
          success: false,
          error: 'Unauthorized',
          message: 'You can only execute transfers from your own bank',
          timestamp: new Date().toISOString()
        };
        res.status(403).json(response);
        return;
      }

      const success = await TransactionService.transferFundsToTransferWallet(transactionId);

      if (success) {
        // After successful fund transfer, notify the destination bank
        await TransactionService.notifyDestinationBank(transactionId);
      }

      const response: ApiResponse = {
        success,
        data: { transactionId, executed: success },
        message: success ? 'Funds transferred to transfer wallet and destination bank notified' : 'Failed to execute transfer',
        timestamp: new Date().toISOString()
      };

      const statusCode = success ? 200 : 400;
      res.status(statusCode).json(response);

    } catch (error) {
      console.error('Error in executeTransfer:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to execute transfer',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  // Complete the transfer (called by destination bank)
  static async completeTransfer(req: Request, res: Response): Promise<void> {
    try {
      const { transferWalletToken, destinationWalletId } = req.body;

      if (!transferWalletToken || !destinationWalletId) {
        const response: ApiResponse = {
          success: false,
          error: 'Missing required fields',
          message: 'transferWalletToken and destinationWalletId are required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      const success = await TransactionService.completeTransfer(transferWalletToken, destinationWalletId);

      const response: ApiResponse = {
        success,
        data: { completed: success },
        message: success ? 'Transfer completed successfully' : 'Failed to complete transfer',
        timestamp: new Date().toISOString()
      };

      const statusCode = success ? 200 : 400;
      res.status(statusCode).json(response);

    } catch (error) {
      console.error('Error in completeTransfer:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to complete transfer',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  // Get transaction status
  static async getTransactionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;

      const transaction = TransactionModel.getTransactionById(transactionId);
      if (!transaction) {
        const response: ApiResponse = {
          success: false,
          error: 'Transaction not found',
          message: 'The specified transaction does not exist',
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }

      // Verify the requesting bank is involved in the transaction
      if (transaction.fromBankCode !== req.bank!.code && transaction.toBankCode !== req.bank!.code) {
        const response: ApiResponse = {
          success: false,
          error: 'Unauthorized',
          message: 'You can only view transactions involving your bank',
          timestamp: new Date().toISOString()
        };
        res.status(403).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: transaction,
        message: 'Transaction details retrieved successfully',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);

    } catch (error) {
      console.error('Error in getTransactionStatus:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve transaction status',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  // Get bank's transactions
  static async getBankTransactions(req: Request, res: Response): Promise<void> {
    try {
      const bankCode = req.bank!.code;
      const transactions = TransactionModel.getTransactionsByBankCode(bankCode);

      const response: ApiResponse = {
        success: true,
        data: { transactions, count: transactions.length },
        message: 'Bank transactions retrieved successfully',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);    } catch (error) {
      console.error('Error in getBankTransactions:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve bank transactions',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  // Cancel a transaction
  static async cancelTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const { reason } = req.body;

      const transaction = TransactionModel.getTransactionById(transactionId);
      if (!transaction) {
        const response: ApiResponse = {
          success: false,
          error: 'Transaction not found',
          message: 'The specified transaction does not exist',
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }

      // Verify the requesting bank is involved in the transaction
      if (transaction.fromBankCode !== req.bank!.code && transaction.toBankCode !== req.bank!.code) {
        const response: ApiResponse = {
          success: false,
          error: 'Unauthorized',
          message: 'You can only cancel transactions involving your bank',
          timestamp: new Date().toISOString()
        };
        res.status(403).json(response);
        return;
      }

      const success = await TransactionService.cancelTransaction(transactionId, reason);

      const response: ApiResponse = {
        success,
        data: { transactionId, cancelled: success },
        message: success ? 'Transaction cancelled successfully' : 'Failed to cancel transaction',
        timestamp: new Date().toISOString()
      };

      const statusCode = success ? 200 : 400;
      res.status(statusCode).json(response);

    } catch (error) {
      console.error('Error in cancelTransaction:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to cancel transaction',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }
}
