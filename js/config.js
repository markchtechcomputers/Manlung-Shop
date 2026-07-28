// ============================================================
// SITE CONFIG — edit these when you're ready to go live
// ============================================================

window.SITE_CONFIG = {
  // Paste your Paystack PUBLIC key here (starts with pk_live_ or pk_test_)
  // Get it from: Paystack Dashboard → Settings → API Keys & Webhooks
  PAYSTACK_PUBLIC_KEY: "pk_live_6fac23c23b199c93126e8b106cb191de266e26bc",

  // Your deployed Manlung Gateway (the secure Node backend project) — once
  // this is set to your real Render/Railway URL, checkout redirects there
  // for real server-calculated pricing instead of the in-page popup.
  // Leave the placeholder in to keep using the in-page Paystack popup.
  GATEWAY_URL: "https://REPLACE_WITH_YOUR_GATEWAY_URL.onrender.com",

  // Currency Paystack will charge in. "KES" for Kenyan Shillings.
  CURRENCY: "KES",

  // Contact email customers can reach out to about an order
  SUPPORT_EMAIL: "adictmanlung@gmail.com",

  // WhatsApp number used by the floating WhatsApp button (digits only, country code, no +)
  WHATSAPP_NUMBER: "254724356178",

  // ----------------------------------------------------------------
  // ADMIN PORTAL LOGIN
  // ----------------------------------------------------------------
  // Preferred: create ONE Supabase user for yourself (Supabase dashboard ->
  // Authentication -> Users -> Add user) and put its email here. admin.html then
  // logs in against Supabase, and the Supabase RLS policies (see README) only let
  // that signed-in user write to the catalog — so nobody can edit your products
  // by reading this file.
  ADMIN_EMAIL: "",

  // Fallback for offline/preview use only, when ADMIN_EMAIL is empty. This is a
  // PBKDF2-SHA256 hash of your password, NOT the password — never paste a plain
  // password here. Leave it empty and admin.html will walk you through creating
  // one on first load ("Set up admin password"), then paste the generated block here.
  // Reminder: with no server, a local-only password gate is a deterrent — anyone
  // determined can bypass the check in their own browser. Use ADMIN_EMAIL for real
  // protection of the shared catalog.
  ADMIN_PASSWORD_PBKDF2: null,

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
  //  5. IMPORTANT: turn on Row Level Security for that table and add the two
  //     policies from the README ("Supabase security"). The anon key below is
  //     public by design (every visitor downloads it) — RLS is the only thing
  //     stopping a stranger from rewriting your prices or download links.
  //     NEVER put the "service_role" key in this file.
  // Until you do this, the site works fine using this-browser-only storage.
  SUPABASE_CONFIG: {
    url: "https://qpsiqaefsulqphsqkaau.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwc2lxYWVmc3VscXBoc3FrYWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMTAxNjYsImV4cCI6MjEwMDY4NjE2Nn0.ornxT6TBlTM4-DISP4SJlG3yKAOjDE6pHSBMLgfm-T0"
  },
  // Rate Card image — clicking "Booking Rate Card" downloads this file directly.
  // IMPORTANT: use the DIRECT image link, not the postimg.cc viewer page.
  // On your postimg.cc page: click "Direct link" and copy that URL (looks like
  // https://i.postimg.cc/XXXXXXXX/filename.jpg) — paste it below.
  RATE_CARD_IMAGE_URL: "https://i.postimg.cc/REPLACE_WITH_DIRECT_LINK/rate-card.jpg"
};
