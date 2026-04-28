const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// Helper to log audit actions
async function logAction(action, message, userId = null) {
  try {
    await prisma.activityLog.create({
      data: {
        module: 'HR',
        action,
        message,
        userId: userId ? parseInt(userId) : null
      }
    });
  } catch (err) {
    console.error("Audit Log Error:", err);
  }
}

// ==========================================
// 1. EMPLOYEE MASTER
// ==========================================

router.post('/employees', async (req, res) => {
  try {
    const { 
      name, email, phone, departmentId, designationId, managerId, 
      panNumber, uanNumber, esiNumber, salary, joiningDate 
    } = req.body;
    
    const employee = await prisma.employee.create({
      data: {
        name, 
        email, 
        phone,
        departmentId: departmentId ? parseInt(departmentId) : null,
        designationId: designationId ? parseInt(designationId) : null,
        managerId: managerId ? parseInt(managerId) : null,
        panNumber,
        uanNumber,
        esiNumber,
        salary: parseFloat(salary || 0),
        joiningDate: joiningDate ? new Date(joiningDate) : undefined
      }
    });
    await logAction('EMPLOYEE_CREATED', `Created employee ${email}`);
    res.status(201).json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create employee" });
  }
});

router.get('/employees', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: { department: true, designation: true, manager: true }
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

router.put('/employees/:id', async (req, res) => {
  try {
    const { name, role, department, managerId, skills, status, salary } = req.body;
    const employee = await prisma.employee.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name, role, department, status,
        managerId: managerId ? parseInt(managerId) : undefined,
        skills: skills ? JSON.parse(skills) : undefined,
        salary: salary ? parseFloat(salary) : undefined
      }
    });
    await logAction('EMPLOYEE_UPDATED', `Updated employee ${employee.email}`);
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: "Failed to update employee" });
  }
});

// ==========================================
// 2. ATTENDANCE SYSTEM
// ==========================================

router.post('/attendance/punch-in', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: parseInt(employeeId),
        loginTime: new Date(),
        status: 'Present'
      }
    });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: "Punch-in failed" });
  }
});

router.post('/attendance/punch-out', async (req, res) => {
  try {
    const { attendanceId } = req.body;
    const existing = await prisma.attendance.findUnique({ where: { id: parseInt(attendanceId) } });
    if (!existing) return res.status(404).json({ error: "Attendance not found" });

    const logoutTime = new Date();
    const workHours = (logoutTime - existing.loginTime) / 3600000; // in hours

    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        logoutTime,
        workHours
      }
    });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: "Punch-out failed" });
  }
});

// ==========================================
// 3. LEAVE MANAGEMENT
// ==========================================

router.post('/leaves', async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;
    const leave = await prisma.leave.create({
      data: {
        employeeId: parseInt(employeeId),
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason
      }
    });
    console.log(`[NOTIFICATION] Leave applied by Employee ${employeeId}`);
    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ error: "Failed to apply leave" });
  }
});

router.patch('/leaves/:id/approve', async (req, res) => {
  try {
    const { status } = req.body; // e.g. 'Manager_Approved', 'HR_Approved', 'Rejected'
    const leave = await prisma.leave.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    });
    console.log(`[NOTIFICATION] Leave ${req.params.id} marked as ${status}`);
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: "Failed to update leave" });
  }
});

// ==========================================
// 4. PERFORMANCE & APPRAISAL
// ==========================================

router.post('/reviews', async (req, res) => {
  try {
    const { employeeId, reviewerId, reviewMonth, reviewYear, rating, comments } = req.body;
    const review = await prisma.performanceReview.create({
      data: {
        employeeId: parseInt(employeeId),
        reviewerId: parseInt(reviewerId),
        reviewMonth,
        reviewYear: parseInt(reviewYear),
        rating: parseInt(rating),
        comments
      }
    });
    await logAction('REVIEW_SUBMITTED', `Review submitted for employee ${employeeId}`);
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// ==========================================
// 5. EXIT MANAGEMENT
// ==========================================

router.post('/exits', async (req, res) => {
  try {
    const { employeeId, resignationDate, lastWorkingDay, reason } = req.body;
    const exitReq = await prisma.exitRequest.create({
      data: {
        employeeId: parseInt(employeeId),
        resignationDate: new Date(resignationDate),
        lastWorkingDay: new Date(lastWorkingDay),
        reason
      }
    });
    
    // Auto-update employee status to Pending Exit
    await prisma.employee.update({
      where: { id: parseInt(employeeId) },
      data: { status: 'Resignation_Pending' }
    });
    
    console.log(`[NOTIFICATION] Exit Request filed by Employee ${employeeId}`);
    res.status(201).json(exitReq);
  } catch (err) {
    res.status(500).json({ error: "Failed to process exit request" });
  }
});

router.patch('/exits/:id/clearance', async (req, res) => {
  try {
    const { clearanceStatus, finalStatus } = req.body;
    const exitReq = await prisma.exitRequest.update({
      where: { id: parseInt(req.params.id) },
      data: {
        clearanceStatus: clearanceStatus ? JSON.parse(clearanceStatus) : undefined,
        status: finalStatus || undefined
      }
    });
    
    if (finalStatus === 'Completed') {
      await prisma.employee.update({
        where: { id: exitReq.employeeId },
        data: { status: 'Terminated' }
      });
    }

    res.json(exitReq);
  } catch (err) {
    res.status(500).json({ error: "Failed to update clearance" });
  }
});

// ==============================
// 🏢 MNC HRMS - ADVANCED MODULES
// ==============================

// --- Recruitment & ATS ---
router.post('/jobs', async (req, res) => {
  try {
      const { title, departmentId, location, experience } = req.body;
      const job = await prisma.jobPosting.create({
          data: { title, departmentId: parseInt(departmentId), location, experience }
      });
      res.status(201).json(job);
  } catch (error) {
      res.status(500).json({ error: "Failed to create Job Posting" });
  }
});

router.post('/candidates', async (req, res) => {
  try {
      const { jobId, name, email, resumeUrl } = req.body;
      const candidate = await prisma.candidate.create({
          data: { jobId: parseInt(jobId), name, email, resumeUrl }
      });
      res.status(201).json(candidate);
  } catch (error) {
      res.status(500).json({ error: "Failed to add candidate" });
  }
});

// Auto-Onboarding: Convert Candidate to Employee
router.post('/candidates/:id/onboard', async (req, res) => {
  try {
      const { id } = req.params;
      const candidate = await prisma.candidate.findUnique({ where: { id: parseInt(id) } });
      if (!candidate) return res.status(404).json({ error: "Candidate not found" });

      const newEmp = await prisma.employee.create({
          data: {
              name: candidate.name,
              email: candidate.email,
              salary: 0,
              status: 'Onboarding'
          }
      });
      
      await prisma.candidate.update({ where: { id: candidate.id }, data: { status: 'Offered' } });
      res.status(201).json({ message: "Employee provisioned", employee: newEmp });
  } catch (error) {
      res.status(500).json({ error: "Failed to onboard candidate" });
  }
});

// --- Asset Allocation ---
router.post('/assets', async (req, res) => {
  try {
      const asset = await prisma.asset.create({ data: req.body });
      res.status(201).json(asset);
  } catch (error) {
      res.status(500).json({ error: "Failed to allocate asset" });
  }
});

// --- Expense Management ---
router.post('/expenses', async (req, res) => {
  try {
      const { employeeId, title, amount, receiptUrl } = req.body;
      const claim = await prisma.expenseClaim.create({
          data: { employeeId: parseInt(employeeId), title, amount, receiptUrl }
      });
      res.status(201).json(claim);
  } catch (error) {
      res.status(500).json({ error: "Failed to submit expense claim" });
  }
});

module.exports = router;
