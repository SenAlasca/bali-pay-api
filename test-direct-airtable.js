// Test Airtable row creation directly
require('dotenv').config();

async function testDirectAirtableLogging() {
  console.log('🧪 Testing direct Airtable row creation...');

  try {
    // Import the compiled service
    const { AirtableService } = require('./dist/services/AirtableService');
    
    console.log('✅ Successfully imported AirtableService');

    // Check if Airtable is configured
    const isConfigured = AirtableService.isConfigured();
    console.log('🔧 Airtable configured:', isConfigured);

    if (!isConfigured) {
      console.log('❌ Airtable not configured properly');
      return;
    }

    // Create a test transaction object
    const testTransaction = {
      id: 'test-txn-' + Date.now(),
      fromBankCode: 'DLB',
      toBankCode: 'DLB',
      fromWalletId: 'wallet-dlb-001',
      toWalletId: 'wallet-dlb-002',
      amount: 50000,
      currency: 'IDR',
      reference: 'TEST-DIRECT-AIRTABLE',
      description: 'Testing direct Airtable logging',
      status: 'pending',
      createdAt: new Date(),
      steps: []
    };    console.log('📝 Attempting to log transaction to Airtable...');
    console.log('Transaction ID:', testTransaction.id);

    const success = await AirtableService.logTransaction(testTransaction, 'Recieved'); // Use correct spelling
    
    if (success) {
      console.log('✅ Successfully logged transaction to Airtable!');
      
      // Wait a moment then try to retrieve it
      console.log('⏳ Waiting 2 seconds before retrieval...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('📋 Retrieving transactions from Airtable...');
      const transactions = await AirtableService.getTransactionsByBank('DLB');
      console.log(`📊 Found ${transactions.length} transactions in Airtable`);
      
      if (transactions.length > 0) {
        console.log('📄 Latest transaction:', JSON.stringify(transactions[0], null, 2));
      }
    } else {
      console.log('❌ Failed to log transaction to Airtable');
    }

  } catch (error) {
    console.error('❌ Error during direct Airtable test:', error);
    console.error('Error stack:', error.stack);
  }
}

testDirectAirtableLogging();
