import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  unit: { type: String, default: "" },
  category: { type: String, default: "", index: true },
  brand: { type: String, default: "" },
  stock: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ["In Stock","Out of Stock"], default: "In Stock" },
  image: { type: String, default: "" },
}, { timestamps: true });

// derive status from stock before save
ProductSchema.pre("save", function(next){
  this.status = (this.stock && this.stock > 0) ? "In Stock" : "Out of Stock";
  next();
});
ProductSchema.pre("findOneAndUpdate", function(next){
  const upd = this.getUpdate()||{};
  if (upd.$set && Object.prototype.hasOwnProperty.call(upd.$set, "stock")) {
    upd.$set.status = (upd.$set.stock > 0) ? "In Stock" : "Out of Stock";
  } else if (Object.prototype.hasOwnProperty.call(upd, "stock")) {
    upd.status = (upd.stock > 0) ? "In Stock" : "Out of Stock";
  }
  next();
});

export default mongoose.model("Product", ProductSchema);