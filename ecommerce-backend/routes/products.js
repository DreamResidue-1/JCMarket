import express from 'express';
import { Product } from '../models/Product.js';
import { AppError, asyncHandler } from '../utils/http.js';
import { authenticateToken, checkPermission } from '../middleware/auth.js';
import { rankProductsBySearch } from '../utils/productSearch.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const search = req.query.search;

  const products = await Product.findAll();

  if (typeof search === 'string' && search.trim()) {
    res.json(rankProductsBySearch(products, search));
    return;
  }

  res.json(products);
}));

router.post(
  '/',
  authenticateToken,
  checkPermission('create_product'),
  asyncHandler(async (req, res) => {
    const { name, image, priceCents, keywords, rating } = req.body;

    if (!name || !image || !priceCents || !Array.isArray(keywords) || keywords.length === 0 || !rating) {
      throw new AppError(400, 'All product fields are required.');
    }

    const parsedPrice = Number.parseInt(priceCents, 10);
    const parsedStars = Number(rating.stars);
    const parsedCount = Number(rating.count);

    if (Number.isNaN(parsedPrice) || Number.isNaN(parsedStars) || Number.isNaN(parsedCount)) {
      throw new AppError(400, 'Product price and rating values must be valid numbers.');
    }

    const product = await Product.create({
      image,
      name,
      priceCents: parsedPrice,
      rating: {
        stars: parsedStars,
        count: parsedCount
      },
      keywords,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json(product);
  })
);

export default router;
