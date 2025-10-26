const { pool } = require("../config/database");
const FitnessPlan = require("../models/fitnessPlan");

class FitnessPlanController {
  static async createPlan(req, res) {
    try {
      const userId = req.userId;
      const { name, status = "active", notes } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Plan name is required" });
      }

      // max N non-archived (configurable via env)
      const MAX_ACTIVE = parseInt(
        process.env.MAX_ACTIVE_FITNESS_PLANS || "10",
        10
      );
      const { rows } = await pool.query(
        "SELECT COUNT(*)::int AS c FROM fitness_plans WHERE user_id=$1 AND status <> 'archived'",
        [userId]
      );
      if (rows[0].c >= MAX_ACTIVE) {
        return res.status(400).json({
          error: `You can only have up to ${MAX_ACTIVE} active/draft plans`,
        });
      }

      // Only name, status, notes now
      const plan = await FitnessPlan.create(userId, {
        name,
        status,
        notes,
      });

      res.status(201).json({ success: true, plan: plan.toJSON() });
    } catch (e) {
      console.error("createPlan error:", e);
      res.status(500).json({ error: "Failed to create fitness plan" });
    }
  }

  static async listPlans(req, res) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      const plans = await FitnessPlan.listForUser(req.userId, {
        status,
        limit: +limit,
        offset: +offset,
      });
      res.json({
        success: true,
        plans: plans.map((p) => p.toJSON()),
        pagination: { limit: +limit, offset: +offset },
      });
    } catch (e) {
      console.error("listPlans error:", e);
      res.status(500).json({ error: "Failed to list fitness plans" });
    }
  }

  static async getPlan(req, res) {
    try {
      const plan = await FitnessPlan.findById(req.params.id);
      if (!plan || plan.userId !== req.userId)
        return res.status(404).json({ error: "Plan not found" });
      res.json({ success: true, plan: plan.toJSON() });
    } catch (e) {
      console.error("getPlan error:", e);
      res.status(500).json({ error: "Failed to fetch plan" });
    }
  }

  static async updatePlan(req, res) {
    try {
      const plan = await FitnessPlan.findById(req.params.id);
      if (!plan || plan.userId !== req.userId)
        return res.status(404).json({ error: "Plan not found" });

      // Only allow updating name, status, notes
      const patch = {};
      const map = {
        name: "name",
        status: "status",
        notes: "notes",
      };
      for (const [k, col] of Object.entries(map)) {
        if (Object.prototype.hasOwnProperty.call(req.body, k)) {
          patch[col] = req.body[k];
        }
      }

      const updated = await plan.update(patch);
      res.json({ success: true, plan: updated.toJSON() });
    } catch (e) {
      console.error("updatePlan error:", e);
      res.status(500).json({ error: "Failed to update plan" });
    }
  }

  static async deletePlan(req, res) {
    try {
      const plan = await FitnessPlan.findById(req.params.id);
      if (!plan || plan.userId !== req.userId)
        return res.status(404).json({ error: "Plan not found" });
      await plan.delete();
      res.json({ success: true });
    } catch (e) {
      console.error("deletePlan error:", e);
      res.status(500).json({ error: "Failed to delete plan" });
    }
  }
}

module.exports = FitnessPlanController;