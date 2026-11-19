const mongoose = require('mongoose');

const visitScheduleItemSchema = new mongoose.Schema({
  visitNo: { type: Number, required: true },
  name: { type: String, required: true },
  dayOffset: { type: Number, required: true },
  windowDays: { type: Number, required: true, default: 3 },
}, { _id: false });

const milestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dueDate: { type: Date },
  doneAt: { type: Date, default: null },
}, { _id: false });

const trialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    phase: {
      type: String,
      required: true,
      enum: ['Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Pilot / Exploratory'],
      default: 'Phase II',
    },
    condition: {
      type: String,
      required: true,
      trim: true,
    },
    formulation: {
      type: String,
      required: true,
      trim: true,
    },
    design: {
      type: String,
      required: true,
      enum: [
        'Randomized, Double-Blind, Placebo-Controlled',
        'Open-Label, Active-Controlled',
        'Single-Arm Exploratory',
        'Cross-Over Comparative',
      ],
      default: 'Randomized, Double-Blind, Placebo-Controlled',
    },
    targetEnrollment: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      required: true,
      enum: ['Draft', 'IEC Pending', 'Approved', 'CTRI Registered', 'Active', 'Paused', 'Closed'],
      default: 'Draft',
    },
    protocolVersion: {
      type: String,
      default: '1.0',
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    expectedEnrollmentDate: {
      type: Date,
      default: null,
    },
    ctri: {
      number: {
        type: String,
        validate: {
          validator: function (v) {
            if (!v) return true;
            return /^CTRI\/\d{4}\/\d{2}\/\d{6}$/.test(v);
          },
          message: props => `${props.value} is not a valid CTRI registration format (CTRI/YYYY/MM/NNNNNN)`,
        },
      },
      registeredAt: { type: Date, default: null },
      prospective: { type: Boolean, default: true },
    },
    visitSchedule: [visitScheduleItemSchema],
    milestones: [milestoneSchema],
    softDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

trialSchema.index({ status: 1 });

trialSchema.pre(/^find/, function (next) {
  if (this.getQuery().softDeleted === undefined) {
    this.where({ softDeleted: false });
  }
  next();
});

const Trial = mongoose.model('Trial', trialSchema);
module.exports = Trial;
