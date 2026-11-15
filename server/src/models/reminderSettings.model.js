import mongoose from 'mongoose';

const reminderSettingsSchema = new mongoose.Schema(
  {
    elderlyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Elderly user ID is required'],
      unique: true,
      index: true,
    },
    // Minutes before scheduled dose to alert elderly user (e.g. 15 minutes before)
    reminderLeadTimeMinutes: {
      type: Number,
      default: 15,
      min: [0, 'Lead time cannot be negative'],
      max: [120, 'Lead time cannot exceed 120 minutes'],
    },
    // Minutes after scheduled time before dose is marked missed & caregiver alerted (e.g. 30 minutes)
    missedDoseGracePeriodMinutes: {
      type: Number,
      default: 30,
      min: [5, 'Grace period must be at least 5 minutes'],
      max: [240, 'Grace period cannot exceed 240 minutes'],
    },
    // Delay in minutes after grace period expires before caregiver is alerted (default 0 = immediately upon grace period expiry)
    caregiverNotificationDelayMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Delay cannot be negative'],
      max: [120, 'Delay cannot exceed 120 minutes'],
    },
    // Escalation to family members if dose remains unconfirmed
    familyEscalation: {
      enabled: {
        type: Boolean,
        default: true,
      },
      // Minutes after caregiver alert before escalating to authorized family
      delayAfterCaregiverMinutes: {
        type: Number,
        default: 30,
        min: [5, 'Escalation delay must be at least 5 minutes'],
        max: [240, 'Escalation delay cannot exceed 240 minutes'],
      },
    },
    // Delivery channels enabled for this senior's reminders
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
    },
    // Timezone override for scheduling calculations (defaults to user's timezone or UTC)
    timezone: {
      type: String,
      default: 'UTC',
      trim: true,
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

export const ReminderSettings = mongoose.model(
  'ReminderSettings',
  reminderSettingsSchema
);
export default ReminderSettings;
