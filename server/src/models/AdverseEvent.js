const mongoose = require('mongoose');

const adverseEventSchema = new mongoose.Schema(
  {
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      required: true,
      index: true,
    },
    trialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trial',
      required: true,
      index: true,
    },
    onsetDate: {
      type: Date,
      required: true,
    },
    reportedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    verbatimTerm: {
      type: String,
      required: true,
      trim: true,
    },
    coded: {
      soc: { type: String, default: null }, // System Organ Class
      pt: { type: String, default: null },  // Preferred Term
      code: { type: String, default: null }, // MedDRA-style demo code
      dictionaryVersion: { type: String, default: 'DEMO-MedDRA-v1' },
    },
    severity: {
      type: String,
      required: true,
      enum: ['Mild', 'Moderate', 'Severe'],
      default: 'Mild',
    },
    serious: {
      type: Boolean,
      required: true,
      default: false,
    },
    seriousCriteria: [
      {
        type: String,
        enum: [
          'Death',
          'Life-threatening',
          'Hospitalization / Prolongation',
          'Persistent Disability / Incapacity',
          'Congenital Anomaly',
          'Other Medically Important Event',
        ],
      },
    ],
    causality: {
      type: String,
      enum: ['Certain', 'Probable', 'Possible', 'Unlikely', 'Unassessable'],
      default: 'Possible',
    },
    expected: {
      type: Boolean,
      default: false,
    },
    outcome: {
      type: String,
      enum: ['Recovered', 'Recovering', 'Not Recovered', 'Recovered with Sequelae', 'Fatal', 'Unknown'],
      default: 'Recovering',
    },
    actionTaken: {
      type: String,
      enum: ['None', 'Dose Reduced', 'Drug Interrupted', 'Drug Withdrawn', 'Not Applicable'],
      default: 'None',
    },
    suspectedFormulation: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Open', 'Reported', 'Under Review', 'Closed'],
      default: 'Open',
    },
    deadlines: {
      initialDue: { type: Date, default: null }, // 24 hours for SAE
      detailedDue: { type: Date, default: null }, // 14 days for SAE
    },
    reportedTo: {
      iec: { type: Date, default: null },
      licensingAuthority: { type: Date, default: null },
      sponsor: { type: Date, default: null },
    },
    softDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

adverseEventSchema.index({ trialId: 1, serious: 1 });
adverseEventSchema.index({ trialId: 1, status: 1 });

adverseEventSchema.pre(/^find/, function (next) {
  if (this.getQuery().softDeleted === undefined) {
    this.where({ softDeleted: false });
  }
  next();
});

const AdverseEvent = mongoose.model('AdverseEvent', adverseEventSchema);
module.exports = AdverseEvent;
