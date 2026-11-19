const mongoose = require('mongoose');

const protocolDeviationSchema = new mongoose.Schema(
  {
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
    category: {
      type: String,
      required: true,
      enum: [
        'Informed Consent',
        'Inclusion / Exclusion Criteria',
        'Visit Out of Window',
        'Investigational Product Dosing',
        'Prohibited Concomitant Medication',
        'Safety Reporting Timeline',
        'Laboratory Assessment',
        'Other',
      ],
      default: 'Visit Out of Window',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['Minor', 'Major', 'Critical'],
      default: 'Minor',
    },
    reportedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    correctiveAction: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Reported', 'Under Review', 'Resolved'],
      default: 'Reported',
    },
    resolvedAt: {
      type: Date,
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

protocolDeviationSchema.index({ trialId: 1, severity: 1 });

protocolDeviationSchema.pre(/^find/, function (next) {
  if (this.getQuery().softDeleted === undefined) {
    this.where({ softDeleted: false });
  }
  next();
});

const ProtocolDeviation = mongoose.model('ProtocolDeviation', protocolDeviationSchema);
module.exports = ProtocolDeviation;
