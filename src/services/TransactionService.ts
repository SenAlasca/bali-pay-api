import { TransferRequest, TransferResponse, IncomingTransferNotification } from '../types';
import { BankModel } from '../models/Bank';
import { WalletModel } from '../models/Wallet';
import { TransactionModel, TransferWalletModel } from '../models/Transaction';
import { AirtableService } from './AirtableService';

export class TransactionService {  static async processTransfer(transferRequest: TransferRequest): Promise<TransferResponse> {
    const {
      fromBankCode,
      toBankCode,
      fromWalletId,
      toWalletId,
      amount,
      currency,
      reference,
      description
    } = transferRequest;

    try {
      // Step 1: Validate banks are connected via Airtable (Airtable-only mode)
      const fromBankConnected = await AirtableService.isBankConnected(fromBankCode);
      const toBankConnected = await AirtableService.isBankConnected(toBankCode);

      if (!fromBankConnected || !toBankConnected) {
        return {
          transactionId: '',
          status: 'failed',
          message: 'One or both banks are not connected to the Bali Pay network'
        };
      }

      // Step 2: Validate wallets
      const fromWallet = WalletModel.getWalletById(fromWalletId);
      const toWallet = WalletModel.getWalletById(toWalletId);

      if (!fromWallet || !toWallet) {
        return {
          transactionId: '',
          status: 'failed',
          message: 'One or both wallets do not exist'
        };
      }

      if (!fromWallet.isActive || !toWallet.isActive) {
        return {
          transactionId: '',
          status: 'failed',
          message: 'One or both wallets are not active'
        };
      }

      // Step 3: Check if from wallet belongs to from bank (Airtable-only mode)
      const fromWalletBank = BankModel.getBankById(fromWallet.bankId);
      if (!fromWalletBank || fromWalletBank.code !== fromBankCode) {
        return {
          transactionId: '',
          status: 'failed',
          message: 'Source wallet does not belong to the requesting bank'
        };
      }

      // Step 4: Check if to wallet belongs to to bank (Airtable-only mode)
      const toWalletBank = BankModel.getBankById(toWallet.bankId);
      if (!toWalletBank || toWalletBank.code !== toBankCode) {
        return {
          transactionId: '',
          status: 'failed',
          message: 'Destination wallet does not belong to the target bank'
        };
      }

      // Step 5: Check sufficient funds
      if (WalletModel.hasInsufficientFunds(fromWalletId, amount)) {
        return {
          transactionId: '',
          status: 'failed',
          message: 'Insufficient funds in source wallet'
        };
      }// Step 6: Create transaction
      const transaction = TransactionModel.createTransaction({
        fromBankCode,
        toBankCode,
        fromWalletId,
        toWalletId,
        amount,
        currency,
        reference,
        description
      });

      // Step 6.1: Log transaction to Airtable
      try {
        await AirtableService.logTransaction(transaction, 'Recieved'); // Updated spelling
        console.log(`📝 Transaction ${transaction.id} logged to Airtable table: ${fromBankCode}`);
      } catch (airtableError) {
        console.error('⚠️ Failed to log transaction to Airtable, but continuing with transaction:', airtableError);
        // Don't fail the transaction if Airtable logging fails
      }

      // Step 7: Add validation step
      TransactionModel.addTransactionStep(transaction.id, {
        step: 'validation',
        status: 'success',
        details: { message: 'All validations passed' }
      });

      // Step 8: Create transfer wallet
      const transferWallet = TransferWalletModel.createTransferWallet(
        transaction.id,
        amount,
        currency
      );

      // Step 9: Link transfer wallet to transaction
      TransactionModel.setTransferWallet(transaction.id, transferWallet.id);

      // Step 10: Add transfer wallet creation step
      TransactionModel.addTransactionStep(transaction.id, {
        step: 'transfer_wallet_created',
        status: 'success',
        details: { transferWalletId: transferWallet.id, token: transferWallet.token }
      });

      // Step 11: Update transaction status to "going"
      TransactionModel.updateTransactionStatus(transaction.id, 'going');

      // Step 12: Return success response
      return {
        transactionId: transaction.id,
        status: 'going',
        transferWallet: {
          id: transferWallet.id,
          token: transferWallet.token,
          expiresAt: transferWallet.expiresAt.toISOString()
        },
        estimatedCompletionTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        message: 'Transfer initiated successfully. Transfer wallet created and ready for fund transfer.'
      };

    } catch (error) {
      console.error('Error processing transfer:', error);
      return {
        transactionId: '',
        status: 'failed',
        message: 'Internal server error during transfer processing'
      };
    }
  }

  static async transferFundsToTransferWallet(transactionId: string): Promise<boolean> {
    try {
      const transaction = TransactionModel.getTransactionById(transactionId);
      if (!transaction || !transaction.transferWalletId) {
        return false;
      }

      const transferWallet = TransferWalletModel.getTransferWalletById(transaction.transferWalletId);
      if (!transferWallet) {
        return false;
      }

      // Check if transfer wallet is expired
      if (TransferWalletModel.isTransferWalletExpired(transferWallet.id)) {
        TransactionModel.updateTransactionStatus(transactionId, 'failed');
        TransactionModel.addTransactionStep(transactionId, {
          step: 'funds_transferred',
          status: 'failed',
          details: { error: 'Transfer wallet expired' }
        });
        return false;
      }

      // Debit from source wallet
      const success = WalletModel.debitWallet(transaction.fromWalletId, transaction.amount);
      if (!success) {
        TransactionModel.updateTransactionStatus(transactionId, 'failed');
        TransactionModel.addTransactionStep(transactionId, {
          step: 'funds_transferred',
          status: 'failed',
          details: { error: 'Failed to debit source wallet' }
        });
        return false;
      }

      // Update transfer wallet status
      TransferWalletModel.updateTransferWalletStatus(transferWallet.id, 'funds_received');

      // Update transaction status
      TransactionModel.updateTransactionStatus(transactionId, 'processing');

      // Add successful fund transfer step
      TransactionModel.addTransactionStep(transactionId, {
        step: 'funds_transferred',
        status: 'success',
        details: { 
          amount: transaction.amount,
          fromWalletId: transaction.fromWalletId,
          transferWalletId: transferWallet.id
        }
      });

      return true;
    } catch (error) {
      console.error('Error transferring funds to transfer wallet:', error);
      return false;
    }
  }

  static async notifyDestinationBank(transactionId: string): Promise<boolean> {
    try {
      const transaction = TransactionModel.getTransactionById(transactionId);
      if (!transaction || !transaction.transferWalletId) {
        return false;
      }

      const transferWallet = TransferWalletModel.getTransferWalletById(transaction.transferWalletId);
      if (!transferWallet) {
        return false;
      }      // Check if destination bank is connected (Airtable-only mode)
      const isToBankConnected = await AirtableService.isBankConnected(transaction.toBankCode);
      if (!isToBankConnected) {
        return false;
      }

      const notification: IncomingTransferNotification = {
        transactionId: transaction.id,
        fromBankCode: transaction.fromBankCode,
        toWalletId: transaction.toWalletId,
        amount: transaction.amount,
        currency: transaction.currency,
        transferWalletToken: transferWallet.token,
        reference: transaction.reference,
        description: transaction.description
      };

      // In Airtable-only mode, we simulate the notification process
      // In a real implementation, you would make an HTTP request to the bank's incoming endpoint
      console.log(`Notifying ${transaction.toBankCode} bank about incoming transfer:`, notification);

      // Add notification step
      TransactionModel.addTransactionStep(transactionId, {
        step: 'notification_sent',
        status: 'success',
        details: { 
          bankCode: transaction.toBankCode,
          endpoint: `https://api.${transaction.toBankCode.toLowerCase()}.co.id/bali-pay/incoming`, // Simulated endpoint
          notification
        }
      });

      return true;
    } catch (error) {
      console.error('Error notifying destination bank:', error);
      return false;
    }
  }

  static async completeTransfer(transferWalletToken: string, destinationWalletId: string): Promise<boolean> {
    try {
      const transferWallet = TransferWalletModel.getTransferWalletByToken(transferWalletToken);
      if (!transferWallet) {
        return false;
      }

      const transaction = TransactionModel.getTransactionById(transferWallet.transactionId);
      if (!transaction) {
        return false;
      }

      // Verify destination wallet matches
      if (transaction.toWalletId !== destinationWalletId) {
        return false;
      }

      // Credit destination wallet
      const success = WalletModel.creditWallet(destinationWalletId, transferWallet.amount);
      if (!success) {
        return false;
      }

      // Update transfer wallet status
      TransferWalletModel.updateTransferWalletStatus(transferWallet.id, 'completed');      // Update transaction status
      TransactionModel.updateTransactionStatus(transaction.id, 'completed');

      // Update Airtable status to "Done"
      try {
        await AirtableService.updateTransactionStatus(transaction.id, transaction.fromBankCode, 'Done');
        console.log(`📝 Transaction ${transaction.id} status updated to "Done" in Airtable`);
      } catch (airtableError) {
        console.error('⚠️ Failed to update transaction status in Airtable:', airtableError);
        // Don't fail the transaction if Airtable update fails
      }

      // Add completion step
      TransactionModel.addTransactionStep(transaction.id, {
        step: 'completed',
        status: 'success',
        details: { 
          transferWalletToken,
          destinationWalletId,
          amount: transferWallet.amount
        }
      });

      return true;
    } catch (error) {
      console.error('Error completing transfer:', error);      return false;
    }
  }

  /**
   * Cancel a transaction and update Airtable status
   */
  static async cancelTransaction(transactionId: string, reason?: string): Promise<boolean> {
    try {
      const transaction = TransactionModel.getTransactionById(transactionId);
      if (!transaction) {
        return false;
      }

      // Update transaction status to cancelled
      TransactionModel.updateTransactionStatus(transactionId, 'cancelled');

      // Add cancellation step
      TransactionModel.addTransactionStep(transactionId, {
        step: 'completed',
        status: 'failed',
        details: { 
          reason: reason || 'Transaction cancelled',
          cancelledAt: new Date().toISOString()
        }
      });

      // Update Airtable status to "Canceled"
      try {
        await AirtableService.updateTransactionStatus(transactionId, transaction.fromBankCode, 'Canceled');
        console.log(`📝 Transaction ${transactionId} status updated to "Canceled" in Airtable`);
      } catch (airtableError) {
        console.error('⚠️ Failed to update transaction status in Airtable:', airtableError);
      }

      return true;
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      return false;
    }
  }
}
