import mongoose from 'mongoose';

const conditionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Condition name is required'],
    trim: true,
  },
  diagnosedDate: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'managed', 'resolved'],
    default: 'active',
  },
  source: {
    type: String,
    enum: ['verified_medical', 'manual'],
    default: 'manual',
  },
  verifiedBy: {
    type: String,
    trim: true,
    default: '',
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const allergySchema = new mongoose.Schema({
  allergen: {
    type: String,
    required: [true, 'Allergen name is required'],
    trim: true,
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'life-threatening'],
    default: 'moderate',
  },
  reaction: {
    type: String,
    trim: true,
    default: '',
  },
  source: {
    type: String,
    enum: ['verified_medical', 'manual'],
    default: 'manual',
  },
  verifiedBy: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Emergency contact name is required'],
    trim: true,
  },
  relationship: {
    type: String,
    trim: true,
    default: '',
  },
  phone: {
    type: String,
    required: [true, 'Emergency contact phone number is required'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    default: '',
  },
  address: {
    type: String,
    trim: true,
    default: '',
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
});

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true,
  },
  specialty: {
    type: String,
    trim: true,
    default: 'General Practitioner',
  },
  clinic: {
    type: String,
    trim: true,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  email: {
    type: String,
    trim: true,
    default: '',
  },
  address: {
    type: String,
    trim: true,
    default: '',
  },
  isPrimaryCare: {
    type: Boolean,
    default: false,
  },
});

const healthProfileSchema = new mongoose.Schema(
  {
    elderlyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Elderly user ID is required'],
      unique: true,
      index: true,
    },
    medicalConditions: [conditionSchema],
    allergies: [allergySchema],
    emergencyContacts: [emergencyContactSchema],
    doctorInformation: [doctorSchema],
    bloodType: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

export const HealthProfile = mongoose.model('HealthProfile', healthProfileSchema);
export default HealthProfile;
