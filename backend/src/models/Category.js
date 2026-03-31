import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, unique: true },
  image: { type: String },
  description: { type: String },
});

categorySchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, "-");
  }
});

export default mongoose.model("Category", categorySchema);
