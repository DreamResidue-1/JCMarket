import './config.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { Op } from 'sequelize';
import { sequelize } from './models/index.js';
import productRoutes from './routes/products.js';
import deliveryOptionRoutes from './routes/deliveryOptions.js';
import cartItemRoutes from './routes/cartItems.js';
import orderRoutes from './routes/orders.js';
import resetRoutes from './routes/reset.js';
import paymentSummaryRoutes from './routes/paymentSummary.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import userRoutes from './routes/users.js';
import { User } from './models/User.js';
import { Product } from './models/Product.js';
import { DeliveryOption } from './models/DeliveryOption.js';
import { CartItem } from './models/CartItem.js';
import { Order } from './models/Order.js';
import { defaultProducts } from './defaultData/defaultProducts.js';
import { defaultDeliveryOptions } from './defaultData/defaultDeliveryOptions.js';
import { defaultCart } from './defaultData/defaultCart.js';
import { defaultOrders } from './defaultData/defaultOrders.js';
import { getAdminEmails } from './utils/googleAuth.js';
import { errorHandler } from './utils/http.js';
import { isEmailDeliveryConfigured } from './utils/email.js';
import { getPermissionsForRole } from './utils/rbac.js';
import fs from 'fs';

const app = express();
const PORT = parseInt(process.env.PORT || '3005', 10);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configuredOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://jcmarket.onrender.com'
    ];

const localDevOriginPatterns = [
  /^http:\/\/localhost:\d+$/i,
  /^http:\/\/127\.0\.0\.1:\d+$/i
];

const isAllowedOrigin = (origin: string) => {
  if (configuredOrigins.includes(origin)) {
    return true;
  }

  if (process.env.NODE_ENV !== 'production') {
    return localDevOriginPatterns.some((pattern) => pattern.test(origin));
  }

  return false;
};

// Middleware
app.use(cors({
  origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Allow popups (e.g. Google sign-in) to communicate with the opener window.
// This relaxes COOP to `same-origin-allow-popups` so `window.postMessage` from
// the popup is not blocked. Apply only for frontend/static responses.
app.use((req: any, res: any, next: any) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

// Serve images from the images folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// Use routes
app.use('/api/products', productRoutes);
app.use('/api/delivery-options', deliveryOptionRoutes);
app.use('/api/cart-items', cartItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reset', resetRoutes);
app.use('/api/payment-summary', paymentSummaryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve index.html for any unmatched routes
app.get('*', (req: any, res: any) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});

app.use(errorHandler);

// Sync database and load default data if none exist
const isSqlite = sequelize.getDialect() === 'sqlite';

if (isSqlite) {
  await sequelize.query('PRAGMA foreign_keys = OFF');
}

await sequelize.sync({ alter: true });

if (isSqlite) {
  await sequelize.query('PRAGMA foreign_keys = ON');
}

const configuredAdminEmails = Array.from(getAdminEmails());
if (configuredAdminEmails.length > 0) {
  await User.update(
    { role: 'admin' },
    {
      where: {
        email: {
          [Op.in]: configuredAdminEmails
        }
      }
    }
  );
}

await User.update(
  { role: 'user' },
  {
    where: {
      role: 'customer'
    }
  }
);

const existingUsers = await User.findAll();
await Promise.all(existingUsers.map(async (user: any) => {
  const currentPermissions = Array.isArray(user.permissions) ? user.permissions : [];
  if (currentPermissions.length > 0) {
    return;
  }

  user.permissions = getPermissionsForRole(user.role);
  await user.save();
}));

const productCount = await Product.count();
if (productCount === 0) {
  const timestamp = Date.now();

  // Prefer seeding from backend/products.json if available (dedupe by `id`)
  let productsToSeed = defaultProducts;
  try {
    const backendProductsPath = path.join(__dirname, 'backend', 'products.json');
    if (fs.existsSync(backendProductsPath)) {
      const raw = fs.readFileSync(backendProductsPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const seen = new Set<string>();
        const deduped: any[] = [];
        parsed.forEach((p: any) => {
          if (!p || !p.id) return;
          if (seen.has(p.id)) return;
          seen.add(p.id);
          deduped.push(p);
        });
        if (deduped.length > 0) {
          productsToSeed = deduped;
          console.log(`Seeding ${deduped.length} products from backend/products.json`);
        }
      }
    }
  } catch (err) {
    console.error('Error loading backend/products.json for seeding, falling back to defaultProducts:', err);
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

  console.log('Default data added to the database.');
}
// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  if (isEmailDeliveryConfigured()) {
    console.log('Email delivery is configured for auth notifications.');
  } else {
    console.warn('Email delivery is not configured. Add SMTP settings to ecommerce-backend/.env to send real auth emails.');
  }
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or set PORT to a free port before starting the server.`);
  } else {
    console.error('Server failed to start:', err);
  }
  process.exit(1);
});
