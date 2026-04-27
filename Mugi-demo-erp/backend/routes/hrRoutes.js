const express = require("express");
const router = express.Router();
const { prisma, pool } = require("../lib/prisma");
const automationService = require("../services/automationService");

// Employees
router.post("/employees", async (req, res) => {
  try {
    const { name, email, role, salary } = req.body;
    await pool.query(
      "INSERT INTO employees (name,email,role,salary) VALUES ($1,$2,$3,$4)",
      [name, email, role, salary]
    );
    res.send("Employee Added");
  } catch (err) {
    res.status(500).send("Error adding employee");
  }
});

router.get("/employees", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany();
    res.json(employees);
  } catch (err) {
    res.status(500).send("Error fetching employees");
  }
});

// Tasks
router.post("/tasks", async (req, res) => {
  try {
    const { title, assigned_to } = req.body;
    const result = await pool.query(
      "INSERT INTO tasks (title, assigned_to) VALUES ($1,$2) RETURNING id",
      [title, assigned_to]
    );
    const taskId = result.rows[0].id;
    await automationService.runAutomation({
        type: "TASK_ASSIGNED",
        data: { taskId, title }
    });
    res.json({ message: "Task Assigned & Employee Notified", taskId });
  } catch (err) {
    res.status(500).send("Error assigning task");
  }
});

router.get("/tasks", async (req, res) => {
  try {
    const tasks = await pool.query(`
      SELECT t.*, e.name as employee_name 
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      ORDER BY t.id DESC
    `);
    res.json(tasks.rows);
  } catch (err) {
    res.status(500).send("Error fetching tasks");
  }
});

router.put("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    await prisma.activityLog.create({
      data: {
        module: "HR",
        action: "Task Update",
        targetId: task.id,
        message: `Task "${task.title}" updated to ${status}.`
      }
    });
    res.json({ message: "Task Updated", task });
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Payroll
router.post("/payroll/calculate", async (req, res) => {
  try {
    const { employeeId, month, year, bonus, manualDeductions, overtimeHours, shiftAllowance } = req.body;
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) }
    });
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const basicSalary = Number(employee.salary);
    const otRate = Number(employee.overtimeRate) || 0;
    const otHours = Number(overtimeHours) || 0;
    const otAmount = otHours * otRate;
    const shiftAllowanceAmt = Number(shiftAllowance) || 0;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendance = await prisma.attendance.findMany({
        where: {
            employeeId: parseInt(employeeId),
            status: 'Absent',
            date: { gte: startDate, lte: endDate }
        }
    });
    
    const absentDays = attendance.length;
    const perDaySalary = basicSalary / 30;
    const autoDeductions = absentDays * perDaySalary;
    const totalDeductions = autoDeductions + (Number(manualDeductions) || 0);
    const bonusAmt = Number(bonus) || 0;
    const netSalary = basicSalary - totalDeductions + bonusAmt + otAmount + shiftAllowanceAmt;

    const payrollRecord = await prisma.payroll.create({
      data: {
        employeeId: parseInt(employeeId),
        month: String(month),
        year: parseInt(year),
        basicSalary,
        deductions: totalDeductions,
        bonus: bonusAmt,
        overtimeHours: otHours,
        overtimeAmount: otAmount,
        shiftAllowance: shiftAllowanceAmt,
        netSalary,
        status: "Calculated"
      }
    });

    res.json({
      message: "✅ Payroll Calculated Successfully",
      payroll: payrollRecord,
      breakdown: { absentDays, autoDeductions, otAmount, shiftAllowanceAmt }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate payroll" });
  }
});

router.get("/payroll", async (req, res) => {
  try {
    const records = await prisma.payroll.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: "Error fetching payroll history" });
  }
});

// Attendance & Leave Lock Helper
const isAttendanceLocked = (targetDate) => {
  const now = new Date();
  const target = new Date(targetDate);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const targetMonth = target.getMonth();
  const targetYear = target.getFullYear();

  // If we are touching a previous month
  if (targetYear < currentYear || (targetYear === currentYear && targetMonth < currentMonth)) {
    // If today is after the 5th, it's locked
    if (now.getDate() > 5) return true;
  }
  return false;
};

// Attendance & Leave
router.post("/attendance", async (req, res) => {
  try {
    const { employeeId, status, date } = req.body;
    const targetDate = date ? new Date(date) : new Date();

    if (isAttendanceLocked(targetDate)) {
      return res.status(403).json({ error: "Corporate Policy Violation: Attendance for the previous cycle is locked after the 5th of the month." });
    }

    const record = await prisma.attendance.create({
      data: {
        employeeId: parseInt(employeeId),
        status,
        date: date ? new Date(date) : new Date()
      }
    });
    res.json({ message: "Attendance/Leave Record Created", record });
  } catch (err) {
    res.status(500).json({ error: "Failed to record attendance" });
  }
});

router.put("/attendance/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const existing = await prisma.attendance.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).send("Not found");
    if (isAttendanceLocked(existing.date)) {
       return res.status(403).json({ error: "Corporate Policy Violation: Attendance for the previous cycle is locked." });
    }

    const record = await prisma.attendance.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    await prisma.activityLog.create({
      data: {
        module: "HR",
        action: "Leave Approval",
        targetId: record.id,
        message: `Leave request for employee ${record.employeeId} set to ${status}.`
      }
    });
    res.json({ message: "Leave Status Updated", record });
  } catch (err) {
    res.status(500).json({ error: "Failed to update leave status" });
  }
});

router.get("/attendance", async (req, res) => {
    try {
        const list = await prisma.attendance.findMany({ orderBy: { date: 'desc' } });
        res.json(list);
    } catch (err) {
        res.status(500).send("Error fetching attendance");
    }
});

router.post("/attendance/bulk", async (req, res) => {
    try {
        const { records } = req.body;
        const result = await prisma.attendance.createMany({
            data: records.map(r => ({
                employeeId: parseInt(r.employeeId),
                status: r.status,
                date: r.date ? new Date(r.date) : new Date()
            }))
        });
        res.json({ message: `✅ ${result.count} Attendance records created`, count: result.count });
    } catch (err) {
        res.status(500).json({ error: "Failed to record bulk attendance" });
    }
});

module.exports = router;
