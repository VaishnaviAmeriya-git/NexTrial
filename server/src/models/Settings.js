const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global_ctms_settings',
    },
    regulatoryTimelines: {
      saeInitialReportDueHours: {
        type: Number,
        required: true,
        default: 24, // 24 hours
      },
      saeDetailedReportDueDays: {
        type: Number,
        required: true,
        default: 14, // 14 days
      },
      iecExpiryWarningDays: {
        type: Number,
        required: true,
        default: 30, // 30 days
      },
      queryOverdueDays: {
        type: Number,
        required: true,
        default: 14, // 14 days
      },
    },
    trialHealthScoreWeights: {
      enrollment: { type: Number, default: 0.25 },
      retention: { type: Number, default: 0.25 },
      compliance: { type: Number, default: 0.20 },
      safety: { type: Number, default: 0.15 },
      quality: { type: Number, default: 0.15 },
    },
    riskBands: {
      lowMax: { type: Number, default: 0.30 },
      mediumMax: { type: Number, default: 0.60 },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
