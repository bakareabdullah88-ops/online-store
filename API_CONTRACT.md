# API contract

Every method of the service layer (`src/services/contracts.ts`) and the endpoint it becomes.
The mock implementation (`src/services/mock`) already behaves like this contract, so a real backend
can be dropped in by implementing `src/services/remote` with **zero UI changes**.

- **Base URL:** `/api/v1`
- **Auth:** HTTP-only session cookie (`kiosk_session`). The mock stores a session id in IndexedDB.
- **Money:** always integer **kobo** (`number`). Never floats.
- **Dates:** ISO-8601 strings in UTC.
- **Types:** request and response shapes refer to `src/services/types.ts`; input schemas are the Zod
  schemas in `src/services/inputs.ts` (reuse them server-side).
- **Errors:** JSON `{ "code": ServiceErrorCode, "message": string, "fields"?: Record<string,string> }`.

| `code`            | HTTP | Meaning                                                           |
| ----------------- | ---- | ----------------------------------------------------------------- |
| `VALIDATION`      | 422  | Input failed the Zod schema; `fields` maps field → message        |
| `UNAUTHORIZED`    | 401  | Not signed in / bad credentials                                   |
| `FORBIDDEN`       | 403  | Signed in but not allowed (e.g. no shop, own product)             |
| `NOT_FOUND`       | 404  | Resource missing or not visible to caller                         |
| `CONFLICT`        | 409  | State conflict (taken handle, sold out, illegal order transition) |
| `UNAVAILABLE`     | 503  | Upstream outage                                                   |
| `NOT_IMPLEMENTED` | 501  | Remote stub (current state of `remote/`)                          |

List endpoints return `Page<T> = { items, total, page, pageSize, hasMore }` where noted.

---

## Auth: `services.auth`

| Method                        | Endpoint                       | Request                                                  | Response                                  | Errors                                        |
| ----------------------------- | ------------------------------ | -------------------------------------------------------- | ----------------------------------------- | --------------------------------------------- |
| `getSession()`                | `GET /auth/session`            | –                                                        | `User \| null`                            | –                                             |
| `signUp(input)`               | `POST /auth/signup`            | `SignUpInput { name, email, password }`                  | `User` (sets cookie)                      | `VALIDATION`, `CONFLICT` (email taken)        |
| `signIn(input)`               | `POST /auth/login`             | `SignInInput { email, password }`                        | `User` (sets cookie)                      | `VALIDATION`, `UNAUTHORIZED`                  |
| `signInDemo(kind)`            | `POST /auth/demo`              | `{ kind: "buyer" \| "seller" }`                          | `User`                                    | `NOT_FOUND` (demo-only; remove in production) |
| `signOut()`                   | `POST /auth/logout`            | –                                                        | `204`                                     | –                                             |
| `requestPasswordReset(input)` | `POST /auth/password-reset`    | `{ email }`                                              | `{ sent: true }` (always, no enumeration) | `VALIDATION`                                  |
| `updateProfile(input)`        | `PATCH /me`                    | `ProfileInput { name, campusId, phone, avatarImageId? }` | `User`                                    | `VALIDATION`, `UNAUTHORIZED`                  |
| `updateNotificationPrefs(p)`  | `PATCH /me/notification-prefs` | `Partial<NotificationPrefs>`                             | `User`                                    | `UNAUTHORIZED`                                |

## Catalog: `services.catalog`

| Method                          | Endpoint                           | Request                                                                                                                                     | Response                                            | Errors                                     |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------ |
| `listCampuses()`                | `GET /campuses`                    | –                                                                                                                                           | `Campus[]` (with zones, pickup points)              | –                                          |
| `getProducts(q)`                | `GET /products`                    | query: `ProductQuery` (`q, category, brandId, campusId, zoneId, minPriceKobo, maxPriceKobo, minRating, inStock, sort, page, pageSize, ids`) | `Page<ProductWithBrand>`                            | `VALIDATION`                               |
| `getProduct(slug)`              | `GET /products/:slug`              | –                                                                                                                                           | `ProductWithBrand`                                  | `NOT_FOUND` (drafts visible only to owner) |
| `getRelatedProducts(id, limit)` | `GET /products/:id/related?limit=` | –                                                                                                                                           | `ProductWithBrand[]`                                | –                                          |
| `getBrands(q)`                  | `GET /brands`                      | query: `BrandQuery { category, campusId, ids, featured, limit }`                                                                            | `Brand[]`                                           | –                                          |
| `getBrand(handle)`              | `GET /brands/:handle`              | –                                                                                                                                           | `Brand`                                             | `NOT_FOUND`                                |
| `getProductReviews(id)`         | `GET /products/:id/reviews`        | –                                                                                                                                           | `{ reviews: Review[], breakdown: RatingBreakdown }` | –                                          |
| `getBrandReviews(id)`           | `GET /brands/:id/reviews`          | –                                                                                                                                           | `{ reviews, breakdown }`                            | –                                          |
| `search(q, limit)`              | `GET /search?q=&limit=`            | –                                                                                                                                           | `{ products: ProductWithBrand[], brands: Brand[] }` | –                                          |
| `recordEvent(e)`                | `POST /events`                     | `{ type: "view" \| "add_to_bag", productId }`                                                                                               | `204`                                               | – (fire-and-forget)                        |
| `getPriceRange()`               | `GET /products/price-range`        | –                                                                                                                                           | `{ minKobo, maxKobo }`                              | –                                          |

## Social: `services.social`

| Method                      | Endpoint                                | Response                       | Errors                                 |
| --------------------------- | --------------------------------------- | ------------------------------ | -------------------------------------- |
| `toggleFollow(brandId)`     | `POST /brands/:id/follow` (toggle)      | `{ following, followerCount }` | `UNAUTHORIZED`, `FORBIDDEN` (own shop) |
| `toggleWishlist(productId)` | `POST /me/wishlist/:productId` (toggle) | `{ saved }`                    | `UNAUTHORIZED`, `NOT_FOUND`            |
| `getWishlist()`             | `GET /me/wishlist`                      | `ProductWithBrand[]`           | `UNAUTHORIZED`                         |
| `getFollowing()`            | `GET /me/following`                     | `Brand[]`                      | `UNAUTHORIZED`                         |

## Orders: `services.orders`

| Method                   | Endpoint                   | Request                                                                                                                                   | Response                                                                 | Errors                                                                   |
| ------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `quote(input)`           | `POST /checkout/quote`     | `CheckoutInput`                                                                                                                           | `CheckoutQuote` (per-brand subtotals, fees, promo status, line problems) | `VALIDATION`, `UNAUTHORIZED`                                             |
| `createOrders(input)`    | `POST /checkout`           | `CheckoutInput { campusId, phone, paymentMethod, groups[{ brandId, lines[{productId, variantKey, quantity}], fulfilment, promoCode? }] }` | `{ checkoutId, orders: Order[] }`, one order per brand                   | `VALIDATION`, `CONFLICT` (stock, own product, invalid promo, low wallet) |
| `listMyOrders()`         | `GET /me/orders`           | –                                                                                                                                         | `Order[]`                                                                | `UNAUTHORIZED`                                                           |
| `getOrder(id)`           | `GET /orders/:id`          | –                                                                                                                                         | `Order` (buyer or the selling brand)                                     | `NOT_FOUND`                                                              |
| `cancelOrder(id)`        | `POST /orders/:id/cancel`  | –                                                                                                                                         | `Order`                                                                  | `CONFLICT` (already accepted)                                            |
| `reviewOrderItem(input)` | `POST /orders/:id/reviews` | `ReviewInput { orderId, productId, rating, body }`                                                                                        | `Review`                                                                 | `CONFLICT` (not delivered / already reviewed)                            |
| `myReviews()`            | `GET /me/reviews`          | –                                                                                                                                         | `Review[]`                                                               | `UNAUTHORIZED`                                                           |

> **Live tracking.** The mock advances orders for seeded brands on a schedule (`domain/orders.ts`).
> **BACKEND-SEAM:** the real API pushes status changes over SSE (`GET /orders/:id/events`) or
> websockets; the UI already polls `getOrder` every 2s while an order is active and will simply
> receive fresher data.

## Notifications: `services.notifications`

| Method          | Endpoint                          | Response            |
| --------------- | --------------------------------- | ------------------- |
| `list()`        | `GET /me/notifications`           | `AppNotification[]` |
| `markRead(id)`  | `POST /me/notifications/:id/read` | `204`               |
| `markAllRead()` | `POST /me/notifications/read-all` | `204`               |

## Messages: `services.messages`

| Method               | Endpoint                            | Request                   | Response                   | Errors                    |
| -------------------- | ----------------------------------- | ------------------------- | -------------------------- | ------------------------- |
| `listThreads(as)`    | `GET /threads?as=buyer\|brand`      | –                         | `Thread[]`                 | `UNAUTHORIZED`            |
| `getThread(id, as)`  | `GET /threads/:id?as=` (marks read) | –                         | `Thread`                   | `NOT_FOUND`               |
| `startThread(input)` | `POST /threads`                     | `{ brandId, productId? }` | `Thread` (existing or new) | `FORBIDDEN` (own shop)    |
| `send(input)`        | `POST /threads/:id/messages`        | `{ body, as }`            | `Thread`                   | `VALIDATION`, `NOT_FOUND` |

## Wallet (demo): `services.wallet`

| Method              | Endpoint                  | Request                             | Response                                             | Errors         |
| ------------------- | ------------------------- | ----------------------------------- | ---------------------------------------------------- | -------------- |
| `getWallet()`       | `GET /me/wallet`          | –                                   | `{ balanceKobo, transactions: WalletTransaction[] }` | `UNAUTHORIZED` |
| `topUp(amountKobo)` | `POST /me/wallet/top-ups` | `{ amountKobo }` (₦500 to ₦200,000) | `{ balanceKobo }`                                    | `VALIDATION`   |

## Saved places: `services.places`

| Method        | Endpoint                                  | Request      | Response       |
| ------------- | ----------------------------------------- | ------------ | -------------- |
| `list()`      | `GET /me/places`                          | –            | `SavedPlace[]` |
| `save(input)` | `PUT /me/places/:id` or `POST /me/places` | `PlaceInput` | `SavedPlace`   |
| `remove(id)`  | `DELETE /me/places/:id`                   | –            | `204`          |

## Shop Studio: `services.studio` (requires the caller to own a brand → else `FORBIDDEN`)

| Method                      | Endpoint                                    | Request                                                       | Response                                            | Errors                                                       |
| --------------------------- | ------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| `createBrand(input)`        | `POST /brands`                              | `CreateBrandInput`                                            | `Brand`                                             | `VALIDATION`, `CONFLICT` (handle taken / already has a shop) |
| `isHandleAvailable(h)`      | `GET /brands/handle-available?handle=`      | –                                                             | `boolean`                                           | –                                                            |
| `getMyBrand()`              | `GET /studio/brand`                         | –                                                             | `Brand \| null`                                     | –                                                            |
| `updateBrand(input)`        | `PATCH /studio/brand`                       | `UpdateBrandInput` (incl. vacation, openHours, payoutAccount) | `Brand`                                             | `VALIDATION`                                                 |
| `getSetup()`                | `GET /studio/setup`                         | –                                                             | `SetupStep[]`                                       | –                                                            |
| `getOverview(period)`       | `GET /studio/overview?period=7d\|30d\|90d`  | –                                                             | `StudioOverview`                                    | –                                                            |
| `getAnalytics(period)`      | `GET /studio/analytics?period=`             | –                                                             | `StudioAnalytics`                                   | –                                                            |
| `listProducts(q)`           | `GET /studio/products?q=&status=&category=` | –                                                             | `Product[]`                                         | –                                                            |
| `getProduct(id)`            | `GET /studio/products/:id`                  | –                                                             | `Product`                                           | `NOT_FOUND`                                                  |
| `createProduct(input)`      | `POST /studio/products`                     | `ProductInput`                                                | `Product`                                           | `VALIDATION`                                                 |
| `updateProduct(id, input)`  | `PUT /studio/products/:id`                  | `ProductInput`                                                | `Product`                                           | `VALIDATION`, `NOT_FOUND`                                    |
| `setProductsStatus(ids, s)` | `POST /studio/products/bulk-status`         | `{ ids, status }`                                             | `204`                                               | –                                                            |
| `deleteProducts(ids)`       | `POST /studio/products/bulk-delete`         | `{ ids }`                                                     | `204`                                               | –                                                            |
| `listOrders()`              | `GET /studio/orders`                        | –                                                             | `Order[]`                                           | –                                                            |
| `updateOrderStatus(id, s)`  | `POST /studio/orders/:id/status`            | `{ status }`                                                  | `Order`                                             | `CONFLICT` (illegal transition)                              |
| `listCustomers()`           | `GET /studio/customers`                     | –                                                             | `Customer[]`                                        | –                                                            |
| `listReviews()`             | `GET /studio/reviews`                       | –                                                             | `Review[]`                                          | –                                                            |
| `replyToReview(id, body)`   | `POST /studio/reviews/:id/reply`            | `{ body }`                                                    | `Review`                                            | `VALIDATION`                                                 |
| `listPromos()`              | `GET /studio/promos`                        | –                                                             | `Promo[]`                                           | –                                                            |
| `createPromo(input)`        | `POST /studio/promos`                       | `PromoInput`                                                  | `Promo`                                             | `VALIDATION`, `CONFLICT` (code exists)                       |
| `updatePromo(id, patch)`    | `PATCH /studio/promos/:id`                  | `Partial<PromoInput>`                                         | `Promo`                                             | `VALIDATION`                                                 |
| `deletePromo(id)`           | `DELETE /studio/promos/:id`                 | –                                                             | `204`                                               | –                                                            |
| `listPayouts()`             | `GET /studio/payouts`                       | –                                                             | `{ availableKobo, pendingKobo, payouts: Payout[] }` | –                                                            |
| `requestPayout()`           | `POST /studio/payouts`                      | –                                                             | `Payout`                                            | `CONFLICT` (no account / below ₦1,000)                       |

## Media: `services.media`

| Method            | Endpoint                                                             | Request                             | Response                                                       | Errors       |
| ----------------- | -------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------- | ------------ |
| `putImage(file)`  | `POST /uploads` (multipart) **or** presigned `PUT` to object storage | image ≤ 8MB, jpeg/png/webp/gif/avif | `{ id, ref: ImageRef }` (`{ kind: "url", src }` in production) | `VALIDATION` |
| `getImage(id)`    | – (served by CDN URL)                                                | –                                   | `Blob \| null`                                                 | –            |
| `deleteImage(id)` | `DELETE /uploads/:id`                                                | –                                   | `204`                                                          | –            |

## Demo: `services.demo`

| Method    | Endpoint | Notes                                                                   |
| --------- | -------- | ----------------------------------------------------------------------- |
| `reset()` | –        | Mock only: wipes IndexedDB and reseeds. Not part of the production API. |
