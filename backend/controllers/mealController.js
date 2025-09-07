const Meal = require('../models/Meal');

class MealController {
  // Create a new meal entry
  static async createMeal(req, res) {
    try {
      const { mealName, mealType, calories, protein, carbohydrates, fat, fiber, sugar, sodium, mealDate, notes } = req.body;

      // Validate required fields
      if (!mealName || !mealType || !calories || !mealDate) {
        return res.status(400).json({
          error: 'Meal name, type, calories, and date are required'
        });
      }

      // Validate meal type
      if (!Meal.validateMealType(mealType)) {
        return res.status(400).json({
          error: 'Invalid meal type. Must be breakfast, lunch, dinner, or snack'
        });
      }

      const mealData = {
        userId: req.userId,
        mealName,
        mealType,
        calories: parseFloat(calories),
        protein: protein ? parseFloat(protein) : 0,
        carbohydrates: carbohydrates ? parseFloat(carbohydrates) : 0,
        fat: fat ? parseFloat(fat) : 0,
        fiber: fiber ? parseFloat(fiber) : 0,
        sugar: sugar ? parseFloat(sugar) : 0,
        sodium: sodium ? parseFloat(sodium) : 0,
        mealDate,
        notes
      };

      const meal = await Meal.create(mealData);

      res.status(201).json({
        message: 'Meal logged successfully',
        meal
      });
    } catch (error) {
      console.error('Create meal error:', error);
      res.status(500).json({
        error: 'Internal server error while creating meal'
      });
    }
  }

  // Get meals for a user (with pagination)
  static async getUserMeals(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      
      const meals = await Meal.findByUserId(
        req.userId, 
        parseInt(limit), 
        parseInt(offset)
      );

      res.json({
        meals,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: meals.length === parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get user meals error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching meals'
      });
    }
  }

  // Get meals for a specific date
  static async getMealsByDate(req, res) {
    try {
      const { date } = req.params;

      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      const meals = await Meal.findByUserAndDate(req.userId, date);

      res.json({
        date,
        meals
      });
    } catch (error) {
      console.error('Get meals by date error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching meals'
      });
    }
  }

  // Get meals within a date range
  static async getMealsByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Start date and end date are required'
        });
      }

      if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/) || !endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      const meals = await Meal.findByDateRange(req.userId, startDate, endDate);

      res.json({
        startDate,
        endDate,
        meals
      });
    } catch (error) {
      console.error('Get meals by date range error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching meals'
      });
    }
  }

  // Update a meal
  static async updateMeal(req, res) {
    try {
      const { id } = req.params;
      
      const meal = await Meal.findById(id);
      
      if (!meal) {
        return res.status(404).json({
          error: 'Meal not found'
        });
      }

      // Check if meal belongs to the authenticated user
      if (meal.userId !== req.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      // Validate meal type if provided
      if (req.body.mealType && !Meal.validateMealType(req.body.mealType)) {
        return res.status(400).json({
          error: 'Invalid meal type. Must be breakfast, lunch, dinner, or snack'
        });
      }

      const updatedMeal = await meal.update(req.body);

      res.json({
        message: 'Meal updated successfully',
        meal: updatedMeal
      });
    } catch (error) {
      console.error('Update meal error:', error);
      res.status(500).json({
        error: 'Internal server error while updating meal'
      });
    }
  }

  // Delete a meal
  static async deleteMeal(req, res) {
    try {
      const { id } = req.params;
      
      const meal = await Meal.findById(id);
      
      if (!meal) {
        return res.status(404).json({
          error: 'Meal not found'
        });
      }

      // Check if meal belongs to the authenticated user
      if (meal.userId !== req.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      await meal.delete();

      res.json({
        message: 'Meal deleted successfully'
      });
    } catch (error) {
      console.error('Delete meal error:', error);
      res.status(500).json({
        error: 'Internal server error while deleting meal'
      });
    }
  }

  // Get daily nutrition summary
  static async getDailyNutrition(req, res) {
    try {
      const { date } = req.params;

      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      const summary = await Meal.getDailyNutritionSummary(req.userId, date);

      res.json({
        date,
        nutrition: summary
      });
    } catch (error) {
      console.error('Get daily nutrition error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching nutrition data'
      });
    }
  }

  // Get meals grouped by type for a specific date
  static async getMealsByTypeAndDate(req, res) {
    try {
      const { date } = req.params;

      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      const mealsByType = await Meal.getMealsByTypeAndDate(req.userId, date);

      res.json({
        date,
        mealsByType
      });
    } catch (error) {
      console.error('Get meals by type error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching meals by type'
      });
    }
  }

  // Get single meal details
  static async getMeal(req, res) {
    try {
      const { id } = req.params;
      
      const meal = await Meal.findById(id);
      
      if (!meal) {
        return res.status(404).json({
          error: 'Meal not found'
        });
      }

      // Check if meal belongs to the authenticated user
      if (meal.userId !== req.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      // Add macro percentages to the response
      const macroPercentages = meal.getMacroPercentages();

      res.json({
        meal,
        macroPercentages
      });
    } catch (error) {
      console.error('Get meal error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching meal'
      });
    }
  }
}

module.exports = MealController;
