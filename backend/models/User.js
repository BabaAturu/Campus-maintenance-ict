import mongoose from 'mongoose';

export const USER_ROLES = Object.freeze({
  STAFF: 'STAFF',
  ICT_ADMIN: 'ICT_ADMIN',
  ICT_TECHNICIAN_TEAM_LEAD: 'ICT_TECHNICIAN_TEAM_LEAD',
  ICT_TECHNICIAN: 'ICT_TECHNICIAN',
});

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    department: { type: String, required: true, trim: true, maxlength: 120 },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.STAFF,
      required: true,
    },
    isActive: { type: Boolean, default: true, required: true },
    isInitialAdmin: { type: Boolean, default: false, select: false },
  },
  { timestamps: true },
);

userSchema.index(
  { isInitialAdmin: 1 },
  { unique: true, partialFilterExpression: { isInitialAdmin: true } },
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
