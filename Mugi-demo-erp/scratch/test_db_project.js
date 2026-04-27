const { prisma } = require('./backend/lib/prisma');

async function testProject() {
  try {
    const lastProject = await prisma.project.findFirst({
      orderBy: { id: 'desc' }
    });
    const nextId = (lastProject ? lastProject.id : 0) + 1;
    const projectCode = `PRJ-${String(nextId).padStart(3, '0')}`;

    const project = await prisma.project.create({
      data: {
        projectCode,
        name: "Test Project from Script",
        description: "Testing if project creation works via Prisma",
        priority: "Medium",
        startDate: new Date()
      }
    });

    console.log("SUCCESS: Project created:", project);
    
    // Cleanup
    await prisma.project.delete({ where: { id: project.id } });
    console.log("CLEANUP: Test project deleted.");
  } catch (err) {
    console.error("ERROR: Failed to create test project:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testProject();
