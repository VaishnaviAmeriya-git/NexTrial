const crypto = require('crypto');
const { AuditLog } = require('../models');

const recordAudit = async ({ who, userEmail, userRole, entity, entityId, action, before, after, req }) => {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    // Phase 2 P2 hash chaining support: find last log's hash
    const lastLog = await AuditLog.findOne().sort({ at: -1 }).select('hash');
    const previousHash = lastLog ? lastLog.hash : 'GENESIS_HASH_NEXTRIAL_2026';

    const timestamp = new Date();
    const payload = `${who}_${entity}_${entityId}_${action}_${timestamp.toISOString()}_${previousHash}`;
    const hash = crypto.createHash('sha256').update(payload).digest('hex');

    await AuditLog.create({
      who,
      userEmail,
      userRole,
      entity,
      entityId: entityId.toString(),
      action,
      before: before ? JSON.parse(JSON.stringify(before)) : null,
      after: after ? JSON.parse(JSON.stringify(after)) : null,
      ipAddress,
      userAgent,
      at: timestamp,
      previousHash,
      hash,
    });
  } catch (err) {
    console.error('[Audit] Failed to persist audit record:', err.message);
  }
};

module.exports = { recordAudit };
