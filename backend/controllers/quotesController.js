const MotivationalQuote = require("../models/motivationalQuote");
const QuoteAuthor = require("../models/quoteAuthor");

// Get all quotes with optional filters
exports.getAllQuotes = async (req, res) => {
  try {
    const { category, isActive, limit = 50, offset = 0 } = req.query;
    
    const quotes = await MotivationalQuote.findAll({
      category,
      isActive: isActive !== undefined ? isActive === 'true' : null,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await MotivationalQuote.count({ category, isActive });

    res.json({
      quotes,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + quotes.length < total
      }
    });
  } catch (err) {
    console.error("Error fetching quotes:", err);
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
};

// Get a single quote by ID
exports.getQuoteById = async (req, res) => {
  try {
    const quote = await MotivationalQuote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }
    res.json(quote);
  } catch (err) {
    console.error("Error fetching quote:", err);
    res.status(500).json({ error: "Failed to fetch quote" });
  }
};

// Get a random quote
exports.getRandomQuote = async (req, res) => {
  try {
    const { category } = req.query;
    const quote = await MotivationalQuote.getRandom({ category });
    
    if (!quote) {
      return res.status(404).json({ error: "No quotes found" });
    }
    
    res.json(quote);
  } catch (err) {
    console.error("Error fetching random quote:", err);
    res.status(500).json({ error: "Failed to fetch random quote" });
  }
};

// Get quote of the day
exports.getQuoteOfTheDay = async (req, res) => {
  try {
    const quote = await MotivationalQuote.getQuoteOfTheDay();
    
    if (!quote) {
      return res.status(404).json({ error: "No quotes available" });
    }
    
    res.json(quote);
  } catch (err) {
    console.error("Error fetching quote of the day:", err);
    res.status(500).json({ error: "Failed to fetch quote of the day" });
  }
};

// Create a new quote
exports.createQuote = async (req, res) => {
  try {
    const { quoteText, authorName, authorBirthYear, authorDeathYear, category, isActive } = req.body;

    if (!quoteText || !authorName) {
      return res.status(400).json({ error: "Quote text and author name are required" });
    }

    // Find or create author
    const author = await QuoteAuthor.findOrCreate({
      name: authorName,
      birthYear: authorBirthYear || null,
      deathYear: authorDeathYear || null
    });

    // Create quote
    const quote = await MotivationalQuote.create({
      quoteText,
      authorId: author.id,
      category: category || 'general',
      isActive: isActive !== undefined ? isActive : true
    });

    const fullQuote = await MotivationalQuote.findById(quote.id);
    res.status(201).json(fullQuote);
  } catch (err) {
    console.error("Error creating quote:", err);
    res.status(500).json({ error: "Failed to create quote" });
  }
};

// Update a quote
exports.updateQuote = async (req, res) => {
  try {
    const quote = await MotivationalQuote.findById(req.params.id, false);
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const { quoteText, authorName, authorBirthYear, authorDeathYear, category, isActive } = req.body;
    const updates = {};

    if (quoteText !== undefined) updates.quote_text = quoteText;
    if (category !== undefined) updates.category = category;
    if (isActive !== undefined) updates.is_active = isActive;

    // Handle author update
    if (authorName) {
      const author = await QuoteAuthor.findOrCreate({
        name: authorName,
        birthYear: authorBirthYear || null,
        deathYear: authorDeathYear || null
      });
      updates.author_id = author.id;
    }

    await quote.update(updates);
    const updatedQuote = await MotivationalQuote.findById(quote.id);
    res.json(updatedQuote);
  } catch (err) {
    console.error("Error updating quote:", err);
    res.status(500).json({ error: "Failed to update quote" });
  }
};

// Delete a quote
exports.deleteQuote = async (req, res) => {
  try {
    const quote = await MotivationalQuote.findById(req.params.id, false);
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    await quote.delete();
    res.json({ message: "Quote deleted successfully" });
  } catch (err) {
    console.error("Error deleting quote:", err);
    res.status(500).json({ error: "Failed to delete quote" });
  }
};

// Get all authors
exports.getAllAuthors = async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const authors = await QuoteAuthor.findAll({
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    res.json(authors);
  } catch (err) {
    console.error("Error fetching authors:", err);
    res.status(500).json({ error: "Failed to fetch authors" });
  }
};

