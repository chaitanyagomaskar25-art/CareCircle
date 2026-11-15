import mongoose from 'mongoose';

const careAuditLogSchema = new mongoose.Schema(
  {
    elderlyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'INVITATION_CREATED',
        'INVITATION_ACCEPTED',
        'INVITATION_REJECTED',
        'MEMBER_REMOVED',
        'PERMISSIONS_UPDATED',
        'RESIDENT_DATA_ACCESSED',
        'UNAUTHORIZED_ACCESS_BLOCKED',
        'HEALTH_OBSERVATION_RECORDED',
        'APPOINTMENT_SCHEDULED',
        'APPOINTMENT_COMPLETED',
        'CARE_NOTE_RECORDED',
        'MEDICATION_CONFIRMED',
        'MEDICATION_SKIPPED',
      ],
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: 'unknown',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const CareAuditLog = mongoose.model('CareAuditLog', careAuditLogSchema);
export default CareAuditLog;
