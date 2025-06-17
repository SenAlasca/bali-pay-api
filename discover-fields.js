// Simple test to read existing records and discover field names
require('dotenv').config();
const Airtable = require('airtable');

async function discoverFields() {
  console.log('🔍 Discovering fields in DLB table...');

  try {
    const airtable = new Airtable({
      apiKey: process.env.AIRTABLE_ACCESS_TOKEN
    });

    const base = airtable.base(process.env.AIRTABLE_BASE_ID);

    // Try to read any existing records
    console.log('📋 Reading existing records...');
    const records = await base('DLB').select({ maxRecords: 5 }).firstPage();
    
    console.log(`📊 Found ${records.length} existing records`);
    
    if (records.length > 0) {
      console.log('\n📋 Available field names:');
      const allFields = new Set();
      
      records.forEach((record, index) => {
        console.log(`\nRecord ${index + 1}:`);
        const fields = Object.keys(record.fields);
        fields.forEach(field => {
          allFields.add(field);
          console.log(`  - "${field}": ${JSON.stringify(record.fields[field])}`);
        });
      });
      
      console.log('\n📋 Summary of all unique field names found:');
      Array.from(allFields).sort().forEach(field => {
        console.log(`  - "${field}"`);
      });
      
    } else {
      console.log('📭 No existing records found');
      console.log('💡 Please manually add at least one record to the DLB table with the fields you want to use');
      console.log('💡 Suggested fields:');
      console.log('  - Transaction ID');
      console.log('  - Bank Code'); 
      console.log('  - Wallet From');
      console.log('  - Wallet To');
      console.log('  - Amount');
      console.log('  - Currency');
      console.log('  - Reference');
      console.log('  - Description');
      console.log('  - Status');
    }

  } catch (error) {
    console.error('❌ Error discovering fields:', error.message);
    
    if (error.message.includes('NOT_FOUND')) {
      console.error('💡 The DLB table does not exist. Please create it first.');
    }
  }
}

discoverFields();
