const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    who: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    entity: {
      type: String,
      required: true,
      index: true, // e.g., 'Participant', 'Trial', 'AdverseEvent', 'Visit', 'Consent'
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['CREATE', 'UPDATE', 'STATUS_CHANGE', 'CONSENT_WITHDRAWAL', 'CODE_AE', 'RETRAIN'],
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: '',
    },
    at: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    previousHash: {
      type: String,
      default: null,
    },
    hash: {
      type: String,
      default: null,
    },
  },
  { timestamps: false }
);

auditLogSchema.index({ entity: 1, entityId: 1, at: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
