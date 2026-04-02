const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    owner:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:         { type: String, required: true, trim: true },
    phone:        { type: String, required: true, trim: true },
    email:        { type: String, trim: true, lowercase: true },
    relationship: { type: String, trim: true },   // "Mom", "Sister", "Friend"
    priority:     { type: Number, default: 1, min: 1, max: 10 }, // 1 = first to be called

    // Notification preferences
    notifyBySMS:  { type: Boolean, default: true },
    notifyByCall: { type: Boolean, default: true },
    notifyByPush: { type: Boolean, default: false }, // only if they also have the app

    fcmToken:     { type: String, default: null },   // if contact also uses SafeNet
  },
  { timestamps: true }
);

contactSchema.index({ owner: 1, priority: 1 });

module.exports = mongoose.model('Contact', contactSchema);
