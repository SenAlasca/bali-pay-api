import Airtable, { FieldSet, Record } from 'airtable';
import { Transaction } from '../types';

// Interface for Airtable transaction record
interface AirtableTransactionRecord extends FieldSet {
  'Transaction ID': string;
  'Bank-code': string;  // Note: hyphen, not space
  'Wallet-from': string; // Note: hyphen, not space
  'Wallet-to': string;   // Note: hyphen, not space
  'Amount': number;
  'Currency': string;
  'Reference': string;
  'Description': string;
  'Status': 'Recieved' | 'Done' | 'Canceled'; // Note: misspelled as in Airtable
}

export class AirtableService {
  private static getAirtable() {
    const apiKey = process.env.AIRTABLE_ACCESS_TOKEN;
    if (!apiKey) {
      throw new Error('AIRTABLE_ACCESS_TOKEN environment variable is not set');
    }
    return new Airtable({ apiKey });
  }

  private static getBase() {
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!baseId) {
      throw new Error('AIRTABLE_BASE_ID environment variable is not set');
    }
    const airtable = this.getAirtable();
    return airtable.base(baseId);
  }
  /**
   * Check if Airtable is properly configured
   */
  static isConfigured(): boolean {
    return !!(process.env.AIRTABLE_ACCESS_TOKEN && process.env.AIRTABLE_BASE_ID);
  }
  /**
   * Log a transaction to Airtable
   * Uses "DLB" as the table name for all transactions
   */  static async logTransaction(
    transaction: Transaction,
    status: 'Recieved' | 'Done' | 'Canceled' = 'Recieved' // Updated to match Airtable spelling
  ): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ Airtable not configured - skipping transaction logging');
        return false;
      }

      const base = this.getBase();
      
      // Use "DLB" as the table name for all transactions
      const tableName = 'DLB';
        const record: AirtableTransactionRecord = {
        'Transaction ID': transaction.id,
        'Bank-code': transaction.fromBankCode,  // Updated field name
        'Wallet-from': transaction.fromWalletId, // Updated field name
        'Wallet-to': transaction.toWalletId,     // Updated field name
        'Amount': transaction.amount,
        'Currency': transaction.currency,
        'Reference': transaction.reference || '',
        'Description': transaction.description || '',
        'Status': status
      };await base(tableName).create([
        {
          fields: record
        }
      ]);

      console.log(`✅ Transaction ${transaction.id} logged to Airtable table: ${tableName}`);
      return true;

    } catch (error) {
      console.error('❌ Error logging transaction to Airtable:', error);
      
      // Check if it's a table not found error
      if (error instanceof Error && error.message.includes('NOT_FOUND')) {
        console.error(`❌ Airtable table "${transaction.fromBankCode}" not found. Please create the table in your Airtable base.`);
      }
      
      return false;
    }
  }  /**
   * Update transaction status in Airtable
   */  static async updateTransactionStatus(
    transactionId: string,
    bankCode: string,
    status: 'Recieved' | 'Done' | 'Canceled' // Updated spelling
  ): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ Airtable not configured - skipping status update');
        return false;
      }

      const base = this.getBase();
      const tableName = 'DLB'; // Use DLB table for all transactions

      // Find the record by Transaction ID
      const records = await base(tableName).select({
        filterByFormula: `{Transaction ID} = '${transactionId}'`,
        maxRecords: 1
      }).firstPage();

      if (records.length === 0) {
        console.error(`❌ Transaction ${transactionId} not found in Airtable table: ${tableName}`);
        return false;
      }

      const recordId = records[0].id;
      await base(tableName).update([
        {
          id: recordId,
          fields: {
            'Status': status
          }
        }
      ]);

      console.log(`✅ Transaction ${transactionId} status updated to "${status}" in Airtable`);
      return true;

    } catch (error) {
      console.error('❌ Error updating transaction status in Airtable:', error);
      return false;
    }
  }  /**
   * Get all transactions from Airtable DLB table
   */
  static async getTransactionsByBank(bankCode: string): Promise<AirtableTransactionRecord[]> {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ Airtable not configured - returning empty transactions');
        return [];
      }

      const base = this.getBase();
      const tableName = 'DLB'; // Use DLB table for all transactions      // Filter by bank code if needed, or return all transactions
      const records = await base(tableName).select({
        filterByFormula: bankCode ? `{Bank-code} = '${bankCode}'` : '', // Updated field name
        sort: [{ field: 'Transaction ID', direction: 'desc' }]
      }).all();

      return records.map(record => record.fields as unknown as AirtableTransactionRecord);

    } catch (error) {
      console.error(`❌ Error fetching transactions from Airtable table ${bankCode}:`, error);
      return [];
    }
  }  /**
   * Validate Airtable connection and base access
   */
  static async validateConnection(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ Airtable not configured - cannot validate connection');
        return false;
      }

      const base = this.getBase();
      
      // Try to access the DLB table
      const testTableName = 'DLB';
      
      await base(testTableName).select({
        maxRecords: 1,
        view: 'Grid view' // Default view name
      }).firstPage();

      console.log('✅ Airtable connection validated successfully');
      return true;

    } catch (error) {
      console.error('❌ Airtable connection validation failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('NOT_FOUND')) {
          console.error('❌ Please check your AIRTABLE_BASE_ID and ensure the DLB table exists');
        } else if (error.message.includes('UNAUTHORIZED')) {
          console.error('❌ Please check your AIRTABLE_ACCESS_TOKEN');
        }
      }
      
      return false;
    }
  }
  /**
   * Create the required table structure
   * Note: This is for reference - table should be created manually in Airtable
   */  static getRequiredTableStructure(): object {
    return {
      name: 'DLB (Transaction Table)',
      fields: [
        { name: 'Transaction ID', type: 'singleLineText' },
        { name: 'Bank-code', type: 'singleLineText' },      // Note: hyphen not space
        { name: 'Wallet-from', type: 'singleLineText' },    // Note: hyphen not space  
        { name: 'Wallet-to', type: 'singleLineText' },      // Note: hyphen not space
        { name: 'Amount', type: 'number', options: { precision: 0 } },
        { name: 'Currency', type: 'singleLineText' },
        { name: 'Reference', type: 'singleLineText' },
        { name: 'Description', type: 'multilineText' },
        { 
          name: 'Status', 
          type: 'singleSelect', 
          options: { 
            choices: [
              { name: 'Received' },  // Note: correct spelling
              { name: 'Done' },
              { name: 'Canceled' }
            ]
          }
        }
      ]
    };
  }

  /**
   * Check if a bank table exists in Airtable
   * This determines if a bank is "connected" to the Bali Pay network
   */
  static async isBankConnected(bankCode: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ Airtable not configured - cannot validate bank connection');
        return false;
      }

      const base = this.getBase();
      
      // Try to access the bank's table
      await base(bankCode).select({
        maxRecords: 1,
        view: 'Grid view' // Default view name
      }).firstPage();

      console.log(`✅ Bank ${bankCode} is connected to Bali Pay network (table exists)`);
      return true;

    } catch (error) {
      console.log(`❌ Bank ${bankCode} is not connected to Bali Pay network (table not found)`);
      return false;
    }
  }

  /**
   * Get all connected banks by checking which tables exist in Airtable
   */
  static async getConnectedBanks(): Promise<string[]> {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ Airtable not configured - returning empty bank list');
        return [];
      }

      // List of potential bank codes to check
      const potentialBankCodes = ['BCA', 'BRI', 'MANDIRI', 'DLB', 'CIMB', 'DANAMON', 'BNI', 'BTN'];
      const connectedBanks: string[] = [];

      for (const bankCode of potentialBankCodes) {
        const isConnected = await this.isBankConnected(bankCode);
        if (isConnected) {
          connectedBanks.push(bankCode);
        }
      }

      console.log(`📋 Connected banks: ${connectedBanks.join(', ')}`);
      return connectedBanks;

    } catch (error) {
      console.error('❌ Error getting connected banks:', error);
      return [];
    }
  }
}
