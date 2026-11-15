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
    hospitalName: {
      type: String,
      trim: true,
      default: '',
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
    appointmentTime: {
      type: String,
      default: '',
    },
    timeStr: {
      type: String,
      default: '',
    },
    durationMinutes: {
      type: Number,
      default: 45,
      min: [5, 'Duration must be at least 5 minutes'],
      max: [240, 'Duration cannot exceed 240 minutes'],
    },
    reason: {
      type: String,
      trim: true,
      default: 'Routine Geriatric Consultation',
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
    questionsForDoctor: [
      {
        question: {
          type: String,
          required: [true, 'Question text is required'],
          trim: true,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        addedByName: {
          type: String,
          default: 'Family Member',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isAnswered: {
          type: Boolean,
          default: false,
        },
        doctorResponse: {
          type: String,
          default: '',
        },
      },
    ],
    reminderSent24h: {
      type: Boolean,
      default: false,
      index: true,
    },
    reminderSent2h: {
      type: Boolean,
      default: false,
      index: true,
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
        if (!ret.hospitalName && ret.clinicName) ret.hospitalName = ret.clinicName;
        if (!ret.clinicName && ret.hospitalName) ret.clinicName = ret.hospitalName;
        if (!ret.appointmentTime && ret.timeStr) ret.appointmentTime = ret.timeStr;
        if (!ret.timeStr && ret.appointmentTime) ret.timeStr = ret.appointmentTime;
        return ret;
      },
    },
  }
);

// Pre-save synchronization for hospital/clinic and time
appointmentSchema.pre('save', function (next) {
  if (!this.hospitalName && this.clinicName) this.hospitalName = this.clinicName;
  if (!this.clinicName && this.hospitalName) this.clinicName = this.hospitalName;
  if (!this.appointmentTime && this.timeStr) this.appointmentTime = this.timeStr;
  if (!this.timeStr && this.appointmentTime) this.timeStr = this.appointmentTime;
  next();
});

appointmentSchema.index({ elderlyUserId: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, status: 1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
