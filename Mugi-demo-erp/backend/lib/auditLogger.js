const { prisma } = require('./prisma');

/**
 * Enterprise Audit Logger
 * Captures granular changes, users, and IP addresses for corporate compliance.
 */
const auditLog = async ({ module, action, message, oldData = null, newData = null, targetId = null, userId = null, req = null }) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
    
    await prisma.activityLog.create({
      data: {
        module,
        action,
        message,
        oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
        ipAddress,
        targetId: targetId ? parseInt(targetId) : null,
        userId: userId ? parseInt(userId) : null
      }
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
};

module.exports = { auditLog };
