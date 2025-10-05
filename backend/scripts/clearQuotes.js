const { pool } = require("../config/database");

/**
 * 1. Run: cd backend && node scripts/clearQuotes.js
 * 2. This deletes ALL quotes and authors (you have 3 seconds to cancel)
 * 3. Then run importQuotes.js to reimport fresh data
 */

const clearQuotes = async () => {
  const client = await pool.connect();
  
  try {
    console.log("⚠️  WARNING: This will delete ALL quotes and authors!");
    console.log("Press Ctrl+C within 3 seconds to cancel...\n");
    
    // Give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log("🗑️  Deleting quotes...");
    const quotesResult = await client.query('DELETE FROM motivational_quotes');
    console.log(`   Deleted ${quotesResult.rowCount} quotes`);
    
    console.log("🗑️  Deleting authors...");
    const authorsResult = await client.query('DELETE FROM quote_authors');
    console.log(`   Deleted ${authorsResult.rowCount} authors`);
    
    console.log("\n✅ All quotes and authors cleared successfully!");
    console.log("   You can now run: node scripts/importQuotes.js\n");
    
  } catch (error) {
    console.error("\n❌ Clear failed:", error);
    throw error;
  } finally {
    client.release();
  }
};

// Run if executed directly
if (require.main === module) {
  clearQuotes()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = { clearQuotes };

