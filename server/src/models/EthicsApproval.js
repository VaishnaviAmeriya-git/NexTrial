const mongoose = require('mongoose');

const ethicsApprovalSchema = new mongoose.Schema(
  {
    trialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trial',
      required: true,
      index: true,
    },
    committeeName: {
      type: String,
      required: true,
      trim: true,
    },
    approvalNo: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['initial', 'amendment', 'continuing_review'],
      default: 'initial',
    },
    approvedAt: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Pending Renewal', 'Expired', 'Revoked'],
      default: 'Active',
    },
    notes: {
      type: String,
      default: '',
    },
    softDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

ethicsApprovalSchema.index({ trialId: 1, status: 1 });

ethicsApprovalSchema.pre(/^find/, function (next) {
  if (this.getQuery().softDeleted === undefined) {
    this.where({ softDeleted: false });
  }
  next();
});

const EthicsApproval = mongoose.model('EthicsApproval', ethicsApprovalSchema);
module.exports = EthicsApproval;
