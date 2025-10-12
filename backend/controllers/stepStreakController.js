// creates or updates step records
const StepStreak = require("../models/stepStreak");

class StepStreakController {
  // POST /api/steps
  // Create or update step record for a specific date
  // SQL updates whenever you POST to /api/steps - can be multiple times per day
  static async upsertSteps(req, res) {
    try {
      const { date, stepCount, calories } = req.body;
      
      if (!date) {
        return res.status(400).json({ error: "Date is required (YYYY-MM-DD)" });
      }
      
      if (stepCount === undefined || stepCount === null) {
        return res.status(400).json({ error: "Step count is required" });
      }

      const data = {
        userId: req.userId,
        date,
        stepCount: parseInt(stepCount),
        calories: calories ? parseInt(calories) : null,
      };

      const stepRecord = await StepStreak.upsert(data);
      res.status(201).json({ success: true, stepRecord });
    } catch (e) {
      console.error("upsertSteps error:", e);
      res.status(500).json({ error: "Failed to save step data" });
    }
  }

  // GET /api/steps/:date
  // Get step record for a specific date
  static async getStepsByDate(req, res) {
    try {
      const { date } = req.params;
      
      if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
      }

      const stepRecord = await StepStreak.findByUserAndDate(req.userId, date);
      
      if (!stepRecord) {
        return res.status(404).json({ error: "No step data found for this date" });
      }

      res.json({ success: true, stepRecord });
    } catch (e) {
      console.error("getStepsByDate error:", e);
      res.status(500).json({ error: "Failed to fetch step data" });
    }
  }

  // GET /api/steps/range?start=YYYY-MM-DD&end=YYYY-MM-DD
  // Get step records for a date range
  static async getStepsRange(req, res) {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ 
          error: "Start and end dates are required (YYYY-MM-DD)" 
        });
      }

      const stepRecords = await StepStreak.findByUserAndDateRange(
        req.userId,
        start,
        end
      );

      res.json({ 
        success: true, 
        count: stepRecords.length,
        stepRecords 
      });
    } catch (e) {
      console.error("getStepsRange error:", e);
      res.status(500).json({ error: "Failed to fetch step data" });
    }
  }

  // GET /api/steps/stats?start=YYYY-MM-DD&end=YYYY-MM-DD&period=overall|week|month
  // Get statistical summary for a period
  static async getStats(req, res) {
    try {
      const { start, end, period = "overall" } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ 
          error: "Start and end dates are required (YYYY-MM-DD)" 
        });
      }

      let stats;
      
      if (period === "week") {
        stats = await StepStreak.getWeeklyStats(req.userId, start, end);
      } else if (period === "month") {
        stats = await StepStreak.getMonthlyStats(req.userId, start, end);
      } else {
        stats = await StepStreak.getStats(req.userId, start, end);
      }

      res.json({ 
        success: true, 
        period,
        dateRange: { start, end },
        stats 
      });
    } catch (e) {
      console.error("getStats error:", e);
      res.status(500).json({ error: "Failed to calculate statistics" });
    }
  }

  // GET /api/steps/weekly?start=YYYY-MM-DD&end=YYYY-MM-DD
  // Get weekly aggregated stats
  static async getWeeklyStats(req, res) {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ 
          error: "Start and end dates are required (YYYY-MM-DD)" 
        });
      }

      const weeklyStats = await StepStreak.getWeeklyStats(req.userId, start, end);

      res.json({ 
        success: true, 
        count: weeklyStats.length,
        weeklyStats 
      });
    } catch (e) {
      console.error("getWeeklyStats error:", e);
      res.status(500).json({ error: "Failed to fetch weekly statistics" });
    }
  }

  // GET /api/steps/monthly?start=YYYY-MM-DD&end=YYYY-MM-DD
  // Get monthly aggregated stats
  static async getMonthlyStats(req, res) {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ 
          error: "Start and end dates are required (YYYY-MM-DD)" 
        });
      }

      const monthlyStats = await StepStreak.getMonthlyStats(req.userId, start, end);

      res.json({ 
        success: true, 
        count: monthlyStats.length,
        monthlyStats 
      });
    } catch (e) {
      console.error("getMonthlyStats error:", e);
      res.status(500).json({ error: "Failed to fetch monthly statistics" });
    }
  }

  // GET /api/steps/streak
  // Get current streak (consecutive days with steps logged)
  static async getStreak(req, res) {
    try {
      const streakDays = await StepStreak.getCurrentStreak(req.userId);

      res.json({ 
        success: true, 
        streakDays,
        message: `Current streak: ${streakDays} day${streakDays !== 1 ? 's' : ''}`
      });
    } catch (e) {
      console.error("getStreak error:", e);
      res.status(500).json({ error: "Failed to calculate streak" });
    }
  }

  // DELETE /api/steps/:date
  // Delete step record for a specific date
  static async deleteSteps(req, res) {
    try {
      const { date } = req.params;
      
      if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
      }

      await StepStreak.deleteByUserAndDate(req.userId, date);

      res.json({ 
        success: true, 
        message: "Step record deleted successfully" 
      });
    } catch (e) {
      console.error("deleteSteps error:", e);
      res.status(500).json({ error: "Failed to delete step data" });
    }
  }

  // GET /api/steps/chart?start=YYYY-MM-DD&end=YYYY-MM-DD
  // Get data formatted for charts (combines range data with stats)
  static async getChartData(req, res) {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ 
          error: "Start and end dates are required (YYYY-MM-DD)" 
        });
      }

      // Get daily records
      const dailyData = await StepStreak.findByUserAndDateRange(
        req.userId,
        start,
        end
      );

      // Get overall stats for the period
      const overallStats = await StepStreak.getStats(req.userId, start, end);

      res.json({ 
        success: true,
        dateRange: { start, end },
        dailyData,
        overallStats,
        chartReady: true
      });
    } catch (e) {
      console.error("getChartData error:", e);
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  }
}

module.exports = StepStreakController;

