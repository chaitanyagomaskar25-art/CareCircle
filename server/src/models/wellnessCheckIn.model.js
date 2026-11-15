import mongoose from 'mongoose';

const wellnessCheckInSchema = new mongoose.Schema(
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
    feeling: {
      type: String,
      enum: {
        values: ['great', 'good', 'okay', 'not-well'],
        message: '{VALUE} is not a valid feeling state',
      },
      required: [true, 'Feeling state is required'],
    },
    energyLevel: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      default: 'moderate',
    },
    sleepQuality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
      default: 'good',
    },
    waterIntakeGlasses: {
      type: Number,
      default: 0,
      min: 0,
      max: 30,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      default: 'manual',
      enum: ['manual', 'verified_medical'],
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

wellnessCheckInSchema.index({ elderlyUserId: 1, recordedAt: -1 });

export const WellnessCheckIn = mongoose.model('WellnessCheckIn', wellnessCheckInSchema);
export default WellnessCheckIn;
