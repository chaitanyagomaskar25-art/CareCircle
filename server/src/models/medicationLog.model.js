import mongoose from 'mongoose';

export const DOSE_STATUSES = Object.freeze([
  'pending',
  'taken',
  'skipped',
  'missed',
]);

const medicationLogSchema = new mongoose.Schema(
  {
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
      required: [true, 'Medication reference ID is required'],
      index: true,
    },
    elderlyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Elderly user ID is required'],
      index: true,
    },
    // The exact calendar moment this dose was due
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled timestamp is required'],
      index: true,
    },
    // Convenient 24-hr time representation e.g. "08:00"
    scheduledTimeStr: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: DOSE_STATUSES,
        message: '{VALUE} is not a valid dose status',
      },
      default: 'pending',
      index: true,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: prevents duplicate dose records for the same medication occurrence
medicationLogSchema.index(
  { medicationId: 1, scheduledAt: 1 },
  { unique: true, name: 'idx_unique_med_dose' }
);

// Compound index for querying a resident's schedule by date
medicationLogSchema.index(
  { elderlyUserId: 1, scheduledAt: 1, status: 1 },
  { name: 'idx_elderly_schedule_status' }
);

export const MedicationLog = mongoose.model('MedicationLog', medicationLogSchema);
export default MedicationLog;
