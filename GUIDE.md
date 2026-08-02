# JewelFlow — Complete Business & Operations Guide

A multi-tenant SaaS catalog platform you sell to local jewellery stores. Each store gets its own branded online catalog, WhatsApp enquiries, and appointment booking — without you building anything new per customer.

---

## Part 1: Running the Project

### First-time setup (any machine)

1. **Install prerequisites**
   - Node.js 18+ → https://nodejs.org
   - PostgreSQL 14+ → https://www.postgresql.org/download/

2. **Create the database**
   ```sql
   -- in psql or pgAdmin
   CREATE DATABASE jewelflow;
   ```

3. **Backend**
   ```bash
   cd backend
   npm install
   ```
   Copy `.env.example` to `.env` and edit:
   - `DB_PASSWORD` — your postgres password
   - `JWT_SECRET` — a long random string (e.g. run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)

   Then:
   ```bash
   npm run db:setup    # creates all tables
   npm run dev         # starts API on :5000
   ```

4. **Frontend** (new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev         # starts app on :3000
   ```

### Verify it's working (smoke test checklist)

| # | Test | Expected |
|---|------|----------|
| 1 | Open http://localhost:5000/api/health | `{"status":"ok",...}` |
| 2 | Open http://localhost:3000 | Redirects to admin login |
| 3 | Register a store (e.g. "Test Jewellers") | Lands on dashboard |
| 4 | Add a category "Rings" | Appears in list |
| 5 | Add a product with an image, price, "show price" ON | Appears in Products grid |
| 6 | Click "View Store" in sidebar | Storefront opens at `/store/test-jewellers` |
| 7 | On storefront: search, filter by category | Product appears/filters correctly |
| 8 | Open product → "Send Enquiry" with name+phone | Success message |
| 9 | Storefront → "Book a Visit" | Success message |
| 10 | Back in admin: Enquiries & Appointments pages | Both entries visible; status can be changed |
| 11 | Settings: change brand color, upload logo, save | Storefront reflects new color/logo after refresh |
| 12 | Log out, log back in | Works, dashboard stats correct |

If all 12 pass, the system is fully functional.

---

## Part 2: How to Sell This

### Who to sell to
- Local jewellery stores with no website (most of them)
- Stores currently posting catalogs on WhatsApp status / Instagram manually
- Multi-branch stores wanting a shared catalog

### The pitch (30 seconds)
> "Your entire collection online in one day. Customers browse your catalog on their phone, tap one button to WhatsApp you about a piece, and book a visit to your store. No website developer, no maintenance headache — ₹X/month."

### Demo flow that closes deals
1. Before the meeting, create their store with 5–10 of their actual pieces (photos from their Instagram).
2. Show them **their own catalog on your phone** — the storefront with their name and gold branding.
3. Tap the WhatsApp button → their phone buzzes with a real enquiry.
4. Show the admin panel: "You add a product in 60 seconds, it's live instantly."
5. Key objection killers:
   - "No price shown unless you want" → show the price-toggle per product
   - "What if a piece is sold?" → mark Sold Out or hide in one tap
   - "I'm not technical" → the admin is as simple as WhatsApp

### Pricing models (pick one)
| Model | Price idea | Notes |
|-------|-----------|-------|
| Monthly SaaS | ₹999–2,999/mo | Recurring revenue, easiest to start |
| Setup + monthly | ₹5,000 setup + ₹999/mo | Setup fee covers you loading their catalog |
| Yearly | ₹10,000–25,000/yr | Better cash flow, fewer churn conversations |

Charge extra for: catalog data entry (per 100 products), photography, custom domain, priority support.

### Onboarding a new customer (your process, ~1 hour)
1. Register their shop in the admin (`/admin/register`) — pick a clean slug (e.g. `sri-lakshmi-jewellers`).
2. Enter their WhatsApp number, phone, address, hours in **Settings**.
3. Upload their logo, set their brand color.
4. Create their categories (Rings, Necklaces, Bangles, Earrings, Chains...).
5. Add their first 20–50 products (get photos via WhatsApp from them).
6. Send them the storefront link + admin login. Do a 15-minute walkthrough call.
7. Tell them to put the link in their Instagram bio, Google Business profile, and WhatsApp status.

---

## Part 3: Deploying to Production (before you can sell)

You need this running on the internet, not localhost.

### Option A: 100% FREE deployment (₹0/month — perfect for demos & first customers)

| Piece | Free service | Notes |
|-------|-------------|-------|
| Database | **Neon.tech** (free Postgres) | 0.5GB storage — enough for thousands of products |
| Backend API | **Render.com** (free web service) | Sleeps after 15 min idle; wakes in ~50s |
| Frontend | **Vercel.com** (free) | Fast, global CDN, custom domain support |

**Step-by-step:**

1. **Database — Neon** (5 min)
   - Sign up at https://neon.tech → Create project → copy the connection string
   - It looks like: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

2. **Backend — Render** (10 min)
   - Push your code to a GitHub repo
   - Render.com → New → Web Service → connect your repo, root directory = `backend`
   - Build command: `npm install` · Start command: `node src/server.js`
   - Add environment variables:
     ```
     NODE_ENV=production
     DB_HOST=<neon host>          DB_PORT=5432
     DB_USER=<neon user>          DB_PASSWORD=<neon password>
     DB_NAME=<neon db name>
     JWT_SECRET=<long random string>
     CORS_ORIGIN=https://your-app.vercel.app
     ```
   - One extra change for Neon: it requires SSL — already handled! The code enables SSL automatically when `NODE_ENV=production` (or set `DB_SSL=true`).
   - Run the table setup once: Render Shell tab → `npm run db:setup`

3. **Frontend — Vercel** (5 min)
   - Vercel.com → New Project → same repo, root directory = `frontend`
   - Framework preset: Vite (auto-detected)
   - Add a `frontend/vercel.json` so `/api` and `/uploads` reach your Render backend:
     ```json
     {
       "rewrites": [
         { "source": "/api/:path*", "destination": "https://your-api.onrender.com/api/:path*" },
         { "source": "/uploads/:path*", "destination": "https://your-api.onrender.com/uploads/:path*" }
       ]
     }
     ```
   - Deploy → your app is live at `https://your-app.vercel.app`

**Free-tier limitations (be aware):**
- ⚠️ **Render free disk is temporary** — uploaded images are DELETED whenever the service restarts/redeploys. Fine for demos; for paying customers either upgrade Render to a paid plan with a persistent disk (~$7/mo) or move images to **Cloudinary** (free tier: 25GB bandwidth) — worth doing once you have 2–3 paying stores.
- ⚠️ Backend sleeps after 15 min idle — first visitor waits ~50s. Fix free: UptimeRobot pinging `/api/health` every 5 min keeps it awake.
- Neon free tier pauses after inactivity too (wakes automatically in ~1s — barely noticeable).

**When to move off free tier:** the moment your first customer pays. ₹700/mo of infra vs ₹999+/mo revenue per store — it pays for itself with one customer.

### Option B: Cheapest paid stack (~₹400–800/mo total) — for real customers
- **Backend + DB**: Railway.app or Render.com paid tier (persistent disk + Postgres included), or a ₹400/mo VPS (Hetzner/DigitalOcean)
- **Frontend**: Vercel or Netlify (free tier is fine forever)
- **Domain**: one domain like `jewelflow.in` — stores get `jewelflow.in/store/their-name`

### Production checklist
- [ ] Set `NODE_ENV=production` and a strong `JWT_SECRET` in server env
- [ ] Set `CORS_ORIGIN` to your frontend domain
- [ ] Run `npm run db:setup` once against the production DB
- [ ] Frontend: `npm run build`, deploy `dist/`; set proxy/rewrite of `/api` and `/uploads` to your backend URL
- [ ] Enable HTTPS (automatic on Vercel/Railway/Render)
- [ ] **Database backups**: enable daily automatic backups (Railway/Render have this built in; on a VPS use `pg_dump` in a cron job)
- [ ] Image storage: local `uploads/` folder is fine on a VPS; on Railway/Render use a persistent volume, or later migrate to S3/Cloudinary

### Backup command (VPS)
```bash
# daily cron: dumps DB with date stamp
pg_dump -U postgres jewelflow > /backups/jewelflow_$(date +%F).sql
```
Also back up the `uploads/` folder (it holds all product images).

---

## Part 4: Maintaining After Selling

### Weekly (15 min)
- Check `/api/health` responds (or set up a free uptime monitor: UptimeRobot.com pings it and emails you if down)
- Glance at server disk space (images accumulate): `df -h` on VPS

### Monthly (30 min)
- Verify backups actually restore: `psql -d test_restore < backup.sql` once in a while
- `npm outdated` in both folders; update patch versions: `npm update`
- Check Postgres disk usage

### When a customer calls with a problem
| Complaint | Likely cause | Fix |
|-----------|-------------|-----|
| "Site is down" | Server/DB crashed | Restart backend; check server logs |
| "Can't log in" | Wrong password | No reset flow yet — manually reset (see below) |
| "Image won't upload" | >5MB or wrong format | Tell them JPEG/PNG under 5MB, or raise `MAX_FILE_SIZE` |
| "Product not showing" | Marked hidden, or wrong category filter | Check the Hidden toggle in admin |
| "WhatsApp button doesn't work" | Number saved without country code | Settings → WhatsApp number as `+91XXXXXXXXXX` |

### Manual password reset (until you build a reset flow)
```bash
cd backend
node -e "require('bcryptjs').hash('NewPass123', 10).then(console.log)"
```
Then in psql:
```sql
UPDATE users SET password_hash = '<hash from above>' WHERE username = 'their_username';
```

### Adding a new customer = zero code
Every new store is just a registration — the same deployment serves all stores. Your costs stay flat as customers grow.

### Offboarding a customer (stopped paying)
```sql
-- everything cascades: products, categories, enquiries, appointments
DELETE FROM shops WHERE slug = 'their-slug';
```
(Take a backup first in case they come back.)

---

## Part 5: Roadmap — what to build next (in priority order)

1. **Password reset via email/OTP** — removes your #1 support task
2. **Super-admin panel** — see all shops, suspend non-payers, usage stats
3. **Payment collection** — Razorpay subscription for auto-billing customers
4. **Custom domains** — `catalog.theirshop.com` (charge extra for this)
5. **Image optimization** — compress/resize on upload (sharp library) to save disk & speed up the storefront
6. **Analytics per store** — "your catalog got 340 views this month" (great retention tool — shows the store owner the value at renewal time)
7. **Bulk product import** — CSV/Excel upload for large catalogs
8. **Rate limiting** — express-rate-limit on public endpoints (enquiries/appointments) to prevent spam

---

## Quick Reference

| Thing | Where |
|-------|-------|
| Admin panel | `/admin` |
| A store's catalog | `/store/<slug>` |
| API health | `/api/health` |
| Server config | `backend/.env` |
| DB tables setup | `cd backend && npm run db:setup` |
| Start backend | `cd backend && npm run dev` |
| Start frontend | `cd frontend && npm run dev` |
| Production build (frontend) | `cd frontend && npm run build` → deploy `dist/` |
