const MealPlan = require("../models/mealPlan");

class MealPlanController {
  static async createPlan(req, res) {
    try {
      const { name, status, startDate, endDate, targetCalories, notes } =
        req.body;
      if (!name)
        return res.status(400).json({ error: "Plan name is required" });

      const plan = await MealPlan.create(req.userId, {
        name,
        status,
        startDate,
        endDate,
        targetCalories,
        notes,
      });
      res.status(201).json({ success: true, plan });
    } catch (e) {
      console.error("createPlan error:", e);
      res.status(500).json({ error: "Failed to create meal plan" });
    }
  }

  static async listPlans(req, res) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      const plans = await MealPlan.listForUser(req.userId, {
        status,
        limit,
        offset,
      });
      res.json({
        success: true,
        plans,
        pagination: { limit: +limit, offset: +offset },
      });
    } catch (e) {
      console.error("listPlans error:", e);
      res.status(500).json({ error: "Failed to list meal plans" });
    }
  }

  static async getPlan(req, res) {
    try {
      const { id } = req.params;
      const plan = await MealPlan.findById(id);
      if (!plan) return res.status(404).json({ error: "Meal plan not found" });
      if (plan.userId !== req.userId)
        return res.status(403).json({ error: "Access denied" });

      res.json({ success: true, plan });
    } catch (e) {
      console.error("getPlan error:", e);
      res.status(500).json({ error: "Failed to fetch meal plan" });
    }
  }

  static async updatePlan(req, res) {
    try {
      const { id } = req.params;
      const plan = await MealPlan.findById(id);
      if (!plan) return res.status(404).json({ error: "Meal plan not found" });
      if (plan.userId !== req.userId)
        return res.status(403).json({ error: "Access denied" });

      const updated = await plan.update(req.body);
      res.json({ success: true, plan: updated });
    } catch (e) {
      console.error("updatePlan error:", e);
      res.status(500).json({ error: "Failed to update meal plan" });
    }
  }

  static async deletePlan(req, res) {
    try {
      const { id } = req.params;
      const plan = await MealPlan.findById(id);
      if (!plan) return res.status(404).json({ error: "Meal plan not found" });
      if (plan.userId !== req.userId)
        return res.status(403).json({ error: "Access denied" });

      await plan.delete();
      res.json({ success: true, message: "Meal plan deleted" });
    } catch (e) {
      console.error("deletePlan error:", e);
      res.status(500).json({ error: "Failed to delete meal plan" });
    }
  }
}

module.exports = MealPlanController;
