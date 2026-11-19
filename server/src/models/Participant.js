const mongoose = require('mongoose');

const ayurvedaProfileSchema = new mongoose.Schema(
  {
    prakriti: {
      type: String,
      required: true,
      enum: ['vata', 'pitta', 'kapha', 'vata-pitta', 'pitta-kapha', 'vata-kapha', 'sama'],
    },
    doshaImbalance: [
      {
        type: String,
        enum: ['Vata Vriddhi', 'Pitta Vriddhi', 'Kapha Vriddhi', 'Vata Kshaya', 'Pitta Kshaya', 'Kapha Kshaya', 'Tridosha'],
      },
    ],
    ayurvedicDiagnosis: {
      type: String,
      required: true,
      trim: true,
    },
    biomedicalDiagnosis: {
      type: String,
      default: '',
      trim: true,
    },
    formulation: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      default: '1 tablet bid after meals',
    },
    procedure: {
      type: String,
      default: 'Oral administration with warm water',
    },
    durationDays: {
      type: Number,
      default: 90,
    },
  },
  { _id: false }
);

const participantSchema = new mongoose.Schema(
  {
    trialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trial',
      required: true,
      index: true,
    },
    subjectId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
      max: 100,
    },
    sex: {
      type: String,
      required: true,
      enum: ['Male', 'Female', 'Other'],
    },
    distanceKm: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: [
        'Screened',
        'Enrolled',
        'Active',
        'Completed',
        'Withdrawn',
        'Lost to follow-up',
        'Screen failure',
      ],
      default: 'Screened',
    },
    arm: {
      type: String,
      default: 'Standard Ayurvedic Regimen',
    },
    enrolledAt: {
      type: Date,
      default: null,
    },
    consentStatus: {
      type: String,
      enum: ['Pending', 'Signed', 'Withdrawn'],
      default: 'Pending',
    },
    ayurveda: {
      type: ayurvedaProfileSchema,
      required: true,
    },
    dropout: {
      date: { type: Date, default: null },
      reason: { type: String, default: null },
    },
    softDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

participantSchema.index({ trialId: 1, status: 1 });

participantSchema.pre(/^find/, function (next) {
  if (this.getQuery().softDeleted === undefined) {
    this.where({ softDeleted: false });
  }
  next();
});

const Participant = mongoose.model('Participant', participantSchema);
module.exports = Participant;
