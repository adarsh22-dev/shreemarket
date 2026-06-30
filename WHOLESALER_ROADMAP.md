# Wholesaler System — Implementation Roadmap

## Current State

| Area | Status | Details |
|------|--------|---------|
| Wholesaler role | ✅ Done | WHOLESALER (roleId=4) created |
| Wholesaler login | ✅ Done | `POST /api/login/wholesaler` with session auth |
| Wholesaler register | ✅ Done | `POST /api/register/wholesaler` with pending approval |
| Wholesaler dashboard | ✅ Done | Dashboard, orders, products, settings APIs + UI |
| Product wholesale fields | ✅ Done | `supportsWholesale`, `wholesalePrice`, `wholesaleDiscountType`, `minimumWholesaleQuantity`, `wholesaleOnly` on Product model |
| Wholesale product page | ✅ Done | Enhanced with tiered pricing, guest CTA, wholesale badges |
| Wholesale pricing in cart | ✅ Done | Cart/checkout wholesale logic with tiered pricing |
| Admin wholesaler mgmt | ✅ Done | Approve/reject/suspend with dedicated UI |
| Wholesaler settings | ✅ Done | GET/PUT `/api/wholesaler/settings` + WholesalerSettings.jsx page |

---

## Phase 1 — Backend: Role & Authentication

**Goal:** Create the WHOLESALER role and registration flow.

### 1.1 Add WHOLESALER role

| File | Change |
|------|--------|
| `backend/.../model/Role.java` | No change needed — roles are seeded dynamically |
| `backend/.../config/DataInitializer.java` | Add `new Role(4L, "WHOLESALER", "Wholesale buyer", "")` to seed data |

### 1.2 Create Wholesaler entity

**New file:** `backend/.../model/Wholesaler.java`

Fields:
- `id` (Long, PK)
- `fullName` (String)
- `email` (String, unique)
- `phone` (String)
- `password` (String, BCrypt)
- `roleId` (Long, default 4L)
- `businessName` (String)
- `gstNumber` (String)
- `businessAddress` (String)
- `businessPhone` (String)
- `businessType` (String — retailer / distributor / reseller)
- `status` (String — Pending / Active / Suspended / Rejected)
- `minMonthlyOrderValue` (Double, nullable)
- `createdAt` (Long, timestamp)
- `updatedAt` (Long, timestamp)
- `agreeTerms` (Boolean)
- `agreePolicies` (Boolean)

### 1.3 Add route protection

**File:** `backend/.../config/SecurityConfig.java`

Add pattern:
```java
.requestMatchers("/api/wholesaler/**").hasRole("WHOLESALER")
```

Make `/api/register/wholesaler` public.

### 1.4 Create registration endpoint

**New file:** `backend/.../controller/WholesalerAuthController.java`

- `POST /api/register/wholesaler` — registration, status=`Pending`, roleId forced to `4L`
- `POST /api/login/wholesaler` — authenticate, check status=Active, start session

**New file:** `backend/.../service/WholesalerService.java`

- `registerWholesaler()` — duplicate email/phone check, BCrypt, default status, log activity
- `loginWholesaler()` — authenticate, session creation

### 1.5 Admin approval endpoints

| File | Endpoint |
|------|----------|
| `backend/.../controller/AdminWholesalerController.java` (new) | `GET /api/admin/wholesalers` — list all wholesalers |
| | `PUT /api/admin/wholesalers/{id}/approve` — approve pending wholesaler |
| | `PUT /api/admin/wholesalers/{id}/reject` — reject with reason |
| | `PUT /api/admin/wholesalers/{id}/suspend` — suspend active wholesaler |

---

## Phase 2 — Backend: Wholesale Product & Pricing API

**Goal:** Serve wholesale products, fix pricing updates, add filtering.

### 2.1 Wholesale product endpoint

**File:** `backend/.../controller/ProductController.java`

Add: `GET /api/products/wholesale` — returns products with `supportsWholesale=true`
- Query params: `page`, `size`, `category`, `minPrice`, `maxPrice`, `search`
- Also include tiered pricing when available

### 2.2 Fix missing wholesale field updates

**File:** `backend/.../service/ProductService.java`

In `updateProduct()`, add:
```java
existingProduct.setWholesalePrice(productData.getWholesalePrice());
existingProduct.setMinimumWholesaleQuantity(productData.getMinimumWholesaleQuantity());
```
(Currently only `supportsWholesale` and `wholesaleDiscountType` are copied.)

### 2.3 Wholesale pricing tiers table

**New file:** `backend/.../model/WholesaleTier.java`

| Field | Type |
|-------|------|
| `id` | Long PK |
| `productId` | Long (FK → products) |
| `minQty` | Integer (e.g., 10) |
| `maxQty` | Integer (e.g., 49, nullable = unlimited) |
| `unitPrice` | Double |

This enables tiered pricing like: 10-49 units = ₹500/unit, 50-199 = ₹450/unit.

**Update `WholesaleTierRepository` (new):**
```java
List<WholesaleTier> findByProductIdOrderByMinQtyAsc(Long productId);
```

### 2.4 Cart wholesale pricing logic

**File:** `backend/.../service/CartService.java`

When user role is WHOLESALER:
1. Check if product `supportsWholesale=true`
2. If cart line qty >= `minimumWholesaleQuantity`, apply `wholesalePrice`
3. Check `WholesaleTier` for better tier pricing
4. Add `wholesalePrice` and `savings` fields to cart line response

---

## Phase 3 — Backend: Wholesaler Dashboard API

**New file:** `backend/.../controller/WholesalerDashboardController.java`

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/wholesaler/dashboard` | Stats: total orders, total spent, pending deliveries, total savings vs retail |
| `GET` | `/api/wholesaler/orders` | Wholesaler's order history with wholesale pricing |
| `GET` | `/api/wholesaler/orders/{id}` | Single order detail with line-level wholesale pricing |
| `POST` | `/api/wholesaler/orders/bulk-inquiry` | Submit bulk order inquiry (not a real order, just a request) |
| `GET` | `/api/wholesaler/products` | Products wholesaler has previously ordered (quick reorder) |
| `GET` | `/api/wholesaler/settings` | Get wholesaler profile/settings |
| `PUT` | `/api/wholesaler/settings` | Update wholesaler profile |

---

## Phase 4 — Frontend: Auth & Routing

### 4.1 Registration page

**File:** `ui/src/pages/WholesalerRegisterPage.jsx` (new)

- Form: Full Name, Email, Phone, Password, Business Name, GST Number, Business Address, Business Phone, Business Type (dropdown), Agree to Terms
- On submit: call `POST /api/register/wholesaler`
- Show success message: "Registration submitted for approval"

### 4.2 Login page

**File:** `ui/src/pages/WholesalerLoginPage.jsx` (new)

- Email + Password form
- Call `POST /api/login/wholesaler`
- Redirect to `/wholesaler/dashboard` on success
- Show "Pending approval" message if status=Pending

Alternatively, add a "Wholesaler" toggle to existing `LoginPage.jsx`.

### 4.3 Route guard

**File:** `ui/src/components/WholesalerProtectedRoute.jsx` (new)

- Check `user?.roleId === 4`
- Redirect to `/wholesaler/login` if not authorized
- Follows same pattern as `VendorProtectedRoute.jsx`

### 4.4 App routes

**File:** `ui/src/App.jsx`

Add:
```jsx
import WholesalerRegisterPage from './pages/WholesalerRegisterPage';
import WholesalerLoginPage from './pages/WholesalerLoginPage';
import WholesalerDashboard from './pages/wholesaler/WholesalerDashboard';
import WholesalerProtectedRoute from './components/WholesalerProtectedRoute';

// Public
<Route path="/wholesaler/register" element={<WholesalerRegisterPage />} />
<Route path="/wholesaler/login" element={<WholesalerLoginPage />} />

// Protected
<Route element={<WholesalerProtectedRoute />}>
  <Route path="/wholesaler/dashboard" element={<WholesalerDashboard />} />
  <Route path="/wholesaler/orders" element={<WholesalerOrders />} />
  <Route path="/wholesaler/products" element={<WholesalerProducts />} />
</Route>
```

### 4.5 API functions

**File:** `ui/src/api/api.js`

Add:
- `registerWholesaler(data)` — `POST /api/register/wholesaler`
- `loginWholesaler(email, password)` — `POST /api/login/wholesaler`
- `getWholesalerDashboard()` — `GET /api/wholesaler/dashboard`
- `getWholesalerOrders()` — `GET /api/wholesaler/orders`
- `getWholesaleProducts(params)` — `GET /api/products/wholesale`
- `getWholesalerSettings()` — `GET /api/wholesaler/settings`
- `updateWholesalerSettings(data)` — `PUT /api/wholesaler/settings`
- `submitBulkInquiry(data)` — `POST /api/wholesaler/orders/bulk-inquiry`

---

## Phase 5 — Frontend: Wholesaler Dashboard

### 5.1 Dashboard layout

**New directory:** `ui/src/pages/wholesaler/`

**New file:** `WholesalerLayout.jsx`

- Sidebar with navigation: Dashboard, My Orders, Browse Products, Bulk Inquiry, Settings
- Header with wholesaler name and business name
- Reuses existing admin layout pattern from `components/admin/AdminLayout.jsx`

### 5.2 Main dashboard

**New file:** `WholesalerDashboard.jsx`

- Summary cards: Total Orders, Total Spent, Pending Deliveries, Total Saved
- Recent orders list (last 5)
- Quick reorder buttons
- Savings chart vs retail prices (using `recharts` — already installed)

### 5.3 Orders page

**New file:** `WholesalerOrders.jsx`

- Order history table with columns: Order #, Date, Items, Qty, Total, Wholesale Price, Status
- Filter by date range and status
- Click to view order detail
- "Reorder" button (adds all items from that order to cart)

### 5.4 Products page

**New file:** `WholesalerProducts.jsx`

- Enhanced version of `WholesalePage.jsx`
- Shows tiered pricing table per product
- "Add to Cart" with qty selector showing applicable price tier
- Filters by category, price range, minimum qty
- "Request Quote" button for custom quantities

---

## Phase 6 — Frontend: Wholesale Cart & Checkout

### 6.1 Cart context updates

**File:** `ui/src/context/CartContext.jsx`

- When user role is WHOLESALER:
  - Show wholesale prices in cart
  - Validate `minimumWholesaleQuantity`
  - Show savings vs retail per line item
  - Show tier badge (e.g., "Wholesale Tier 2")

### 6.2 Checkout

**File:** `ui/src/pages/CheckoutPage.jsx`

- Wholesaler checkout flow:
  - GST invoice field (GST number already collected at registration)
  - Minimum order value validation
  - PO number field (optional)
  - "Request Invoice" toggle

### 6.3 Cart display

**File:** `ui/src/pages/CartPage.jsx`

- Wholesale price badges
- "Wholesale" tag on items
- Minimum qty indicator with visual cue
- "Add ___ more to reach wholesale price" helper text

---

## Phase 7 — Frontend: Enhanced Wholesale Page

**File:** `ui/src/pages/WholesalePage.jsx`

Current page is a basic filtering product list. Enhance with:
- Tiered pricing table on each product card
- Login/register as wholesaler CTA for guest users
- Wholesaler badge on products
- "You save X%" compared to retail
- Minimum order value banner
- "Bulk Inquiry" floating button

---

## Phase 8 — Admin: Wholesaler Management

### 8.1 Admin panel page

**New file:** `ui/src/pages/admin/AdminWholesalers.jsx`

- List all wholesalers with status
- Approve / Reject / Suspend actions
- View wholesaler details (business info, order history)
- Configure tiered pricing rules globally

### 8.2 Add to admin sidebar

**File:** `ui/src/components/admin/AdminLayout.jsx`

Add "Wholesalers" navigation item under "Users" section, linking to `/admin/wholesalers`.

---

## Summary Table

| Phase | Scope | Files (new) | Files (modified) | Est. Days |
|-------|-------|-------------|------------------|-----------|
| 1 | Backend role & auth | 4-5 | 3 | 2-3 |
| 2 | Backend product API | 2-3 | 3 | 2-3 |
| 3 | Backend dashboard API | 1-2 | 0 | 1 |
| 4 | Frontend auth & routes | 4-5 | 2 | 2 |
| 5 | Frontend dashboard | 5-6 | 0 | 3-4 |
| 6 | Frontend cart & checkout | 0 | 3 | 2 |
| 7 | Enhanced wholesale page | 0 | 1 | 1 |
| 8 | Admin wholesaler mgmt | 1 | 1 | 1-2 |
| **Total** | | **17-22** | **13** | **14-19** |

---

## Architecture Decisions

1. **Separate Wholesaler entity** (not User) — follows the existing Vendor pattern where vendors have a completely separate table from customers. Keeps concerns isolated.
2. **roleId=4** — maintains the numeric role pattern: ADMIN=1, CUSTOMER=2, VENDOR=3, WHOLESALER=4.
3. **Session auth** — reuses the existing Spring Security session-based auth, no JWT changes needed.
4. **WholesaleTier table** — enables multi-tier quantity-based pricing beyond the single `wholesalePrice` field.
5. **Pending→Active flow** — matches vendor registration: admin must approve before the wholesaler can log in.
