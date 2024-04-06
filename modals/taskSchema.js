const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: false,
    default: "pending",
    enum: ["pending", "in-progress", "completed"],
  },
  priority: {
    type: String,
    required: false,
    default: "low",
    enum: ["low", "medium", "high"],
  },
  startDateFormatted: {
    type: Date,
    required: true,
  },
  endDateFormatted: {
    type: Date,
    required: true,
  },
  createdDate: {
    type: Date,
    required: false,
    default: new Date(),
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

userSchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("Task", userSchema);
