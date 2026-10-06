# haritaabha

Online plant store for an Indian nursery — storefront, cart, checkout (Razorpay + cash on delivery), customer accounts with Google sign-in, admin panel, and pan-India shipping through Shiprocket.

Built with Next.js 16 (App Router), MongoDB/Mongoose, Better Auth, Tailwind CSS v4.

## Run locally

```bash
cp .env.example .env.local      # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
docker compose up -d            # MongoDB replica set on :27017
npm install
npm run seed                    # demo catalogue + admin (ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev                     # http://localhost:3000   ·   admin at /admin
```

Without Razorpay / Shiprocket / ImageKit / Google keys the app runs in **demo mode**: payments open a "test payment" dialog, shipments get a demo AWB, uploads are saved to `public/uploads`, and the Google button is hidden. The admin panel shows which integrations are still missing.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` / `lint` | Checks |
| `npm run seed` | Upsert demo categories/products (all `isDemo: true`) and the first admin |
| `npm run seed:clear` | Delete all demo data (run before go-live, then delete `public/demo`) |
| `npm run admin:set` | Make `ADMIN_EMAIL` / `ADMIN_PASSWORD` the admin (creates the account or resets its password) |
| `npm run admin:create -- email@x.com` | Give an existing account admin access (`--remove` to revoke) |

## Going live

1. Create accounts: Razorpay (KYC), Shiprocket (KYC, pickup address, API user), Google Cloud OAuth client, ImageKit, MongoDB Atlas.
2. Create a Vercel project and set every variable from `.env.example`. Paste values as-is in Vercel; quoting and `\$` escaping are only needed in a local `.env.local`.
3. Razorpay → Webhooks: `https://<domain>/api/webhooks/razorpay`, events `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`, secret → `RAZORPAY_WEBHOOK_SECRET`.
4. Shiprocket → Settings → API → Webhooks: `https://<domain>/api/webhooks/courier`, token → `SHIPROCKET_WEBHOOK_TOKEN`.
5. Google OAuth redirect URI: `https://<domain>/api/auth/callback/google`.
6. Set the pickup pincode and support details in **Admin → Settings**.
7. `npm run admin:set` with the real admin email/password, then `npm run seed:clear`, delete `public/demo`, add real products.
