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
                module: "Stock",
                recordId: newProduct.id,
                status: "Pending Retry",
                syncType: "Tally"
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

    try {
        await tallyService.syncStock(result);
        await tallyService.updateSyncStatus(result.id, "Stock", "Success");
    } catch (err) {
        console.warn("Tally Stock Sync Delayed");
    }

    res.json({ message: "Product Added & Synced", product: result });
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

module.exports = router;
