const fs = require("fs").promises;
const path = require("path");
const { pool } = require("../config/database");
const QuoteAuthor = require("../models/quoteAuthor");
const MotivationalQuote = require("../models/motivationalQuote");

/**
 * HOW TO USE:
 * 1. Edit backend/data/quotes.json - add your quotes in JSON format
 * 2. Run: cd backend && node scripts/importQuotes.js
 * 3. Done! Only new quotes are imported, duplicates are skipped
 * 
 * To start fresh: Run clearQuotes.js first, then this script
 */

const importQuotes = async () => {
  const client = await pool.connect();
  
  try {
    console.log("🚀 Starting quote import...\n");

    // Read JSON file
    const jsonPath = path.join(__dirname, "../data/quotes.json");
    const fileContent = await fs.readFile(jsonPath, "utf-8");
    const quotesData = JSON.parse(fileContent);

    console.log(`📄 Found ${quotesData.length} quotes in quotes.json\n`);

    // Ask if user wants to clear existing data
    const existingCount = await client.query('SELECT COUNT(*) FROM motivational_quotes');
    const count = parseInt(existingCount.rows[0].count);
    
    if (count > 0) {
      console.log(`⚠️  Database already has ${count} quotes.`);
      console.log("   This script will ADD new quotes without removing existing ones.");
      console.log("   To clear all quotes first, run: node scripts/clearQuotes.js\n");
    }

    await client.query('BEGIN');
    
    let authorCount = 0;
    let quoteCount = 0;
    let skippedCount = 0;
    const authorCache = new Map();

    for (const [index, item] of quotesData.entries()) {
      try {
        // Validation
        if (!item.quote || !item.author) {
          console.log(`⚠️  Skipping entry ${index + 1}: Missing quote or author`);
          skippedCount++;
          continue;
        }

        // Check if quote already exists
        const existingQuote = await client.query(
          'SELECT id FROM motivational_quotes WHERE quote_text = $1',
          [item.quote]
        );

        if (existingQuote.rows.length > 0) {
          console.log(`ℹ️  Quote ${index + 1} already exists, skipping...`);
          skippedCount++;
          continue;
        }

        // Get or create author
        let author;
        if (authorCache.has(item.author)) {
          author = authorCache.get(item.author);
        } else {
          author = await QuoteAuthor.findOrCreate({
            name: item.author,
            birthYear: item.birthYear || null,
            deathYear: item.deathYear || null,
          });
          authorCache.set(item.author, author);
          if (authorCache.size > authorCount) {
            authorCount++;
          }
        }

        // Create quote
        await MotivationalQuote.create({
          quoteText: item.quote,
          authorId: author.id,
          category: item.category || 'general',
          isActive: item.isActive !== undefined ? item.isActive : true
        });
        
        quoteCount++;
        
        // Progress indicator
        if (quoteCount % 10 === 0) {
          console.log(`✓ Imported ${quoteCount} quotes...`);
        }
      } catch (itemError) {
        console.error(`❌ Error processing quote ${index + 1}:`, itemError.message);
        skippedCount++;
      }
    }
    
    await client.query('COMMIT');
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ IMPORT COMPLETE!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   • Quotes imported: ${quoteCount}`);
    console.log(`   • Authors processed: ${authorCache.size}`);
    console.log(`   • Skipped/Duplicates: ${skippedCount}`);
    console.log(`   • Total in file: ${quotesData.length}`);
    
    // Show statistics
    const categoryStats = await client.query(`
      SELECT category, COUNT(*) as count 
      FROM motivational_quotes 
      WHERE is_active = true
      GROUP BY category 
      ORDER BY count DESC
    `);
    
    if (categoryStats.rows.length > 0) {
      console.log(`\n📈 Quotes by Category:`);
      categoryStats.rows.forEach(row => {
        console.log(`   • ${row.category}: ${row.count}`);
      });
    }

    const totalActive = await client.query(
      'SELECT COUNT(*) FROM motivational_quotes WHERE is_active = true'
    );
    console.log(`\n🎯 Total Active Quotes: ${totalActive.rows[0].count}`);
    console.log("=".repeat(60) + "\n");
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("\n❌ Import failed:", error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the import if executed directly
if (require.main === module) {
  importQuotes()
    .then(() => {
      console.log("✓ Script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("✗ Script failed:", error);
      process.exit(1);
    });
}

module.exports = { importQuotes };

