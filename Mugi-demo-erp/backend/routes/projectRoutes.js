const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// Create Project
router.post('/', async (req, res) => {
  try {
    const { name, description, clientName, priority, startDate, endDate, managerId } = req.body;
    
    // Auto-generate project code (ZEN-001, ZEN-002...)
    const lastProject = await prisma.project.findFirst({
      orderBy: { id: 'desc' }
    });
    const nextId = (lastProject ? lastProject.id : 0) + 1;
    const projectCode = `PRJ-${String(nextId).padStart(3, '0')}`;

    const project = await prisma.project.create({
      data: {
        projectCode,
        name,
        description,
        clientName,
        priority: priority || 'Medium',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        managerId: managerId ? parseInt(managerId) : null
      }
    });

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// List Projects
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Project Details with Task Summary
router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        tasks: {
          include: { assignee: { select: { name: true, email: true } } }
        },
        sprints: true
      }
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch project details" });
  }
});

module.exports = router;
