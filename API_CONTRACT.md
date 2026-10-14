# API contract

Every method of the service layer (`src/services/contracts.ts`): what it takes, returns and
refuses. The UI only talks to these interfaces. Two implementations exist:

- **`mock`**: the service code in `src/services/mock` runs in the browser against IndexedDB (one
  person's device). Used for local development and most unit tests.
- **`remote`** (the real backend): the **same service code** runs on the server against Postgres,
  shared by everyone. `src/services/remote` is a thin browser client; `src/server` holds the
  database, sessions and route handlers. Set `NEXT_PUBLIC_DATA_SOURCE=remote` and `DATABASE_URL`.

## Transport (remote)

| Route                   | What                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `POST /api/rpc`         | `{ service, method, args }` → `{ data, seq }`. One call of any method below except `media`.    |
| `POST /api/media`       | Raw image body (`image/jpeg\|png\|webp\|gif\|avif`, ≤ 4MB; the browser shrinks bigger photos). |
| `GET /api/media/:id`    | The image, cached forever (ids are never reused).                                              |
| `DELETE /api/media/:id` | Only by whoever uploaded it.                                                                   |
| `GET /api/sync`         | `{ seq }`: the newest change. Open tabs poll it every 20s and refetch when it moves.           |

- **Auth:** HTTP-only, `SameSite=Lax` session cookie (`kamplug_session`, 30 days). Only a SHA-256
  hash of its token is stored (`kamplug_sessions`). `signIn`/`signUp`/`startPreview` and Google
  sign-in set it, `signOut`/`deleteAccount` clear it.
- **Google sign-in:** Better Auth handles the trip to Google; Kamplug then takes the verified email
  and signs the person in (creating the account on first visit). Invite-only still applies: an
  email not on the list is sent back to `/login?error=not_invited`. If someone had signed up with
  a password for that email, the password is removed, because Google has now proved who owns it.
  Google-only accounts confirm account deletion by typing their email.
- **Same site only:** requests whose `Origin` isn't this site get `403`. Sign-in, sign-up and
  account deletion allow 10 attempts a minute per address.
- **Never sent:** password hashes and salts are stripped from every response.
- **The preview account** (sample data) is shared by every visitor, so it can look at everything
  but change nothing: any call that would save a change gets `403 FORBIDDEN` with a message saying
  so. Its product views aren't recorded.
- **Money:** always integer **kobo** (`number`). Never floats.
- **Dates:** ISO-8601 strings in UTC.
- **Types:** request and response shapes refer to `src/services/types.ts`; input schemas are the Zod
  schemas in `src/services/inputs.ts`.
- **Errors:** JSON `{ "error": { "code": ServiceErrorCode, "message": string, "fields"?: Record<string,string> } }`.

The **Endpoint** column in the tables below is the REST shape each method would take if the API is
ever split into resources (for a mobile app, say). Today every method goes through `/api/rpc`.

| `code`            | HTTP | Meaning                                                            |
| ----------------- | ---- | ------------------------------------------------------------------ |
| `VALIDATION`      | 422  | Input failed the Zod schema; `fields` maps field → message         |
| `UNAUTHORIZED`    | 401  | Not signed in / bad credentials                                    |
| `FORBIDDEN`       | 403  | Signed in but not allowed (e.g. no shop, own product)              |
| `NOT_FOUND`       | 404  | Resource missing or not visible to caller                          |
| `CONFLICT`        | 409  | State conflict (taken handle, sold out, illegal order transition)  |
| `UNAVAILABLE`     | 503  | Database not connected, a feature not switched on, or rate limited |
| `NOT_IMPLEMENTED` | 501  | Not used by the server today                                       |

List endpoints return `Page<T> = { items, total, page, pageSize, hasMore }` where noted.

---

## Auth: `services.auth`

| Method                        | Endpoint                       | Request                                                  | Response                                  | Errors                                                                    |
| ----------------------------- | ------------------------------ | -------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `getSession()`                | `GET /auth/session`            | –                                                        | `User \| null`                            | –                                                                         |
| `signUp(input)`               | `POST /auth/signup`            | `SignUpInput { name, email, password }`                  | `User` (sets cookie)                      | `VALIDATION`, `CONFLICT` (email taken)                                    |
| `signIn(input)`               | `POST /auth/login`             | `SignInInput { email, password }`                        | `User` (sets cookie)                      | `VALIDATION`, `UNAUTHORIZED`                                              |
| `signOut()`                   | `POST /auth/logout`            | –                                                        | `204`                                     | –                                                                         |
| `startPreview()`              | `POST /auth/preview`           | –                                                        | `User` (sets cookie)                      | `UNAVAILABLE` (sample data off; drop with the sample data)                |
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
