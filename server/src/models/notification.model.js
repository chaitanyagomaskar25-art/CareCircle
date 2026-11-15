import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
      index: true,
    },
    elderlyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Elderly user ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: [
          'medication_reminder',
          'medication_due',
          'missed_dose_caregiver',
          'missed_dose_family_escalation',
          'inventory_refill',
          'sos_emergency',
          'appointment_reminder',
          'system',
        ],
        message: '{VALUE} is not a valid notification type',
      },
      required: [true, 'Notification type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: 1000,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    deliveryChannel: {
      type: String,
      enum: {
        values: ['in_app', 'email', 'both'],
        message: '{VALUE} is not a valid delivery channel',
      },
      default: 'both',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'delivered', 'failed', 'read'],
        message: '{VALUE} is not a valid status',
      },
      default: 'delivered',
      index: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // Idempotency key prevents duplicate notifications (e.g. type:doseId:recipientId:channel)
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    deliveryDetails: {
      emailDelivered: { type: Boolean, default: false },
      socketDelivered: { type: Boolean, default: false },
      failureReason: { type: String, default: null },
      retryCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for performant queries
notificationSchema.index({ recipientId: 1, readAt: 1, sentAt: -1 });
notificationSchema.index({ elderlyUserId: 1, sentAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
