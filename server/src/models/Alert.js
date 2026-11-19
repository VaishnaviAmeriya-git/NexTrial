const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'VISIT_OVERDUE',
        'IEC_EXPIRY_WARNING',
        'SAE_REPORT_DUE',
        'HIGH_DROPOUT_RISK',
        'QUERY_OVERDUE',
        'ENROLLMENT_BEHIND_TARGET',
        'CTRI_MISSING_FOR_ACTIVE_TRIAL',
        'SYSTEM_NOTIFICATION',
      ],
    },
    trialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trial',
      required: true,
      index: true,
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      default: null,
      index: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['info', 'warning', 'danger'],
      default: 'warning',
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'ack'],
      default: 'open',
      index: true,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    softDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

alertSchema.index({ trialId: 1, status: 1 });
alertSchema.index({ type: 1, status: 1 });

alertSchema.pre(/^find/, function (next) {
  if (this.getQuery().softDeleted === undefined) {
    this.where({ softDeleted: false });
  }
  next();
});

const Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;
