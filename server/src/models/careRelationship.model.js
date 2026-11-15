import mongoose from 'mongoose';

export const PERMISSION_TYPES = Object.freeze([
  'view_medications',
  'manage_medications',
  'view_appointments',
  'manage_appointments',
  'view_health_records',
  'add_health_observations',
]);

export const RELATIONSHIP_TYPES = Object.freeze([
  'daughter',
  'son',
  'spouse',
  'grandchild',
  'nurse',
  'doctor',
  'caregiver',
  'other',
]);

export const INVITATION_STATUSES = Object.freeze([
  'pending',
  'accepted',
  'rejected',
  'revoked',
]);

const careRelationshipSchema = new mongoose.Schema(
  {
    elderlyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Elderly user ID is required'],
      index: true,
    },
    memberUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    inviteeEmail: {
      type: String,
      required: [true, 'Invitee email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    relationshipType: {
      type: String,
      enum: {
        values: RELATIONSHIP_TYPES,
        message: '{VALUE} is not a valid relationship type',
      },
      default: 'caregiver',
    },
    permissions: {
      type: [
        {
          type: String,
          enum: {
            values: PERMISSION_TYPES,
            message: '{VALUE} is not a valid CareCircle permission',
          },
        },
      ],
      default: ['view_medications', 'view_appointments', 'view_health_records'],
    },
    invitationStatus: {
      type: String,
      enum: {
        values: INVITATION_STATUSES,
        message: '{VALUE} is not a valid invitation status',
      },
      default: 'pending',
      index: true,
    },
    invitationToken: {
      type: String,
      select: false, // Omit token hash in default queries
      index: true,
    },
    invitationExpiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Invited by user ID is required'],
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.invitationToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index to ensure uniqueness of active relationships
careRelationshipSchema.index(
  { elderlyUserId: 1, inviteeEmail: 1, invitationStatus: 1 },
  { name: 'idx_elderly_invitee_status' }
);

export const CareRelationship = mongoose.model('CareRelationship', careRelationshipSchema);
export default CareRelationship;
