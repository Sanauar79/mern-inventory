import mongoose from "mongoose";

const InventoryLogSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  oldQuantity: { type: Number, required: true },
  newQuantity: { type: Number, required: true },
  delta: { type: Number, required: true },
  user: { type: String, default: "system" },
}, { timestamps: true });

export default mongoose.model("InventoryLog", InventoryLogSchema);