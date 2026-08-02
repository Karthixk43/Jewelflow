# JewelFlow

Multi-tenant SaaS platform for jewellery stores — digital catalog, enquiries, WhatsApp integration, and appointment booking.

## Tech Stack

- **Backend:** Node.js, Express, PostgreSQL
- **Frontend:** React (Vite), Tailwind CSS, React Router

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (with a database created, e.g. `jewelflow`)

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env.example`) and set your database credentials:

```
PORT=5000
HOST=0.0.0.0
NODE_ENV=development

DATABASE_URL=
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=jewelflow
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
CORS_ORIGIN=http://localhost:3000

# Optional: persistent cloud image storage for deployment
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=jewelflow
```

Create the database (if not existing) and tables:

```bash
# In psql: CREATE DATABASE jewelflow;
npm run db:setup
```

For hosted Postgres, set `DATABASE_URL` and `DB_SSL=true` instead of the individual `DB_*` fields.

Start the API server:

```bash
npm run dev        # dev with auto-reload
# or: npm start
```

API runs at http://localhost:5000

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at http://localhost:3000 (API requests are proxied to :5000).

For production deployments where the frontend and backend are hosted separately, set `VITE_API_BASE_URL` in the frontend build environment to the backend URL, for example `https://api.yoursite.com`.

## Free Deployment Preview

The repository includes `render.yaml` for a single Render web service. It builds the frontend and serves it from the Express backend, so the app and API use the same URL.

1. Create a free Neon Postgres project and copy its pooled connection string.
2. Push this folder to a new GitHub repository. Do not use the unrelated Git repository currently above this folder.
3. In Render, create a Blueprint from the new repository.
4. Set `DATABASE_URL` to the Neon connection string and `FRONTEND_URL` to the generated Render URL.
5. Add Cloudinary environment variables so product images and logos stay permanent after redeploys.
6. Deploy once, then open the Render Shell and run `cd backend && npm run db:setup`.

Without Cloudinary configured, uploads fall back to the local `backend/uploads` folder. That is fine for local development, but not safe for deployed customer data on free hosting.

## Usage

1. Open http://localhost:3000 → redirected to admin login
2. Click **Register your store** and create a shop
3. Add categories and products from the admin dashboard
4. Your public storefront is at `/store/<your-shop-slug>`

## Routes

| Path | Description |
|---|---|
| `/admin/login`, `/admin/register` | Admin auth |
| `/admin` | Dashboard (products, categories, enquiries, appointments, settings) |
| `/store/:slug` | Public storefront |
| `/store/:slug/product/:id` | Product detail with WhatsApp/enquiry |

## API Overview

- `POST /api/auth/register` — register shop + admin
- `POST /api/auth/login` — login
- `GET /api/products?shop=<slug>` — public product list
- `GET /api/products/admin/all` — admin product list (auth)
- `POST/PUT/DELETE /api/products` — manage products (auth)
- `GET/POST/PUT/DELETE /api/categories` — categories
- `GET/PUT /api/shop`, `GET /api/shop/dashboard` — shop info & stats
- `POST /api/enquiries?shop=<slug>` — customer enquiry; admin: `GET`, `PATCH /:id/status`
- `POST /api/appointments?shop=<slug>` — book visit; admin: `GET`, `PATCH /:id/status`
- `POST /api/upload/products`, `POST /api/upload/logo` — image uploads (auth)

Public endpoints identify the shop via `?shop=<slug>` query param or `x-shop-slug` header.
