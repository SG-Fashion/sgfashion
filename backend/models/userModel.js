import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  // Only required if authProvider === 'local'
  phone: {
    type: String,
    required: function() { return this.authProvider === 'local'; }
  },

  dob: {
    type: Date,
    required: function() { return this.authProvider === 'local'; }
  },

  // Only required if authProvider === 'local'
  password: {
    type: String,
    required: function() { return this.authProvider === 'local'; }
  },

  // Indicates whether this is a local or Google‐authenticated user
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    required: true,
    default: 'local'
  },

  // The Google "sub" field from the ID token, if authProvider === 'google'
  googleId: {
    type: String,
    select: false
  },

  cartData: {
    type: Object,
    default: {}
  },

  savedAddresses: {
    type: [Object],
    default: []
  }
}, {
  minimize: false,
  timestamps: true   // createdAt and updatedAt
});

// Export the existing model if it exists, otherwise create a new one
const userModel = mongoose.models.user || mongoose.model('user', userSchema);
export default userModel;
