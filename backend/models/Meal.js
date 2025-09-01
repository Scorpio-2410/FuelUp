const { pool } = require('../config/database');

class Meal {
  constructor(mealData) {
    this.id = mealData.id;
    this.userId = mealData.user_id;
    this.mealName = mealData.meal_name;
    this.mealType = mealData.meal_type;
    this.calories = mealData.calories;
    this.protein = mealData.protein;
    this.carbohydrates = mealData.carbohydrates;
    this.fat = mealData.fat;
    this.fiber = mealData.fiber;
    this.sugar = mealData.sugar;
    this.sodium = mealData.sodium;
    this.mealDate = mealData.meal_date;
    this.notes = mealData.notes;
    this.createdAt = mealData.created_at;
    this.updatedAt = mealData.updated_at;
  }

  // Create a new meal entry
  static async create(mealData) {
    try {
      const query = `
        INSERT INTO meals (user_id, meal_name, meal_type, calories, protein, 
                          carbohydrates, fat, fiber, sugar, sodium, meal_date, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const values = [
        mealData.userId,
        mealData.mealName,
        mealData.mealType,
        mealData.calories,
        mealData.protein || 0,
        mealData.carbohydrates || 0,
        mealData.fat || 0,
        mealData.fiber || 0,
        mealData.sugar || 0,
        mealData.sodium || 0,
        mealData.mealDate,
        mealData.notes || null
      ];

      const result = await pool.query(query, values);
      return new Meal(result.rows[0]);
    } catch (error) {
      throw new Error(`Error creating meal: ${error.message}`);
    }
  }

  // Find meal by ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM meals WHERE id = $1';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Meal(result.rows[0]);
    } catch (error) {
      throw new Error(`Error finding meal by ID: ${error.message}`);
    }
  }

  // Get all meals for a user
  static async findByUserId(userId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT * FROM meals 
        WHERE user_id = $1 
        ORDER BY meal_date DESC, created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await pool.query(query, [userId, limit, offset]);
      
      return result.rows.map(row => new Meal(row));
    } catch (error) {
      throw new Error(`Error finding meals for user: ${error.message}`);
    }
  }

  // Get meals for a specific date
  static async findByUserAndDate(userId, date) {
    try {
      const query = `
        SELECT * FROM meals 
        WHERE user_id = $1 AND meal_date = $2
        ORDER BY meal_type, created_at
      `;
      const result = await pool.query(query, [userId, date]);
      
      return result.rows.map(row => new Meal(row));
    } catch (error) {
      throw new Error(`Error finding meals for date: ${error.message}`);
    }
  }

  // Get meals within a date range
  static async findByDateRange(userId, startDate, endDate) {
    try {
      const query = `
        SELECT * FROM meals 
        WHERE user_id = $1 AND meal_date BETWEEN $2 AND $3
        ORDER BY meal_date DESC, meal_type, created_at
      `;
      const result = await pool.query(query, [userId, startDate, endDate]);
      
      return result.rows.map(row => new Meal(row));
    } catch (error) {
      throw new Error(`Error finding meals in date range: ${error.message}`);
    }
  }

  // Update meal
  async update(updateData) {
    try {
      const allowedFields = [
        'meal_name', 'meal_type', 'calories', 'protein', 'carbohydrates',
        'fat', 'fiber', 'sugar', 'sodium', 'meal_date', 'notes'
      ];

      const setClause = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          setClause.push(`${field} = $${paramIndex}`);
          values.push(updateData[field]);
          paramIndex++;
        }
      }

      if (setClause.length === 0) {
        throw new Error('No valid fields to update');
      }

      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(this.id);

      const query = `
        UPDATE meals 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Meal not found');
      }

      // Update current instance
      Object.assign(this, new Meal(result.rows[0]));
      return this;
    } catch (error) {
      throw new Error(`Error updating meal: ${error.message}`);
    }
  }

  // Delete meal
  async delete() {
    try {
      const query = 'DELETE FROM meals WHERE id = $1';
      const result = await pool.query(query, [this.id]);
      
      if (result.rowCount === 0) {
        throw new Error('Meal not found');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting meal: ${error.message}`);
    }
  }

  // Get daily nutrition summary for a user
  static async getDailyNutritionSummary(userId, date) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_meals,
          SUM(calories) as total_calories,
          SUM(protein) as total_protein,
          SUM(carbohydrates) as total_carbohydrates,
          SUM(fat) as total_fat,
          SUM(fiber) as total_fiber,
          SUM(sugar) as total_sugar,
          SUM(sodium) as total_sodium
        FROM meals 
        WHERE user_id = $1 AND meal_date = $2
      `;
      const result = await pool.query(query, [userId, date]);
      
      return {
        totalMeals: parseInt(result.rows[0].total_meals) || 0,
        totalCalories: parseFloat(result.rows[0].total_calories) || 0,
        totalProtein: parseFloat(result.rows[0].total_protein) || 0,
        totalCarbohydrates: parseFloat(result.rows[0].total_carbohydrates) || 0,
        totalFat: parseFloat(result.rows[0].total_fat) || 0,
        totalFiber: parseFloat(result.rows[0].total_fiber) || 0,
        totalSugar: parseFloat(result.rows[0].total_sugar) || 0,
        totalSodium: parseFloat(result.rows[0].total_sodium) || 0
      };
    } catch (error) {
      throw new Error(`Error getting daily nutrition summary: ${error.message}`);
    }
  }

  // Get meals grouped by type for a specific date
  static async getMealsByTypeAndDate(userId, date) {
    try {
      const query = `
        SELECT 
          meal_type,
          COUNT(*) as meal_count,
          SUM(calories) as total_calories,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', id,
              'meal_name', meal_name,
              'calories', calories,
              'protein', protein,
              'carbohydrates', carbohydrates,
              'fat', fat,
              'notes', notes
            ) ORDER BY created_at
          ) as meals
        FROM meals 
        WHERE user_id = $1 AND meal_date = $2
        GROUP BY meal_type
        ORDER BY 
          CASE meal_type 
            WHEN 'breakfast' THEN 1
            WHEN 'lunch' THEN 2
            WHEN 'dinner' THEN 3
            WHEN 'snack' THEN 4
            ELSE 5
          END
      `;
      const result = await pool.query(query, [userId, date]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting meals by type: ${error.message}`);
    }
  }

  // Calculate macronutrient percentages
  getMacroPercentages() {
    const totalCalories = parseFloat(this.calories) || 0;
    
    if (totalCalories === 0) {
      return { protein: 0, carbohydrates: 0, fat: 0 };
    }

    // Calories per gram: Protein = 4, Carbs = 4, Fat = 9
    const proteinCalories = (parseFloat(this.protein) || 0) * 4;
    const carbCalories = (parseFloat(this.carbohydrates) || 0) * 4;
    const fatCalories = (parseFloat(this.fat) || 0) * 9;

    return {
      protein: Math.round((proteinCalories / totalCalories) * 100),
      carbohydrates: Math.round((carbCalories / totalCalories) * 100),
      fat: Math.round((fatCalories / totalCalories) * 100)
    };
  }

  // Validate meal type
  static validateMealType(mealType) {
    const validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    return validTypes.includes(mealType.toLowerCase());
  }
}

module.exports = Meal;
