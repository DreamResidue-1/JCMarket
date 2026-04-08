import express from 'express';
import { randomUUID } from 'crypto';
import { Product } from '../models/Product.js';
import { DeliveryOption } from '../models/DeliveryOption.js';
import { CartItem } from '../models/CartItem.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { normalizeSearchText, rankProductsBySearch } from '../utils/productSearch.js';

const router = express.Router();
const threads = new Map();
const THREAD_TTL_MS = 1000 * 60 * 60 * 6;
const MAX_RECOMMENDATIONS = 4;

const formatMoney = (priceCents) => `$${(priceCents / 100).toFixed(2)}`;

const formatProductSummary = (product, index) => {
  return `${index + 1}. ${product.name} - ${formatMoney(product.priceCents)} (${product.rating.stars}/5, ${product.rating.count} reviews)`;
};

const cleanupThreads = () => {
  const now = Date.now();

  for (const [threadId, thread] of threads.entries()) {
    if (now - thread.updatedAt > THREAD_TTL_MS) {
      threads.delete(threadId);
    }
  }
};

const getThread = (threadId) => {
  cleanupThreads();

  if (threadId && threads.has(threadId)) {
    return threads.get(threadId);
  }

  const newThreadId = threadId || randomUUID();
  const thread = {
    id: newThreadId,
    history: [],
    lastMatches: [],
    updatedAt: Date.now()
  };

  threads.set(newThreadId, thread);
  return thread;
};

const getReferencedProduct = (message, matches) => {
  if (!matches.length) {
    return null;
  }

  const normalizedMessage = normalizeSearchText(message);
  const indexMatchers = [
    { test: /\b(first|1|one)\b/, index: 0 },
    { test: /\b(second|2|two)\b/, index: 1 },
    { test: /\b(third|3|three)\b/, index: 2 },
    { test: /\b(fourth|4|four)\b/, index: 3 }
  ];

  for (const matcher of indexMatchers) {
    if (matcher.test.test(normalizedMessage) && matches[matcher.index]) {
      return matches[matcher.index];
    }
  }

  if (/\b(cheapest|lowest|budget|affordable)\b/.test(normalizedMessage)) {
    return [...matches].sort((left, right) => left.priceCents - right.priceCents)[0];
  }

  if (/\b(expensive|premium|priciest|highest)\b/.test(normalizedMessage)) {
    return [...matches].sort((left, right) => right.priceCents - left.priceCents)[0];
  }

  if (/\b(best|top|highest rated|rating)\b/.test(normalizedMessage)) {
    return [...matches].sort((left, right) => {
      if (right.rating.stars !== left.rating.stars) {
        return right.rating.stars - left.rating.stars;
      }

      return right.rating.count - left.rating.count;
    })[0];
  }

  return null;
};

const extractMaxPrice = (message) => {
  const match = normalizeSearchText(message).match(/\b(?:under|below|less than|max|up to)\s+\$?(\d+(?:\.\d{1,2})?)\b/);

  if (!match) {
    return null;
  }

  return Math.round(Number(match[1]) * 100);
};

const buildDeliveryResponse = async () => {
  const deliveryOptions = await DeliveryOption.findAll();
  const sortedOptions = [...deliveryOptions].sort((left, right) => left.deliveryDays - right.deliveryDays);

  if (!sortedOptions.length) {
    return 'I can help with products and order questions. Delivery options are not available right now.';
  }

  const parts = sortedOptions.map((option) => {
    const label = option.deliveryDays === 1 ? '1-day' : `${option.deliveryDays}-day`;
    const price = option.priceCents === 0 ? 'free' : formatMoney(option.priceCents);
    return `${label} delivery for ${price}`;
  });

  return `We currently offer ${parts.join(', ')}. You can change the delivery option from the cart or checkout page.`;
};

const buildCartResponse = async () => {
  const cartItems = await CartItem.findAll();

  if (!cartItems.length) {
    return 'Your cart is currently empty. Tell me what you want to shop for and I can help you find it.';
  }

  const products = await Promise.all(cartItems.map((item) => Product.findByPk(item.productId)));
  const summaries = cartItems.map((item, index) => {
    const product = products[index];
    const productName = product?.name || `Product ${item.productId}`;
    return `${productName} x${item.quantity}`;
  });

  return `You currently have ${cartItems.length} item(s) in the cart: ${summaries.join(', ')}.`;
};

const buildProductDetailResponse = (product) => {
  const keywords = Array.isArray(product.keywords) ? product.keywords.join(', ') : '';
  const keywordText = keywords ? ` Categories: ${keywords}.` : '';
  return `${product.name} costs ${formatMoney(product.priceCents)} and is rated ${product.rating.stars}/5 from ${product.rating.count} reviews.${keywordText}`;
};

const buildSearchResponse = (message, matches) => {
  const recommendations = matches.slice(0, MAX_RECOMMENDATIONS);
  const normalizedMessage = normalizeSearchText(message);
  const maxPrice = extractMaxPrice(normalizedMessage);

  const filteredRecommendations = maxPrice === null
    ? recommendations
    : recommendations.filter((product) => product.priceCents <= maxPrice);

  const finalRecommendations = filteredRecommendations.length > 0 ? filteredRecommendations : recommendations;

  if (!finalRecommendations.length) {
    if (maxPrice !== null) {
      return `I found products related to that search, but nothing under ${formatMoney(maxPrice)}. Try raising the budget a little or ask for a different category.`;
    }

    return 'I could not find a close product match yet. Try a category like shoes, kitchen, apparel, towels, or basketball.';
  }

  const recommendationText = finalRecommendations
    .map((product, index) => formatProductSummary(product, index))
    .join('\n');

  return `Here are the best matches I found:\n${recommendationText}\n\nIf you want, I can narrow that down by budget, rating, or delivery speed.`;
};

const buildFallbackResponse = () => {
  return 'I can help you find products, compare prices, explain delivery options, or summarize your cart. Try asking for something like "show kitchen items under $40" or "what is the fastest delivery option?"';
};

const generateChatResponse = async (message, thread) => {
  const normalizedMessage = normalizeSearchText(message);

  if (!normalizedMessage) {
    return {
      response: 'Send me a product question or shopping request and I will help you with it.',
      matches: thread.lastMatches
    };
  }

  if (/\b(thanks|thank you)\b/.test(normalizedMessage)) {
    return {
      response: 'You are welcome. If you want to keep shopping, I can help you compare products or delivery options.',
      matches: thread.lastMatches
    };
  }

  if (/\b(hello|hi|hey)\b/.test(normalizedMessage) && normalizedMessage.split(' ').length <= 4) {
    return {
      response: 'Hello! I can help you search products, compare options, and answer delivery questions. What would you like to shop for?',
      matches: thread.lastMatches
    };
  }

  if (/\b(delivery|shipping|arrive|arrival|ship)\b/.test(normalizedMessage)) {
    return {
      response: await buildDeliveryResponse(),
      matches: thread.lastMatches
    };
  }

  if (/\b(cart|basket)\b/.test(normalizedMessage)) {
    return {
      response: await buildCartResponse(),
      matches: thread.lastMatches
    };
  }

  if (/\b(order|track|tracking|package)\b/.test(normalizedMessage) && !thread.lastMatches.length) {
    return {
      response: 'You can review and track orders from the Orders page. If you need help finding a product before checkout, tell me what you are looking for.',
      matches: thread.lastMatches
    };
  }

  const referencedProduct = getReferencedProduct(normalizedMessage, thread.lastMatches);
  if (referencedProduct) {
    return {
      response: buildProductDetailResponse(referencedProduct),
      matches: thread.lastMatches
    };
  }

  const allProducts = await Product.findAll();
  const rankedProducts = rankProductsBySearch(allProducts, message);

  if (rankedProducts.length > 0) {
    return {
      response: buildSearchResponse(message, rankedProducts),
      matches: rankedProducts.slice(0, MAX_RECOMMENDATIONS)
    };
  }

  return {
    response: buildFallbackResponse(),
    matches: thread.lastMatches
  };
};

const handleChatMessage = async (req, res, threadId) => {
  const { message } = req.body ?? {};

  if (typeof message !== 'string' || !message.trim()) {
    throw new AppError(400, 'A message is required.');
  }

  const thread = getThread(threadId);
  const trimmedMessage = message.trim();
  const result = await generateChatResponse(trimmedMessage, thread);

  thread.history.push(
    { role: 'user', message: trimmedMessage },
    { role: 'assistant', message: result.response }
  );
  thread.history = thread.history.slice(-12);
  thread.lastMatches = result.matches;
  thread.updatedAt = Date.now();
  threads.set(thread.id, thread);

  res.json({
    threadId: thread.id,
    response: result.response
  });
};

router.post('/', asyncHandler(async (req, res) => {
  await handleChatMessage(req, res, null);
}));

router.post('/:threadId', asyncHandler(async (req, res) => {
  await handleChatMessage(req, res, req.params.threadId);
}));

export default router;
