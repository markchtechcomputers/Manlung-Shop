import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadScript, resetStorage, setBody, siteConfig, stubPaystackFunctions } from "./helpers/harness.js";

const TOUR_DOM = `
  <button class="pay-btn" data-ticket="REGULAR" data-price="1000"></button>
  <button class="pay-btn" data-ticket="VIP" data-price="3000"></button>
  <button class="pay-btn" data-ticket="VVIP" data-price="5000"></button>
  <button id="rateCardBtn"></button>
  <div id="detailsForm" style="display:none">
    <input id="fullName">
    <input id="idNumber">
    <input id="phoneNumber">
    <button id="generateTicketBtn"></button>
  </div>
  <canvas id="ticketCanvas" style="display:none"></canvas>
  <button id="downloadFinalBtn" style="display:none"></button>
  <div class="bg-slide active"></div>
  <div class="bg-slide"></div>
`;

let tourSystem;
let cartFunctions;
let paystack;
let ctx;

// jsdom ships no 2d canvas implementation, so record the drawing calls instead.
function stubCanvas() {
  ctx = {
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    drawImage: vi.fn()
  };
  vi.spyOn(window.HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx);
  vi.spyOn(window.HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,AAAA");
}

function drawnText() {
  return ctx.fillText.mock.calls.map(c => c[0]);
}

function fillTicketForm(name, id, phone) {
  document.getElementById("fullName").value = name;
  document.getElementById("idNumber").value = id;
  document.getElementById("phoneNumber").value = phone;
}

function payFor(type) {
  document.querySelector(`.pay-btn[data-ticket="${type}"]`).click();
  // The popup path reports success straight back through onSuccess.
  paystack.checkout.mock.calls.at(-1)[0].onSuccess({ reference: "ref_1" });
}

beforeEach(async () => {
  resetStorage();
  setBody(TOUR_DOM);
  siteConfig();
  window.Element.prototype.scrollIntoView = vi.fn();
  // jsdom cannot navigate, and the module "clicks" download anchors.
  vi.spyOn(window.HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  cartFunctions = { showToast: vi.fn() };
  window.cartFunctions = cartFunctions;
  paystack = stubPaystackFunctions();
  stubCanvas();
  await loadScript("js/tour.js");
  tourSystem = window.tourSystem;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ticket purchase", () => {
  it("checks out the ticket type and price held on the button", () => {
    tourSystem.setupTourEvents();

    document.querySelector('.pay-btn[data-ticket="VIP"]').click();

    expect(paystack.checkout.mock.calls[0][0]).toMatchObject({
      amount: 3000,
      items: [{ id: 202, quantity: 1 }],
      label: "Adict Manlung Tour Ticket — VIP",
      needsShipping: false,
      isPhysical: false,
      ticketType: "VIP",
      ticketPrice: 3000
    });
  });

  it("opens the details form once payment succeeds", () => {
    tourSystem.setupTourEvents();

    payFor("REGULAR");

    expect(document.getElementById("detailsForm").style.display).toBe("block");
    expect(document.getElementById("generateTicketBtn").disabled).toBe(false);
  });

  it("blocks a second purchase while an undownloaded ticket exists", () => {
    tourSystem.setupTourEvents();
    payFor("REGULAR");
    fillTicketForm("Jane Doe", "12345678", "0712345678");
    document.getElementById("generateTicketBtn").click();

    document.querySelector('.pay-btn[data-ticket="VIP"]').click();

    expect(paystack.checkout).toHaveBeenCalledTimes(1);
    expect(cartFunctions.showToast).toHaveBeenCalledWith(expect.stringContaining("already have an active ticket"));
  });

  it("allows another purchase after the ticket has been downloaded", () => {
    tourSystem.setupTourEvents();
    payFor("REGULAR");
    fillTicketForm("Jane Doe", "12345678", "0712345678");
    document.getElementById("generateTicketBtn").click();
    document.getElementById("downloadFinalBtn").click();

    document.querySelector('.pay-btn[data-ticket="VIP"]').click();

    expect(paystack.checkout).toHaveBeenCalledTimes(2);
    expect(document.getElementById("ticketCanvas").style.display).toBe("none");
  });

  it("does nothing when the tour markup is not on the page", () => {
    setBody("");

    expect(() => tourSystem.setupTourEvents()).not.toThrow();
  });
});

describe("ticket generation", () => {
  beforeEach(() => {
    tourSystem.setupTourEvents();
  });

  it("requires a completed payment first", () => {
    fillTicketForm("Jane Doe", "12345678", "0712345678");

    document.getElementById("generateTicketBtn").click();

    expect(cartFunctions.showToast).toHaveBeenCalledWith(expect.stringContaining("complete payment first"));
    expect(document.getElementById("ticketCanvas").style.display).toBe("none");
  });

  it.each([
    ["a missing name", "", "12345678", "0712345678", "Please fill in all details: Full Name, ID Number, and Phone Number."],
    ["a missing id", "Jane Doe", "", "0712345678", "Please fill in all details: Full Name, ID Number, and Phone Number."],
    ["an invalid phone", "Jane Doe", "12345678", "0712", "Please enter a valid phone number (9-15 digits, optional +)."]
  ])("refuses to generate with %s", (_label, name, id, phone, message) => {
    payFor("REGULAR");
    fillTicketForm(name, id, phone);

    document.getElementById("generateTicketBtn").click();

    expect(cartFunctions.showToast).toHaveBeenCalledWith(message);
    expect(document.getElementById("ticketCanvas").style.display).toBe("none");
  });

  it("draws the ticket with the holder details upper-cased and the paid price", () => {
    payFor("VIP");
    fillTicketForm(" jane doe ", "12345678", "0712 345 678");

    document.getElementById("generateTicketBtn").click();

    const canvas = document.getElementById("ticketCanvas");
    expect(canvas.width).toBe(850);
    expect(canvas.height).toBe(530);
    expect(drawnText()).toContain("JANE DOE");
    expect(drawnText()).toContain("12345678");
    expect(drawnText()).toContain("VIP");
    expect(drawnText()).toContain("KSh 3,000");
    expect(canvas.style.display).toBe("block");
    expect(document.getElementById("downloadFinalBtn").style.display).toBe("inline-block");
  });

  it("locks the generate button after a ticket is made", () => {
    payFor("REGULAR");
    fillTicketForm("Jane Doe", "12345678", "0712345678");

    document.getElementById("generateTicketBtn").click();
    const btn = document.getElementById("generateTicketBtn");
    expect(btn.disabled).toBe(true);
    expect(btn.innerText).toBe("✓ Ticket Created");

    btn.disabled = false;
    btn.click();
    expect(cartFunctions.showToast).toHaveBeenCalledWith("Ticket already generated! Please download it.");
  });

  it("refuses to reuse a ticket that was already downloaded", () => {
    payFor("REGULAR");
    fillTicketForm("Jane Doe", "12345678", "0712345678");
    document.getElementById("generateTicketBtn").click();
    document.getElementById("downloadFinalBtn").click();

    const btn = document.getElementById("generateTicketBtn");
    btn.disabled = false;
    btn.click();

    expect(cartFunctions.showToast).toHaveBeenCalledWith(expect.stringContaining("already downloaded"));
  });

  it("uses a per-ticket colour scheme", () => {
    payFor("VIP");
    fillTicketForm("Jane Doe", "12345678", "0712345678");

    document.getElementById("generateTicketBtn").click();

    // VIP scheme border colour
    expect(ctx.strokeStyle).toBeDefined();
    expect(ctx.createLinearGradient).toHaveBeenCalledWith(0, 0, 850, 0);
  });
});

describe("ticket download", () => {
  beforeEach(() => {
    tourSystem.setupTourEvents();
  });

  it("refuses to download before a ticket exists", () => {
    document.getElementById("downloadFinalBtn").click();

    expect(cartFunctions.showToast).toHaveBeenCalledWith(expect.stringContaining("No ticket available"));
  });

  it("downloads the canvas as a png named after the ticket type", () => {
    const anchors = [];
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(tag => {
      const el = realCreate(tag);
      if (tag === "a") anchors.push(el);
      return el;
    });
    payFor("VVIP");
    fillTicketForm("Jane Doe", "12345678", "0712345678");
    document.getElementById("generateTicketBtn").click();

    document.getElementById("downloadFinalBtn").click();

    expect(anchors[0].download).toBe("adict_vvip_landscape.png");
    expect(anchors[0].href).toBe("data:image/png;base64,AAAA");
    expect(document.getElementById("ticketCanvas").style.display).toBe("none");
    expect(cartFunctions.showToast).toHaveBeenCalledWith(expect.stringContaining("Ticket downloaded!"));
  });

  it("refuses a second download of the same ticket", () => {
    payFor("REGULAR");
    fillTicketForm("Jane Doe", "12345678", "0712345678");
    document.getElementById("generateTicketBtn").click();
    document.getElementById("downloadFinalBtn").click();
    cartFunctions.showToast.mockClear();

    document.getElementById("downloadFinalBtn").click();

    expect(cartFunctions.showToast).toHaveBeenCalledWith(expect.stringContaining("No ticket available"));
  });

  it("falls back to a save-image hint when the export is blocked", () => {
    payFor("REGULAR");
    fillTicketForm("Jane Doe", "12345678", "0712345678");
    document.getElementById("generateTicketBtn").click();
    window.HTMLCanvasElement.prototype.toDataURL.mockImplementation(() => {
      throw new Error("tainted canvas");
    });

    document.getElementById("downloadFinalBtn").click();

    expect(cartFunctions.showToast).toHaveBeenCalledWith(expect.stringContaining("Right-click on the ticket image"));
  });
});

describe("checkPaymentReturn", () => {
  it("reopens the details form for a ticket paid for before the redirect", () => {
    sessionStorage.setItem("paymentInitiated", "true");
    sessionStorage.setItem("pendingTicketType", "VVIP");
    sessionStorage.setItem("pendingTicketPrice", "5000");

    tourSystem.checkPaymentReturn();

    expect(document.getElementById("detailsForm").style.display).toBe("block");
    // single use — a refresh must not re-open it
    expect(sessionStorage.getItem("paymentInitiated")).toBeNull();
    expect(sessionStorage.getItem("pendingTicketType")).toBeNull();
  });

  it("keeps the details form hidden on a normal visit", () => {
    tourSystem.checkPaymentReturn();

    expect(document.getElementById("detailsForm").style.display).toBe("none");
  });

  it("clears any details typed before the redirect", () => {
    fillTicketForm("Old Name", "999", "0700000000");

    tourSystem.showDetailsPanelAutomatically("VIP", 3000);

    expect(document.getElementById("fullName").value).toBe("");
    expect(document.getElementById("idNumber").value).toBe("");
    expect(document.getElementById("phoneNumber").value).toBe("");
  });

  it("does nothing when the details form is not on the page", () => {
    setBody("");

    expect(() => tourSystem.showDetailsPanelAutomatically("VIP", 3000)).not.toThrow();
  });
});

describe("initRateCardDownload", () => {
  it("warns while the config still holds the placeholder link", () => {
    tourSystem.initRateCardDownload();

    document.getElementById("rateCardBtn").click();

    expect(cartFunctions.showToast).toHaveBeenCalledWith(expect.stringContaining("Rate card isn't set up yet"));
  });

  it("rejects a postimg viewer page instead of a direct image link", () => {
    siteConfig({ RATE_CARD_IMAGE_URL: "https://postimg.cc/abcd1234" });
    tourSystem.initRateCardDownload();

    document.getElementById("rateCardBtn").click();

    expect(cartFunctions.showToast).toHaveBeenCalledWith(expect.stringContaining("not the direct image"));
  });

  it("downloads a direct image link as a blob", async () => {
    siteConfig({ RATE_CARD_IMAGE_URL: "https://i.postimg.cc/abcd1234/rate-card.jpg" });
    window.fetch = vi.fn(() => Promise.resolve({ ok: true, blob: () => Promise.resolve(new Blob(["img"])) }));
    window.URL.createObjectURL = vi.fn(() => "blob:rate-card");
    window.URL.revokeObjectURL = vi.fn();
    tourSystem.initRateCardDownload();

    document.getElementById("rateCardBtn").click();
    await vi.waitFor(() => expect(window.URL.revokeObjectURL).toHaveBeenCalled());

    expect(window.fetch).toHaveBeenCalledWith("https://i.postimg.cc/abcd1234/rate-card.jpg");
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:rate-card");
  });

  it("opens the image in a new tab when the host blocks the fetch", async () => {
    siteConfig({ RATE_CARD_IMAGE_URL: "https://cdn.example.com/rate-card.png" });
    window.fetch = vi.fn(() => Promise.resolve({ ok: false }));
    window.open = vi.fn();
    tourSystem.initRateCardDownload();

    document.getElementById("rateCardBtn").click();
    await vi.waitFor(() => expect(window.open).toHaveBeenCalledWith("https://cdn.example.com/rate-card.png", "_blank"));

    expect(cartFunctions.showToast).toHaveBeenCalledWith(expect.stringContaining("host blocked it"));
  });

  it("does nothing when the rate card button is absent", () => {
    setBody("");

    expect(() => tourSystem.initRateCardDownload()).not.toThrow();
  });
});

describe("initTourSlideshow", () => {
  it("advances the background slides on a timer", () => {
    vi.useFakeTimers();
    const slides = document.querySelectorAll(".bg-slide");

    tourSystem.initTourSlideshow();
    vi.advanceTimersByTime(5000);

    expect(slides[0].classList.contains("active")).toBe(false);
    expect(slides[1].classList.contains("active")).toBe(true);

    vi.advanceTimersByTime(5000);
    expect(slides[0].classList.contains("active")).toBe(true);
    vi.useRealTimers();
  });

  it("does not start a timer for a single slide", () => {
    vi.useFakeTimers();
    setBody('<div class="bg-slide active"></div>');
    const setIntervalSpy = vi.spyOn(window, "setInterval");

    tourSystem.initTourSlideshow();

    expect(setIntervalSpy).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
