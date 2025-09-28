// backend/controllers/exerciseCategoryController.js
const ExerciseCategory = require("../models/exerciseCategory");

const ExerciseCategoryController = {
  async listCategories(req, res) {
    try {
      const isGymExercise = req.query.isGymExercise;
      let categories;
      
      if (isGymExercise !== undefined) {
        const gymFilter = isGymExercise === 'true';
        categories = await ExerciseCategory.findByType(gymFilter);
      } else {
        categories = await ExerciseCategory.getAll();
      }
      
      res.json({ 
        success: true, 
        categories: categories.map(c => c.toJSON())
      });
    } catch (e) {
      console.error("listCategories error:", e);
      res.status(500).json({ error: "Failed to list exercise categories" });
    }
  },

  async getCategoryById(req, res) {
    try {
      const id = Number(req.params.id);
      const category = await ExerciseCategory.findById(id);
      if (!category)
        return res.status(404).json({ error: "Category not found" });
      res.json({ success: true, category: category.toJSON() });
    } catch (e) {
      console.error("getCategoryById error:", e);
      res.status(500).json({ error: "Failed to fetch exercise category" });
    }
  },

  async createCategory(req, res) {
    try {
      const created = await ExerciseCategory.create({
        name: req.body.name,
        description: req.body.description,
        isGymExercise: req.body.isGymExercise ?? false,
      });
      res.status(201).json({ success: true, category: created.toJSON() });
    } catch (e) {
      console.error("createCategory error:", e);
      res.status(500).json({ error: "Failed to create exercise category" });
    }
  },

  async updateCategory(req, res) {
    try {
      const id = Number(req.params.id);
      const category = await ExerciseCategory.findById(id);
      if (!category)
        return res.status(404).json({ error: "Category not found" });
      
      const updated = await category.update({
        name: req.body.name,
        description: req.body.description,
        isGymExercise: req.body.isGymExercise,
      });
      res.json({ success: true, category: updated.toJSON() });
    } catch (e) {
      console.error("updateCategory error:", e);
      res.status(500).json({ error: "Failed to update exercise category" });
    }
  },

  async deleteCategory(req, res) {
    try {
      const id = Number(req.params.id);
      const category = await ExerciseCategory.findById(id);
      if (!category) 
        return res.status(404).json({ error: "Category not found" });
      
      await category.delete();
      res.json({ success: true });
    } catch (e) {
      console.error("deleteCategory error:", e);
      res.status(500).json({ error: "Failed to delete exercise category" });
    }
  },
};

module.exports = ExerciseCategoryController;
