import mongoose from 'mongoose';

const logSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true },
    targetId: { type: String, default: null },
    details: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Log', logSchema);
