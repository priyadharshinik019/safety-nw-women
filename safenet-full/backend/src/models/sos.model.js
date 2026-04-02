const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    status: {
      type: String,
      enum: ['active', 'resolved', 'cancelled', 'escalated'],
      default: 'active',
    },

    triggerMethod: {
      type: String,
      enum: ['button', 'voice', 'shake', 'silent', 'test'],
      required: true,
    },

    // Initial location when SOS was triggered
    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },  // [lng, lat]
      address:     { type: String, default: null },
    },

    // Full GPS trail recorded during active SOS
    locationHistory: [
      {
        coordinates: { type: [Number], required: true },
        recordedAt:  { type: Date, default: Date.now },
      },
    ],

    // Trusted contacts notification log
    notifiedContacts: [
      {
        contact:      { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
        name:         { type: String },
        phone:        { type: String },
        notifiedAt:   { type: Date },
        smsDelivered: { type: Boolean, default: false },
        callPlaced:   { type: Boolean, default: false },
        callSid:      { type: String, default: null },
        callStatus:   { type: String, default: 'pending' }, // completed|no-answer|busy|failed
        callDuration: { type: Number, default: 0 },
        pushDelivered:{ type: Boolean, default: false },
      },
    ],

    // Volunteer notification log
    notifiedVolunteers: [
      {
        volunteer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        notifiedAt:  { type: Date },
        responded:   { type: Boolean, default: false },
        respondedAt: { type: Date, default: null },
      },
    ],

    // Police escalation
    policeNotified:   { type: Boolean, default: false },
    policeNotifiedAt: { type: Date, default: null },

    // Resolution
    resolvedAt:  { type: Date, default: null },
    resolvedBy:  { type: String, enum: ['user', 'contact', 'auto', null], default: null },
    resolveNote: { type: String, default: null },
  },
  { timestamps: true }
);

sosSchema.index({ location: '2dsphere' });
sosSchema.index({ user: 1, status: 1 });
sosSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SOS', sosSchema);
