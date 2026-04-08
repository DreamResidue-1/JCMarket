import express from 'express';
import { CartItem } from '../models/CartItem.js';
import { Product } from '../models/Product.js';
import { DeliveryOption } from '../models/DeliveryOption.js';
import { AppError, asyncHandler } from '../utils/http.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const cartItems = await CartItem.findAll();
  let totalItems = 0;
  let productCostCents = 0;
  let shippingCostCents = 0;

  for (const item of cartItems) {
    const product = await Product.findByPk(item.productId);
    const deliveryOption = await DeliveryOption.findByPk(item.deliveryOptionId);

    if (!product) {
      throw new AppError(400, `Product not found: ${item.productId}`);
    }

    if (!deliveryOption) {
      throw new AppError(400, `Invalid delivery option: ${item.deliveryOptionId}`);
    }

    totalItems += item.quantity;
    productCostCents += product.priceCents * item.quantity;
    shippingCostCents += deliveryOption.priceCents;
  }

  const totalCostBeforeTaxCents = productCostCents + shippingCostCents;
  const taxCents = Math.round(totalCostBeforeTaxCents * 0.1);
  const totalCostCents = totalCostBeforeTaxCents + taxCents;

  res.json({
    totalItems,
    productCostCents,
    shippingCostCents,
    totalCostBeforeTaxCents,
    taxCents,
    totalCostCents
  });
}));

export default router;
