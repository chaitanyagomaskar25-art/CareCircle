import mongoose from 'mongoose';

export const MEDICATION_STATUSES = Object.freeze([
  'active',
  'discontinued',
  'completed',
  'paused',
]);

export const FREQUENCY_TYPES = Object.freeze([
  'daily',
  'twice_daily',
  'three_times_daily',
  'as_needed',
  'weekly',
  'custom',
]);

const medicationSchema = new mongoose.Schema(
  {
    elderlyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Elderly user ID is required'],
      index: true,
    },
    medicineName: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      minlength: [2, 'Medicine name must be at least 2 characters'],
      maxlength: [120, 'Medicine name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    dosage: {
      type: String,
      required: [true, 'Dosage instructions are required (e.g. 10mg, 1 tablet)'],
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
      default: 'Take with water',
    },
    frequency: {
      type: String,
      enum: {
        values: FREQUENCY_TYPES,
        message: '{VALUE} is not a valid medication frequency',
      },
      default: 'daily',
    },
    // Standardized 24-hr time strings, e.g. ["08:00", "20:00"]
    scheduledTimes: {
      type: [String],
      required: [true, 'At least one scheduled time is required'],
      validate: {
        validator: function (times) {
          if (!Array.isArray(times) || times.length === 0) return false;
          const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
          return times.every((t) => timeRegex.test(t));
        },
        message: 'Scheduled times must be in HH:mm 24-hour format (e.g. "08:00", "13:30")',
      },
    },
    startDate: {
      type: Date,
      required: [true, 'Prescription start date is required'],
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    prescribedBy: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: MEDICATION_STATUSES,
        message: '{VALUE} is not a valid prescription status',
      },
      default: 'active',
      index: true,
    },
    pillAppearance: {
      type: String,
      trim: true,
      default: 'Tablet',
    },
    remainingInventory: {
      type: Number,
      default: 30,
      min: [0, 'Remaining inventory cannot be negative'],
    },
    refillThreshold: {
      type: Number,
      default: 7,
      min: [1, 'Refill threshold must be at least 1'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for rapid filtering
medicationSchema.index({ elderlyUserId: 1, status: 1 });

export const Medication = mongoose.model('Medication', medicationSchema);
export default Medication;
