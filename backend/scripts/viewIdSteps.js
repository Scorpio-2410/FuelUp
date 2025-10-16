const { Pool } = require('pg');
const readline = require('readline');
require('dotenv').config();

// Database configuration - using same config as the main app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

class ViewIdSteps {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  // Display all users with their IDs, usernames, and full names
  async showAllUsers() {
    try {
      console.log('\n📋 All Users:');
      console.log('=' .repeat(80));
      
      const query = `
        SELECT id, username, full_name 
        FROM users 
        ORDER BY id ASC
      `;
      
      const result = await pool.query(query);
      
      if (result.rows.length === 0) {
        console.log('❌ No users found in the database.');
        return [];
      }
      
      console.log('ID\tUsername\t\tFull Name');
      console.log('-'.repeat(80));
      
      result.rows.forEach(user => {
        const fullName = user.full_name || 'N/A';
        console.log(`${user.id}\t${user.username}\t\t${fullName}`);
      });
      
      console.log('=' .repeat(80));
      return result.rows;
      
    } catch (error) {
      console.error('❌ Error fetching users:', error.message);
      return [];
    }
  }

  // Get user steps history by ID with optional date filter
  async getUserStepsHistory(userId, specificDate = null) {
    try {
      console.log(`\n👤 Fetching steps history for User ID: ${userId}`);
      if (specificDate) {
        console.log(`📅 Filtering by date: ${specificDate}`);
      }
      console.log('=' .repeat(80));
      
      // First, get user info
      const userQuery = `
        SELECT username, full_name 
        FROM users 
        WHERE id = $1
      `;
      
      const userResult = await pool.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        console.log(`❌ User with ID ${userId} not found.`);
        return;
      }
      
      const user = userResult.rows[0];
      const fullName = user.full_name || 'N/A';
      
      console.log(`👤 User: ${user.username} (${fullName})`);
      console.log('-'.repeat(80));
      
      // Get steps history with optional date filter
      let stepsQuery, queryParams;
      if (specificDate) {
        stepsQuery = `
          SELECT 
            date,
            step_count as steps,
            created_at,
            updated_at
          FROM step_streaks 
          WHERE user_id = $1 AND date = $2
          ORDER BY date DESC
        `;
        queryParams = [userId, specificDate];
      } else {
        stepsQuery = `
          SELECT 
            date,
            step_count as steps,
            created_at,
            updated_at
          FROM step_streaks 
          WHERE user_id = $1 
          ORDER BY date DESC
        `;
        queryParams = [userId];
      }
      
      const stepsResult = await pool.query(stepsQuery, queryParams);
      
      if (stepsResult.rows.length === 0) {
        if (specificDate) {
          console.log(`📊 No steps data found for this user on ${specificDate}.`);
        } else {
          console.log('📊 No steps data found for this user.');
        }
        return;
      }
      
      console.log('Date\t\tSteps\t\tUpdated');
      console.log('-'.repeat(80));
      
      stepsResult.rows.forEach(step => {
        const updatedAt = new Date(step.updated_at).toLocaleDateString();
        
        console.log(
          `${step.date}\t${step.steps.toLocaleString()}\t\t${updatedAt}`
        );
      });
      
      // Show summary statistics
      const totalSteps = stepsResult.rows.reduce((sum, row) => sum + row.steps, 0);
      const avgSteps = Math.round(totalSteps / stepsResult.rows.length);
      const maxSteps = Math.max(...stepsResult.rows.map(row => row.steps));
      const minSteps = Math.min(...stepsResult.rows.map(row => row.steps));
      
      console.log('-'.repeat(80));
      console.log(`📈 Summary:`);
      console.log(`   Total Records: ${stepsResult.rows.length}`);
      console.log(`   Total Steps: ${totalSteps.toLocaleString()}`);
      console.log(`   Average Steps: ${avgSteps.toLocaleString()}`);
      console.log(`   Max Steps: ${maxSteps.toLocaleString()}`);
      console.log(`   Min Steps: ${minSteps.toLocaleString()}`);
      
    } catch (error) {
      console.error('❌ Error fetching steps history:', error.message);
    }
  }

  // Show all users with their steps history
  async showAllUsersWithSteps() {
    try {
      console.log('\n👥 All Users with Steps History:');
      console.log('=' .repeat(100));
      
      // Get all users with their steps data
      const query = `
        SELECT 
          u.id,
          u.username,
          u.full_name,
          s.date,
          s.step_count as steps,
          s.created_at,
          s.updated_at
        FROM users u
        LEFT JOIN step_streaks s ON u.id = s.user_id
        ORDER BY u.id ASC, s.date DESC
      `;
      
      const result = await pool.query(query);
      
      if (result.rows.length === 0) {
        console.log('❌ No users found in the database.');
        return;
      }
      
      // Group by user
      const usersMap = new Map();
      
      result.rows.forEach(row => {
        if (!usersMap.has(row.id)) {
          usersMap.set(row.id, {
            id: row.id,
            username: row.username,
            fullName: row.full_name || 'N/A',
            steps: []
          });
        }
        
        if (row.date) { // Only add if there are steps
          usersMap.get(row.id).steps.push({
            date: row.date,
            steps: row.steps,
            created_at: row.created_at,
            updated_at: row.updated_at
          });
        }
      });
      
      // Display each user with their steps
      usersMap.forEach((user, userId) => {
        console.log(`\n👤 User ID: ${user.id} | ${user.username} (${user.fullName})`);
        console.log('-'.repeat(80));
        
        if (user.steps.length === 0) {
          console.log('📊 No steps data found for this user.');
        } else {
          console.log('Date\t\tSteps\t\tUpdated');
          console.log('-'.repeat(60));
          
          user.steps.forEach(step => {
            const updatedAt = new Date(step.updated_at).toLocaleDateString();
            console.log(`${step.date}\t${step.steps.toLocaleString()}\t\t${updatedAt}`);
          });
          
          // Summary for this user
          const totalSteps = user.steps.reduce((sum, step) => sum + step.steps, 0);
          const avgSteps = Math.round(totalSteps / user.steps.length);
          const maxSteps = Math.max(...user.steps.map(step => step.steps));
          const minSteps = Math.min(...user.steps.map(step => step.steps));
          
          console.log('-'.repeat(60));
          console.log(`📈 Summary: ${user.steps.length} records | Total: ${totalSteps.toLocaleString()} | Avg: ${avgSteps.toLocaleString()} | Max: ${maxSteps.toLocaleString()} | Min: ${minSteps.toLocaleString()}`);
        }
        
        console.log('=' .repeat(100));
      });
      
    } catch (error) {
      console.error('❌ Error fetching all users with steps:', error.message);
    }
  }

  // Ask user to select an ID
  askForUserId() {
    return new Promise((resolve) => {
      this.rl.question('\n🔍 Enter User ID to view steps history (or "q" to quit, "all" for all users): ', (answer) => {
        if (answer.toLowerCase() === 'q') {
          resolve(null);
        } else if (answer.toLowerCase() === 'all') {
          resolve('all');
        } else {
          const userId = parseInt(answer);
          if (isNaN(userId) || userId <= 0) {
            console.log('❌ Please enter a valid positive number, "all", or "q".');
            this.askForUserId().then(resolve);
          } else {
            resolve(userId);
          }
        }
      });
    });
  }

  // Main execution method
  async run() {
    try {
      console.log('🚀 View ID Steps - User Steps History Viewer');
      console.log('=' .repeat(80));
      
      // Show all users
      const users = await this.showAllUsers();
      
      if (users.length === 0) {
        console.log('❌ No users available to view.');
        return;
      }
      
      // Ask for user ID
      const userId = await this.askForUserId();
      
      if (userId === null) {
        console.log('👋 Goodbye!');
        return;
      }
      
      // Show steps history
      if (userId === 'all') {
        await this.showAllUsersWithSteps();
      } else {
        await this.getUserStepsHistory(userId);
      }
      
      // Ask if user wants to view another user
      this.rl.question('\n🔄 View another user? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          await this.run();
        } else {
          console.log('👋 Goodbye!');
          this.rl.close();
        }
      });
      
    } catch (error) {
      console.error('❌ Error in main execution:', error.message);
    } finally {
      // Don't close the connection here as we might need it for recursive calls
    }
  }

  // Close connections
  async close() {
    this.rl.close();
    await pool.end();
  }
}

// Run the script if called directly
if (require.main === module) {
  const viewer = new ViewIdSteps();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down gracefully...');
    await viewer.close();
    process.exit(0);
  });
  
  viewer.run().catch(async (error) => {
    console.error('❌ Fatal error:', error.message);
    await viewer.close();
    process.exit(1);
  });
}

module.exports = ViewIdSteps;
