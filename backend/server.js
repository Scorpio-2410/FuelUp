require("dotenv").config();

const express = require("express");
const app = express();

// .env port & fallback port.
const PORT = process.env.PORT || 4000;

// Middleware to parse JSON
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Hello from Node backend");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
