import express from 'express';
import { sequelize } from '../models/index.js';
import { Product } from '../models/Product.js';
import { DeliveryOption } from '../models/DeliveryOption.js';
import { CartItem } from '../models/CartItem.js';
import { Order } from '../models/Order.js';
import { defaultProducts } from '../defaultData/defaultProducts.js';
import { defaultDeliveryOptions } from '../defaultData/defaultDeliveryOptions.js';
import { defaultCart } from '../defaultData/defaultCart.js';
import { defaultOrders } from '../defaultData/defaultOrders.js';
import { asyncHandler } from '../utils/http.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.post('/', asyncHandler(async (req, res) => {
  await sequelize.sync({ force: true });

  const timestamp = Date.now();

  // Prefer backend/products.json when available (dedupe by id)
  let productsToSeed = defaultProducts;
  try {
    const backendProductsPath = path.join(__dirname, '..', 'backend', 'products.json');
    if (fs.existsSync(backendProductsPath)) {
      const raw = fs.readFileSync(backendProductsPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const seen = new Set();
        const deduped = [];
        parsed.forEach((p) => {
          if (!p || !p.id) return;
          if (seen.has(p.id)) return;
          seen.add(p.id);
          deduped.push(p);
        });
        if (deduped.length > 0) {
          productsToSeed = deduped;
        }
      }
    }
  } catch (err) {
    console.error('Error loading backend/products.json for reset seeding, falling back to defaultProducts:', err);
  }

  const productsWithTimestamps = productsToSeed.map((product, index) => ({
    ...product,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  const deliveryOptionsWithTimestamps = defaultDeliveryOptions.map((option, index) => ({
    ...option,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  const cartItemsWithTimestamps = defaultCart.map((item, index) => ({
    ...item,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  const ordersWithTimestamps = defaultOrders.map((order, index) => ({
    ...order,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  await Product.bulkCreate(productsWithTimestamps);
  await DeliveryOption.bulkCreate(deliveryOptionsWithTimestamps);
  await CartItem.bulkCreate(cartItemsWithTimestamps);
  await Order.bulkCreate(ordersWithTimestamps);

  res.status(204).send();
}));

export default router;
