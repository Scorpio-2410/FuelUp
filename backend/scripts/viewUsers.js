const { pool } = require('../config/database');

async function viewUsers() {
  try {
    console.log('👥 FuelUp Users Database\n');
    console.log('=' .repeat(60));

    // Get user count
    const countQuery = 'SELECT COUNT(*) as total FROM users';
    const countResult = await pool.query(countQuery);
    const totalUsers = countResult.rows[0].total;
    
    console.log(`📊 Total Users: ${totalUsers}`);
    console.log('');

    if (totalUsers === '0') {
      console.log('🔍 No users found in the database.');
      return;
    }

    // Get ALL users with ALL columns in database order
    const usersQuery = `
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
      ORDER BY created_at DESC;
    `;
    
    const usersResult = await pool.query(usersQuery);
    
    console.log('📋 Recent Users (newest first):');
    console.log('-'.repeat(100));
    
    // Define column widths for ALL columns in database order
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
    
    const columns = ['id', 'email', 'username', 'password_hash', 'full_name', 'dob', 'height_cm', 'weight_kg', 'gender', 'avatar_uri', 'notifications_enabled', 'last_login_at', 'follow_up_frequency', 'created_at', 'updated_at'];
    
    // Print header
    console.log('   ' + columns.map(col => {
      const width = columnWidths[col];
      return col.padEnd(width);
    }).join(' │ '));
    
    console.log('   ' + columns.map(col => {
      const width = columnWidths[col];
      return '─'.repeat(width);
    }).join('─┼─'));
    
    // Print user data
    usersResult.rows.forEach(user => {
      const values = columns.map(col => {
        let value = user[col];
        const width = columnWidths[col];
        
        if (value === null || value === undefined) return 'NULL'.padEnd(width);
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

    console.log('');
    
    // Get recent registrations (last 24 hours)
    const recentQuery = `
      SELECT COUNT(*) as recent_count 
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `;
    
    const recentResult = await pool.query(recentQuery);
    const recentCount = recentResult.rows[0].recent_count;
    
    console.log(`🆕 New users in last 24 hours: ${recentCount}`);
    
    // Show the most recent user details
    if (usersResult.rows.length > 0) {
      const latestUser = usersResult.rows[0];
      console.log('\n🔥 Most Recent User:');
      console.log('-'.repeat(30));
      console.log(`ID: ${latestUser.id}`);
      console.log(`Username: ${latestUser.username || 'N/A'}`);
      console.log(`Email: ${latestUser.email}`);
      console.log(`Full Name: ${latestUser.full_name || 'N/A'}`);
      console.log(`Created: ${new Date(latestUser.created_at).toLocaleString()}`);
      console.log(`Last Login: ${latestUser.last_login_at ? new Date(latestUser.last_login_at).toLocaleString() : 'Never'}`);
      console.log(`Notifications: ${latestUser.notifications_enabled ? 'Enabled' : 'Disabled'}`);
    }

    console.log('\n✅ User view complete!');
    
  } catch (error) {
    console.error('❌ Error viewing users:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Check if script is run directly
if (require.main === module) {
  viewUsers();
}

module.exports = { viewUsers };
