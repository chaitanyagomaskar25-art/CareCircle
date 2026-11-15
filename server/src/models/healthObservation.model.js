import mongoose from 'mongoose';

export const METRIC_TYPES = Object.freeze([
  'blood_pressure',
  'blood_sugar',
  'blood_glucose',
  'heart_rate',
  'weight',
  'general_wellness',
  'general_mood',
  'temperature',
  'oxygen_saturation',
  'mobility',
  'other',
]);

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
    metricType: {
      type: String,
      enum: {
        values: METRIC_TYPES,
        message: '{VALUE} is not a valid observation metric type',
      },
      index: true,
    },
    // Backwards-compatible alias for existing controllers
    type: {
      type: String,
      enum: {
        values: METRIC_TYPES,
        message: '{VALUE} is not a valid observation type',
      },
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
    systolic: {
      type: Number,
      default: null,
    },
    diastolic: {
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
    recordSource: {
      type: String,
      enum: ['manual', 'verified_medical'],
      default: 'manual',
      index: true,
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

// Pre-validate hook to keep metricType and type synchronized
healthObservationSchema.pre('validate', function (next) {
  if (!this.metricType && this.type) {
    this.metricType = this.type;
  }
  if (!this.type && this.metricType) {
    this.type = this.metricType;
  }
  // Normalize blood_glucose to blood_sugar if needed or vice-versa
  if (this.metricType === 'blood_sugar' && !this.type) {
    this.type = 'blood_sugar';
  }
  next();
});

healthObservationSchema.index({ elderlyUserId: 1, recordedAt: -1 });
healthObservationSchema.index({ elderlyUserId: 1, metricType: 1, recordedAt: -1 });

export const HealthObservation = mongoose.model(
  'HealthObservation',
  healthObservationSchema
);
export default HealthObservation;
