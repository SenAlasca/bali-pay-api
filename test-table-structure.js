// Test to see what fields exist in the DLB table
require('dotenv').config();
const Airtable = require('airtable');

console.log('🔍 Checking DLB table structure...');

const airtable = new Airtable({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN
});

const base = airtable.base(process.env.AIRTABLE_BASE_ID);

async function checkTableStructure() {
  try {
    console.log('📋 Checking fields in DLB table...');
    
    // Try to create a minimal test record to see what fields are expected
    const testRecord = {
      'Name': 'Test Field Discovery'  // Most tables have a Name field by default
    };

    try {
      const record = await base('DLB').create([{
        fields: testRecord
      }]);
      
      console.log('✅ Test record created successfully!');
      console.log('📄 Record ID:', record[0].id);
      console.log('📄 Record fields:', Object.keys(record[0].fields));
      
      // Clean up - delete the test record
      await base('DLB').destroy([record[0].id]);
      console.log('🗑️ Test record cleaned up');
      
    } catch (createError) {
      console.log('❌ Error creating test record:', createError.message);
      
      if (createError.message.includes('UNKNOWN_FIELD_NAME')) {
        console.log('💡 The "Name" field does not exist. Let me try to read existing records...');
        
        // Try to read existing records to see their structure
        try {
          const records = await base('DLB').select({ maxRecords: 1 }).firstPage();
          
          if (records.length > 0) {
            console.log('📄 Existing record fields:', Object.keys(records[0].fields));
            console.log('📄 Sample record data:', records[0].fields);
          } else {
            console.log('📄 No existing records found in DLB table');
            console.log('💡 Please manually add a record to the DLB table first, or check the field names');
          }
        } catch (readError) {
          console.log('❌ Error reading records:', readError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  }
}

checkTableStructure();
