const mongoose = require('mongoose');

const topFactorSchema = new mongoose.Schema(
  {
    feature: { type: String, required: true },
    value: { type: Number, required: true },
    contribution: { type: Number, required: true },
    direction: { type: String, default: 'Increases risk' },
    label: { type: String, default: '' },
  },
  { _id: false }
);

const riskPredictionSchema = new mongoose.Schema(
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
    asOfVisitNo: {
      type: Number,
      required: true,
      default: 3,
    },
    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    band: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High'],
    },
    topFactors: [topFactorSchema],
    suggestedActions: [
      {
        type: String,
      },
    ],
    modelVersion: {
      type: String,
      required: true,
      default: 'v1.0-rf',
    },
    computedAt: {
      type: Date,
      default: Date.now,
    },
    softDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

riskPredictionSchema.index({ participantId: 1, asOfVisitNo: 1 });
riskPredictionSchema.index({ trialId: 1, band: 1 });

riskPredictionSchema.pre(/^find/, function (next) {
  if (this.getQuery().softDeleted === undefined) {
    this.where({ softDeleted: false });
  }
  next();
});

const RiskPrediction = mongoose.model('RiskPrediction', riskPredictionSchema);
module.exports = RiskPrediction;
