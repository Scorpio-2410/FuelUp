// Script to view step tracking data in the database
// Run with: node backend/scripts/viewStepData.js

const { pool } = require("../config/database");

async function viewStepData() {
  try {
    console.log("\n🔍 Checking Step Tracking Database...\n");
    console.log("=" .repeat(80));

    // Get all users
    const usersResult = await pool.query(
      `SELECT id, username, email, created_at FROM users ORDER BY id`
    );

    if (usersResult.rows.length === 0) {
      console.log("❌ No users found in database");
      return;
    }

    console.log(`\n👥 Found ${usersResult.rows.length} user(s):\n`);
    usersResult.rows.forEach(user => {
      console.log(`   ID: ${user.id} | Username: ${user.username} | Email: ${user.email}`);
    });

    console.log("\n" + "=".repeat(80));

    // For each user, show their step data
    for (const user of usersResult.rows) {
      console.log(`\n📊 Step Data for User: ${user.username} (ID: ${user.id})`);
      console.log("-".repeat(80));

      const stepsResult = await pool.query(
        `SELECT 
          id,
          date,
          step_count,
          calories,
          created_at,
          updated_at
         FROM step_streaks 
         WHERE user_id = $1 
         ORDER BY date DESC 
         LIMIT 30`,
        [user.id]
      );

      if (stepsResult.rows.length === 0) {
        console.log("   ❌ No step data found for this user\n");
        continue;
      }

      console.log(`   ✅ Found ${stepsResult.rows.length} day(s) of data:\n`);
      
      stepsResult.rows.forEach(step => {
        const date = new Date(step.date).toISOString().split('T')[0];
        const created = new Date(step.created_at).toLocaleString();
        const updated = new Date(step.updated_at).toLocaleString();
        const goalMet = step.step_count >= 8000 ? '✅' : '❌';
        
        console.log(`   ${goalMet} Date: ${date}`);
        console.log(`      Steps: ${step.step_count.toLocaleString()} | Calories: ${step.calories || 'N/A'}`);
        console.log(`      Created: ${created}`);
        console.log(`      Updated: ${updated}`);
        console.log();
      });

      // Calculate stats
      const statsResult = await pool.query(
        `SELECT 
          COUNT(*) as total_days,
          SUM(step_count) as total_steps,
          AVG(step_count) as avg_steps,
          MAX(step_count) as max_steps,
          MIN(step_count) as min_steps
         FROM step_streaks
         WHERE user_id = $1`,
        [user.id]
      );

      const stats = statsResult.rows[0];
      console.log("   📈 Overall Statistics:");
      console.log(`      Total Days Logged: ${stats.total_days}`);
      console.log(`      Total Steps: ${parseInt(stats.total_steps || 0).toLocaleString()}`);
      console.log(`      Average Steps/Day: ${Math.round(stats.avg_steps || 0).toLocaleString()}`);
      console.log(`      Best Day: ${parseInt(stats.max_steps || 0).toLocaleString()} steps`);
      console.log(`      Worst Day: ${parseInt(stats.min_steps || 0).toLocaleString()} steps`);
      
      // Check streak
      const today = new Date().toISOString().split('T')[0];
      const streakCheck = await pool.query(
        `SELECT date, step_count 
         FROM step_streaks 
         WHERE user_id = $1 AND step_count >= 8000
         ORDER BY date DESC 
         LIMIT 10`,
        [user.id]
      );

      console.log(`\n   🔥 Streak Information:`);
      if (streakCheck.rows.length === 0) {
        console.log(`      No days with 8000+ steps found`);
      } else {
        console.log(`      Days with 8000+ steps: ${streakCheck.rows.length}`);
        console.log(`      Most recent: ${new Date(streakCheck.rows[0].date).toISOString().split('T')[0]}`);
        
        // Calculate consecutive streak
        let streak = 0;
        let checkDate = new Date(today);
        
        for (let i = 0; i < 365; i++) {
          const dateStr = checkDate.toISOString().split('T')[0];
          const hasSteps = streakCheck.rows.some(row => {
            const rowDate = new Date(row.date).toISOString().split('T')[0];
            return rowDate === dateStr;
          });
          
          if (hasSteps) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        
        console.log(`      Current Streak: ${streak} day(s)`);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ Database check complete!\n");

  } catch (error) {
    console.error("❌ Error checking database:", error.message);
    console.error(error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

viewStepData();

