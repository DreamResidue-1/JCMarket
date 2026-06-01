JC Market — Realistic Ecommerce Sample

Overview
JC Market is a demo ecommerce application built to showcase a full-stack production-like setup: storefront (React + Vite + TypeScript), backend API (Node/Express), seedable product catalog, payment mock, Docker development environment, and CI pipelines. Use this repo as a reference, demo, or starting point for production projects.

Key features
- Product catalog, cart, checkout flow (mock payments)
- Orders, inventory, and fulfillment status
- Seed scripts and sample product images
- Docker + docker-compose for local dev with DB
- Unit and integration tests, plus GitHub Actions CI

Repository layout
- JCMarket-ts/ — React + TypeScript storefront and marketing assets
- ecommerce-backend/ — API server, models, seed scripts, tests
- branding/ — logos, favicons, and BRANDING.md

Getting started (local)
Prereqs: Node.js 18+, npm, Docker (optional)

1. Frontend
   cd JCMarket-ts
   npm install
   npm run dev

2. Backend (in separate terminal)
   cd ecommerce-backend
   npm install
   npm run dev

3. If using Docker
   docker-compose up --build
   (See docker/ for compose file and env examples)

Environment
Create a .env file in ecommerce-backend/ with:
- PORT=4000
- DATABASE_URL=postgres://user:pass@db:5432/jcmarket
- JWT_SECRET=change-me

Seeding demo data
From ecommerce-backend:
   npm run seed -- --file ../JCMarket-ts/sample-products.csv

Tests
- Frontend: npm test inside JCMarket-ts
- Backend: npm test inside ecommerce-backend

CI / CD
A GitHub Actions workflow (/.github/workflows/) runs lint, test, and build on push. See docs/API.md and ARCHITECTURE.md for integration points.

Contributing
See CONTRIBUTING.md for branch, PR, and code style guidelines. Keep changes small and add tests for new behavior.

License & Contacts
This sample is provided under the MIT License (see LICENSE). For questions: dev@jc-market.example
