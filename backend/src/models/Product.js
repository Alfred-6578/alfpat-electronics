import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, min: 0 },
  images: [String],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  brand: { type: String },
  stock: { type: Number, default: 0, min: 0 },
  specs: [{ key: String, value: String }],
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

productSchema.pre("save", async function () {
  if (this.isModified("name")) {
    let base = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let slug = base;
    let count = 0;
    const Product = this.constructor;

    // Check for existing slugs, skip self on update
    while (await Product.findOne({ slug, _id: { $ne: this._id } })) {
      count++;
      slug = `${base}-${count}`;
    }

    this.slug = slug;
  }
});

export default mongoose.model("Product", productSchema);
