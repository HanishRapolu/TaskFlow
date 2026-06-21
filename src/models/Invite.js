import mongoose from 'mongoose';
import crypto from 'crypto';

const inviteSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    required: true
  },
  token: {
    type: String,
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
}, { timestamps: true });

// Prevent multiple active invites for the same email + workspace combo
inviteSchema.index({ workspaceId: 1, email: 1 }, { unique: true });

export default mongoose.model('Invite', inviteSchema);
