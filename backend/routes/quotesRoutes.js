const express = require("express");
const router = express.Router();
const quotesController = require("../controllers/quotesController");

// Public routes (no auth required for reading quotes)
router.get("/", quotesController.getAllQuotes);
router.get("/random", quotesController.getRandomQuote);
router.get("/daily", quotesController.getQuoteOfTheDay);
router.get("/authors", quotesController.getAllAuthors);
router.get("/:id", quotesController.getQuoteById);

// Protected routes (optional - add auth middleware if needed)
router.post("/", quotesController.createQuote);
router.put("/:id", quotesController.updateQuote);
router.delete("/:id", quotesController.deleteQuote);

module.exports = router;

