const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// Helper to log task activity
async function logTaskActivity(taskId, action, message, userId = null) {
  try {
    await prisma.taskLog.create({
      data: {
        taskId: parseInt(taskId),
        action,
        message,
        userId: userId ? parseInt(userId) : null
      }
    });
  } catch (err) {
    console.error("Failed to log task activity:", err);
  }
}

// Helper to send basic notification
function sendNotification(event, data) {
  // Simple console log for now as requested
  console.log(`[NOTIFICATION] ${event}:`, data);
}

const STATUS_FLOW = {
  'Backlog': ['Todo'],
  'Todo': ['In_Progress'],
  'In_Progress': ['Code_Review'],
  'Code_Review': ['Testing'],
  'Testing': ['Done'],
  'Done': [] // Terminal state
};

// --- DASHBOARD AND TRACKING APIs ---

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalTasks, completedToday, pendingToday, overdue, groupedStatus] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({
        where: { completedAt: { gte: today } }
      }),
      prisma.task.count({
        where: { dueDate: { gte: today, lt: new Date(today.getTime() + 86400000) }, status: { not: 'Done' } }
      }),
      prisma.task.count({
        where: { dueDate: { lt: today }, status: { not: 'Done' } }
      }),
      prisma.task.groupBy({
        by: ['status'],
        _count: { status: true }
      })
    ]);

    res.json({
      totalTasks,
      completedToday,
      pendingToday,
      overdue,
      tasksByStatus: groupedStatus.map(g => ({ status: g.status, count: g._count.status }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

router.get('/due-today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { gte: today, lt: tomorrow },
        status: { not: 'Done' }
      },
      include: { assignee: true, project: true }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch due today" });
  }
});

router.get('/completed-today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await prisma.task.findMany({
      where: {
        completedAt: { gte: today }
      },
      include: { assignee: true, project: true }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch completed today" });
  }
});

router.get('/overdue', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: today },
        status: { not: 'Done' }
      },
      include: { assignee: true, project: true }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch overdue tasks" });
  }
});

router.get('/my-summary', async (req, res) => {
  try {
    // In a real system, you would extract userId from req.user (JWT)
    // We will assume assigneeId is passed or mock it for now.
    const { assigneeId } = req.query;
    if (!assigneeId) return res.status(400).json({ error: "assigneeId required" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalTasks, completedToday, pendingToday, overdue] = await Promise.all([
      prisma.task.count({ where: { assigneeId: parseInt(assigneeId) } }),
      prisma.task.count({ where: { assigneeId: parseInt(assigneeId), completedAt: { gte: today } } }),
      prisma.task.count({ where: { assigneeId: parseInt(assigneeId), dueDate: { gte: today, lt: tomorrow }, status: { not: 'Done' } } }),
      prisma.task.count({ where: { assigneeId: parseInt(assigneeId), dueDate: { lt: today }, status: { not: 'Done' } } })
    ]);

    res.json({ totalTasks, completedToday, pendingToday, overdue });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user summary" });
  }
});

// --- CORE APIs ---

// Create Task
router.post('/', async (req, res) => {
  try {
    const { 
      title, description, type, priority, projectId, sprintId, 
      parentId, assigneeId, reporterId, storyPoints, dueDate, estimatedHours 
    } = req.body;

    const lastTask = await prisma.task.findFirst({ orderBy: { id: 'desc' } });
    const nextId = (lastTask ? lastTask.id : 0) + 1;
    const taskCode = `TSK-${String(nextId).padStart(4, '0')}`;

    const task = await prisma.task.create({
      data: {
        taskCode,
        title,
        description,
        type: type || 'Task',
        priority: priority || 'Medium',
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

    await logTaskActivity(task.id, 'CREATED', `Task created: ${taskCode}`, reporterId);
    if (assigneeId) {
      sendNotification('TASK_ASSIGNED', { taskId: task.id, assigneeId });
    }

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// List Tasks (with advanced filtering)
router.get('/', async (req, res) => {
  try {
    // query params: status, priority, assigned_to, due_date, projectId
    const { status, priority, assigned_to, due_date, projectId } = req.query;
    
    let where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigned_to) where.assigneeId = parseInt(assigned_to);
    if (projectId) where.projectId = parseInt(projectId);
    if (due_date) {
      const start = new Date(due_date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.dueDate = { gte: start, lt: end };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { name: true, projectCode: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Update Task Status / Details (with workflow enforcement)
router.patch('/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { status, priority, assigneeId, completionPercent, actualHours, userId } = req.body;
    
    const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existingTask) return res.status(404).json({ error: "Task not found" });

    let updateData = {};
    let statusChanged = false;
    let assignedChanged = false;

    // Enforce workflow logic if status is changing
    if (status && status !== existingTask.status) {
      const allowedNext = STATUS_FLOW[existingTask.status] || [];
      // Allow moving directly from any state to Backlog/Todo for reset (or strict? strict: prevent skipping)
      // The prompt asks to "Prevent skipping stages"
      if (!allowedNext.includes(status)) {
        return res.status(400).json({ error: `Invalid transition from ${existingTask.status} to ${status}. Allowed: ${allowedNext.join(', ')}` });
      }

      updateData.status = status;
      statusChanged = true;

      // Auto update completion time
      if (status === 'Done' && !existingTask.completedAt) {
        updateData.completedAt = new Date();
      }
    }

    if (priority) updateData.priority = priority;
    if (assigneeId && assigneeId !== existingTask.assigneeId) {
      updateData.assigneeId = parseInt(assigneeId);
      assignedChanged = true;
    }
    if (completionPercent !== undefined) updateData.completionPercent = parseInt(completionPercent);
    if (actualHours !== undefined) updateData.actualHours = parseFloat(actualHours);

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData
    });

    if (statusChanged) {
      await logTaskActivity(taskId, 'STATUS_CHANGE', `Status changed from ${existingTask.status} to ${status}`, userId);
      sendNotification('TASK_STATUS_CHANGED', { taskId, oldStatus: existingTask.status, newStatus: status });
    }
    if (assignedChanged) {
      await logTaskActivity(taskId, 'ASSIGNMENT_CHANGE', `Assigned to user ID ${assigneeId}`, userId);
      sendNotification('TASK_ASSIGNED', { taskId, assigneeId });
    }

    // Check if task became overdue (can be a cron, but we can check on update)
    if (task.dueDate && new Date() > new Date(task.dueDate) && task.status !== 'Done') {
      sendNotification('TASK_OVERDUE', { taskId });
    }

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Approve Task
router.patch('/:id/approve', async (req, res) => {
  try {
    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: { approvalStatus: 'Approved' }
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Failed to approve task" });
  }
});

// --- COMMENTS APIs ---

router.post('/:id/comments', async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) return res.status(400).json({ error: "userId and message required" });

    const comment = await prisma.taskComment.create({
      data: {
        taskId: parseInt(req.params.id),
        userId: parseInt(userId),
        content: message
      },
      include: { user: { select: { name: true } } }
    });

    await logTaskActivity(req.params.id, 'COMMENT_ADDED', `User added a comment: ${message.substring(0,20)}...`, userId);

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await prisma.taskComment.findMany({
      where: { taskId: parseInt(req.params.id) },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
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
    const durationHours = (endTime - activeLog.startTime) / 3600000;

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    const hourlyRate = user ? parseFloat(user.hourlyRate) : 0;
    const sessionCost = durationHours * hourlyRate;

    const updatedLog = await prisma.workLog.update({
      where: { id: activeLog.id },
      data: {
        endTime,
        duration: durationHours
      }
    });

    // Update total actual hours and cost on task
    await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: {
        actualHours: { increment: durationHours },
        actualCost: { increment: sessionCost }
      }
    });

    res.json(updatedLog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to stop timer" });
  }
});

module.exports = router;
