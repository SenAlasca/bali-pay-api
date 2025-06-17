import { Bank } from '../types';
import { AirtableService } from '../services/AirtableService';

// In-memory storage (replace with database in production)
const banks: Map<string, Bank> = new Map();
const banksByCode: Map<string, Bank> = new Map();

// Initialize with some test banks
const testBanks: Bank[] = [
  {
    id: 'bank-1',
    name: 'Bank Central Asia',
    code: 'BCA',
    apiKey: 'bca-api-key-123',
    isActive: true,
    registeredAt: new Date(),
    endpoints: {
      incoming: 'https://api.bca.co.id/bali-pay/incoming',
      status: 'https://api.bca.co.id/bali-pay/status'
    }
  },
  {
    id: 'bank-2',
    name: 'Bank Rakyat Indonesia',
    code: 'BRI',
    apiKey: 'bri-api-key-456',
    isActive: true,
    registeredAt: new Date(),
    endpoints: {
      incoming: 'https://api.bri.co.id/bali-pay/incoming',
      status: 'https://api.bri.co.id/bali-pay/status'
    }
  },  {
    id: 'bank-3',
    name: 'Bank Mandiri',
    code: 'MANDIRI',
    apiKey: 'mandiri-api-key-789',
    isActive: true,
    registeredAt: new Date(),
    endpoints: {
      incoming: 'https://api.bankmandiri.co.id/bali-pay/incoming',
      status: 'https://api.bankmandiri.co.id/bali-pay/status'
    }
  },
  {
    id: 'bank-4',
    name: 'DLB Bank',
    code: 'DLB',
    apiKey: 'dlb-api-key-2024',
    isActive: true,
    registeredAt: new Date(),
    endpoints: {
      incoming: 'https://api.dlb.co.id/bali-pay/incoming',
      status: 'https://api.dlb.co.id/bali-pay/status'
    }
  }
];

// Initialize test data
testBanks.forEach(bank => {
  banks.set(bank.id, bank);
  banksByCode.set(bank.code, bank);
});

export class BankModel {
  static getAllBanks(): Bank[] {
    return Array.from(banks.values());
  }

  static getBankById(id: string): Bank | undefined {
    return banks.get(id);
  }

  static getBankByCode(code: string): Bank | undefined {
    return banksByCode.get(code);
  }

  static getBankByApiKey(apiKey: string): Bank | undefined {
    return Array.from(banks.values()).find(bank => bank.apiKey === apiKey);
  }
  static isValidBank(bankCode: string): boolean {
    const bank = banksByCode.get(bankCode);
    return bank !== undefined && bank.isActive;
  }

  /**
   * Check if a bank is connected to Bali Pay network via Airtable
   * This is the new dynamic validation method
   */
  static async isValidBankAsync(bankCode: string): Promise<boolean> {
    // First check if bank exists in our local registry
    const bank = banksByCode.get(bankCode);
    if (!bank || !bank.isActive) {
      console.log(`❌ Bank ${bankCode} not found in local registry or inactive`);
      return false;
    }

    // Then check if bank has a table in Airtable (meaning it's connected to network)
    const isConnected = await AirtableService.isBankConnected(bankCode);
    return isConnected;
  }

  /**
   * Get all banks that are connected to the Bali Pay network
   */
  static async getConnectedBanks(): Promise<Bank[]> {
    const connectedBankCodes = await AirtableService.getConnectedBanks();
    const connectedBanks: Bank[] = [];

    for (const bankCode of connectedBankCodes) {
      const bank = banksByCode.get(bankCode);
      if (bank && bank.isActive) {
        connectedBanks.push(bank);
      }
    }

    return connectedBanks;
  }

  static registerBank(bank: Omit<Bank, 'id' | 'registeredAt'>): Bank {
    const newBank: Bank = {
      ...bank,
      id: `bank-${Date.now()}`,
      registeredAt: new Date()
    };
    
    banks.set(newBank.id, newBank);
    banksByCode.set(newBank.code, newBank);
    
    return newBank;
  }

  static updateBank(id: string, updates: Partial<Bank>): Bank | null {
    const bank = banks.get(id);
    if (!bank) return null;

    const updatedBank = { ...bank, ...updates };
    banks.set(id, updatedBank);
    
    // Update code mapping if code changed
    if (updates.code && updates.code !== bank.code) {
      banksByCode.delete(bank.code);
      banksByCode.set(updates.code, updatedBank);
    }
    
    return updatedBank;
  }

  static deactivateBank(id: string): boolean {
    const bank = banks.get(id);
    if (!bank) return false;

    bank.isActive = false;
    banks.set(id, bank);
    return true;
  }
}
