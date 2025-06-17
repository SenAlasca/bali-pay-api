// Test Airtable connection for DLB table
require('dotenv').config();
const Airtable = require('airtable');

console.log('🔍 Testing Airtable Connection for DLB...');
console.log('Base ID:', process.env.AIRTABLE_BASE_ID);
console.log('Access Token:', process.env.AIRTABLE_ACCESS_TOKEN ? '***configured***' : 'NOT SET');

const airtable = new Airtable({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN
});

const base = airtable.base(process.env.AIRTABLE_BASE_ID);

async function testDLBConnection() {
  try {
    console.log('\n📋 Testing access to DLB table...');
    
    // Try to read records from DLB table
    const records = await base('DLB').select({
      maxRecords: 1
    }).firstPage();
    
    console.log('✅ Successfully connected to Airtable!');
    console.log(`📊 DLB table has ${records.length} records (showing max 1)`);
    
    if (records.length > 0) {
      console.log('📄 Sample record fields:', Object.keys(records[0].fields));
      console.log('📄 Sample record data:', records[0].fields);
    }
    
    console.log('\n✅ DLB table is accessible and ready for transactions!');
    
  } catch (error) {
    console.error('❌ Error testing Airtable connection:', error.message);
    
    if (error.message.includes('NOT_FOUND')) {
      console.error('💡 The DLB table does not exist in your Airtable base.');
      console.error('💡 Please create a table named "DLB" with the required fields:');
      console.error('   - Transaction ID (Single line text)');
      console.error('   - Bank Code (Single line text)');
      console.error('   - Wallet From (Single line text)');
      console.error('   - Wallet To (Single line text)');
      console.error('   - Amount (Number)');
      console.error('   - Currency (Single line text)');
      console.error('   - Reference (Single line text)');
      console.error('   - Description (Long text)');
      console.error('   - Status (Single select: Received, Done, Canceled)');
    } else if (error.message.includes('UNAUTHORIZED')) {
      console.error('💡 Check your AIRTABLE_ACCESS_TOKEN permissions');
    } else {
      console.error('💡 Full error:', error);
    }
  }
}

testDLBConnection();
