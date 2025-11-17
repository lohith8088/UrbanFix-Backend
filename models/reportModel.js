import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    aiClassification: { type: String },

    // 📍 Location fields
    address: { type: String },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: false,
      },
    },

    photoURLs: [{ type: String }],
    videoURLs: [{ type: String }],

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Resolved"],
      default: "Pending",
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

// For geospatial queries later
reportSchema.index({ location: "2dsphere" });

const Report = mongoose.model("Report", reportSchema);
export default Report;
