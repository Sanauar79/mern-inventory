import express from "express";
import multer from "multer";
import { parse } from "fast-csv";
import csv from "csv-parser";
import fs from "fs";
import Product from "../models/Product.js";
import InventoryLog from "../models/InventoryLog.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * GET /api/products?name=&category=
 * Search + filter products
 */
router.get("/", async (req, res) => {
  try {
    const { name, category, page = 1, limit = 10, sort = "name" } = req.query;

    const query = {};
    if (name) query.name = new RegExp(name, "i");
    if (category) query.category = category;

    const products = await Product.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({ items: products, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/products
 * Add a product
 */
router.post("/", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/products/:id
 * Update product (inline editing)
 */
router.put("/:id", async (req, res) => {
  try {
    const oldProduct = await Product.findById(req.params.id);
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // log inventory changes if stock updated
    if (req.body.stock !== undefined && req.body.stock !== oldProduct.stock) {
      await InventoryLog.create({
        productId: updated._id,
        oldQuantity: oldProduct.stock,
        newQuantity: req.body.stock,
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/products/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/products/import
 * Import from CSV
 */
router.post("/import", upload.single("file"), async (req, res) => {
  try {
    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        results.push(row);
      })
      .on("end", async () => {
        try {
          for (let row of results) {
            const product = new Product({
              name: row.name && row.name.trim() !== "" ? row.name : "Unnamed Product",
              category: row.category || "General",
              stock: row.stock ? parseInt(row.stock, 10) : 0,
              status: ["In Stock", "Out of Stock"].includes(row.status)
                ? row.status
                : "In Stock",
              image: row.image || "",
            });
            await product.save();
          }
          res.json({ success: true, message: "CSV imported successfully!" });
        } catch (err) {
          console.error("Error saving products:", err);
          res.status(500).json({ error: "Error saving products" });
        }
      });
  } catch (err) {
    console.error("CSV Import Error:", err);
    res.status(500).json({ error: "CSV Import Failed" });
  }
});

/**
 * GET /api/products/export
 * Export to CSV
 */
router.get("/export", async (req, res) => {
  try {
    const products = await Product.find({});
    res.setHeader("Content-Disposition", "attachment; filename=products.csv");
    res.set("Content-Type", "text/csv");

    res.write("name,unit,category,brand,stock,status,image\n");
    products.forEach((p) => {
      res.write(`${p.name},${p.unit},${p.category},${p.brand},${p.stock},${p.status},${p.image}\n`);
    });
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/products/:id/history
 * Inventory logs
 */
router.get("/:id/history", async (req, res) => {
  try {
    const logs = await InventoryLog.find({ productId: req.params.id }).sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
