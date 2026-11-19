const mongoose = require('mongoose');

const dataQuerySchema = new mongoose.Schema(
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
    field: {
      type: String,
      required: true,
      trim: true,
    },
    queryText: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Open', 'Answered', 'Closed'],
      default: 'Open',
    },
    raisedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueAt: {
      type: Date,
      required: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answeredAt: {
      type: Date,
      default: null,
    },
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    answerText: {
      type: String,
      default: null,
    },
    closedAt: {
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

dataQuerySchema.index({ trialId: 1, status: 1 });
dataQuerySchema.index({ dueAt: 1, status: 1 });

dataQuerySchema.pre(/^find/, function (next) {
  if (this.getQuery().softDeleted === undefined) {
    this.where({ softDeleted: false });
  }
  next();
});

const DataQuery = mongoose.model('DataQuery', dataQuerySchema);
module.exports = DataQuery;
