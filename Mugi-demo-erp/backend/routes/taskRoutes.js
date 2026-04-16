const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// Create Task
router.post('/', async (req, res) => {
  try {
    const { 
      title, description, type, priority, projectId, sprintId, 
      parentId, assigneeId, reporterId, storyPoints, dueDate, estimatedHours 
    } = req.body;

    // Auto-generate Task ID (TASK-001...)
    const lastTask = await prisma.task.findFirst({
      orderBy: { id: 'desc' }
    });
    const nextId = (lastTask ? lastTask.id : 0) + 1;
    const taskCode = `TSK-${String(nextId).padStart(4, '0')}`;

    const task = await prisma.task.create({
      data: {
        taskCode,
        title,
        description,
        type: type || 'Task',
        priority: priority || 'P3',
        status: 'Backlog',
        projectId: projectId ? parseInt(projectId) : null,
        sprintId: sprintId ? parseInt(sprintId) : null,
        parentId: parentId ? parseInt(parentId) : null,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        reporterId: reporterId ? parseInt(reporterId) : null,
        storyPoints: storyPoints ? parseInt(storyPoints) : 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 0
      }
    });

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// List Tasks (with filtering)
router.get('/', async (req, res) => {
  try {
    const { status, priority, type, projectId } = req.query;
    const tasks = await prisma.task.findMany({
      where: {
        status,
        priority,
        type,
        projectId: projectId ? parseInt(projectId) : undefined
      },
      include: {
        assignee: { select: { id: true, name: true, roleName: true } },
        project: { select: { name: true, projectCode: true } },
        subtasks: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Update Task Status / Details
router.patch('/:id', async (req, res) => {
  try {
    const { status, priority, assigneeId, completionPercent, actualHours } = req.body;
    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status,
        priority,
        assigneeId: assigneeId ? parseInt(assigneeId) : undefined,
        completionPercent: completionPercent !== undefined ? parseInt(completionPercent) : undefined,
        actualHours: actualHours !== undefined ? parseFloat(actualHours) : undefined
      }
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Time Tracking: Start Timer
router.post('/:id/start-timer', async (req, res) => {
  try {
    const { userId } = req.body;
    const log = await prisma.workLog.create({
      data: {
        taskId: parseInt(req.params.id),
        userId: parseInt(userId),
        startTime: new Date()
      }
    });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: "Failed to start timer" });
  }
});

// Time Tracking: Stop Timer
router.post('/:id/stop-timer', async (req, res) => {
  try {
    const { userId } = req.body;
    const activeLog = await prisma.workLog.findFirst({
      where: {
        taskId: parseInt(req.params.id),
        userId: parseInt(userId),
        endTime: null
      },
      orderBy: { startTime: 'desc' }
    });

    if (!activeLog) return res.status(404).json({ error: "No active timer found" });

    const endTime = new Date();
    const durationMs = endTime - activeLog.startTime;
    const durationHours = durationMs / (1000 * 60 * 60);

    const updatedLog = await prisma.workLog.update({
      where: { id: activeLog.id },
      data: {
        endTime,
        duration: durationHours
      }
    });

    // Update total actual hours on task
    await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: {
        actualHours: { increment: durationHours }
      }
    });

    res.json(updatedLog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to stop timer" });
  }
});

module.exports = router;
