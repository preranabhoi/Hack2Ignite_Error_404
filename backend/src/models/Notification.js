const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: [
        'submission',
        'assignment',
        'status_change',
        'progress',
        'resolution',
        'priority_change',
        'admin_note',
        'admin_alert',
      ],
      required: true,
      index: true,
    },
    relatedGrievanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      default: null,
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
