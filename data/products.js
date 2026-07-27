// Product Data
// NOTE: No payment links here anymore -- every purchase (digital, CD, merch, tour)
// now goes through the single Paystack checkout system in js/paystack.js.
// Prices are in whole KSh.
// You normally won't need to hand-edit this file anymore -- use the Admin
// Portal (admin.html) to add/update products, CDs, and merch instead.
// This file only defines the DEFAULTS the site falls back to.

const digitalProducts = [
  { id:1, title:"My Gee", price:199, unit:"per track", description:"Official digital single from Adict Manlung.", features:["Instant download","MP3 320kbps"], imgUrl:"https://placehold.co/600x600/0b2a6b/ffffff?text=My+Gee", featured:false, stock:999, soldOut:false, downloadUrl:"" },
  { id:2, title:"Unfinished Business", price:199, unit:"per track", description:"Official digital single from Adict Manlung.", features:["Instant download","MP3 320kbps"], imgUrl:"https://placehold.co/600x600/0b2a6b/ffffff?text=Unfinished+Business", featured:false, stock:999, soldOut:false, downloadUrl:"" },
  { id:3, title:"Black Africa", price:499, unit:"per track", description:"Official digital single from Adict Manlung.", features:["Instant download","MP3 320kbps"], imgUrl:"https://placehold.co/600x600/0b2a6b/FFD700?text=Black+Africa", featured:true, stock:999, soldOut:false, downloadUrl:"" },
  { id:4, title:"Still Outside", price:199, unit:"per track", description:"Official digital single from Adict Manlung.", features:["Instant download","MP3 320kbps"], imgUrl:"https://placehold.co/600x600/0b2a6b/ffffff?text=Still+Outside", featured:false, stock:999, soldOut:false, downloadUrl:"" },
  { id:5, title:"Cold (Adict Manlung x Trecky)", price:299, unit:"per track", description:"Collab single with Trecky.", features:["Instant download","MP3 320kbps"], imgUrl:"https://placehold.co/600x600/123a8c/FFD700?text=Cold", featured:true, stock:999, soldOut:false, downloadUrl:"" },
  { id:6, title:"Money Bag", price:199, unit:"per track", description:"Official digital single from Adict Manlung.", features:["Instant download","MP3 320kbps"], imgUrl:"https://placehold.co/600x600/16213e/ffffff?text=Money+Bag", featured:false, stock:999, soldOut:false, downloadUrl:"" }
];

const cdProducts = [
  { id:7, title:"MANLUNG CD (Signed)", price:1499, unit:"per CD", description:"Signed physical CD copy, delivered to your door.", features:["Signed by the artist","Free Nairobi delivery"], imgUrl:"https://placehold.co/600x600/0b2a6b/ffffff?text=Manlung+CD", audioUrl:"", tracks:[], featured:true, stock:47, soldOut:false },
  { id:8, title:"Money Bag Bundle", price:1299, unit:"per bundle", description:"Physical CD bundle featuring Money Bag and more.", features:["Limited run","Free Nairobi delivery"], imgUrl:"https://placehold.co/600x600/0b2a6b/ffffff?text=Manlung+CD", audioUrl:"", tracks:[], featured:true, stock:38, soldOut:false }
];

const merchItems = [
  {
    id:101,
    title:"Money Bag Hoodie",
    price:4999,
    unit:"per hoodie",
    imgUrl:"https://placehold.co/600x600/16213e/ffffff?text=Money+Bag+Hoodie",
    description:"Premium heavyweight hoodie - Embroidered Money Bag logo - Soft cotton blend",
    features:["Heavyweight cotton blend","Embroidered logo","True to size"],
    comingSoon:false,
    soldOut:false,
    sizes:["S","M","L","XL","XXL"],
    colors: [
      { name:"White", code:"#FFFFFF", border:"1px solid #ccc" },
      { name:"Black", code:"#111111", border:"none" },
      { name:"Blue", code:"#3B82F6", border:"none" },
      { name:"Red", code:"#EF4444", border:"none" },
      { name:"Green", code:"#10B981", border:"none" }
    ]
  },
  { id:102, title:"Manlung Tee", price:2999, unit:"per tee", imgUrl:"https://placehold.co/600x600/1a1a1a/ffffff?text=TEE", description:"100% combed cotton - Screen printed design", features:["100% combed cotton","Screen printed"], comingSoon:true, soldOut:false, sizes:["S","M","L","XL"], colors:[] },
  { id:103, title:"Drip Cap", price:2499, unit:"per cap", imgUrl:"https://placehold.co/600x600/1a1a1a/ffffff?text=CAP", description:"Structured snapback - Embroidered logo", features:["Structured fit","Embroidered logo"], comingSoon:true, soldOut:false, sizes:["One Size"], colors:[] },
  { id:104, title:"Money Bag Chain", price:3499, unit:"per piece", imgUrl:"https://placehold.co/600x600/1a1a1a/ffffff?text=JEWELRY", description:"Stainless steel chain with Money Bag pendant - Tarnish resistant - Everyday streetwear jewelry piece", features:["Stainless steel","Tarnish resistant","Adjustable length"], comingSoon:true, soldOut:false, sizes:[], colors:[] }
];

const testimonials = [
  { name:"@nairobigram", text:"Adict Manlung speaks for the streets. Best hip-hop from Kenya right now!", stars:5 },
  { name:"DJ Rufftone", text:"Raw energy, real lyrics. Money Bag is a certified banger.", stars:5 },
  { name:"@mombasa_vibes", text:"Been following since the first single. The growth in every project is real.", stars:5 },
  { name:"Kelele Radio", text:"Adict Manlung is one of the most consistent independent artists coming out of Kenya right now.", stars:5 }
];

const allProducts = [...digitalProducts, ...cdProducts];

// Export for use in other modules (data-store.js will override this with
// saved admin edits, if any exist, right after this file loads)
window.productData = {
  digitalProducts,
  cdProducts,
  merchItems,
  testimonials,
  allProducts
};
