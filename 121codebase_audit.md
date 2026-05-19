# 🔍 Full Codebase Audit — RestaurantSystem

Deep analysis across `backend`, `web`, and `customer-web` apps.

---

## PART A: INCOMPLETE FUNCTIONALITIES

### Backend
| # | Feature | File | Status |
|---|---------|------|--------|
| 1 | **devLogin endpoint** exists in controller but has **no route** registered in `auth.routes.ts` — dead code sitting in production | `auth.controller.ts:80` | Dead Code |
| 2 | **Refresh Token rotation** — JWT generates a `refreshToken` but there is **no `/auth/refresh` endpoint** to use it. Token expires in 1 hour with no way to refresh without re-login | `jwt.ts`, `auth.routes.ts` | Missing |
| 3 | **CSRF middleware** — Written (`csrf.middleware.ts`) but **never mounted** in `index.ts`. Completely unused | `csrf.middleware.ts` | Unused |
| 4 | **Validation middleware** — Zod `validate()` middleware exists but is **not used on any route**. Zero input validation on all 28 route files | `validate.middleware.ts` | Unused |
| 5 | **Staff Invite SMS** — `inviteStaff` just `console.log`s the dynamic link. No actual SMS is sent | `auth.controller.ts:219` | Stub |
| 6 | **COGS in P&L** — hardcoded as `totalRevenue * 0.3`. Not connected to actual Inventory/PurchaseLog data | `accounting.controller.ts:262` | Mock |
| 7 | **ITC in GSTR-3B** — hardcoded as `expense * 18/118` instead of using actual CGST/SGST stored per expense | `accounting.controller.ts:206` | Approximation |
| 8 | **Menu Sync to Zomato/Swiggy** — worker iterates items but only `console.log`s. No actual API call | `menuSync.service.ts:35-39` | Stub |
| 9 | **Menu Sync worker** (new) — same issue, simulates with `setTimeout` | `menuSync.worker.ts` | Stub |
| 10 | **Campaign SMS delivery tracking** — `CampaignRecipient.responded` is never set to `true` anywhere | `campaign.controller.ts` | Incomplete |
| 11 | **Feedback SMS cron** — referenced in comments but no actual cron job processes the feedback SMS queue | `index.ts:167` comment | Missing |
| 12 | **WhatsApp order confirmation** — `sendOrderConfirmationWA` likely stubs/logs since no WhatsApp Business API credentials are configured | `whatsappService.ts` | Stub |
| 13 | **Reconciliation Report** — aggregates `commissionEstimated` field that is hardcoded (20%/22%/5%) rather than actual Zomato/Swiggy settlement data | `integration.controller.ts:324-326` | Inaccurate |
| 14 | **Export Month End Report** button — calls `/analytics/gst/export` which may not exist (no route found in analytics.routes.ts for Excel export) | `AccountantDashboard.tsx` | Possibly broken |
| 15 | **"Download Excel for GSTN"** button on GSTFiling page — same issue, hits an export endpoint that may not be registered | `GSTFiling.tsx` | Possibly broken |

### Web (Admin Dashboard)
| # | Feature | File | Status |
|---|---------|------|--------|
| 16 | **LiveAnalytics page** — visible in sidebar but actual real-time WebSocket data flow is not connected | `LiveAnalytics.tsx` | Partial |
| 17 | **Analytics.tsx** — only 3.6KB, appears to be a lightweight shell/redirect, not a full analytics page | `Analytics.tsx` | Shell |
| 18 | **Reports page** — "Download" buttons on reports likely don't trigger real PDF/Excel generation | `ReportsPage.tsx` | UI-only |
| 19 | **KDS (Kitchen Display)** — station filtering may not reflect actual station categories correctly | `KDS.tsx` | Unverified |
| 20 | **Invoice PDF download** — `InvoiceScreen.tsx` is only 5KB, likely just displays data without actual PDF generation | `InvoiceScreen.tsx` | Likely missing |

### Customer-Web (PWA)
| # | Feature | File | Status |
|---|---------|------|--------|
| 21 | **Order Tracking page** — only 3.8KB, likely shows static status rather than live WebSocket tracking | `Tracking.tsx` | Minimal |
| 22 | **Razorpay key hardcoded** as `rzp_test_stub` in customer checkout | `Checkout.tsx:44` | Hardcoded |
| 23 | **MyAccount page** — only 5.8KB, loyalty points/order history display may be incomplete | `MyAccount.tsx` | Partial |

---

## PART B: 50+ BUGS

### Critical Bugs
| # | Bug | File:Line | Severity |
|---|-----|-----------|----------|
| 1 | **`getBaseQuery` not imported in billing controller** caused 500 error on EOD — was just fixed this session but indicates fragile import management | `billing.controller.ts` | Critical |
| 2 | **Online orders trust client-side prices** — `createOnlineOrder` says "we trust the request for stub purposes" and uses `item.priceAtOrderTime` directly from the request body without server-side price validation | `onlineOrder.controller.ts:33` | Critical |
| 3 | **Takeaway order creates fake tableId** — `new mongoose.Types.ObjectId()` is used as a placeholder `tableId` that references no real table document, corrupting `Table` references | `order.controller.ts:158` | Major |
| 4 | **`requireRole` uses `UserRole.MANAGER`** which doesn't exist in the enum — the enum has `BRANCH_MANAGER` not `MANAGER`, meaning the invite-staff route is broken | `auth.routes.ts:12` | Critical |
| 5 | **OTP brute-force possible** — no rate limiting on `sendCustomerOTP` or `verifyCustomerOTP` endpoints. An attacker can try all 6-digit codes (1M combinations) | `customerAuth.routes.ts` | Critical |
| 6 | **Razorpay webhook fallback secret** — `process.env.RAZORPAY_WEBHOOK_SECRET || 'fallback_secret'` means if the env var is missing, ALL webhooks with `'fallback_secret'` pass verification | `onlineOrder.controller.ts:128` | Critical |
| 7 | **`delete req.user.branchId`** in auth middleware mutates the decoded JWT payload object. If the same token object is reused or cached, this causes inconsistent state | `auth.middleware.ts:41` | Major |
| 8 | **`requireBranchAccess`** middleware misses `OWNER` role — only checks `SUPER_OWNER`, `BRANCH_MANAGER`, and exact `branchId` match. An OWNER would be blocked from accessing any branch-specific route using this middleware | `auth.middleware.ts:55` | Major |
| 9 | **Duplicate Redis connections** — `config/redis.ts` and `config/queue.ts` both create separate IORedis connections. Plus `menuSync.worker.ts` creates a third. Three Redis connections when one is sufficient | `redis.ts`, `queue.ts`, `menuSync.worker.ts` | Resource leak |
| 10 | **Duplicate `menuSyncQueue`** — both `config/queue.ts` and `workers/menuSync.worker.ts` export a `menuSyncQueue` with different queue names (`'MenuSync'` vs `'menu-sync'`). The controller imports from `worker`, but the service imports from `config` — these are different queues! | `queue.ts:13`, `menuSync.worker.ts:9` | Critical |

### Data Integrity Bugs
| # | Bug | File:Line | Severity |
|---|-----|-----------|----------|
| 11 | **`...req.body` spread in `createIntegration`** allows clients to overwrite `restaurantId`, `status`, `errorLog` or any other protected field | `integration.controller.ts:283` | Major |
| 12 | **`...req.body` spread in `createExpense`** allows overwriting `restaurantId`, `branchId`, `recordedBy` | `expense.controller.ts:33` | Major |
| 13 | **`...req.body` spread in `createTdsLog`** allows overwriting `restaurantId`, `recordedBy` | `tds.controller.ts:25` | Major |
| 14 | **`...req.body` spread in `StaffMember.create`** allows setting arbitrary fields like `_id`, `createdAt` | `staff.controller.ts:27` | Major |
| 15 | **`...req.body` spread in `Supplier.create`** — same issue | `inventory.controller.ts:170` | Major |
| 16 | **`...req.body` spread in `Branch.create`** — same issue | `branch.controller.ts:26` | Major |
| 17 | **`...req.body` spread in `MenuItem update`** — same issue | `menu.controller.ts:209` | Major |
| 18 | **`updateIntegration` allows overwriting `restaurantId`** via request body since it does `req.body` directly | `integration.controller.ts:293` | Major |
| 19 | **Invoice total computed client-side** — `totalAmountINR` in `createOrder` is calculated from client-sent `priceAtOrderTime`, not from the database | `order.controller.ts:81` | Major |
| 20 | **GSTR-1 query doesn't use `getBaseQuery`** — builds manual `restaurantId` filter, potentially inconsistent with branch scope | `accounting.controller.ts:69` | Medium |

### Frontend Bugs
| # | Bug | File:Line | Severity |
|---|-----|-----------|----------|
| 21 | **`restaurantId: 'fallback_id'`** in customer checkout — if no restaurantId is in the cart store, the order is created with an invalid restaurant reference | `Checkout.tsx:22` | Critical |
| 22 | **Customer Login stores `data.name`** as `displayName` but the API returns `data.phoneNumber`, not `data.name` — the name field will be `undefined` | `Login.tsx(customer):115` | Medium |
| 23 | **InvoiceRegister uses `inv.id`** as React key instead of `inv._id` — Mongoose `.id` getter may not be available on `.lean()` results if the backend uses lean queries | `InvoiceRegister.tsx:62` | Minor |
| 24 | **No error boundary** on any page — an unhandled exception in any component crashes the entire app with a white screen | All pages | Major |
| 25 | **`fetchData` in ExpenseTds** doesn't pass `branchId` query param, so the backend returns all expenses regardless of selected branch | `ExpenseTds.tsx:27` | Medium |
| 26 | **Admin Login** doesn't validate phone number format before calling Firebase — no `maxLength`, no digit-only enforcement | `Login.tsx(web):85-94` | Minor |
| 27 | **Admin Login** doesn't handle reCAPTCHA errors gracefully — no error state shown to user | `Login.tsx(web):41-43` | Medium |
| 28 | **Checkout `getGST`** calculates GST on the client side which may differ from the server's `computeGSTBreakup` calculation, leading to price discrepancy at billing | `Checkout.tsx:13` | Medium |
| 29 | **`useEffect` missing dependencies** — `fetchIntegrations()` in IntegrationsSettings depends on `user` but isn't included in deps array lint rule | `IntegrationsSettings.tsx:32` | Minor |
| 30 | **Stale closure in Campaigns** — campaign send/preview may use stale `accessToken` if the token refreshes mid-session | `Campaigns.tsx` | Medium |

### Backend Logic Bugs
| # | Bug | File:Line | Severity |
|---|-----|-----------|----------|
| 31 | **`paymentStatus` always 'PENDING'** — online order sets `paymentMode: 'PAY_AT_COUNTER' ? 'PENDING' : 'PENDING'` — both branches are identical, payment status is never 'PAID' at creation | `onlineOrder.controller.ts:87` | Minor (cosmetic) |
| 32 | **Bill preview `subtotal = GST-inclusive`** — comment says "GST-inclusive" but `raw = subtotal`, contradicting variable naming. Unclear if prices are tax-inclusive or exclusive | `billing.controller.ts:73` | Confusing |
| 33 | **`endOfMonth` off-by-one** — backend `getDashboardMetrics` uses `new Date(y, m+1, 0)` which gives last day of month at midnight (00:00:00), missing invoices created on the last day after midnight. Fixed in some places but not all | `accounting.controller.ts` | Medium |
| 34 | **Online order `mongoose` imported via `require`** inside `createOnlineOrder` instead of top-level `import` | `onlineOrder.controller.ts:30,54` | Code smell |
| 35 | **`Branch` model accessed via `mongoose.model('Branch')`** instead of imported model — fragile, breaks if model isn't registered yet | `onlineOrder.controller.ts:55` | Medium |
| 36 | **Token blacklist TTL mismatch** — access token expires in `1h` but blacklist entry also expires in `3600s` (1h). If user logs out at minute 59, the blacklist entry expires 1 second after the token itself, leaving a tiny window | `auth.controller.ts:130` | Minor |
| 37 | **No pagination on Invoice Register** — `getInvoiceRegister` returns ALL invoices for the month with no `limit`, can be extremely slow for high-volume restaurants | `accounting.controller.ts:321` | Performance |
| 38 | **`Campaign.sentAt`** is set before SMS actually finishes sending — if SMS fails mid-batch, campaign is marked as SENT but not all messages were delivered | `campaign.controller.ts:136-139` | Medium |
| 39 | **Loyalty points bonus** applied in a loop with individual `findByIdAndUpdate` calls — no transaction, race conditions possible if same customer is in multiple concurrent campaigns | `campaign.controller.ts:120-133` | Medium |
| 40 | **`requestBill`** in onlineOrder is completely unauthenticated — anyone with an orderId can change order status | `onlineOrder.routes.ts:11` | Critical |

### Misc Bugs
| # | Bug | File:Line | Severity |
|---|-----|-----------|----------|
| 41 | **Duplicate AI controller files** — both `ai.controller.ts` and `aiController.ts` exist with overlapping functionality | Controllers dir | Confusing |
| 42 | **Duplicate AI route files** — both `ai.routes.ts` and `aiRoutes.ts` exist | Routes dir | Confusing |
| 43 | **Socket.io auth is optional** — if no token is provided, `socket.user = null` but connection still succeeds, allowing unauthenticated users to join restaurant rooms | `index.ts:96` | Major |
| 44 | **`join_restaurant` auth bypass** — checks `user.restaurantId !== restaurantId` but `user` can be null (unauthenticated socket), causing a TypeError crash | `index.ts:118` | Critical |
| 45 | **`enableOfflineQueue: false`** on Redis means all requests fail during brief Redis disconnections instead of queuing | `redis.ts:6` | Reliability |
| 46 | **No graceful shutdown** — server has no SIGTERM/SIGINT handler to close MongoDB, Redis, and BullMQ connections cleanly | `index.ts` | Production |
| 47 | **`express.json` limit is 50kb** — menu items with images (base64) or large batch operations will be rejected | `index.ts:52` | Medium |
| 48 | **`lookupCustomerForOnlineOrder`** is unauthenticated and returns customer name for any phone number — information disclosure | `onlineOrder.routes.ts:6` | Security |
| 49 | **`getTableInfo`** is unauthenticated — anyone can enumerate all table IDs and get restaurant/branch metadata | `onlineOrder.routes.ts:9` | Security |
| 50 | **Two `Razorpay` instances** — one in `billing.controller.ts` (inline) and one imported from `config/razorpay.ts` in `onlineOrder.controller.ts` — inconsistent config | Multiple | Bug |
| 51 | **`Invoice` is NOT re-queried after creation** — some race conditions where concurrent orders could generate duplicate invoice numbers despite `InvoiceSequence` | `billing.controller.ts` | Edge case |
| 52 | **`searchOrders` uses `$regex`** with user-supplied input without escaping special regex characters — can crash with invalid regex or be used for ReDoS | `order.controller.ts:53` | Security |

---

## PART C: 50+ SECURITY VULNERABILITIES

### Authentication & Authorization
| # | Vulnerability | File | CVSS Est. |
|---|---------------|------|-----------|
| S1 | **Hardcoded JWT secret fallback** `'fallback-secret-for-dev'` — if `JWT_SECRET` env var is missing, ALL tokens are signed with a publicly known secret | `jwt.ts:4` | 🔴 Critical |
| S2 | **Customer JWT secret fallback** `'secret'` — even weaker fallback for customer tokens | `customerAuth.controller.ts:87` | 🔴 Critical |
| S3 | **Customer login secret differs** from main JWT — `customerAuth.controller.ts` uses `process.env.JWT_SECRET || 'secret'` while `auth.controller.ts` uses `'fallback-secret-for-dev'` | Mismatch | 🟡 Medium |
| S4 | **No token audience/issuer** validation — JWTs have no `iss` or `aud` claim, meaning a customer token could potentially be used against admin endpoints if the secret matches | `jwt.ts` | 🔴 High |
| S5 | **Same secret for access and refresh tokens** — compromising one compromises both. Refresh tokens should use a separate secret | `jwt.ts:18-19` | 🟠 High |
| S6 | **Razorpay test keys in production fallback** — `rzp_test_key` / `rzp_test_secret` are usable if env vars are missing | `billing.controller.ts:39-40` | 🔴 Critical |
| S7 | **Razorpay webhook secret fallback** `'fallback_secret'` — any attacker can forge valid payment webhooks | `onlineOrder.controller.ts:128` | 🔴 Critical |
| S8 | **`devLogin` creates SUPER_OWNER** without any authentication — dead code but if accidentally routed, grants full admin access | `auth.controller.ts:80-118` | 🔴 Critical |
| S9 | **`inviteStaff` uses `temp_{timestamp}` as firebaseUid** — predictable, collision-prone, and allows pre-creation attacks | `auth.controller.ts:208` | 🟠 High |
| S10 | **OTP returned in API response** when MSG91 is not configured — `devMode && { otp }` leaks the OTP to anyone calling the API | `customerAuth.controller.ts:58` | 🔴 Critical |

### Input Validation
| # | Vulnerability | File | CVSS Est. |
|---|---------------|------|-----------|
| S11 | **Zero Zod validation on ANY route** — the `validate` middleware exists but is never applied. All endpoints accept arbitrary JSON without schema validation | All routes | 🔴 Critical |
| S12 | **`...req.body` spread** on 9+ create endpoints allows **mass assignment** — attackers can set `_id`, `restaurantId`, `role`, `isActive`, `createdAt`, etc. | Multiple controllers | 🔴 Critical |
| S13 | **No phone number sanitization** — phone numbers are stored as-is without format validation. SQL/NoSQL injection possible via MongoDB operator injection in phone field | `customerAuth.controller.ts:21` | 🟠 High |
| S14 | **`$regex` with user input** in order search — allows ReDoS (Regular Expression Denial of Service) attacks | `order.controller.ts:53` | 🟠 High |
| S15 | **`mongoose.Types.ObjectId.isValid`** check is insufficient — it accepts strings that aren't valid ObjectIds (e.g., 12-char strings) | `onlineOrder.controller.ts:38` | 🟡 Medium |
| S16 | **No file upload validation** — `multer` is installed but file type/size restrictions are not visible in the middleware | `package.json` | 🟡 Medium |

### CSRF & CORS
| # | Vulnerability | File | CVSS Est. |
|---|---------------|------|-----------|
| S17 | **CSRF middleware built but NOT deployed** — all state-mutating POST/PUT/DELETE endpoints are vulnerable to CSRF | `csrf.middleware.ts`, `index.ts` | 🟠 High |
| S18 | **CORS set to `*` in development** — allows any origin to make authenticated requests with `credentials: true`. This is an XSS amplification vector | `index.ts:48` | 🟠 High |
| S19 | **`credentials: true` with `origin: '*'`** — this combination is technically rejected by browsers but indicates a design intent issue | `index.ts:50` | 🟡 Medium |

### Unauthenticated Endpoints
| # | Vulnerability | File | CVSS Est. |
|---|---------------|------|-----------|
| S20 | **`createOnlineOrder`** — fully unauthenticated. Anyone can create orders for any restaurant | `onlineOrder.routes.ts:7` | 🔴 Critical |
| S21 | **`verifyPaymentWebhook`** — relies only on HMAC with a fallback secret | `onlineOrder.routes.ts:8` | 🔴 Critical |
| S22 | **`requestBill`** — unauthenticated, allows changing order status from OPEN to BILLED | `onlineOrder.routes.ts:11` | 🟠 High |
| S23 | **`payOnlineOrder`** — unauthenticated, creates Razorpay orders for any order | `onlineOrder.routes.ts:12` | 🔴 Critical |
| S24 | **`getLiveTableOrder`** — unauthenticated, leaks order details including customer info | `onlineOrder.routes.ts:10` | 🟠 High |
| S25 | **`getTableInfo`** — unauthenticated, leaks table and branch metadata | `onlineOrder.routes.ts:9` | 🟡 Medium |
| S26 | **`lookupCustomerForOnlineOrder`** — unauthenticated, allows enumerating customer names by phone number for any restaurant | `onlineOrder.routes.ts:6` | 🟠 High |
| S27 | **Webhook endpoints** (`/zomato/webhook`, `/swiggy/webhook`) — HMAC verification is optional (`if (integration.webhookSecret && signature)`) — if no secret is set, all payloads are accepted | `integration.controller.ts:30-36` | 🔴 Critical |

### Data Exposure
| # | Vulnerability | File | CVSS Est. |
|---|---------------|------|-----------|
| S28 | **Customer OTP stored in plaintext** in the database — should be hashed (bcrypt/argon2) | `customerAuth.controller.ts:38` | 🟠 High |
| S29 | **`webhookSecret` returned in GET `/integrations`** — API keys/secrets should never be sent back to the frontend | `integration.controller.ts:271` | 🔴 Critical |
| S30 | **Error messages leak stack traces** — `console.error` outputs are detailed but some `catch` blocks return `err.message` which could contain internal details | Multiple controllers | 🟡 Medium |
| S31 | **No field selection on `getIntegrations`** — returns full documents including `webhookSecret`, `errorLog`, internal IDs | `integration.controller.ts:271` | 🟠 High |
| S32 | **Customer profile endpoint** (`getMyProfile`) returns `select('-otp -otpExpiresAt')` but doesn't exclude other sensitive fields | `customerAuth.controller.ts:120` | 🟡 Medium |

### Rate Limiting
| # | Vulnerability | File | CVSS Est. |
|---|---------------|------|-----------|
| S33 | **No rate limit on OTP send** — allows SMS bombing (financial attack on MSG91 credits) | `customerAuth.routes.ts` | 🔴 Critical |
| S34 | **No rate limit on OTP verify** — allows brute-force of 6-digit OTP (1M combinations) | `customerAuth.routes.ts` | 🔴 Critical |
| S35 | **No rate limit on online order creation** — DoS via mass order creation | `onlineOrder.routes.ts:7` | 🟠 High |
| S36 | **No rate limit on customer lookup** — allows mass enumeration of customer names | `onlineOrder.routes.ts:6` | 🟠 High |
| S37 | **Auth rate limiter is 100 per 15 mins** — too generous for a login endpoint, should be 5-10 per 15 mins per IP | `index.ts:64` | 🟡 Medium |

### Injection & Denial of Service
| # | Vulnerability | File | CVSS Est. |
|---|---------------|------|-----------|
| S38 | **MongoDB operator injection** — `mongoSanitize` is applied but `$regex` usage with user input in `getAllOrders` bypasses it | `order.controller.ts:51-56` | 🟠 High |
| S39 | **NoSQL injection via query params** — `branchId` from `req.query` is passed directly to MongoDB queries without ObjectId casting in multiple controllers | Multiple | 🟠 High |
| S40 | **Request body size 50kb** — insufficient for legitimate large menu updates but the real issue is no per-field validation | `index.ts:52` | 🟡 Medium |

### Socket.io Security
| # | Vulnerability | File | CVSS Est. |
|---|---------------|------|-----------|
| S41 | **Unauthenticated socket connections accepted** — `socket.user = null` is allowed | `index.ts:96` | 🟠 High |
| S42 | **`join_restaurant`** doesn't verify the requesting socket owns the restaurant — any authenticated user can join any restaurant's room and receive all real-time events | `index.ts:107-131` | 🔴 Critical |
| S43 | **`join_order`** has zero auth check — anyone can join any order room and receive real-time updates including customer PII | `index.ts:134-137` | 🔴 Critical |
| S44 | **No socket event validation** — `data` parameter in `join_restaurant` is used without type checking and can crash the server | `index.ts:108-115` | 🟡 Medium |

### Cryptographic Issues
| # | Vulnerability | File | CVSS Est. |
|---|---------------|------|-----------|
| S45 | **Webhook HMAC comparison** uses `!==` instead of `crypto.timingSafeEqual` — vulnerable to timing attacks | `integration.controller.ts:33` | 🟡 Medium |
| S46 | **Razorpay webhook HMAC comparison** same issue — timing attack vulnerable | `onlineOrder.controller.ts:135` | 🟡 Medium |
| S47 | **OTP generation uses `Math.random()`** which is not cryptographically secure — should use `crypto.randomInt()` | `customerAuth.controller.ts:17` | 🟠 High |

### Infrastructure
| # | Vulnerability | File | CVSS Est. |
|---|---------------|------|-----------|
| S48 | **No HTTPS enforcement** — server listens on HTTP. No `app.use(express.redirect)` or HSTS headers | `index.ts` | 🟠 High |
| S49 | **Cookie security flags** only set in production — CSRF cookie has `secure: false` in development, but more critically, cookies may be sent over HTTP in production if HTTPS isn't enforced | `csrf.middleware.ts:9` | 🟡 Medium |
| S50 | **No request ID correlation** — errors can't be traced across services. Winston logs don't include a unique request ID | `error.middleware.ts` | 🟡 Medium |
| S51 | **`mongoose-field-encryption`** is installed but not used on any model — sensitive fields like `webhookSecret`, `panNumber` are stored in plaintext | `package.json` | 🟠 High |
| S52 | **No Content Security Policy for API** — Helmet CSP only allows `'self'` for scripts but doesn't set `frame-ancestors` to prevent clickjacking | `index.ts:34` | 🟡 Medium |

---

## PART D: PRIORITY FIXES

> [!CAUTION]
> **Top 5 MUST-FIX items before any production deployment:**

1. **Remove all hardcoded secret fallbacks** (`jwt.ts`, `billing.controller.ts`, `onlineOrder.controller.ts`) — fail loudly if env vars are missing
2. **Add Zod validation schemas** to all routes — the middleware exists, just needs to be applied
3. **Stop spreading `...req.body`** into Mongoose creates — whitelist allowed fields explicitly
4. **Rate limit OTP endpoints** — add specific rate limiter (5 per phone per 15 min)
5. **Authenticate all online-order endpoints** with at least a customer JWT or session token

> [!WARNING]
> **Next 5 high-impact fixes:**

6. Fix the `UserRole.MANAGER` bug in `auth.routes.ts` (should be `BRANCH_MANAGER`)
7. Hash OTPs before storing in database
8. Add `crypto.timingSafeEqual` for all HMAC comparisons
9. Fix duplicate BullMQ queue names (`MenuSync` vs `menu-sync`)
10. Implement token refresh endpoint
