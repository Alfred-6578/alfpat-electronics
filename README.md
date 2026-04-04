# ALFPAT ELECTRONICS 🛒

> A full-stack ecommerce platform for home electronics in Nigeria.  
> Built with Next.js 14, Node.js/Express, MongoDB, Paystack, WhatsApp Cloud API and Brevo SMTP.

---

## Tech Stack

| Layer         | Technology                              |
|---------------|-----------------------------------------|
| Frontend      | Next.js 14 (App Router) + Tailwind CSS  |
| Backend       | Node.js + Express 5 (ES Modules)        |
| Database      | MongoDB Atlas + Mongoose                |
| Auth          | JWT + Google OAuth 2.0 + Passport       |
| Payments      | Paystack (webhook-based)                |
| Email         | Nodemailer + Brevo SMTP                 |
| Notifications | WhatsApp Cloud API (Meta)               |
| File Upload   | Cloudinary                              |

---

## Features

### Customer Side
- Browse products by category with search, sort, and filters
- Product detail pages with image gallery, specs, and related products
- Cart with localStorage + database sync (persists across sessions)
- Wishlist with localStorage + database sync
- Guest cart merges with account cart on login
- Login / Register with email or Google OAuth
- Forgot password with email reset link
- Checkout with saved delivery addresses
- Nigerian states + cities dropdown
- Paystack payment integration with webhook confirmation
- Order verification polling page with real-time status
- Order confirmation email + admin WhatsApp notification
- Order history with status tracking
- Mobile-responsive design (320px minimum)

### Admin Side
- Dashboard with revenue, orders, products stats, and low stock alerts
- Products management (create, edit, upload images, activate/deactivate)
- Orders management with status updates and detail modal
- Categories management (CRUD with image upload)
- Customers management (add, update role, suspend, delete, view order history)
- Admin panel at hidden URL for security

---

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas account (free tier works)
- Paystack account (free test mode)
- Google Cloud Console project (for OAuth)
- Brevo account (free — 300 emails/day)
- Meta Developer account (for WhatsApp Cloud API)
- Cloudinary account (free tier)

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Alfred-6578/alfpat-electronics.git
cd alfpat-electronics
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in all values — see Environment Variables section below
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Fill in values
npm run dev
```

### 4. Seed the database

```bash
cd backend
npm run seed
```

### 5. Open the app

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Admin panel: http://localhost:3000/mngmt-x7k9q2

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                  | Description                                    | Example                                          |
|---------------------------|------------------------------------------------|--------------------------------------------------|
| `PORT`                    | Server port                                    | `5000`                                           |
| `NODE_ENV`                | Environment                                    | `development`                                    |
| `MONGO_URI`               | MongoDB connection string                      | `mongodb+srv://user:pass@cluster.mongodb.net/db`  |
| `JWT_SECRET`              | Secret for signing JWTs                        | Random 64-char hex string                        |
| `JWT_EXPIRES_IN`          | Token expiry                                   | `30d`                                            |
| `GOOGLE_CLIENT_ID`        | Google OAuth client ID                         | From Google Cloud Console                        |
| `GOOGLE_CLIENT_SECRET`    | Google OAuth client secret                     | From Google Cloud Console                        |
| `GOOGLE_CALLBACK_URL`     | OAuth callback URL                             | `http://localhost:5000/api/auth/google/callback`  |
| `PAYSTACK_SECRET_KEY`     | Paystack secret key                            | `sk_test_...`                                    |
| `WHATSAPP_PHONE_NUMBER_ID`| Meta WhatsApp phone number ID                  | From Meta Developer Dashboard                    |
| `WHATSAPP_ACCESS_TOKEN`   | Meta WhatsApp access token                     | From Meta Developer Dashboard                    |
| `ADMIN_WHATSAPP_NUMBER`   | Admin WhatsApp number (with country code)      | `2348012345678`                                  |
| `CLOUDINARY_CLOUD_NAME`   | Cloudinary cloud name                          | From Cloudinary Dashboard                        |
| `CLOUDINARY_API_KEY`      | Cloudinary API key                             | From Cloudinary Dashboard                        |
| `CLOUDINARY_API_SECRET`   | Cloudinary API secret                          | From Cloudinary Dashboard                        |
| `SMTP_HOST`               | SMTP server host                               | `smtp-relay.brevo.com`                           |
| `SMTP_PORT`               | SMTP server port                               | `587`                                            |
| `SMTP_USER`               | SMTP login                                     | From Brevo SMTP settings                         |
| `SMTP_PASS`               | SMTP password/key                              | From Brevo SMTP settings                         |
| `FROM_NAME`               | Email sender name                              | `ALFPAT ELECTRONICS`                             |
| `FROM_EMAIL`              | Email sender address                           | `your@email.com`                                 |
| `CLIENT_URL`              | Frontend URL (for CORS, redirects)             | `http://localhost:3000`                          |

### Frontend (`frontend/.env.local`)

| Variable                       | Description                    | Example                                 |
|--------------------------------|--------------------------------|-----------------------------------------|
| `NEXT_PUBLIC_API_URL`          | Backend API base URL           | `http://localhost:5000/api`             |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key         | `pk_test_...`                           |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID         | Same as backend                         |
| `NEXT_PUBLIC_ADMIN_WHATSAPP`   | Admin WhatsApp for support     | `2348012345678`                         |
| `NEXT_PUBLIC_FROM_EMAIL`       | Sender email (shown to users)  | `noreply@alfpat.com`                    |

---

## Third-Party Setup Guides

### Paystack
1. Sign up at [paystack.com](https://paystack.com)
2. Go to Settings > API Keys & Webhooks
3. Copy test secret key and public key
4. Set webhook URL to `https://yourdomain.com/api/payments/webhook`
5. For local testing use [ngrok](https://ngrok.com): `ngrok http 5000`

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project, enable APIs & Services, create Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
5. Copy Client ID and Secret

### WhatsApp Cloud API
1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create an app and add the WhatsApp product
3. In API Setup: copy Phone Number ID and generate access token
4. Add recipient test numbers under the "To" field
5. Create a message template named `new_order_notification` for production

### Brevo (Email)
1. Sign up at [brevo.com](https://www.brevo.com)
2. Go to Settings > SMTP & API > SMTP tab
3. Copy SMTP Server, Port, Login, and Master Password
4. Verify your sender email address

### Cloudinary
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Copy Cloud Name, API Key, API Secret from Dashboard

---

## Test Accounts (after seeding)

| Role     | Email              | Password       |
|----------|--------------------|----------------|
| Admin    | admin@alfpat.com   | admin123       |

---

## Test Payment (Paystack Test Mode)

| Field   | Value                |
|---------|----------------------|
| Card    | `4084 0840 8408 4081`|
| Expiry  | Any future date      |
| CVV     | `408`                |
| OTP     | `123456`             |

---

## API Endpoints

### Auth
| Method | Endpoint                          | Auth     | Description              |
|--------|-----------------------------------|----------|--------------------------|
| POST   | `/api/auth/register`              | Public   | Register new user        |
| POST   | `/api/auth/login`                 | Public   | Login                    |
| GET    | `/api/auth/me`                    | Protected| Get current user         |
| GET    | `/api/auth/google`                | Public   | Start Google OAuth       |
| POST   | `/api/auth/forgot-password`       | Public   | Request password reset   |
| POST   | `/api/auth/reset-password/:token` | Public   | Reset password           |

### Products & Categories
| Method | Endpoint                   | Auth   | Description              |
|--------|----------------------------|--------|--------------------------|
| GET    | `/api/products`            | Public | List products (filtered) |
| GET    | `/api/products/:slug`      | Public | Get product by slug      |
| GET    | `/api/categories`          | Public | List all categories      |
| POST   | `/api/categories`          | Admin  | Create category          |
| PUT    | `/api/categories/:id`      | Admin  | Update category          |
| DELETE | `/api/categories/:id`      | Admin  | Delete category          |

### Payments & Orders
| Method | Endpoint                         | Auth      | Description              |
|--------|----------------------------------|-----------|--------------------------|
| POST   | `/api/payments/initialize`       | Protected | Initialize Paystack      |
| POST   | `/api/payments/webhook`          | None      | Paystack webhook         |
| GET    | `/api/payments/order/:reference` | Protected | Check payment status     |
| GET    | `/api/orders/my`                 | Protected | User's orders            |
| GET    | `/api/orders/:id`                | Protected | Order detail             |

### Cart & Wishlist
| Method | Endpoint              | Auth      | Description              |
|--------|-----------------------|-----------|--------------------------|
| GET    | `/api/cart`           | Protected | Get saved cart           |
| PUT    | `/api/cart`           | Protected | Save cart                |
| POST   | `/api/cart/merge`     | Protected | Merge local + DB cart    |
| DELETE | `/api/cart`           | Protected | Clear cart               |
| GET    | `/api/wishlist`       | Protected | Get wishlist             |
| PUT    | `/api/wishlist`       | Protected | Save wishlist            |
| POST   | `/api/wishlist/merge` | Protected | Merge local + DB         |
| DELETE | `/api/wishlist`       | Protected | Clear wishlist           |

### Admin
| Method | Endpoint                           | Auth  | Description              |
|--------|------------------------------------|-------|--------------------------|
| GET    | `/api/admin/dashboard`             | Admin | Dashboard stats          |
| GET    | `/api/admin/products`              | Admin | List all products        |
| POST   | `/api/admin/products`              | Admin | Create product           |
| PUT    | `/api/admin/products/:id`          | Admin | Update product           |
| DELETE | `/api/admin/products/:id`          | Admin | Soft delete product      |
| GET    | `/api/admin/orders`                | Admin | List all orders          |
| PUT    | `/api/admin/orders/:id`            | Admin | Update order status      |
| GET    | `/api/admin/customers`             | Admin | List customers           |
| GET    | `/api/admin/customers/:id`         | Admin | Customer detail + orders |
| POST   | `/api/admin/customers`             | Admin | Create user              |
| PUT    | `/api/admin/customers/:id/role`    | Admin | Change user role         |
| PUT    | `/api/admin/customers/:id/suspend` | Admin | Toggle suspend           |
| DELETE | `/api/admin/customers/:id`         | Admin | Delete user              |

---

## Project Structure

```
alfpat-electronics/
├── backend/
│   ├── server.js                 # Express app entry point
│   ├── src/
│   │   ├── config/               # DB, Cloudinary, Passport config
│   │   ├── controllers/          # Route handlers
│   │   ├── middleware/            # Auth, error handling
│   │   ├── models/               # Mongoose schemas
│   │   ├── routes/               # API route definitions
│   │   ├── services/             # Paystack, WhatsApp, Email
│   │   ├── utils/                # JWT, pagination helpers
│   │   └── seed.js               # Database seeder
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (store)/          # Store pages (Navbar + Footer)
│   │   │   ├── (auth)/           # Auth pages (no Navbar)
│   │   │   ├── mngmt-x7k9q2/    # Admin panel (hidden URL)
│   │   │   └── auth/callback/    # Google OAuth callback
│   │   ├── components/
│   │   │   ├── layout/           # Navbar, Footer, AdminSidebar
│   │   │   ├── products/         # ProductCard, ProductGrid
│   │   │   ├── cart/             # CartDrawer
│   │   │   ├── admin/            # ProductForm
│   │   │   └── ui/               # Badge, Pagination, Skeleton, EmptyState
│   │   ├── context/              # Auth, Cart, Wishlist providers
│   │   └── lib/                  # API clients, types, utils
│   ├── .env.local.example
│   └── package.json
│
└── README.md
```

---

## Git Branching Strategy

Uses GitHub Flow:

- `main` — production only
- `develop` — integration branch
- `feature/*` — individual features

---

## License

MIT
