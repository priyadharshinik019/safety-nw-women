const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    phone:      { type: String, required: true, unique: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String, required: true, minlength: 8, select: false },
    fcmToken:   { type: String, default: null },      // Firebase push token
    isVolunteer:{ type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },

    // Current GPS position (updated by app in background)
    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },  // [lng, lat]
      updatedAt:   { type: Date, default: null },
    },

    // Emergency settings
    settings: {
      voiceActivation:     { type: Boolean, default: true },
      shakeActivation:     { type: Boolean, default: false },
      autoCallPolice:      { type: Boolean, default: true },
      escalationDelayMins: { type: Number,  default: 2 },
    },
  },
  { timestamps: true }
);

// Geospatial index for volunteer proximity search
userSchema.index({ location: '2dsphere' });
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare plaintext password with stored hash
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Strip sensitive fields from JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
