const express = require("express");
const router = express.Router();
const Task = require("../modals/taskSchema");
const mongoose = require("mongoose");

const orderMap = {
  asc: 1,
  desc: -1,
};
const toDate = (dateString) => {
  const formattedDate = new Date(dateString);
  return formattedDate;
};

router.post("/addTask/:userId", async (req, res) => {
  const { name, description, status, priority, startDate, endDate } = req.body;

  const userId = req.params.userId;

  if (!name || !description || !startDate || !endDate || !userId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const startDateFormatted = toDate(startDate),
    endDateFormatted = toDate(endDate);

  try {
    const newTask = new Task({
      name,
      description,
      status,
      priority,
      startDateFormatted,
      endDateFormatted,
      user: userId,
    });

    await newTask.save();
    res.status(201).json({ message: "Task added successfully", task: newTask });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/allTask/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const filter = req?.query?.filter ? req?.query?.filter : "priority";
    const sortDirection = req?.query?.sortDirection
      ? req?.query?.sortDirection
      : "asc";

    const matchStage = {
      $match: { user: new mongoose.Types.ObjectId(userId) },
    };
    let tasks;
    switch (filter) {
      case "due":
        tasks = await Task.aggregate([
          matchStage,
          {
            $match: {
              $or: [{ status: "pending" }, { status: "in-progress" }],
            },
          },
          {
            $sort: { createdDate: orderMap[sortDirection] },
          },
        ]);
        break;
      case "today":
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        tasks = await Task.aggregate([
          matchStage,
          {
            $match: {
              $and: [
                { startDate: { $gte: todayStart } },
                { endDate: { $lte: todayEnd } },
              ],
            },
          },
          {
            $sort: { startDate: orderMap[sortDirection] },
          },
        ]);
        break;
      case "tommorrow":
        const tomorrowStart = new Date();
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date();
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
        tomorrowEnd.setHours(23, 59, 59, 999);

        tasks = await Task.aggregate([
          matchStage,
          {
            $match: {
              $and: [
                { startDate: { $gte: tomorrowStart } },
                { endDate: { $lte: tomorrowEnd } },
              ],
            },
          },
          {
            $sort: { startDate: orderMap[sortDirection] },
          },
        ]);
        break;
      case "priority":
        tasks = await Task.aggregate([
          matchStage,
          {
            $addFields: {
              priorityOrder: {
                $switch: {
                  branches: [
                    { case: { $eq: ["$priority", "low"] }, then: 1 },
                    { case: { $eq: ["$priority", "medium"] }, then: 2 },
                    { case: { $eq: ["$priority", "high"] }, then: 3 },
                  ],
                  default: 0,
                },
              },
            },
          },
          {
            $sort: { priorityOrder: orderMap[sortDirection] },
          },
          {
            $project: { priorityOrder: 0 },
          },
        ]);
        break;
      case "creation-date":
        tasks = await Task.aggregate([
          matchStage,
          {
            $sort: { createdDate: orderMap[sortDirection] },
          },
        ]);
      default:
        tasks = await Task.aggregate([
          matchStage,
          {
            $addFields: {
              priorityOrder: {
                $switch: {
                  branches: [
                    { case: { $eq: ["$priority", "low"] }, then: 1 },
                    { case: { $eq: ["$priority", "medium"] }, then: 2 },
                    { case: { $eq: ["$priority", "high"] }, then: 3 },
                  ],
                  default: 0,
                },
              },
            },
          },
          {
            $sort: { priorityOrder: orderMap[sortDirection] },
          },
          {
            $project: { priorityOrder: 0 },
          },
        ]);
    }

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get tasks" });
  }
});

router.get("/priorities", (req, res) => {
  try {
    const priorities = [
      { id: 1, name: "low" },
      { id: 2, name: "medium" },
      { id: 3, name: "high" },
    ];

    res.json(priorities);
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get priorities" });
  }
});

router.get("/statuses", (req, res) => {
  try {
    const statuses = [
      { id: 1, name: "pending" },
      { id: 2, name: "in-progress" },
      { id: 3, name: "completed" },
    ];
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get statuses" });
  }
});

router.delete("/task/:taskId", async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }
    await Task.findByIdAndDelete(existingTask);

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to delete task" });
  }
});

router.get("/tasks/count/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const matchStage = {
      $match: { user: new mongoose.Types.ObjectId(userId) },
    };
    const counts = await Task.aggregate([
      matchStage,
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = [
      { name: "pending", value: 0 },
      { name: "completed", value: 0 },
      { name: "in-progress", value: 0 },
    ];

    counts.forEach((count) => {
      if (count._id === "pending") {
        result[0].value = count.count;
      } else if (count._id === "completed") {
        result[1].value = count.count;
      } else if (count._id === "in-progress") {
        result[2].value = count.count;
      }
    });

    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to retrieve task counts" });
  }
});

router.put("/tasks/:taskId", async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const updatedTaskDetails = req.body;

    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    for (const [key, value] of Object.entries(updatedTaskDetails)) {
      if (existingTask[key] !== undefined) {
        existingTask[key] = value;
      }
    }

    await existingTask.save();

    res.status(200).json({
      success: true,
      data: existingTask,
      message: "Task updated successfully",
    });
  } catch (errpr) {
    res.status(500).json({ success: false, error: "Failed to update task" });
  }
});

module.exports = router;
