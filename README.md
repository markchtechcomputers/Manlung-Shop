# Manlung Shop

Official online store for Kenyan independent hip-hop artist **Adict Manlung** — digital singles, physical CDs, merchandise, and tour tickets, with a full Admin Portal and a secure payment backend.

This repo is the **storefront**. Payments are processed by a separate project, **Manlung Gateway** (its own repo — see "Payments" below).

---

## What's in here

```
manlung-shop/
├── shop.html              # The storefront customers see (rename to index.html when ready to go live)
├── admin.html             # Your dashboard — add/edit products, CDs, merch, tour tickets
├── favicon.svg            # Site icon
├── css/
│   └── styles.css         # All styling
├── js/
│   ├── config.js          # ⚙️ EDIT THIS — Paystack key, Gateway URL, Firebase, admin password
│   ├── data-store.js      # Loads/saves product data (Firebase if configured, else this browser only)
│   ├── currency.js        # Country/currency detection, picker, conversion
│   ├── paystack.js        # Checkout logic — routes to the Gateway if set up, else an in-page popup
│   ├── cart.js             # Shopping cart
│   ├── render.js          # Draws product/CD/merch cards from the data
│   ├── tour.js            # Tour ticket purchase + ticket image generation
│   ├── menu.js            # Slide-out menu: newsletter, account login, policy pages, country search
│   ├── admin.js           # Powers admin.html
│   └── countdown.js       # (optional) countdown widget for release dates, unused by default
└── data/
    ├── products.js        # DEFAULT product data (Admin Portal edits override this at runtime)
    └── countries.js       # Country/currency list with flags
```

## First-time setup

Open `js/config.js` and fill in:

| Setting | What it's for | Required? |
|---|---|---|
| `PAYSTACK_PUBLIC_KEY` | Fallback in-page payment popup | Only if you're **not** using the Gateway |
| `GATEWAY_URL` | Your deployed Manlung Gateway URL | Recommended — real server-calculated pricing |
| `SUPABASE_CONFIG` | Makes Admin edits visible to every visitor, not just your browser; also powers cross-device customer accounts | Optional but recommended |
| `ADMIN_PASSWORD` | Password for `admin.html` | Yes — change the default! |
| `RATE_CARD_IMAGE_URL` | Direct image link for the downloadable tour rate card | Optional |

## Running it locally

No build step — it's plain HTML/CSS/JS. Just open `shop.html` (or `admin.html`) directly in a browser, or serve the folder with any static file server.

## Running the tests

The storefront still needs no build step; the tests are the only thing that uses npm.

```bash
npm install        # one time
npm test           # run every unit test
npm run test:watch # re-run tests as you edit
npm run test:coverage
```

The tests run in [Vitest](https://vitest.dev/) with a jsdom browser stand-in. Each
file in `js/` is loaded exactly the way the browser loads it and then driven
through the `window.*` API it publishes (`window.cartFunctions`,
`window.currencyFunctions`, ...), so tests need no changes to the site's code.
Shared setup lives in `tests/helpers/harness.js`.

## Managing products

You almost never need to hand-edit `data/products.js` anymore — use the **Admin Portal** (`admin.html`) instead:
- Add/edit/delete digital tracks, CDs, merch
- Set descriptions, features, sold-out status, images
- CDs: add a full tracklist (title + audio URL per track) — this is what auto-downloads after purchase
- Click **Export products.js** any time to download an updated copy of the raw data file

**Important:** if you've deployed the Gateway, its `products.js` is a **separate file** with its own copy of prices (this is intentional — it's what makes checkout tamper-proof). Whenever you change a product/price in the Admin Portal, update the matching entry in the Gateway's `products.js` too, and redeploy the Gateway. Otherwise checkout for that item will fail or charge the old price.

## Payments

Two ways checkout can work:

1. **Gateway mode (recommended)** — set `GATEWAY_URL` in `js/config.js` to your deployed Manlung Gateway. Checkout redirects there, the server calculates the real price from its own trusted catalog, opens Paystack's hosted checkout, verifies the payment, and sends the customer back here — where their download starts automatically, or they see a shipping confirmation.
2. **Popup mode (fallback)** — if no Gateway is set, checkout opens Paystack's in-page popup directly using `PAYSTACK_PUBLIC_KEY`. Works, but trusts the browser to report the price.

## Deploying

1. Rename `shop.html` to `index.html` when you're ready to replace the maintenance page.
2. Push to GitHub:
   ```
   git add -A
   git commit -m "Update site"
   git push origin main
   ```
3. If hosted on GitHub Pages, it auto-publishes within a minute. Other static hosts (Netlify, Vercel) — re-upload the same way.
4. `admin.html` lives in the same folder — once deployed it's reachable at `yourdomain.com/admin.html`.

## Admin Portal security note

Since this is a static site with no server, the admin password check happens in the browser — it's a light deterrent (like an unlisted door), not bank-grade security. Don't reuse a password you use elsewhere.
