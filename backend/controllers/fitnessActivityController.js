// backend/controllers/fitnessActivityController.js
const FitnessActivity = require("../models/fitnessActivity");

class FitnessActivityController {
  // POST /api/fitness/activities
  // Create a new fitness activity
  static async createActivity(req, res) {
    try {
      const { 
        date, 
        activityType, 
        exerciseName, 
        durationMinutes, 
        caloriesBurned, 
        intensity, 
        notes, 
        externalId 
      } = req.body;
      
      if (!date) {
        return res.status(400).json({ error: "Date is required (YYYY-MM-DD)" });
      }
      
      if (!activityType) {
        return res.status(400).json({ error: "Activity type is required" });
      }
      
      if (!exerciseName) {
        return res.status(400).json({ error: "Exercise name is required" });
      }
      
      if (!durationMinutes || durationMinutes <= 0) {
        return res.status(400).json({ error: "Duration in minutes is required and must be positive" });
      }
      
      if (!caloriesBurned || caloriesBurned < 0) {
        return res.status(400).json({ error: "Calories burned is required and must be non-negative" });
      }

      const data = {
        userId: req.userId,
        date,
        activityType,
        exerciseName,
        durationMinutes: parseInt(durationMinutes),
        caloriesBurned: parseInt(caloriesBurned),
        intensity: intensity || 'moderate',
        notes: notes || null,
        externalId: externalId || null,
      };

      const activity = await FitnessActivity.create(data);
      res.status(201).json({ success: true, activity });
    } catch (e) {
      console.error("createActivity error:", e);
      res.status(500).json({ error: "Failed to create fitness activity" });
    }
  }

  // GET /api/fitness/activities/:date
  // Get activities for a specific date
  static async getActivitiesByDate(req, res) {
    try {
      const { date } = req.params;
      
      if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
      }

      const activities = await FitnessActivity.findByUserAndDate(req.userId, date);
      
      res.json({ 
        success: true, 
        date,
        activities,
        totalCalories: activities.reduce((sum, activity) => sum + activity.caloriesBurned, 0)
      });
    } catch (e) {
      console.error("getActivitiesByDate error:", e);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  }

  // GET /api/fitness/activities/range?start=YYYY-MM-DD&end=YYYY-MM-DD
  // Get activities for a date range
  static async getActivitiesRange(req, res) {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ 
          error: "Start and end dates are required (YYYY-MM-DD)" 
        });
      }

      const activities = await FitnessActivity.findByUserAndDateRange(
        req.userId,
        start,
        end
      );

      res.json({ 
        success: true, 
        dateRange: { start, end },
        count: activities.length,
        activities,
        totalCalories: activities.reduce((sum, activity) => sum + activity.caloriesBurned, 0)
      });
    } catch (e) {
      console.error("getActivitiesRange error:", e);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  }

  // GET /api/fitness/activities/stats?start=YYYY-MM-DD&end=YYYY-MM-DD
  // Get activity statistics for a period
  static async getStats(req, res) {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ 
          error: "Start and end dates are required (YYYY-MM-DD)" 
        });
      }

      const stats = await FitnessActivity.getStats(req.userId, start, end);

      res.json({ 
        success: true, 
        dateRange: { start, end },
        stats 
      });
    } catch (e) {
      console.error("getStats error:", e);
      res.status(500).json({ error: "Failed to calculate statistics" });
    }
  }

  // GET /api/fitness/activities/calories/:date
  // Get total calories burned from activities for a specific date
  static async getCaloriesBurned(req, res) {
    try {
      const { date } = req.params;
      
      if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
      }

      const totalCalories = await FitnessActivity.getTotalCaloriesBurned(req.userId, date);
      
      res.json({ 
        success: true, 
        date,
        totalCalories 
      });
    } catch (e) {
      console.error("getCaloriesBurned error:", e);
      res.status(500).json({ error: "Failed to fetch calories data" });
    }
  }

  // PUT /api/fitness/activities/:id
  // Update an existing activity
  static async updateActivity(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (!id) {
        return res.status(400).json({ error: "Activity ID is required" });
      }

      // First, get the activity to ensure it belongs to the user
      const activities = await FitnessActivity.findByUserAndDateRange(
        req.userId,
        '1900-01-01',
        '2100-12-31'
      );
      
      const activity = activities.find(a => a.id === parseInt(id));
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      await activity.update(updates);
      res.json({ success: true, activity });
    } catch (e) {
      console.error("updateActivity error:", e);
      res.status(500).json({ error: "Failed to update activity" });
    }
  }

  // DELETE /api/fitness/activities/:id
  // Delete an activity
  static async deleteActivity(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Activity ID is required" });
      }

      // First, get the activity to ensure it belongs to the user
      const activities = await FitnessActivity.findByUserAndDateRange(
        req.userId,
        '1900-01-01',
        '2100-12-31'
      );
      
      const activity = activities.find(a => a.id === parseInt(id));
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      await activity.delete();
      res.json({ 
        success: true, 
        message: "Activity deleted successfully" 
      });
    } catch (e) {
      console.error("deleteActivity error:", e);
      res.status(500).json({ error: "Failed to delete activity" });
    }
  }
}

module.exports = FitnessActivityController;
