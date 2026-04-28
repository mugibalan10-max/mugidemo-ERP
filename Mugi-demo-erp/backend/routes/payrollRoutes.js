const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// Setup Salary Structure (Helper endpoint)
router.post('/structure', async (req, res) => {
  try {
    const { employeeId, basicSalary, hra, allowances, pfEnabled, taxPercent } = req.body;
    const structure = await prisma.salaryStructure.upsert({
      where: { employeeId: parseInt(employeeId) },
      update: { basicSalary, hra, allowances, pfEnabled, taxPercent },
      create: { employeeId: parseInt(employeeId), basicSalary, hra, allowances, pfEnabled, taxPercent }
    });
    res.json(structure);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update salary structure' });
  }
});

// GET structure
router.get('/structure/:employeeId', async (req, res) => {
  try {
    const structure = await prisma.salaryStructure.findUnique({
      where: { employeeId: parseInt(req.params.employeeId) }
    });
    res.json(structure);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch salary structure' });
  }
});

// POST /payroll/generate
router.post('/generate', async (req, res) => {
  try {
    const { employeeId, month, year, bonus = 0, incentives = 0 } = req.body;
    
    // Check existing
    const existing = await prisma.payroll.findUnique({
      where: { employeeId_month_year: { employeeId: parseInt(employeeId), month: String(month), year: parseInt(year) } }
    });
    if (existing && existing.status !== 'Draft') {
      return res.status(400).json({ error: 'Payroll already processed for this month' });
    }

    const structure = await prisma.salaryStructure.findUnique({ where: { employeeId: parseInt(employeeId) } });
    if (!structure) return res.status(400).json({ error: 'Salary structure not found for employee' });

    // Calculate LOP
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const totalWorkingDays = 30; // Approximation for Indian standard payroll

    const attendances = await prisma.attendance.findMany({
      where: { employeeId: parseInt(employeeId), date: { gte: startDate, lte: endDate } }
    });
    const presentDays = attendances.filter(a => a.status === 'Present').length;
    
    const leaves = await prisma.leave.findMany({
      where: { employeeId: parseInt(employeeId), status: 'HRApproved', startDate: { gte: startDate, lte: endDate } }
    });
    let leaveDays = 0;
    leaves.forEach(l => {
      leaveDays += Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / (1000 * 60 * 60 * 24)) + 1;
    });

    const lopDays = Math.max(0, totalWorkingDays - (presentDays + leaveDays));

    // Earnings
    const basic = parseFloat(structure.basicSalary);
    const hra = parseFloat(structure.hra);
    const allow = parseFloat(structure.allowances);
    const gross = basic + hra + allow + parseFloat(bonus) + parseFloat(incentives);

    const perDaySalary = basic / totalWorkingDays;
    const lopDeduction = lopDays * perDaySalary;

    const actualBasic = basic - lopDeduction;

    // Deductions
    const pf = structure.pfEnabled ? (Math.max(0, actualBasic) * 0.12) : 0;
    const tax = gross * (parseFloat(structure.taxPercent) / 100);
    
    const totalDed = pf + tax + lopDeduction;
    const net = Math.max(0, gross - totalDed);

    // Transaction
    const payroll = await prisma.$transaction(async (tx) => {
      let p;
      const data = {
        employeeId: parseInt(employeeId), month: String(month), year: parseInt(year),
        basicSalary: basic, hra, allowances: allow, bonus: parseFloat(bonus), incentives: parseFloat(incentives), grossSalary: gross,
        pfDeduction: pf, taxDeduction: tax, lopDays, lopDeduction, otherDeductions: 0, totalDeductions: totalDed,
        netSalary: net, status: 'Draft'
      };

      if (existing) {
        p = await tx.payroll.update({ where: { id: existing.id }, data });
        await tx.payrollDetail.deleteMany({ where: { payrollId: existing.id } });
      } else {
        p = await tx.payroll.create({ data });
      }

      // Store Details Breakdown
      await tx.payrollDetail.createMany({
        data: [
          { payrollId: p.id, componentName: 'Basic Salary', type: 'Earning', amount: basic },
          { payrollId: p.id, componentName: 'HRA', type: 'Earning', amount: hra },
          { payrollId: p.id, componentName: 'Allowances', type: 'Earning', amount: allow },
          { payrollId: p.id, componentName: 'Bonus', type: 'Earning', amount: parseFloat(bonus) },
          { payrollId: p.id, componentName: 'Incentives', type: 'Earning', amount: parseFloat(incentives) },
          { payrollId: p.id, componentName: 'PF Deduction (12%)', type: 'Deduction', amount: pf },
          { payrollId: p.id, componentName: `Tax Deduction (${structure.taxPercent}%)`, type: 'Deduction', amount: tax },
          { payrollId: p.id, componentName: `LOP (${lopDays} days)`, type: 'Deduction', amount: lopDeduction }
        ]
      });
      return p;
    });

    res.json({ message: 'Payroll Generated Successfully', payroll });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payroll generation failed' });
  }
});

// GET /payroll/payslip
router.get('/payslip', async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    const payroll = await prisma.payroll.findUnique({
      where: { employeeId_month_year: { employeeId: parseInt(employeeId), month: String(month), year: parseInt(year) } },
      include: { employee: { include: { department: true } }, details: true }
    });
    if (!payroll) return res.status(404).json({ error: 'Payslip not found for this month/year' });
    res.json(payroll);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payslip' });
  }
});

// POST /payroll/pay
router.post('/pay', async (req, res) => {
  try {
    const { payrollId, paymentMode } = req.body;
    
    const existing = await prisma.payroll.findUnique({ where: { id: parseInt(payrollId) } });
    if (!existing) return res.status(404).json({ error: "Payroll not found" });
    if (existing.status === 'Paid') return res.status(400).json({ error: "Already Paid" });

    const payroll = await prisma.payroll.update({
      where: { id: parseInt(payrollId) },
      data: { status: 'Paid', paymentMode, paymentDate: new Date() }
    });
    
    await prisma.activityLog.create({
      data: { module: 'Payroll', action: 'PAYMENT', message: `Payroll ID ${payrollId} marked as Paid via ${paymentMode}` }
    });
    
    res.json({ message: 'Payment processed successfully', payroll });
  } catch (err) {
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// GET /payroll/report
router.get('/report', async (req, res) => {
  try {
    const { month, year } = req.query;
    const payrolls = await prisma.payroll.findMany({
      where: { month: String(month), year: parseInt(year) },
      include: { employee: { include: { department: true } } }
    });

    const summary = {
      totalGross: 0, totalNet: 0, totalPF: 0, totalTax: 0, departmentBreakdown: {}
    };

    payrolls.forEach(p => {
      summary.totalGross += parseFloat(p.grossSalary);
      summary.totalNet += parseFloat(p.netSalary);
      summary.totalPF += parseFloat(p.pfDeduction);
      summary.totalTax += parseFloat(p.taxDeduction);

      const deptName = p.employee?.department?.name || 'Unassigned';
      if (!summary.departmentBreakdown[deptName]) summary.departmentBreakdown[deptName] = 0;
      summary.departmentBreakdown[deptName] += parseFloat(p.netSalary);
    });

    res.json({ payrolls, summary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
