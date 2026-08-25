// Tour Ticket System
let currentTicketType = "";
let currentPrice = 0;
let paymentCompleted = false;
let ticketGenerated = false;
let ticketDownloaded = false;
let userDetails = { name: "", id: "", phone: "" };

const colorSchemes = {
  REGULAR: {
    mainGrad: ["#0b2b44", "#123d66"],
    accent: "#3b82f6",
    typeColor: "#a5d8ff",
    priceColor: "#facc15",
    borderColor: "#3b82f6",
    textAccent: "#b3e0ff"
  },
  VIP: {
    mainGrad: ["#0a3a2a", "#0e5e3e"],
    accent: "#22c55e",
    typeColor: "#bbf7d0",
    priceColor: "#fde047",
    borderColor: "#4ade80",
    textAccent: "#bbf0aa"
  },
  VVIP: {
    mainGrad: ["#4a0e0e", "#7a2020"],
    accent: "#ef4444",
    typeColor: "#fecaca",
    priceColor: "#ffb347",
    borderColor: "#f97316",
    textAccent: "#ffcf9a"
  }
};

const LOGO_URL = "https://placehold.co/80x80/16213e/FFD700?text=M";
let logoImage = new Image();
logoImage.crossOrigin = "Anonymous";
let logoLoaded = false;
logoImage.onload = () => { logoLoaded = true; };
logoImage.onerror = () => { logoLoaded = false; };
logoImage.src = LOGO_URL;

function getTicketDownloadUrl(ticketType) {
  const shows = window.productData.tourShows || [];
  for (const show of shows) {
    const t = (show.ticketTypes || []).find(tt => tt.type === ticketType);
    if (t && t.downloadUrl) return t.downloadUrl;
  }
  return "";
}

function showDetailsPanelAutomatically(ticketType, price) {
  const detailsPanel = document.getElementById("detailsForm");
  if (!detailsPanel) return;

  // If admin has set a ticket download URL, the download is handled
  // by paystack.js — this fallback only runs for the popup path without a URL.
  const downloadUrl = getTicketDownloadUrl(ticketType);
  if (downloadUrl) {
    window.cartFunctions?.showToast("✅ Payment successful — downloading your ticket...");
    setTimeout(() => {
      window.paystackCheckoutFunctions?.triggerDownload(downloadUrl, `adict_${ticketType.toLowerCase()}_ticket`);
    }, 500);
    return;
  }

  detailsPanel.style.display = "block";
  paymentCompleted = true;
  currentTicketType = ticketType;
  currentPrice = price;
  document.getElementById("fullName").value = "";
  document.getElementById("idNumber").value = "";
  document.getElementById("phoneNumber").value = "";
  document.getElementById("generateTicketBtn").disabled = false;
  document.getElementById("generateTicketBtn").innerText = "✨ Generate My Ticket ✨";
  detailsPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}

function checkPaymentReturn() {
  const paymentInitiated = sessionStorage.getItem("paymentInitiated");
  const pendingType = sessionStorage.getItem("pendingTicketType");
  const pendingPrice = sessionStorage.getItem("pendingTicketPrice");

  if (paymentInitiated === "true" && pendingType && pendingPrice) {
    sessionStorage.removeItem("paymentInitiated");
    sessionStorage.removeItem("pendingTicketType");
    sessionStorage.removeItem("pendingTicketPrice");
    showDetailsPanelAutomatically(pendingType, parseInt(pendingPrice));
    currentTicketType = pendingType;
    currentPrice = parseInt(pendingPrice);
  } else {
    const detailsPanel = document.getElementById("detailsForm");
    if (detailsPanel) detailsPanel.style.display = "none";
  }
}

function generateLandscapeTicket() {
  const canvas = document.getElementById("ticketCanvas");
  const generateBtn = document.getElementById("generateTicketBtn");

  if (!canvas || !generateBtn) return;

  canvas.width = 850;
  canvas.height = 530;
  const ctx = canvas.getContext("2d");
  const scheme = colorSchemes[currentTicketType];

  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, scheme.mainGrad[0]);
  grad.addColorStop(1, scheme.mainGrad[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = scheme.borderColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
  ctx.strokeStyle = "#FFD966";
  ctx.lineWidth = 2;
  ctx.strokeRect(21, 21, canvas.width - 42, canvas.height - 42);

  if (logoLoaded && logoImage.complete && logoImage.naturalWidth > 0) {
    try { ctx.drawImage(logoImage, 25, 25, 80, 80); } catch(e) {}
  } else {
    ctx.font = "bold 16px monospace";
    ctx.fillStyle = "#FFD966";
    ctx.fillText("ADICT", 30, 60);
  }

  ctx.font = "bold 30px 'Poppins', 'Arial Black'";
  ctx.fillStyle = "#FFF2D0";
  ctx.shadowBlur = 3;
  ctx.fillText("ADICT MANLUNG LIVE", canvas.width/2 - 145, 70);
  ctx.font = "18px 'Segoe UI'";
  ctx.fillStyle = "#F5D742";
  ctx.fillText("OFFICIAL TOUR TICKET", canvas.width/2 - 110, 108);

  ctx.font = "bold 42px 'Arial Black'";
  ctx.fillStyle = scheme.typeColor;
  ctx.fillText(currentTicketType, 170, 190);
  ctx.font = "bold 34px monospace";
  ctx.fillStyle = scheme.priceColor;
  ctx.fillText(`KSh ${currentPrice.toLocaleString()}`, canvas.width - 250, 190);

  ctx.beginPath();
  ctx.moveTo(155, 210);
  ctx.lineTo(canvas.width - 170, 210);
  ctx.strokeStyle = "#FFC857";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.font = "bold 16px 'Segoe UI'";
  ctx.fillStyle = "#DDDDDD";
  ctx.fillText("🎟️ TICKET HOLDER", 50, 265);
  ctx.font = "bold 22px monospace";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(userDetails.name.slice(0, 32), 50, 300);

  ctx.font = "14px 'Segoe UI'";
  ctx.fillStyle = "#CCCCCC";
  ctx.fillText("ID NUMBER", 50, 345);
  ctx.font = "bold 18px monospace";
  ctx.fillStyle = scheme.textAccent;
  ctx.fillText(userDetails.id.slice(0, 26), 50, 378);

  ctx.fillStyle = "#CCCCCC";
  ctx.fillText("📞 PHONE", 50, 420);
  ctx.fillStyle = scheme.textAccent;
  ctx.fillText(userDetails.phone.slice(0, 20), 50, 452);

  const ticketRef = "ML" + Math.floor(Math.random() * 100000000).toString().slice(0, 7);
  ctx.font = "bold 13px 'Courier New'";
  ctx.fillStyle = "#FFD966";
  ctx.fillText("✓ TRANSACTION VERIFIED", canvas.width - 210, 265);
  ctx.font = "bold 18px monospace";
  ctx.fillStyle = "#FDEA9F";
  ctx.fillText(ticketRef, canvas.width - 210, 300);
  ctx.font = "12px monospace";
  ctx.fillStyle = "#CCCCCC";
  ctx.fillText("Paystack Verified", canvas.width - 210, 345);
  ctx.fillStyle = "#4ADE80";
  ctx.fillText("✓ PAID", canvas.width - 210, 378);
  ctx.fillStyle = "#FFB347";
  ctx.font = "11px monospace";
  ctx.fillText(`Ref: ${ticketRef}`, canvas.width - 210, 412);

  ctx.font = "bold 12px 'Segoe UI'";
  ctx.fillStyle = "#FACC15";
  ctx.fillText("📍 VENUE & TIME SENT VIA EMAIL", 110, 480);
  ctx.font = "11px monospace";
  ctx.fillStyle = "#FFE484";
  ctx.fillText("KEEP THIS TICKET — PRESENT IT AT THE DOOR", 150, 505);

  ctx.fillStyle = "#FFF2D7";
  ctx.fillRect(canvas.width - 120, 440, 58, 58);
  ctx.fillStyle = "#1F1A0C";
  for(let s=0; s<3; s++) {
    ctx.fillRect(canvas.width - 112 + s*15, 449, 7, 7);
    ctx.fillRect(canvas.width - 112 + s*15, 473, 7, 7);
    ctx.fillRect(canvas.width - 112, 462 + s*8, 7, 7);
    ctx.fillRect(canvas.width - 92, 462 + s*8, 7, 7);
  }
  ctx.fillStyle = "#D4AF37";
  ctx.font = "10px monospace";
  ctx.fillText("SCAN", canvas.width-98, 515);

  ctx.globalAlpha = 0.12;
  ctx.font = "bold 38px 'Arial'";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("MANLUNG", canvas.width/2 - 85, 310);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  canvas.style.display = "block";
  document.getElementById("downloadFinalBtn").style.display = "inline-block";
  ticketGenerated = true;
  generateBtn.disabled = true;
  generateBtn.innerText = "✓ Ticket Created";

  canvas.scrollIntoView({ behavior: "smooth", block: "center" });
}

function initRateCardDownload() {
  const btn = document.getElementById("rateCardBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const url = window.SITE_CONFIG?.RATE_CARD_IMAGE_URL;

    if (!url || url.includes("REPLACE_WITH")) {
      window.cartFunctions?.showToast("Rate card isn't set up yet — add the DIRECT image link in js/config.js");
      return;
    }

    const looksLikeDirectImage = /^https?:\/\/i\.postimg\.sc\/.*\.(jpg|jpeg|png|webp|gif)$/i.test(url) || /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
    if (!looksLikeDirectImage) {
      window.cartFunctions?.showToast("⚠️ That's a postimg.cc page link, not the direct image — open the image on postimg.cc, click 'Direct link', and paste THAT url (ends in .jpg/.png) into js/config.js");
      return;
    }

    window.cartFunctions?.showToast("Downloading rate card...");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "Adict-Manlung-Rate-Card.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.cartFunctions?.showToast("Couldn't auto-download (host blocked it) — opening image, use Save Image instead");
      window.open(url, "_blank");
    }
  });
}

function refreshTicketCards() {
  const payBtns = document.querySelectorAll(".pay-btn");
  payBtns.forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  setupTourEvents();
}

function setupTourEvents() {
  const detailsPanel = document.getElementById("detailsForm");
  const generateBtn = document.getElementById("generateTicketBtn");
  const downloadBtn = document.getElementById("downloadFinalBtn");
  const canvas = document.getElementById("ticketCanvas");

  if (!detailsPanel || !generateBtn || !downloadBtn || !canvas) return;

  document.querySelectorAll(".pay-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (ticketGenerated && !ticketDownloaded) {
        window.cartFunctions?.showToast("⚠️ You already have an active ticket. Please download it first.");
        return;
      }
      if (ticketDownloaded) {
        ticketGenerated = false;
        ticketDownloaded = false;
        canvas.style.display = "none";
        downloadBtn.style.display = "none";
      }
      const type = btn.getAttribute("data-ticket");
      const price = parseInt(btn.getAttribute("data-price"));
      const downloadUrl = btn.getAttribute("data-download-url") || "";
      const ticketProductIds = { REGULAR: 201, VIP: 202, VVIP: 203 };

      window.paystackCheckoutFunctions.checkout({
        amount: price,
        items: [{ id: ticketProductIds[type], quantity: 1 }],
        label: `Adict Manlung Tour Ticket — ${type}`,
        needsShipping: false,
        isPhysical: false,
        downloadItems: [],
        ticketType: type,
        ticketPrice: price,
        ticketDownloadUrl: downloadUrl,
        metadata: {
          custom_fields: [
            { display_name: "Ticket Type", variable_name: "ticket_type", value: type }
          ]
        },
        onSuccess: () => {
          if (downloadUrl) {
            window.cartFunctions?.showToast("✅ Payment successful — downloading your ticket...");
            setTimeout(() => {
              window.paystackCheckoutFunctions?.triggerDownload(downloadUrl, `adict_${type.toLowerCase()}_ticket`);
            }, 500);
          } else {
            showDetailsPanelAutomatically(type, price);
          }
        }
      });
    });
  });

  generateBtn.addEventListener("click", () => {
    const name = document.getElementById("fullName").value.trim();
    const idVal = document.getElementById("idNumber").value.trim();
    const phoneVal = document.getElementById("phoneNumber").value.trim();

    if (!currentTicketType || !paymentCompleted) {
      window.cartFunctions?.showToast("Please complete payment first (click Pay & Get Ticket).");
      return;
    }
    if (!name || !idVal || !phoneVal) {
      window.cartFunctions?.showToast("Please fill in all details: Full Name, ID Number, and Phone Number.");
      return;
    }
    const cleanedPhone = phoneVal.replace(/[\s\-()]/g, "");
    if (!/^\+?\d{9,15}$/.test(cleanedPhone)) {
      window.cartFunctions?.showToast("Please enter a valid phone number (9-15 digits, optional +).");
      return;
    }
    if (ticketGenerated) {
      window.cartFunctions?.showToast("Ticket already generated! Please download it.");
      return;
    }
    if (ticketDownloaded) {
      window.cartFunctions?.showToast("This ticket was already downloaded. Please select a new ticket type.");
      return;
    }

    userDetails = { name: name.toUpperCase(), id: idVal, phone: phoneVal };
    generateLandscapeTicket();
  });

  downloadBtn.addEventListener("click", () => {
    if (!ticketGenerated) {
      window.cartFunctions?.showToast("No ticket available. Please complete payment and generate ticket.");
      return;
    }
    if (ticketDownloaded) {
      window.cartFunctions?.showToast("This ticket has already been downloaded. Please select a new ticket type.");
      return;
    }
    try {
      const link = document.createElement('a');
      link.download = `adict_${currentTicketType.toLowerCase()}_landscape.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      ticketDownloaded = true;
      ticketGenerated = false;
      canvas.style.display = "none";
      downloadBtn.style.display = "none";
      window.cartFunctions?.showToast("✅ Ticket downloaded! You can now buy another ticket.");
    } catch(e) {
      window.cartFunctions?.showToast("Right-click on the ticket image and select 'Save image as...'");
    }
  });
}

function initTourSlideshow() {
  let bgSlideIndex = 0;
  const bgSlides = document.querySelectorAll('.bg-slide');
  if (bgSlides.length > 1) {
    setInterval(() => {
      bgSlides[bgSlideIndex].classList.remove('active');
      bgSlideIndex = (bgSlideIndex + 1) % bgSlides.length;
      bgSlides[bgSlideIndex].classList.add('active');
    }, 5000);
  }
}

window.tourSystem = {
  currentTicketType,
  currentPrice,
  paymentCompleted,
  ticketGenerated,
  ticketDownloaded,
  userDetails,
  showDetailsPanelAutomatically,
  checkPaymentReturn,
  generateLandscapeTicket,
  setupTourEvents,
  refreshTicketCards,
  initTourSlideshow,
  initRateCardDownload,
  getTicketDownloadUrl
};
