const { prisma } = require('../lib/prisma');
const bcrypt = require('bcrypt');

async function main() {
  console.log('🌱 Starting RBAC Seeding...');

  // 1. Define Permissions
  const permissionsData = [
    // Dashboard
    { moduleName: 'dashboard', action: 'view', description: 'Can view dashboard' },
    
    // Commercial
    { moduleName: 'leads', action: 'view', description: 'Can view leads' },
    { moduleName: 'leads', action: 'manage', description: 'Full access to leads' },
    { moduleName: 'customers', action: 'view', description: 'Can view customers' },
    { moduleName: 'customers', action: 'manage', description: 'Full access to customers' },
    { moduleName: 'invoices', action: 'view', description: 'Can view invoices' },
    { moduleName: 'invoices', action: 'create', description: 'Can create invoices' },
    { moduleName: 'invoices', action: 'manage', description: 'Full access to invoices' },

    // Operations
    { moduleName: 'inventory', action: 'view', description: 'Can view inventory' },
    { moduleName: 'inventory', action: 'manage', description: 'Full access to inventory' },
    { moduleName: 'vendors', action: 'view', description: 'Can view vendors' },
    { moduleName: 'vendors', action: 'manage', description: 'Full access to vendors' },
    { moduleName: 'purchase_orders', action: 'view', description: 'Can view POs' },
    { moduleName: 'purchase_orders', action: 'manage', description: 'Full access to POs' },
    { moduleName: 'grn', action: 'view', description: 'Can view Goods Received' },
    { moduleName: 'grn', action: 'manage', description: 'Full access to GRN' },

    // Finance
    { moduleName: 'tally', action: 'view', description: 'Can view Tally sync status' },
    { moduleName: 'tally', action: 'sync', description: 'Can trigger Tally sync' },
    { moduleName: 'vendor_bills', action: 'view', description: 'Can view vendor bills' },
    { moduleName: 'vendor_bills', action: 'manage', description: 'Full access to vendor bills' },
    { moduleName: 'vendor_ledger', action: 'view', description: 'Can view vendor ledgers' },
    { moduleName: 'aging', action: 'view', description: 'Can view aging analysis' },

    // HR
    { moduleName: 'tasks', action: 'view', description: 'Can view tasks' },
    { moduleName: 'tasks', action: 'manage', description: 'Full access to tasks' },
    { moduleName: 'employees', action: 'view', description: 'Can view employee list' },
    { moduleName: 'employees', action: 'manage', description: 'HR management access' },
    { moduleName: 'payroll', action: 'view', description: 'Can view payroll' },
    { moduleName: 'payroll', action: 'process', description: 'Can process monthly payroll' },
    { moduleName: 'reports', action: 'view', description: 'Can view all reports' },
  ];

  console.log('Upserting permissions...');
  const permissions = {};
  for (const p of permissionsData) {
    const created = await prisma.permission.upsert({
      where: { moduleName_action: { moduleName: p.moduleName, action: p.action } },
      update: {},
      create: p,
    });
    permissions[`${p.moduleName}:${p.action}`] = created.id;
  }

  // 2. Define Roles
  const roles = [
    { name: 'Admin', description: 'System Administrator with full access' },
    { name: 'Finance Manager', description: 'Can manage all financial operations' },
    { name: 'HR', description: 'Human Resources and Payroll management' },
    { name: 'Sales', description: 'Leads, Customers, and Invoicing' },
    { name: 'Inventory Manager', description: 'Procurement and Inventory control' },
    { name: 'Employee', description: 'Basic access to tasks and profile' },
  ];

  console.log('Upserting roles...');
  const roleMap = {};
  for (const r of roles) {
    const created = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
    roleMap[r.name] = created.id;
  }

  // 3. Map Permissions to Roles
  const mapping = {
    'Admin': Object.keys(permissions), // All
    'Finance Manager': [
      'dashboard:view', 'invoices:view', 'vendor_bills:manage', 'vendor_ledger:view', 'aging:view', 'reports:view', 'tally:view', 'tally:sync'
    ],
    'HR': [
      'dashboard:view', 'employees:manage', 'payroll:process', 'payroll:view', 'tasks:view', 'reports:view'
    ],
    'Sales': [
      'dashboard:view', 'leads:manage', 'customers:manage', 'invoices:create', 'invoices:view', 'tasks:view'
    ],
    'Inventory Manager': [
      'dashboard:view', 'inventory:manage', 'vendors:manage', 'purchase_orders:manage', 'grn:manage', 'tasks:view'
    ],
    'Employee': [
      'dashboard:view', 'tasks:view'
    ]
  };

  console.log('Mapping permissions to roles...');
  for (const [roleName, perms] of Object.entries(mapping)) {
    const roleId = roleMap[roleName];
    for (const pKey of perms) {
      const permissionId = permissions[pKey];
      await prisma.permissionAssignment.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  // 4. Create a default Admin user if not exists
  const adminEmail = 'admin@mugi.com';
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { roleId: roleMap['Admin'] },
    create: {
      email: adminEmail,
      name: 'Super Admin',
      password: hashedPassword,
      roleId: roleMap['Admin']
    },
  });

  console.log('✅ RBAC Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
