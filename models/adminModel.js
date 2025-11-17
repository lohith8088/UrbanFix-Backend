import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true
    },

    department: {
      type: String,
      required: true
    },

    authorityEmail: {
      type: String,
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
