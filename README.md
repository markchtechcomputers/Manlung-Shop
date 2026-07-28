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
| `ADMIN_EMAIL` | Supabase user that `admin.html` logs in as — the only real protection for the shared catalog | Yes, if `SUPABASE_CONFIG` is set |
| `ADMIN_PASSWORD_PBKDF2` | Offline fallback gate for `admin.html` (a password **hash**, generated for you on first load) | Only when `ADMIN_EMAIL` is empty |
| `RATE_CARD_IMAGE_URL` | Direct image link for the downloadable tour rate card | Optional |

Never put a plain-text password, a Paystack **secret** key, or the Supabase **service_role**
key in `js/config.js` — every visitor downloads that file.

## Running it locally

No build step — it's plain HTML/CSS/JS. Just open `shop.html` (or `admin.html`) directly in a browser, or serve the folder with any static file server.

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

## Admin Portal security

There is no server here, so a password typed into `admin.html` can only be checked in
the browser. That means a browser-only check can always be bypassed by someone editing
the page in their own devtools. What actually protects the shop is **who is allowed to
write to Supabase**, so set the portal up like this:

1. Supabase dashboard → **Authentication → Users → Add user**: create one user for
   yourself with a long, unique password.
2. Put that user's email in `ADMIN_EMAIL` in `js/config.js`.
3. Apply the RLS policies below. Now `admin.html` signs in against Supabase, and only
   that signed-in user can change the catalog — reading `config.js` gets an attacker
   nothing.

With `ADMIN_EMAIL` empty (offline/preview use) the portal falls back to a local gate:
it checks the password against the PBKDF2 hash in `ADMIN_PASSWORD_PBKDF2`, and edits
never leave the browser. On first load it walks you through generating that hash — the
password itself is never stored in the repo, and there is no default password.

### Supabase security

The `anonKey` in `js/config.js` is public by design (every visitor downloads it), so
Row Level Security is the only thing stopping a stranger from rewriting your prices or
download links. In the Supabase SQL editor:

```sql
alter table public.manlung_products enable row level security;

-- Everyone may read the catalog
create policy "catalog is readable" on public.manlung_products
  for select using (true);

-- Only the signed-in admin user may change it
create policy "only admin writes" on public.manlung_products
  for all to authenticated
  using (auth.jwt() ->> 'email' = 'YOUR_ADMIN_EMAIL')
  with check (auth.jwt() ->> 'email' = 'YOUR_ADMIN_EMAIL');
```

Run the same check for any other table you add. If the anon key was ever used with RLS
off, rotate it (Project Settings → API → Rotate) after enabling the policies.

### Other things to keep in mind

- **Prices must be calculated server-side.** In popup mode the browser reports the
  amount to Paystack, so a visitor can pay whatever they like. Deploy the Gateway and
  set `GATEWAY_URL` before selling anything meaningful.
- **Third-party scripts.** `supabase-js` is pinned to an exact version with an SRI hash;
  Paystack's `inline.js` and the Bandsintown widget are unversioned URLs, so they can't
  be pinned — they are trusted by their origin only, via the Content-Security-Policy in
  each page's `<head>`. If you add another external script you must add its origin to
  that CSP or the browser will block it.
- **Product text and URLs are treated as untrusted.** Anything from the Admin Portal or
  Supabase is HTML-escaped and URL-checked (`js/security.js`) before rendering, so a
  `javascript:` link or `<script>` in a product title can't run.
