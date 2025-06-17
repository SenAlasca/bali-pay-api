// Test Airtable connection
require('dotenv').config();
const Airtable = require('airtable');

console.log('🔍 Testing Airtable Connection...');
console.log('Base ID:', process.env.AIRTABLE_BASE_ID);
console.log('Access Token:', process.env.AIRTABLE_ACCESS_TOKEN ? '***configured***' : 'NOT SET');

const airtable = new Airtable({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN
});

const base = airtable.base(process.env.AIRTABLE_BASE_ID);

async function testConnection() {
  try {
    console.log('\n📋 Testing access to BCA table...');
    
    // Try to read records from BCA table
    const records = await base('BCA').select({
      maxRecords: 1
    }).firstPage();
    
    console.log('✅ Successfully connected to Airtable!');
    console.log(`📊 BCA table has ${records.length} records (showing max 1)`);
    
    if (records.length > 0) {
      console.log('📄 Sample record fields:', Object.keys(records[0].fields));
    }
    
    // Test other tables
    const bankCodes = ['BRI', 'MANDIRI'];
    for (const bankCode of bankCodes) {
      try {
        const testRecords = await base(bankCode).select({ maxRecords: 1 }).firstPage();
        console.log(`✅ ${bankCode} table is accessible`);
      } catch (error) {
        console.log(`❌ ${bankCode} table not found or not accessible`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing Airtable connection:', error.message);
    
    if (error.message.includes('NOT_FOUND')) {
      console.error('💡 Make sure you have created tables named: BCA, BRI, MANDIRI in your Airtable base');
    } else if (error.message.includes('UNAUTHORIZED')) {
      console.error('💡 Check your AIRTABLE_ACCESS_TOKEN');
    }
  }
}

testConnection();
