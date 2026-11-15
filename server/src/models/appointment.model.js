import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    elderlyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Elderly user ID is required'],
      index: true,
    },
    doctorName: {
      type: String,
      required: [true, 'Doctor or specialist name is required'],
      trim: true,
    },
    specialty: {
      type: String,
      trim: true,
      default: 'General Practice',
    },
    clinicName: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date and time is required'],
      index: true,
    },
    timeStr: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: [
        'checkup',
        'specialist',
        'telehealth',
        'lab_work',
        'therapy',
        'dental',
        'vision',
        'other',
      ],
      default: 'checkup',
    },
    status: {
      type: String,
      enum: ['upcoming', 'completed', 'cancelled', 'rescheduled'],
      default: 'upcoming',
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    isTelehealth: {
      type: Boolean,
      default: false,
    },
    telehealthLink: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
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

appointmentSchema.index({ elderlyUserId: 1, appointmentDate: 1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
