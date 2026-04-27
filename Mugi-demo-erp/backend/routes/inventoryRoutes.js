const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/prisma");
const tallyService = require("../services/tally.service");
const automationService = require("../services/automationService");

// Add Product - Automated Sync
router.post("/products", async (req, res) => {
  try {
    const { product_name, sku, quantity, min_stock, price } = req.body;
    const qty = parseInt(quantity) || 0;
    const min = parseInt(min_stock) || 10;
    const prc = parseFloat(price) || 0;

    const result = await prisma.$transaction(async (tx) => {
        const newProduct = await tx.product.create({
            data: {
                productName: product_name,
                sku,
                quantity: qty,
                minStock: min,
                price: prc
            }
        });

        await tx.syncQueue.create({
            data: {
                entityType: "stock",
                entityId: String(newProduct.id),
                payload: newProduct,
                status: "QUEUED"
            }
        });

        return newProduct;
    });

    if (result.quantity < result.minStock) {
        await automationService.runAutomation({
            type: "LOW_STOCK",
            data: { 
                productId: result.id, 
                productName: result.productName, 
                quantity: result.quantity, 
                minStock: result.minStock,
                sku: result.sku
            }
        });
    }

    res.json({ message: "Product Added to Inventory & Queued for Sync", product: result });
  } catch (err) {
    res.status(500).send("Error adding product");
  }
});

// Get all products
router.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (err) {
    res.status(500).send("Error fetching products");
  }
});

// Get single product by ID (Stock Check)
router.get("/products/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).send("Error fetching product details");
  }
});

// Update Product with Audit Trail
router.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, price, min_stock, quantity } = req.body;

    const oldProduct = await prisma.product.findUnique({ where: { id: parseInt(id) } });
    if (!oldProduct) return res.status(404).json({ error: "Product not found" });

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        productName: product_name,
        price: price ? parseFloat(price) : undefined,
        minStock: min_stock ? parseInt(min_stock) : undefined,
        quantity: quantity ? parseInt(quantity) : undefined
      }
    });

    // Enterprise Audit Log
    await prisma.activityLog.create({
      data: {
        module: "Inventory",
        action: "PRODUCT_UPDATE",
        message: `Product ${updatedProduct.sku} updated. Price changed from ${oldProduct.price} to ${updatedProduct.price}`,
        oldData: oldProduct,
        newData: updatedProduct,
        ipAddress: req.socket.remoteAddress,
        targetId: updatedProduct.id
      }
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

module.exports = router;
