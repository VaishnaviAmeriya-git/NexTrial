const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema(
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
    version: {
      type: String,
      required: true,
      default: '1.0',
    },
    signedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    method: {
      type: String,
      required: true,
      enum: ['Written Paper', 'Digital e-Consent', 'Audio-Visual Recorded'],
      default: 'Written Paper',
    },
    witnessName: {
      type: String,
      default: '',
      trim: true,
    },
    withdrawnAt: {
      type: Date,
      default: null,
    },
    withdrawalReason: {
      type: String,
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

consentSchema.pre(/^find/, function (next) {
  if (this.getQuery().softDeleted === undefined) {
    this.where({ softDeleted: false });
  }
  next();
});

const Consent = mongoose.model('Consent', consentSchema);
module.exports = Consent;
