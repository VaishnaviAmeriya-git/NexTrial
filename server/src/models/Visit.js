const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
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
    visitNo: {
      type: Number,
      required: true,
    },
    visitName: {
      type: String,
      default: function () {
        return `Visit ${this.visitNo}`;
      },
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    windowStart: {
      type: Date,
      required: true,
    },
    windowEnd: {
      type: Date,
      required: true,
    },
    actualDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ['Scheduled', 'Completed', 'Missed', 'Out-of-window'],
      default: 'Scheduled',
    },
    notes: {
      type: String,
      default: '',
    },
    vitalSigns: {
      systolicBp: Number,
      diastolicBp: Number,
      pulse: Number,
      temperatureC: Number,
      weightKg: Number,
    },
    ayurvedicAssessments: {
      doshaAggravationObserved: Boolean,
      digestiveFireAgni: {
        type: String,
        enum: ['Sama', 'Vishama', 'Tikshna', 'Manda', 'Not Assessed'],
        default: 'Not Assessed',
      },
      bowelHabitsKostha: {
        type: String,
        enum: ['Krura', 'Mrudu', 'Madhya', 'Not Assessed'],
        default: 'Not Assessed',
      },
    },
    softDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

visitSchema.index({ participantId: 1, visitNo: 1 }, { unique: true });
visitSchema.index({ trialId: 1, status: 1 });

visitSchema.pre(/^find/, function (next) {
  if (this.getQuery().softDeleted === undefined) {
    this.where({ softDeleted: false });
  }
  next();
});

const Visit = mongoose.model('Visit', visitSchema);
module.exports = Visit;
