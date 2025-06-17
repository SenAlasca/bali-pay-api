import { TransferWallet, Transaction, TransactionStep } from '../types';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage (replace with database in production)
const transferWallets: Map<string, TransferWallet> = new Map();
const transactions: Map<string, Transaction> = new Map();
const transactionSteps: Map<string, TransactionStep[]> = new Map();

export class TransferWalletModel {
  static createTransferWallet(transactionId: string, amount: number, currency: string): TransferWallet {
    const transferWallet: TransferWallet = {
      id: `tw-${uuidv4()}`,
      transactionId,
      amount,
      currency,
      token: `tok-${uuidv4()}`,
      status: 'created',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiry
    };

    transferWallets.set(transferWallet.id, transferWallet);
    return transferWallet;
  }

  static getTransferWalletById(id: string): TransferWallet | undefined {
    return transferWallets.get(id);
  }

  static getTransferWalletByToken(token: string): TransferWallet | undefined {
    return Array.from(transferWallets.values()).find(tw => tw.token === token);
  }

  static updateTransferWalletStatus(id: string, status: TransferWallet['status']): boolean {
    const transferWallet = transferWallets.get(id);
    if (!transferWallet) return false;

    transferWallet.status = status;
    transferWallets.set(id, transferWallet);
    return true;
  }

  static isTransferWalletExpired(id: string): boolean {
    const transferWallet = transferWallets.get(id);
    return transferWallet ? transferWallet.expiresAt < new Date() : true;
  }

  static getAllTransferWallets(): TransferWallet[] {
    return Array.from(transferWallets.values());
  }
}

export class TransactionModel {
  static createTransaction(data: {
    fromBankCode: string;
    toBankCode: string;
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    currency: string;
    reference?: string;
    description?: string;
  }): Transaction {
    const transaction: Transaction = {
      id: `txn-${uuidv4()}`,
      ...data,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      steps: []
    };

    transactions.set(transaction.id, transaction);
    transactionSteps.set(transaction.id, []);
    return transaction;
  }

  static getTransactionById(id: string): Transaction | undefined {
    const transaction = transactions.get(id);
    if (transaction) {
      transaction.steps = transactionSteps.get(id) || [];
    }
    return transaction;
  }

  static updateTransactionStatus(id: string, status: Transaction['status']): boolean {
    const transaction = transactions.get(id);
    if (!transaction) return false;

    transaction.status = status;
    transaction.updatedAt = new Date();
    transactions.set(id, transaction);
    return true;
  }

  static setTransferWallet(transactionId: string, transferWalletId: string): boolean {
    const transaction = transactions.get(transactionId);
    if (!transaction) return false;

    transaction.transferWalletId = transferWalletId;
    transaction.updatedAt = new Date();
    transactions.set(transactionId, transaction);
    return true;
  }

  static addTransactionStep(transactionId: string, step: Omit<TransactionStep, 'id' | 'transactionId' | 'timestamp'>): boolean {
    const steps = transactionSteps.get(transactionId) || [];
    const newStep: TransactionStep = {
      id: `step-${uuidv4()}`,
      transactionId,
      timestamp: new Date(),
      ...step
    };

    steps.push(newStep);
    transactionSteps.set(transactionId, steps);
    return true;
  }

  static getAllTransactions(): Transaction[] {
    return Array.from(transactions.values()).map(transaction => ({
      ...transaction,
      steps: transactionSteps.get(transaction.id) || []
    }));
  }

  static getTransactionsByBankCode(bankCode: string): Transaction[] {
    return Array.from(transactions.values())
      .filter(transaction => 
        transaction.fromBankCode === bankCode || transaction.toBankCode === bankCode
      )
      .map(transaction => ({
        ...transaction,
        steps: transactionSteps.get(transaction.id) || []
      }));
  }
}
