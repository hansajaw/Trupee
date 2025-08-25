import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const { Schema, models, model } = mongoose;

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9._]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    fullName: { type: String, trim: true },
    phone: String,
    bio: String,
    profileImage: String,

    // Email verification
    isVerified: { type: Boolean, default: false },
    emailVerifyToken: String,   // stores HASH
    emailVerifyExpires: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.emailVerifyToken;
        delete ret.emailVerifyExpires;
        return ret;
      },
    },
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("email") && this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  if (this.isModified("userName") && this.userName) {
    this.userName = this.userName.toLowerCase().trim();
  }

  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() || {};
  const nextPassword =
    update.password ??
    (update.$set && Object.prototype.hasOwnProperty.call(update.$set, "password")
      ? update.$set.password
      : undefined);

  if (!nextPassword) return next();

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(nextPassword, salt);
  if (update.password) update.password = hashed;
  if (update.$set && update.$set.password) update.$set.password = hashed;
  this.setUpdate(update);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false; // remember .select("+password")
  return bcrypt.compare(candidate, this.password);
};

// Create verify token: store HASH in DB, return RAW for email link
userSchema.methods.createEmailVerifyToken = function () {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  this.emailVerifyToken = hash;
  this.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return raw;
};

userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() }).select("+password");
};

export default models.User || model("User", userSchema);
