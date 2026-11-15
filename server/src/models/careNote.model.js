import mongoose from 'mongoose';

const careNoteSchema = new mongoose.Schema(
  {
    elderlyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Elderly user ID is required'],
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author user ID is required'],
    },
    category: {
      type: String,
      enum: ['general', 'medical', 'dietary', 'behavioral', 'physician_instruction'],
      default: 'general',
    },
    note: {
      type: String,
      required: [true, 'Care note text is required'],
      trim: true,
    },
    isPriority: {
      type: Boolean,
      default: false,
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

careNoteSchema.index({ elderlyUserId: 1, createdAt: -1 });

export const CareNote = mongoose.model('CareNote', careNoteSchema);
export default CareNote;
