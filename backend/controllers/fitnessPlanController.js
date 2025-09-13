// controllers/fitnessPlanController.js
const FitnessPlan = require("../models/fitnessPlan");
const FitnessProfile = require("../models/fitnessProfile");
const Exercise = require("../models/exercise");

class FitnessPlanController {
  // POST /api/fitness/plans
  static async createPlan(req, res) {
    try {
      const userId = req.userId;
      const {
        name,
        goal, // optional (plan-level label), e.g. "cut", "bulk"
        status = "active", // active | archived | draft
        startDate, // "YYYY-MM-DD"
        endDate, // "YYYY-MM-DD"
        notes,
        fitnessProfileId, // optional: associate to an existing profile
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Plan name is required" });
      }

      if (fitnessProfileId) {
        const profile = await FitnessProfile.findById(fitnessProfileId);
        if (!profile || profile.userId !== userId) {
          return res.status(403).json({ error: "Invalid fitness profile" });
        }
      }

      const plan = await FitnessPlan.create({
        userId,
        name,
        goal: goal || null,
        status,
        startDate: startDate || null,
        endDate: endDate || null,
        notes: notes || null,
        fitnessProfileId: fitnessProfileId || null,
      });

      res.status(201).json({ success: true, plan: plan.toJSON() });
    } catch (e) {
      console.error("createPlan error:", e);
      res.status(500).json({ error: "Failed to create fitness plan" });
    }
  }

  // GET /api/fitness/plans?status=&limit=&offset=
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

  // GET /api/fitness/plans/:id
  static async getPlan(req, res) {
    try {
      const plan = await FitnessPlan.findById(req.params.id);
      if (!plan || plan.userId !== req.userId) {
        return res.status(404).json({ error: "Plan not found" });
      }

      // Include profile (if set) and related exercises via the profile
      let profile = null;
      let exercises = [];
      if (plan.fitnessProfileId) {
        profile = await FitnessProfile.findById(plan.fitnessProfileId);
        if (profile && profile.userId === req.userId) {
          exercises = await Exercise.listByProfile(plan.fitnessProfileId);
        }
      }

      res.json({
        success: true,
        plan: plan.toJSON(),
        profile: profile ? profile.toJSON() : null,
        exercises: exercises.map((x) => x.toJSON()),
      });
    } catch (e) {
      console.error("getPlan error:", e);
      res.status(500).json({ error: "Failed to fetch plan" });
    }
  }

  // PUT /api/fitness/plans/:id
  static async updatePlan(req, res) {
    try {
      const plan = await FitnessPlan.findById(req.params.id);
      if (!plan || plan.userId !== req.userId) {
        return res.status(404).json({ error: "Plan not found" });
      }

      const patch = {};
      const allowed = [
        "name",
        "goal",
        "status",
        "startDate",
        "endDate",
        "notes",
        "fitnessProfileId",
      ];
      for (const k of allowed) {
        if (Object.prototype.hasOwnProperty.call(req.body, k)) {
          patch[k] = req.body[k];
        }
      }

      // If re-associating to a profile, enforce ownership
      if (
        patch.fitnessProfileId != null &&
        patch.fitnessProfileId !== plan.fitnessProfileId
      ) {
        const profile = await FitnessProfile.findById(patch.fitnessProfileId);
        if (!profile || profile.userId !== req.userId) {
          return res.status(403).json({ error: "Invalid fitness profile" });
        }
      }

      const updated = await plan.update(patch);
      res.json({ success: true, plan: updated.toJSON() });
    } catch (e) {
      console.error("updatePlan error:", e);
      res.status(500).json({ error: "Failed to update plan" });
    }
  }

  // DELETE /api/fitness/plans/:id
  static async deletePlan(req, res) {
    try {
      const plan = await FitnessPlan.findById(req.params.id);
      if (!plan || plan.userId !== req.userId) {
        return res.status(404).json({ error: "Plan not found" });
      }
      await plan.delete();
      res.json({ success: true });
    } catch (e) {
      console.error("deletePlan error:", e);
      res.status(500).json({ error: "Failed to delete plan" });
    }
  }

  // Convenience: GET /api/fitness/plans/:id/exercises
  static async listPlanExercises(req, res) {
    try {
      const plan = await FitnessPlan.findById(req.params.id);
      if (!plan || plan.userId !== req.userId) {
        return res.status(404).json({ error: "Plan not found" });
      }
      if (!plan.fitnessProfileId) {
        return res.json({ success: true, exercises: [] });
      }
      const items = await Exercise.listByProfile(plan.fitnessProfileId, {
        userId: req.userId,
      });
      res.json({ success: true, exercises: items.map((x) => x.toJSON()) });
    } catch (e) {
      console.error("listPlanExercises error:", e);
      res.status(500).json({ error: "Failed to fetch exercises for plan" });
    }
  }
}

module.exports = FitnessPlanController;
