const mongoose = require("mongoose");

const recurrenceSchema = new mongoose.Schema({
  freq: { type: String, enum: ["none", "daily", "weekly"], default: "none" },
  daysOfWeek: [{ type: Number }], // 0=Sun..6=Sat
  startDate: String,
});

const scheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: String }, // YYYY-MM-DD (optional if recurring)
    time: { type: String, required: true }, // "HH:MM-HH:MM"
    title: { type: String, required: true },
    subtitle: { type: String },
    category: {
      type: String,
      enum: ["work", "personal", "outing", "gym", "mealprep"],
      required: true,
    },
    color: { type: String },
    recurrence: recurrenceSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Schedule", scheduleSchema);
