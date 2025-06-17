import { Wallet } from '../types';

// In-memory storage (replace with database in production)
const wallets: Map<string, Wallet> = new Map();

// Initialize with some test wallets
const testWallets: Wallet[] = [
  {
    id: 'wallet-bca-001',
    bankId: 'bank-1',
    accountNumber: '1234567890',
    balance: 1000000,
    currency: 'IDR',
    isActive: true
  },
  {
    id: 'wallet-bca-002',
    bankId: 'bank-1',
    accountNumber: '1234567891',
    balance: 500000,
    currency: 'IDR',
    isActive: true
  },
  {
    id: 'wallet-bri-001',
    bankId: 'bank-2',
    accountNumber: '9876543210',
    balance: 750000,
    currency: 'IDR',
    isActive: true
  },  {
    id: 'wallet-mandiri-001',
    bankId: 'bank-3',
    accountNumber: '5555555555',
    balance: 2000000,
    currency: 'IDR',
    isActive: true
  },
  {
    id: 'wallet-dlb-001',
    bankId: 'bank-4',
    accountNumber: 'DLB001001',
    balance: 1500000,
    currency: 'IDR',
    isActive: true
  },
  {
    id: 'wallet-dlb-002',
    bankId: 'bank-4',
    accountNumber: 'DLB001002',
    balance: 800000,
    currency: 'IDR',
    isActive: true
  }
];

// Initialize test data
testWallets.forEach(wallet => {
  wallets.set(wallet.id, wallet);
});

export class WalletModel {
  static getAllWallets(): Wallet[] {
    return Array.from(wallets.values());
  }

  static getWalletById(id: string): Wallet | undefined {
    return wallets.get(id);
  }

  static getWalletsByBankId(bankId: string): Wallet[] {
    return Array.from(wallets.values()).filter(wallet => wallet.bankId === bankId);
  }

  static isValidWallet(walletId: string): boolean {
    const wallet = wallets.get(walletId);
    return wallet !== undefined && wallet.isActive;
  }

  static hasInsufficientFunds(walletId: string, amount: number): boolean {
    const wallet = wallets.get(walletId);
    return !wallet || wallet.balance < amount;
  }

  static updateBalance(walletId: string, amount: number): boolean {
    const wallet = wallets.get(walletId);
    if (!wallet) return false;

    wallet.balance += amount;
    wallets.set(walletId, wallet);
    return true;
  }

  static debitWallet(walletId: string, amount: number): boolean {
    const wallet = wallets.get(walletId);
    if (!wallet || wallet.balance < amount) return false;

    wallet.balance -= amount;
    wallets.set(walletId, wallet);
    return true;
  }

  static creditWallet(walletId: string, amount: number): boolean {
    const wallet = wallets.get(walletId);
    if (!wallet) return false;

    wallet.balance += amount;
    wallets.set(walletId, wallet);
    return true;
  }

  static createWallet(wallet: Omit<Wallet, 'id'>): Wallet {
    const newWallet: Wallet = {
      ...wallet,
      id: `wallet-${Date.now()}`
    };
    
    wallets.set(newWallet.id, newWallet);
    return newWallet;
  }

  static deactivateWallet(id: string): boolean {
    const wallet = wallets.get(id);
    if (!wallet) return false;

    wallet.isActive = false;
    wallets.set(id, wallet);
    return true;
  }
}
