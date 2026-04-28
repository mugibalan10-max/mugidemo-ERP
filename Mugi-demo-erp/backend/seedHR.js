const { prisma } = require('./lib/prisma');

async function seed() {
  try {
    await prisma.department.createMany({
      data: [
        { id: 1, name: 'Engineering' },
        { id: 2, name: 'Finance & Accounts' },
        { id: 3, name: 'Human Resources' },
        { id: 4, name: 'Sales & Marketing' }
      ],
      skipDuplicates: true
    });
    
    await prisma.designation.createMany({
      data: [
        { id: 1, title: 'Software Engineer', level: 1 },
        { id: 2, title: 'Senior Software Engineer', level: 2 },
        { id: 3, title: 'Finance Manager', level: 3 },
        { id: 4, title: 'HR Executive', level: 1 },
        { id: 5, title: 'VP of Sales', level: 5 }
      ],
      skipDuplicates: true
    });
    
    console.log('Seeded successfully');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
seed();
