// Product Data
const digitalProducts = [
  { id:1, title:"My Gee", price:1.99, imgUrl:"https://files.catbox.moe/ez3isw.png", purchaseUrl:"https://buy.stripe.com/test_cNi7sKfrWdBQ65a4TVgfu00", featured:false, stock:999 },
  { id:2, title:"Unfinished Business", price:1.99, imgUrl:"https://files.catbox.moe/0snz7n.png", purchaseUrl:"https://buy.stripe.com/test_3cI14m2FaeFUalq867gfu01", featured:false, stock:999 },
  { id:3, title:"Black Africa", price:4.99, imgUrl:"https://files.catbox.moe/7wugkl.png", purchaseUrl:"https://buy.stripe.com/test_fZu00i1B6dBQcty4TVgfu02", featured:true, stock:999 },
  { id:4, title:"Still Outside", price:1.99, imgUrl:"https://files.catbox.moe/qu7s1e.png", purchaseUrl:"https://buy.stripe.com/test_cNidR86Vq41g8di3PRgfu03", featured:false, stock:999 },
  { id:5, title:"Cold (Adict Manlung x Trecky)", price:1.99, imgUrl:"https://i.postimg.cc/6pZcW0kw/White-Modern-Minimal-Album-Cover-Mockup-Square-(11)-Made-with-Poster-My-Wall-(1).png", purchaseUrl:"https://buy.stripe.com/test_fZu4gyenS55keBG2LNgfu07", featured:false, stock:999 }
];

const cdProducts = [
  { id:5, title:"MANLUNG CD (Signed)", price:14.99, imgUrl:"https://files.catbox.moe/vzkm0u.png", purchaseUrl:"https://buy.stripe.com/test_aFa14mdjO8hwfFKfyzgfu04", featured:true, stock:47 },
  { id:6, title:"Money Bag Bundle", price:12.99, imgUrl:"https://files.catbox.moe/vzkm0u.png", purchaseUrl:"https://buy.stripe.com/test_8x24gy1B61T8eBG4TVgfu05", featured:true, stock:38 }
];

const merchItems = [
  { 
    id:101, 
    title:"Money Bag Hoodie", 
    price:49.99, 
    imgUrl:"https://files.catbox.moe/js0kqn.jpg", 
    description:"Premium heavyweight hoodie • Embroidered Money Bag logo • Soft cotton blend", 
    comingSoon:false,
    paymentUrl:"https://buy.stripe.com/test_cNieVc6VqbtI8di3PRgfu06",
    colors: [
      { name:"White", code:"#FFFFFF", border:"1px solid #ccc" },
      { name:"Black", code:"#111111", border:"none" },
      { name:"Blue", code:"#3B82F6", border:"none" },
      { name:"Red", code:"#EF4444", border:"none" },
      { name:"Green", code:"#10B981", border:"none" }
    ]
  },
  { id:102, title:"Manlung Tee", price:29.99, imgUrl:"https://placehold.co/600x600/1a1a1a/ffffff?text=TEE", description:"100% combed cotton • Screen printed design", comingSoon:true },
  { id:103, title:"Drip Cap", price:24.99, imgUrl:"https://placehold.co/600x600/1a1a1a/ffffff?text=CAP", description:"Structured snapback • Embroidered logo", comingSoon:true }
];

const testimonials = [
  { name:"@nairobigram", text:"Adict Manlung speaks for the streets. Best hip-hop from Kenya right now!", stars:5 },
  { name:"DJ Rufftone", text:"Raw energy, real lyrics. 'Money Bag' is a certified banger.", stars:5 }
];

const allProducts = [...digitalProducts, ...cdProducts];

// Export for use in other modules
window.productData = {
  digitalProducts,
  cdProducts,
  merchItems,
  testimonials,
  allProducts
};
