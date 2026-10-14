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
| `UNAVAILABLE`     | 503  | Upstream outage, or a feature that is not switched on yet         |
| `NOT_IMPLEMENTED` | 501  | Remote stub (current state of `remote/`)                          |

List endpoints return `Page<T> = { items, total, page, pageSize, hasMore }` where noted.

---

## Auth: `services.auth`

| Method                        | Endpoint                       | Request                                                  | Response                                  | Errors                                                                    |
| ----------------------------- | ------------------------------ | -------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `getSession()`                | `GET /auth/session`            | –                                                        | `User \| null`                            | –                                                                         |
| `signUp(input)`               | `POST /auth/signup`            | `SignUpInput { name, email, password }`                  | `User` (sets cookie)                      | `VALIDATION`, `CONFLICT` (email taken)                                    |
| `signIn(input)`               | `POST /auth/login`             | `SignInInput { email, password }`                        | `User` (sets cookie)                      | `VALIDATION`, `UNAUTHORIZED`                                              |
| `signOut()`                   | `POST /auth/logout`            | –                                                        | `204`                                     | –                                                                         |
| `startPreview()`              | `POST /auth/preview`           | –                                                        | `User` (sets cookie)                      | `UNAVAILABLE` (sample data off; mock only, drop with the sample data)     |
| `requestPasswordReset(input)` | `POST /auth/password-reset`    | `{ email }`                                              | `{ sent: true }` (always, no enumeration) | `VALIDATION`, `UNAVAILABLE` (until email is on, see `config/features.ts`) |
| `deleteAccount(input)`        | `DELETE /me`                   | `{ password }`                                           | `204` (clears cookie)                     | `VALIDATION`, `UNAUTHORIZED` (wrong password)                             |
| `updateProfile(input)`        | `PATCH /me`                    | `ProfileInput { name, campusId, phone, avatarImageId? }` | `User`                                    | `VALIDATION`, `UNAUTHORIZED`                                              |
| `updateNotificationPrefs(p)`  | `PATCH /me/notification-prefs` | `Partial<NotificationPrefs>`                             | `User`                                    | `UNAUTHORIZED`                                                            |

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

| Method                   | Endpoint                      | Request                                                                                                                                   | Response                                                                 | Errors                                                                                                                              |
| ------------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `quote(input)`           | `POST /checkout/quote`        | `CheckoutInput`                                                                                                                           | `CheckoutQuote` (per-brand subtotals, fees, promo status, line problems) | `VALIDATION`, `UNAUTHORIZED`                                                                                                        |
| `createOrders(input)`    | `POST /checkout`              | `CheckoutInput { campusId, phone, paymentMethod, groups[{ brandId, lines[{productId, variantKey, quantity}], fulfilment, promoCode? }] }` | `{ checkoutId, orders: Order[] }`, one order per brand                   | `VALIDATION`, `CONFLICT` (stock, own product, invalid promo), `UNAVAILABLE` (online payment while `features.onlinePayments` is off) |
| `listMyOrders()`         | `GET /me/orders`              | –                                                                                                                                         | `Order[]`                                                                | `UNAUTHORIZED`                                                                                                                      |
| `getOrder(id)`           | `GET /orders/:id`             | –                                                                                                                                         | `Order` (buyer or the selling brand)                                     | `NOT_FOUND`                                                                                                                         |
| `cancelOrder(id)`        | `POST /orders/:id/cancel`     | –                                                                                                                                         | `Order`                                                                  | `CONFLICT` (already accepted)                                                                                                       |
| `reviewOrderItem(input)` | `POST /orders/:id/reviews`    | `ReviewInput { orderId, productId, rating, body }`                                                                                        | `Review`                                                                 | `CONFLICT` (not delivered / already reviewed)                                                                                       |
| `getDashboard(range)`    | `GET /me/dashboard?from=&to=` | –                                                                                                                                         | `BuyerDashboard` (`domain/analytics.ts`)                                 | `UNAUTHORIZED`                                                                                                                      |
| `myReviews()`            | `GET /me/reviews`             | –                                                                                                                                         | `Review[]`                                                               | `UNAUTHORIZED`                                                                                                                      |

> **Status changes.** Sellers move orders by hand: placed → confirmed → preparing → ready / out for
> delivery → delivered (or declined / cancelled). Pay-on-delivery and pay-at-pickup orders are marked
> paid when they're delivered. **BACKEND-SEAM:** the real API pushes status changes over SSE
> (`GET /orders/:id/events`) or websockets through `services.realtime`; until then the UI polls
> while an order is active.

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

## Saved places: `services.places`

| Method        | Endpoint                                  | Request      | Response       |
| ------------- | ----------------------------------------- | ------------ | -------------- |
| `list()`      | `GET /me/places`                          | –            | `SavedPlace[]` |
| `save(input)` | `PUT /me/places/:id` or `POST /me/places` | `PlaceInput` | `SavedPlace`   |
| `remove(id)`  | `DELETE /me/places/:id`                   | –            | `204`          |

## Shop Studio: `services.studio` (requires the caller to own a brand → else `FORBIDDEN`)

| Method                       | Endpoint                                    | Request                                                       | Response                                                               | Errors                                                       |
| ---------------------------- | ------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| `createBrand(input)`         | `POST /brands`                              | `CreateBrandInput`                                            | `Brand`                                                                | `VALIDATION`, `CONFLICT` (handle taken / already has a shop) |
| `isHandleAvailable(h)`       | `GET /brands/handle-available?handle=`      | –                                                             | `boolean`                                                              | –                                                            |
| `getMyBrand()`               | `GET /studio/brand`                         | –                                                             | `Brand \| null`                                                        | –                                                            |
| `updateBrand(input)`         | `PATCH /studio/brand`                       | `UpdateBrandInput` (incl. vacation, openHours, payoutAccount) | `Brand`                                                                | `VALIDATION`                                                 |
| `getSetup()`                 | `GET /studio/setup`                         | –                                                             | `SetupStep[]`                                                          | –                                                            |
| `getDashboard(range)`        | `GET /studio/dashboard?from=&to=`           | –                                                             | `SellerDashboard` (funnel, volume, retention, to-do)                   | –                                                            |
| `getProductAnalytics(range)` | `GET /studio/analytics?from=&to=`           | –                                                             | `{ stats: ProductStat[], hourly, campuses }`                           | –                                                            |
| `getFinance()`               | `GET /studio/finance`                       | –                                                             | `{ earnedKobo, pendingKobo, completedOrders, byMonth, payoutAccount }` | –                                                            |
| `listProducts(q)`            | `GET /studio/products?q=&status=&category=` | –                                                             | `Product[]`                                                            | –                                                            |
| `getProduct(id)`             | `GET /studio/products/:id`                  | –                                                             | `Product`                                                              | `NOT_FOUND`                                                  |
| `createProduct(input)`       | `POST /studio/products`                     | `ProductInput`                                                | `Product`                                                              | `VALIDATION`                                                 |
| `updateProduct(id, input)`   | `PUT /studio/products/:id`                  | `ProductInput`                                                | `Product`                                                              | `VALIDATION`, `NOT_FOUND`                                    |
| `setProductsStatus(ids, s)`  | `POST /studio/products/bulk-status`         | `{ ids, status }`                                             | `204`                                                                  | –                                                            |
| `deleteProducts(ids)`        | `POST /studio/products/bulk-delete`         | `{ ids }`                                                     | `204`                                                                  | –                                                            |
| `listOrders()`               | `GET /studio/orders`                        | –                                                             | `Order[]`                                                              | –                                                            |
| `updateOrderStatus(id, s)`   | `POST /studio/orders/:id/status`            | `{ status }`                                                  | `Order`                                                                | `CONFLICT` (illegal transition)                              |
| `listCustomers()`            | `GET /studio/customers`                     | –                                                             | `Customer[]`                                                           | –                                                            |
| `listReviews()`              | `GET /studio/reviews`                       | –                                                             | `Review[]`                                                             | –                                                            |
| `replyToReview(id, body)`    | `POST /studio/reviews/:id/reply`            | `{ body }`                                                    | `Review`                                                               | `VALIDATION`                                                 |
| `listPromos()`               | `GET /studio/promos`                        | –                                                             | `Promo[]`                                                              | –                                                            |
| `createPromo(input)`         | `POST /studio/promos`                       | `PromoInput`                                                  | `Promo`                                                                | `VALIDATION`, `CONFLICT` (code exists)                       |
| `updatePromo(id, patch)`     | `PATCH /studio/promos/:id`                  | `Partial<PromoInput>`                                         | `Promo`                                                                | `VALIDATION`                                                 |
| `deletePromo(id)`            | `DELETE /studio/promos/:id`                 | –                                                             | `204`                                                                  | –                                                            |

## Media: `services.media`

| Method            | Endpoint                                                             | Request                             | Response                                                       | Errors       |
| ----------------- | -------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------- | ------------ |
| `putImage(file)`  | `POST /uploads` (multipart) **or** presigned `PUT` to object storage | image ≤ 8MB, jpeg/png/webp/gif/avif | `{ id, ref: ImageRef }` (`{ kind: "url", src }` in production) | `VALIDATION` |
| `getImage(id)`    | – (served by CDN URL)                                                | –                                   | `Blob \| null`                                                 | –            |
| `deleteImage(id)` | `DELETE /uploads/:id`                                                | –                                   | `204`                                                          | –            |

## Realtime: `services.realtime`

| Method          | Endpoint                         | Notes                                                                              |
| --------------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| `subscribe(cb)` | websocket / SSE `GET /me/events` | Calls `cb` when anything the user can see changes. The mock listens to other tabs. |

## Dates

`range` is `{ from, to }` in local calendar days (`YYYY-MM-DD`, inclusive). Dashboards compare it with
the same number of days just before (`previousRange` in `domain/analytics.ts`).
