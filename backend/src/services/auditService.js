const AuditLog = require('../models/AuditLog');

const recordAudit = async ({ action, actorId, grievanceId, details = {} }) => {
  try {
    await AuditLog.create({ action, actorId, grievanceId, details });
  } catch (error) {
    console.error('[CivicAI Audit] Failed to record audit event:', error.message);
  }
};

module.exports = { recordAudit };
