// ============================================================
// SITE CONFIG — edit these when you're ready to go live
// ============================================================

window.SITE_CONFIG = {
  // Paste your Paystack PUBLIC key here (starts with pk_live_ or pk_test_)
  // Get it from: Paystack Dashboard → Settings → API Keys & Webhooks
  // Payment credentials are intentionally not committed.
  // Wire this from your Vercel runtime/build environment when payments are enabled.
  PAYSTACK_PUBLIC_KEY: "",

  // Your deployed Manlung Gateway (the secure Node backend project) — once
  // this is set to your real Render/Railway URL, checkout redirects there
  // for real server-calculated pricing instead of the in-page popup.
  // Leave the placeholder in to keep using the in-page Paystack popup.
  // Set from Vercel when the secure payment gateway is enabled.
  GATEWAY_URL: "",

  // Currency Paystack will charge in. "KES" for Kenyan Shillings.
  CURRENCY: "KES",

  // Contact email customers can reach out to about an order
  SUPPORT_EMAIL: "adictmanlung@gmail.com",

  // Admin Portal login password. Change this to something only you know.
  // Note: since this is a static site with no server, this is a light deterrent
  // (like an unlisted door), not bank-grade security — anyone who really wants to
  // view your site's source code could find it. Don't reuse a password you use elsewhere.
  ADMIN_PASSWORD: "@Adictmanlung15073221",

  // ----------------------------------------------------------------
  // SUPABASE (makes admin edits visible to EVERY visitor, not just you;
  // also powers customer account login/signup across every device)
  // ----------------------------------------------------------------
  // Without this, admin edits only save to YOUR browser (localStorage) --
  // fine for previewing, but visitors on other devices won't see them.
  // To make edits go live for everyone:
  //  1. Go to https://supabase.com -> New project (free)
  //  2. Table Editor -> create a table called "manlung_products" with
  //     columns: id (int8, primary key) and data (jsonb)
  //  3. Project Settings -> API -> copy "Project URL" and "anon public" key
  //  4. Paste the values below
  // Until you do this, the site works fine using this-browser-only storage.
  SUPABASE_CONFIG: {
    url: "https://qpsiqaefsulqphsqkaau.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwc2lxYWVmc3VscXBoc3FrYWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMTAxNjYsImV4cCI6MjEwMDY4NjE2Nn0.ornxT6TBlTM4-DISP4SJlG3yKAOjDE6pHSBMLgfm-T0"
  },

  // ----------------------------------------------------------------
  // FIREBASE (optional BACKUP database, in case Supabase ever goes down)
  // ----------------------------------------------------------------
  // The site writes product data to BOTH Supabase and Firebase (when both
  // are configured) so if either one stops working, the other keeps the
  // site running. Reading prefers Supabase, falling back to Firebase
  // automatically if Supabase is unreachable.
  // Setup: https://console.firebase.google.com -> Create project (free) ->
  // Build -> Realtime Database -> Create Database -> start in TEST MODE ->
  // Project Settings -> General -> "Your apps" -> Add app (Web) -> copy config.
   FIREBASE_CONFIG: {
     apiKey: "AIzaSy...",
     authDomain: "manlung-shop.firebaseapp.com",
     databaseURL: "https://manlung-shop-default-rtdb.firebaseio.com",
     projectId: "manlung-shop",
     storageBucket: "manlung-shop.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   },
  // Rate Card image — clicking "Booking Rate Card" downloads this file directly.
  // IMPORTANT: use the DIRECT image link, not the postimg.cc viewer page.
  // On your postimg.cc page: click "Direct link" and copy that URL (looks like
  // https://i.postimg.cc/XXXXXXXX/filename.jpg) — paste it below.
  RATE_CARD_IMAGE_URL: "https://raw.githubusercontent.com/markchtechcomputers/galary-/main/WhatsApp%20Image%202026-07-29%20at%203.23.19%20PM.jpeg"
};
