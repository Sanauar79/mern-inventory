import mongoose from "mongoose";
import cloudinary from "./cloudinary.js";   // make sure this file exists at server/cloudinary.js
import Product from "./models/Product.js"; // adjust path if needed
import dotenv from "dotenv";

dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const products = await Product.find();

  for (const product of products) {
  if (product.image) {
    console.log(`➡️ ${product.name} | image starts with: ${product.image.substring(0, 30)}`);

    if (product.image.startsWith("data:image")) {
      try {
        // remove the "data:image/jpeg;base64," part
        const base64Data = product.image.replace(/^data:image\/\w+;base64,/, "");

        // send proper data URI to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(
          `data:image/jpeg;base64,${base64Data}`,
          { folder: "products" }
        );

        product.image = uploadResponse.secure_url;
        await product.save();

        console.log(`✅ Migrated image for product: ${product.name}`);
      } catch (err) {
        console.error(`❌ Failed for ${product.name}:`, err.message);
      }
    } else {
      console.log(`ℹ️ Skipped: ${product.name} (already a URL)`);
    }
  }
}


    await mongoose.disconnect();
    console.log("🚀 Migration complete, DB updated with Cloudinary URLs");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  }
}

migrate();
