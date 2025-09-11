const { pool } = require('../config/database');

async function viewDatabaseSchema() {
  try {
    console.log('🔍 FuelUp Database Schema\n');
    console.log('=' .repeat(50));

    // Get all tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    console.log(`📊 Tables (${tablesResult.rows.length}):`);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log('');

    // Get detailed schema for each table
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      console.log(`🏗️  Table: ${tableName}`);
      console.log('-'.repeat(30));
      
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position;
      `;
      
      const columnsResult = await pool.query(columnsQuery, [tableName]);
      
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        
        console.log(`  ${col.column_name.padEnd(25)} ${col.data_type}${length} ${nullable}${defaultVal}`);
      });
      
      // Get foreign keys
      const fkQuery = `
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = $1;
      `;
      
      const fkResult = await pool.query(fkQuery, [tableName]);
      
      if (fkResult.rows.length > 0) {
        console.log('  🔗 Foreign Keys:');
        fkResult.rows.forEach(fk => {
          console.log(`    ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }
      
      console.log('');
    }

    // Get indexes
    console.log('📇 Indexes:');
    console.log('-'.repeat(20));
    
    const indexQuery = `
      SELECT 
        indexname,
        tablename,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    const indexResult = await pool.query(indexQuery);
    indexResult.rows.forEach(idx => {
      console.log(`  ${idx.tablename}.${idx.indexname}`);
    });

    console.log('\n✅ Schema view complete!');
    
  } catch (error) {
    console.error('❌ Error viewing schema:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

viewDatabaseSchema();
