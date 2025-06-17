import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import { AirtableService } from '../services/AirtableService';

export class AirtableController {
  /**
   * Get Airtable connection status
   */
  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const isConnected = await AirtableService.validateConnection();
      const response: ApiResponse = {
        success: isConnected,        data: {
          connected: isConnected,
          baseId: process.env.AIRTABLE_BASE_ID ? '***configured***' : null,
          accessToken: process.env.AIRTABLE_ACCESS_TOKEN ? '***configured***' : null,
          requiredTables: ['DLB'],
          tableStructure: AirtableService.getRequiredTableStructure()
        },
        message: isConnected ? 
          'Airtable integration is working properly' : 
          'Airtable integration not available - check configuration and table setup',
        timestamp: new Date().toISOString()
      };
      res.status(isConnected ? 200 : 503).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to check Airtable status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get transactions for a specific bank from Airtable
   */
  static async getTransactionsByBank(req: Request, res: Response): Promise<void> {
    try {
      const { bankCode } = req.params;
        // Validate bank code (optional - we can retrieve all or filter by bank)
      const validBankCodes = ['BCA', 'BRI', 'MANDIRI', 'DLB', 'ALL'];
      if (!validBankCodes.includes(bankCode.toUpperCase())) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid bank code. Must be one of: BCA, BRI, MANDIRI, DLB, or ALL',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      const transactions = await AirtableService.getTransactionsByBank(bankCode.toUpperCase());
      const response: ApiResponse = {
        success: true,
        data: {
          bankCode: bankCode.toUpperCase(),
          transactions,
          count: transactions.length
        },
        message: `Retrieved ${transactions.length} transactions from Airtable for ${bankCode.toUpperCase()}`,
        timestamp: new Date().toISOString()
      };
      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to retrieve transactions from Airtable',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }
}
