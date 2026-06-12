# 🎵 Adict Manlung Official Store

**Professional Hip-Hop Artist Store & Tour Management System**

![Adict Manlung](https://files.catbox.moe/19z48q.png)

> Official online store for Kenyan independent hip-hop artist **Adict Manlung**. Features digital music sales, physical CDs, merchandise, and a complete tour ticket system with automated ticket generation.

## ✨ Features

### 🛍️ **E-Commerce**
- **Digital Singles**: Direct purchase of MP3 tracks
- **Physical CDs**: Signed CDs with limited stock indicators  
- **Merchandise**: Hoodies, tees, and accessories with color/size selection
- **Shopping Cart**: Persistent cart with localStorage
- **Secure Checkout**: Stripe integration with multiple payment options

### 🎫 **Tour Management**
- **Interactive Ticket System**: REGULAR, VIP, VVIP tier selection
- **Automated Ticket Generation**: Custom canvas-based ticket creation
- **Payment Integration**: Secure payment processing
- **Ticket Downloads**: PNG download with QR code placeholder
- **Background Slideshow**: Rotating scenic images

### 📱 **Responsive Design**
- Mobile-first responsive layout
- Touch-friendly navigation
- Optimized for all screen sizes
- Professional dark theme with subtle animations

### 🔧 **Technical Features**
- Modular code architecture (HTML/CSS/JS separation)
- Persistent cart with localStorage
- Email capture for newsletter
- WhatsApp integration for direct contact
- Toast notifications for user feedback
- Section-based navigation

## 🏗️ Project Structure

```
Manlung-Shop/
├── index.html              # Main HTML file
├── README.md               # This documentation
├── css/
│   └── styles.css          # All styling (19KB)
├── js/
│   ├── app.js             # Main application initialization
│   ├── cart.js            # Cart management system
│   ├── render.js          # UI rendering functions  
│   └── tour.js            # Tour ticket system
└── data/
    └── products.js        # Product data (easy to edit!)
```

## 🚀 Getting Started

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/markchtechcomputers/Manlung-Shop.git
   ```
2. Open `index.html` in your browser
3. No build process required - works directly!

### File Organization
- **Update products?** → Edit `data/products.js`
- **Change styling?** → Edit `css/styles.css`
- **Modify cart logic?** → Edit `js/cart.js`
- **Update tour system?** → Edit `js/tour.js`
- **Add new features?** → Edit `js/app.js`

## 📦 Product Management

Edit `data/products.js` to update products:

```javascript
// Example product structure
const digitalProducts = [
  {
    id: 1,
    title: "My Gee",
    price: 1.99,
    imgUrl: "https://files.catbox.moe/ez3isw.png",
    purchaseUrl: "https://buy.stripe.com/test_cNi7sKfrWdBQ65a4TVgfu00",
    featured: false,
    stock: 999
  }
  // Add more products here...
];
```

## 🎨 Customization

### Colors & Theme
The dark theme uses a sophisticated color palette:
- Primary: `#0a0a0a` (background)
- Accent: `#FFD966` (gold highlights)
- Text: `#e8e8e8` (off-white)
- Cards: `rgba(255,255,255,0.02)` with subtle borders

### Fonts
- **Primary**: Inter (clean, modern sans-serif)
- **Headings**: Poppins (bold, attention-grabbing)
- **Code/Monospace**: Courier New, monospace

## 💳 Payment Integration

### Stripe Test Mode
Currently uses Stripe test links (`buy.stripe.com/test_*`). To go live:

1. Replace test links in `data/products.js` with live Stripe payment links
2. Update tour ticket payment URLs in `index.html`
3. Configure real M-Pesa details in `js/cart.js` (line with `123456` placeholder)

### Payment Methods
- Stripe (credit/debit cards)
- M-Pesa (Kenyan mobile money)
- Direct bank transfer options

## 🔒 Security Features

- **Cart Persistence**: localStorage with JSON serialization
- **Payment Security**: External Stripe/M-Pesa gateways
- **Form Validation**: Client-side validation for tour tickets
- **Session Management**: Payment flow tracking with sessionStorage

## 📱 Mobile Optimization

- Responsive grid layouts (`grid-template-columns: repeat(auto-fill, minmax(...))`)
- Touch-friendly buttons (minimum 44px touch targets)
- Mobile-first media queries
- Optimized image loading with `loading="lazy"`

## 🚀 Deployment

### GitHub Pages (Recommended)
1. Push to GitHub repository
2. Go to Settings → Pages
3. Select main branch and `/root` folder
4. Your site will be available at `https://username.github.io/Manlung-Shop/`

### Custom Domain
1. Update CNAME record to point to GitHub Pages
2. Add `CNAME` file with your domain
3. Configure in GitHub Pages settings

## 🔧 Troubleshooting

### Common Issues

1. **Cart not saving?**
   - Check localStorage permissions
   - Ensure JSON parsing/serialization works

2. **Images not loading?**
   - Verify image URLs in `data/products.js`
   - Check CORS permissions on external hosts

3. **Payment links not working?**
   - Test links are for development only
   - Replace with live payment links for production

4. **Ticket canvas not showing?**
   - Canvas height fixed to 530px (was 420px)
   - Check browser console for JavaScript errors

### Browser Support
- Chrome 60+ ✅
- Firefox 55+ ✅  
- Safari 12+ ✅
- Edge 79+ ✅

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is the official property of **Adict Manlung**. All rights reserved.

## 📞 Contact

**Adict Manlung**
- Email: adictmanlung@gmail.com
- WhatsApp: +254 724 356 178
- YouTube: [Money Bag Official Video](https://www.youtube.com/watch?v=Is2A5T_Fcoo)

---

*"Raw voice from the streets, painting vivid pictures of struggle, ambition, and growth."* - Adict Manlung