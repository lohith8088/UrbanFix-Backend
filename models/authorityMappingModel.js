import mongoose from "mongoose";

const authorityMappingSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      unique: true,
    },
    authorityEmail: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const AuthorityMapping = mongoose.model("AuthorityMapping", authorityMappingSchema);
export default AuthorityMapping;
