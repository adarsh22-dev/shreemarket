# SreeMarket — Multi-Vendor E-Commerce Marketplace

A full-stack, multi-vendor e-commerce marketplace platform with customer shopping, vendor operations, wholesaler portal, admin panel, AI-powered customer support chatbot ("WooAI"), and **React Native mobile apps**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SreeMarket Full Ecosystem                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  Mobile Apps    │  │   Web Frontends │  │      Backend API            │  │
│  │  (React Native) │  │                 │  │      (Spring Boot)          │  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────────────────┤  │
│  │  • Consumer App │  │  • Consumer     │  │  • REST API (port 8082)     │  │
│  │    (iOS/Android)│  │    (Next.js 16) │  │  • Spring Security/JWT      │  │
│  │  • Vendor App   │  │  • Admin/Vendor │  │  • Spring Data JPA + MySQL           │  │
│  │    (iOS/Android)│  │    (React+Vite) │  │  • Razorpay, MailerSend     │  │
│  │  • Admin App    │  │                 │  │  • WooAI Chatbot            │  │
│  │    (iOS/Android)│  │                 │  │                             │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘  │
│           │                    │                          │                 │
│           └────────────────────┼──────────────────────────┘                 │
│                                │                                            │
│                    ┌───────────┴───────────┐                                 │
│                    │    MySQL Database     │                                 │
│                    │     (smarketdb)       │                                 │
│                    └───────────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
- **Java 17**, Spring Boot 3.2.3, Maven
- Spring Security, Spring Data JPA, Hibernate
- MySQL 8, Lombok, Bucket4j (rate limiting)
- Razorpay (payments), MailerSend (email), Google OAuth
- Apache POI (Excel export)

### Frontend — Admin/Vendor/Wholesaler UI
- **React 19**, Vite 7, React Router 7
- Framer Motion, Recharts, Lucide React
- react-hot-toast, xlsx, jspdf
- PWA via vite-plugin-pwa

### Frontend — Consumer UI
- **Next.js 16**, React 19
- App Router (SSR/SSG)
- Framer Motion, Recharts, Lucide React
- PWA via @ducanh2912/next-pwa

### Mobile Apps — React Native (Expo)
- **Expo SDK 51+**, React Native 0.76, React 19, TypeScript
- Expo Router v3 (file-based routing, universal links)
- NativeWind v4 (Tailwind CSS for React Native)
- TanStack Query v5 + Zustand (state management)
- React Hook Form + Zod (forms & validation)
- Expo SecureStore + MMKV (encrypted storage)
- expo-auth-session (Google OAuth), expo-local-authentication (biometric)
- Razorpay React Native SDK (payments)
- Expo Push Notifications (FCM/APNs)
- FlashList (performant lists), Expo Image (optimized images)
- EAS Build / EAS Submit / EAS Update (CI/CD & OTA updates)
- pnpm Workspaces + Turborepo (monorepo)

---

## Prerequisites

- **Java 17+** (JDK)
- **Maven 3.8+**
- **Node.js 18+**
- **MySQL 8+**
- **Git**

---

## Project Structure

```
s_market/
├── s_market_backend/       # Spring Boot REST API (port 8082)
│   ├── pom.xml
│   ├── uploads/             # File uploads directory
│   └── src/main/java/com/sreemarket/backend/
│       ├── controller/      # REST controllers
│       ├── service/         # Business logic
│       ├── model/           # JPA entities
│       ├── repository/      # Spring Data repositories
│       ├── dto/             # Data transfer objects
│       ├── config/          # Security, CORS, Web config
│       └── util/            # Utilities
│
├── s_market_ui/            # React + Vite SPA (port 5173)
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── pages/           # Admin, Vendor, Wholesaler, Customer pages
│       ├── components/      # Reusable components
│       ├── context/         # Cart, Wishlist, Compare contexts
│       ├── api/api.js       # API client
│       └── styles/
│
└── s_market_consumer/      # Next.js app (port 3000)
    ├── package.json
    ├── next.config.mjs
    └── src/
        ├── app/             # App Router pages
        ├── components/      # Reusable components
        ├── context/         # State management
        ├── lib/             # API helpers
        └── styles/
```

---

## Database Setup

1. **Install and start MySQL** (if not running).

2. **Create the database**:

```sql
CREATE DATABASE smarketdb;
```

3. **Set the database password** via environment variable:

```bash
export DB_PASSWORD=your_mysql_password
```

4. Tables are auto-created on first run (`spring.jpa.hibernate.ddl-auto=update`).

---

## Backend Setup

```bash
cd s_market/s_market_backend

# Build the project
mvn clean package -DskipTests

# Run in development mode
mvn spring-boot:run

# OR run the packaged JAR
java -jar target/backend-0.0.1-SNAPSHOT.jar

# Run tests
mvn test
```

The API starts at **http://localhost:8082**.

On first run, default roles and an admin user are created:
- **Email:** admin@smarket.com
- **Password:** admin123 (or overridden via `ADMIN_PASSWORD` env var)

---

## Frontend Setup — Admin/Vendor UI (React + Vite)

```bash
cd s_market/s_market_ui

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

The app starts at **http://localhost:5173**.

---

## Frontend Setup — Consumer UI (Next.js)

```bash
cd s_market/s_market_consumer

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint
npm run lint
```

The app starts at **http://localhost:3000**.

---

## Environment Variables

### Backend (`s_market_backend`)

| Variable | Description | Default | Required |
|---|---|---|---|
| `DB_PASSWORD` | MySQL database password | — | **Yes** |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — | No |
| `RAZORPAY_KEY_ID` | Razorpay payment key | `rzp_test_placeholder_key_id` | No (dev) |
| `RAZORPAY_KEY_SECRET` | Razorpay payment secret | `rzp_test_placeholder_key_secret` | No (dev) |
| `MAILERSEND_API_KEY` | MailerSend transactional email API key | — | No |
| `APP_BASE_URL` | Base URL for email links | `http://localhost:5173` | No |
| `APP_EMAIL_FROM` | From email address | `noreply@sreemarket.com` | No |
| `APP_EMAIL_FROM_NAME` | From name | `SreeMarket` | No |
| `ADMIN_PASSWORD` | Default admin password | `admin123` | No |

### React UI (`s_market_ui/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8082/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | — |

### Next.js Consumer (`s_market_consumer/.env.local`)

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL | `http://localhost:8082/api` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | — |

---

## Running the Full Application

Start all three services in separate terminals:

```bash
# Terminal 1: Backend
cd s_market/s_market_backend
mvn spring-boot:run

# Terminal 2: React Admin UI
cd s_market/s_market_ui
npm run dev

# Terminal 3: Next.js Consumer
cd s_market/s_market_consumer
npm run dev
```

The Next.js consumer frontend proxies `/api/*` and `/uploads/*` requests to the backend, so you can access everything through **http://localhost:3000**.

---

## API Overview

All API endpoints are prefixed with `/api` and served on port **8082**.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/register` | Customer registration |
| POST | `/api/register/vendor` | Vendor registration |
| POST | `/api/register/wholesaler` | Wholesaler registration |
| POST | `/api/login` | Login (customer/admin) |
| POST | `/api/login/wholesaler` | Wholesaler login |
| POST | `/api/google` | Google OAuth login |
| POST | `/api/forgot-password` | Request password reset |
| POST | `/api/reset-password` | Reset password |
| POST | `/api/logout` | Logout |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | All products |
| GET | `/api/products/featured` | Featured products |
| GET | `/api/products/single/{id}` | Single product |
| GET | `/api/products/search?q=` | Search products |
| POST | `/api/products` | Create product |
| POST | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |
| GET | `/api/products/{id}/questions` | Product Q&A |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orders` | Create order |
| GET | `/api/orders/user/{userId}` | User orders |
| GET | `/api/orders/vendor/{vendorId}` | Vendor orders |
| POST | `/api/orders/{id}/cancel` | Cancel order |
| POST | `/api/orders/{id}/return` | Return request |
| GET | `/api/orders/track/{awb}` | Track shipment |

### Cart
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cart/{userId}` | Get cart |
| POST | `/api/cart/add` | Add to cart |
| PUT | `/api/cart/update` | Update item |
| DELETE | `/api/cart/remove/{itemId}` | Remove item |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/*` | Dashboard, analytics, vendor/product/order management |
| POST | `/api/admin/*` | CRUD for categories, coupons, banners, shipping zones, CMS, SEO, gift cards, etc. |

### Vendor
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/vendor/profile` | Vendor profile |
| GET | `/api/vendor/payouts` | Payout history |
| GET | `/api/vendor/store-settings` | Store settings |
| GET | `/api/vendor/shipping/shipments` | Shipments |

### Wholesaler
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/wholesaler/dashboard` | Dashboard |
| GET | `/api/wholesaler/orders` | Orders |
| PUT | `/api/wholesaler/settings` | Update settings |

### WooAI (Chatbot)
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/wooai/session` | Chat sessions |
| POST | `/api/wooai/session/{id}/message` | Send message |

### Other
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | Categories |
| GET | `/api/reviews/product/{id}` | Reviews |
| POST | `/api/contact` | Contact form |
| POST | `/api/newsletter/subscribe` | Subscribe |
| POST | `/api/payment/create-order` | Razorpay order |
| POST | `/api/payment/verify` | Verify payment |
| GET | `/api/loyalty/me` | Loyalty points |

**Authentication:** Session-based (JSESSIONID cookie), BCrypt password hashing. Roles: `ROLE_CUSTOMER`, `ROLE_VENDOR`, `ROLE_ADMIN`, `ROLE_WHOLESALER`.

---

## Features

### Customer
- Product browsing, search, filtering
- Shopping cart, checkout, wishlist, product comparison
- Order tracking, returns, invoices
- Product reviews and Q&A
- Loyalty points program
- Google OAuth login

### Vendor
- Store management (profile, settings, banners)
- Product CRUD, inventory management, bulk CSV upload
- Order management, shipping, labels
- Payouts and invoices
- Analytics dashboard
- KYC verification

### Wholesaler
- Bulk buying with tiered pricing
- RFQ (Request for Quotation)
- Wholesaler-specific dashboard
- GST number validation

### Admin
- Vendor/product/order management
- Category, brand, tag management
- Coupons, flash sales, banners, announcements
- CMS pages, blog posts, SEO
- Shipping zones, pincode serviceability
- Tax/GST configuration
- Gift cards, gift wrapping
- Reports and analytics
- System settings, maintenance mode

### AI Chatbot (WooAI)
- Customer support chatbot
- Session management, policy-based routing
- Callback requests
- Agent management

---

## PWA

Both frontends support Progressive Web App:
- **React UI** uses `vite-plugin-pwa` with service worker auto-update, runtime caching for API responses, images, and fonts.
- **Next.js Consumer** uses `@ducanh2912/next-pwa`.

---

## Deployment

### Backend
```bash
cd s_market/s_market_backend
mvn clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=prod \
  --DB_PASSWORD=your_prod_password
```

### React UI
```bash
cd s_market/s_market_ui
npm run build
# Serve the dist/ directory via Nginx or similar
```

### Next.js Consumer
```bash
cd s_market/s_market_consumer
npm run build
npm run start
```

---

## Testing

### Backend
```bash
cd s_market/s_market_backend
mvn test
```

### Frontend
```bash
cd s_market/s_market_ui
npm run lint

cd s_market/s_market_consumer
npm run lint
```

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@smarket.com | admin123 |
| Customer | (self-registered) | — |
| Vendor | (self-registered) | — |
| Wholesaler | (self-registered) | — |

---

## License

Proprietary — all rights reserved.
