import mongoose from 'mongoose';

const healthObservationSchema = new mongoose.Schema(
  {
    elderlyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Elderly user ID is required'],
      index: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author user ID is required'],
    },
    type: {
      type: String,
      enum: {
        values: [
          'blood_pressure',
          'blood_glucose',
          'heart_rate',
          'temperature',
          'weight',
          'oxygen_saturation',
          'general_mood',
          'mobility',
          'other',
        ],
        message: '{VALUE} is not a valid observation type',
      },
      required: [true, 'Observation type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    value: {
      type: String,
      required: [true, 'Observation value is required'],
      trim: true,
    },
    numericValue: {
      type: Number,
      default: null,
    },
    unit: {
      type: String,
      trim: true,
      default: '',
    },
    severity: {
      type: String,
      enum: ['normal', 'attention', 'critical'],
      default: 'normal',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
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

healthObservationSchema.index({ elderlyUserId: 1, recordedAt: -1 });

export const HealthObservation = mongoose.model(
  'HealthObservation',
  healthObservationSchema
);
export default HealthObservation;
