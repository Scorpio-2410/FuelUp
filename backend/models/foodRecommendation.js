class FoodRecommendation {
  // Simulated logic for now (replace with AI model later)
  static async generate(availableItems, userId) {
    const healthy = ["chicken breast", "eggs", "spinach", "rice", "oats"];
    const results = availableItems.map(item => ({
      item,
      recommendedUse: healthy.includes(item.toLowerCase())
        ? "Great choice! Use it for a healthy meal."
        : "Can be used occasionally in moderation.",
    }));
    return results;
  }
}

module.exports = FoodRecommendation;
