const { pool } = require('../config/database');

async function viewAllData() {
  try {
    console.log('📊 FuelUp Database Data\n');
    console.log('=' .repeat(60));

    // Get all tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      // Get row count for each table
      const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
      const countResult = await pool.query(countQuery);
      const rowCount = countResult.rows[0].count;
      
      console.log(`\n🏗️  Table: ${tableName} (${rowCount} rows)`);
      console.log('-'.repeat(50));
      
      if (rowCount === '0') {
        console.log('   📭 No data found');
        continue;
      }
      
      // Get ALL data from each table
      let dataQuery;
      if (tableName === 'users') {
        // Use ALL columns for users table in database order (same as viewUsers.js)
        dataQuery = `
          SELECT 
            id,
            email,
            username,
            password_hash,
            full_name,
            dob,
            height_cm,
            weight_kg,
            gender,
            avatar_uri,
            notifications_enabled,
            last_login_at,
            follow_up_frequency,
            created_at,
            updated_at
          FROM users 
          ORDER BY created_at DESC
        `;
      } else {
        dataQuery = `SELECT * FROM ${tableName} ORDER BY id DESC`;
      }
      const dataResult = await pool.query(dataQuery);
      
      if (dataResult.rows.length > 0) {
        // Define column widths for better formatting (all user columns)
        const columnWidths = {
          'id': 4,
          'email': 25,
          'username': 15,
          'password_hash': 12,
          'full_name': 18,
          'dob': 12,
          'height_cm': 10,
          'weight_kg': 10,
          'gender': 10,
          'avatar_uri': 12,
          'notifications_enabled': 8,
          'last_login_at': 12,
          'follow_up_frequency': 12,
          'created_at': 12,
          'updated_at': 12
        };
        
        const columns = Object.keys(dataResult.rows[0]);
        
        // Print header with custom widths
        console.log('   ' + columns.map(col => {
          const width = columnWidths[col] || 15;
          return col.padEnd(width);
        }).join(' │ '));
        
        console.log('   ' + columns.map(col => {
          const width = columnWidths[col] || 15;
          return '─'.repeat(width);
        }).join('─┼─'));
        
        // Print data rows with custom formatting
        dataResult.rows.forEach(row => {
          const values = columns.map(col => {
            let value = row[col];
            const width = columnWidths[col] || 15;
            
            if (value === null) return 'NULL'.padEnd(width);
            if (value instanceof Date) return value.toLocaleDateString().padEnd(width);
            if (typeof value === 'boolean') return (value ? 'Yes' : 'No').padEnd(width);
            
            let stringValue = String(value);
            // Special handling for password_hash - show first 8 chars + ...
            if (col === 'password_hash' && stringValue.length > 8) {
              stringValue = stringValue.substring(0, 8) + '...';
            } else if (stringValue.length > width - 1) {
              stringValue = stringValue.substring(0, width - 4) + '...';
            }
            return stringValue.padEnd(width);
          });
          console.log('   ' + values.join(' │ '));
        });
        
        console.log(`\n   📊 Total: ${rowCount} rows`);
      }
    }

    console.log('\n✅ Data view complete!');
    
  } catch (error) {
    console.error('❌ Error viewing data:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Check if script is run directly
if (require.main === module) {
  viewAllData();
}

module.exports = { viewAllData };
