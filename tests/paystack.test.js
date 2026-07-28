import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadScript, resetStorage, setBody, siteConfig } from "./helpers/harness.js";

const GATEWAY = "https://gateway.example.com";

let paystackCheckoutFunctions;
let cartFunctions;
let paystackHandler;

function stubPaystackPop() {
  paystackHandler = { openIframe: vi.fn() };
  window.PaystackPop = { setup: vi.fn(() => paystackHandler) };
  return window.PaystackPop;
}

// window.prompt answers, consumed in order.
function stubPrompts(answers) {
  const queue = [...answers];
  window.prompt = vi.fn(() => (queue.length ? queue.shift() : null));
  return window.prompt;
}

beforeEach(async () => {
  resetStorage();
  setBody("");
  siteConfig();
  cartFunctions = { showToast: vi.fn(), clearCart: vi.fn() };
  window.cartFunctions = cartFunctions;
  stubPaystackPop();
  await loadScript("js/paystack.js");
  paystackCheckoutFunctions = window.paystackCheckoutFunctions;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.PaystackPop;
});

describe("paystackCheckout (popup mode)", () => {
  it("converts the amount to the smallest currency unit and opens the popup", () => {
    paystackCheckoutFunctions.paystackCheckout({
      amount: 1499.4,
      email: "fan@example.com",
      label: "CD",
      metadata: { custom_fields: [] }
    });

    expect(window.PaystackPop.setup).toHaveBeenCalledWith(expect.objectContaining({
      key: "pk_test_abc123",
      email: "fan@example.com",
      amount: 149940,
      currency: "KES",
      label: "CD"
    }));
    expect(paystackHandler.openIframe).toHaveBeenCalled();
  });

  it("refuses to open when the Paystack key is still the placeholder", () => {
    siteConfig({ PAYSTACK_PUBLIC_KEY: "pk_REPLACE_WITH_YOUR_KEY" });

    paystackCheckoutFunctions.paystackCheckout({ amount: 100, email: "a@b.com" });

    expect(window.PaystackPop.setup).not.toHaveBeenCalled();
    expect(cartFunctions.showToast).toHaveBeenCalledWith(expect.stringContaining("Payments aren't set up yet"));
  });

  it("reports a clear error when the Paystack script never loaded", () => {
    delete window.PaystackPop;

    paystackCheckoutFunctions.paystackCheckout({ amount: 100, email: "a@b.com" });

    expect(cartFunctions.showToast).toHaveBeenCalledWith(expect.stringContaining("Payment system failed to load"));
  });

  it("forwards the Paystack callback and onClose to the caller", () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    paystackCheckoutFunctions.paystackCheckout({ amount: 100, email: "a@b.com", onSuccess, onClose });
    const opts = window.PaystackPop.setup.mock.calls[0][0];
    opts.callback({ reference: "ref_9" });
    opts.onClose();

    expect(onSuccess).toHaveBeenCalledWith({ reference: "ref_9" });
    expect(onClose).toHaveBeenCalled();
  });
});

describe("checkout email prompt", () => {
  it("remembers the email for the rest of the session", () => {
    stubPrompts(["fan@example.com"]);

    paystackCheckoutFunctions.checkout({ amount: 199, items: [{ id: 1, quantity: 1 }] });

    expect(sessionStorage.getItem("manlungCustomerEmail")).toBe("fan@example.com");
    expect(window.PaystackPop.setup).toHaveBeenCalled();
  });

  it.each([
    ["cancelled", null],
    ["missing @", "fanexample.com"],
    ["missing dot", "fan@example"]
  ])("aborts checkout on a %s email", (_label, answer) => {
    stubPrompts([answer]);

    paystackCheckoutFunctions.checkout({ amount: 199, items: [{ id: 1, quantity: 1 }] });

    expect(window.PaystackPop.setup).not.toHaveBeenCalled();
    expect(cartFunctions.showToast).toHaveBeenCalledWith("A valid email is needed to checkout");
  });
});

describe("checkout shipping prompts", () => {
  it("appends the collected shipping details to the Paystack metadata", () => {
    stubPrompts(["fan@example.com", "Jane Doe", "+254712345678", "Mombasa, Nyali"]);

    paystackCheckoutFunctions.checkout({
      amount: 1499,
      items: [{ id: 7, quantity: 1 }],
      needsShipping: true,
      metadata: { custom_fields: [{ display_name: "Product", variable_name: "product", value: "CD" }] }
    });

    const fields = window.PaystackPop.setup.mock.calls[0][0].metadata.custom_fields;
    expect(fields.map(f => f.variable_name)).toEqual(["product", "recipient_name", "phone", "address"]);
    expect(JSON.parse(sessionStorage.getItem("manlungShippingInfo"))).toEqual({
      name: "Jane Doe",
      phone: "+254712345678",
      address: "Mombasa, Nyali"
    });
  });

  it("re-prompts until the phone number is valid", () => {
    const prompt = stubPrompts(["fan@example.com", "Jane Doe", "0712", "0712345678", "Nyali"]);

    paystackCheckoutFunctions.checkout({ amount: 1499, items: [{ id: 7, quantity: 1 }], needsShipping: true });

    expect(prompt).toHaveBeenCalledTimes(5);
    expect(JSON.parse(sessionStorage.getItem("manlungShippingInfo")).phone).toBe("0712345678");
  });

  it("accepts a phone number written with spaces and dashes", () => {
    stubPrompts(["fan@example.com", "Jane Doe", "0712-345 678", "Nyali"]);

    paystackCheckoutFunctions.checkout({ amount: 1499, items: [{ id: 7, quantity: 1 }], needsShipping: true });

    expect(window.PaystackPop.setup).toHaveBeenCalled();
  });

  it.each([
    ["name", 1, "A name is needed to ship your order"],
    ["phone", 2, "A phone number is needed to ship your order"],
    ["address", 3, "A delivery address is needed to ship your order"]
  ])("aborts when the %s prompt is cancelled", (_label, cancelAt, message) => {
    const answers = ["fan@example.com", "Jane Doe", "0712345678", "Nyali"];
    answers[cancelAt] = null;
    stubPrompts(answers.slice(0, cancelAt + 1));

    paystackCheckoutFunctions.checkout({ amount: 1499, items: [{ id: 7, quantity: 1 }], needsShipping: true });

    expect(window.PaystackPop.setup).not.toHaveBeenCalled();
    expect(cartFunctions.showToast).toHaveBeenCalledWith(message);
  });
});

describe("download panel", () => {
  it("lists every downloadable item, staggers the downloads and reports completion", () => {
    vi.useFakeTimers();
    const clicks = [];
    vi.spyOn(window.HTMLAnchorElement.prototype, "click").mockImplementation(function () {
      clicks.push(this.href);
    });
    stubPrompts(["fan@example.com"]);

    paystackCheckoutFunctions.checkout({
      amount: 1499,
      items: [{ id: 7, quantity: 1 }],
      downloadItems: [
        { title: "Track One", downloadUrl: "https://cdn.test/one.mp3" },
        { title: "Track Two", downloadUrl: "https://cdn.test/two.mp3" },
        { title: "Emailed later", downloadUrl: "" }
      ]
    });
    window.PaystackPop.setup.mock.calls[0][0].callback({ reference: "ref_1" });

    expect(document.querySelectorAll(".download-panel-link")).toHaveLength(2);
    expect(document.getElementById("downloadPanel").textContent).toContain("1 item(s) will have their download link emailed");

    vi.advanceTimersByTime(2000);
    expect(clicks).toEqual(["https://cdn.test/one.mp3", "https://cdn.test/two.mp3"]);
    expect(document.getElementById("downloadPanelStatus").textContent).toContain("Download complete");
    vi.useRealTimers();
  });

  it("shows the shipping address for a physical order and closes on ✕", () => {
    stubPrompts(["fan@example.com", "Jane Doe", "0712345678", "Nyali, Mombasa"]);

    paystackCheckoutFunctions.checkout({
      amount: 1499,
      items: [{ id: 7, quantity: 1 }],
      needsShipping: true,
      isPhysical: true,
      downloadItems: []
    });
    window.PaystackPop.setup.mock.calls[0][0].callback({ reference: "ref_1" });

    expect(document.getElementById("downloadPanel").textContent).toContain("Nyali, Mombasa");

    document.getElementById("downloadPanelClose").click();
    expect(document.getElementById("downloadPanel")).toBeNull();
  });

  it("toasts when the popup is dismissed", () => {
    stubPrompts(["fan@example.com"]);

    paystackCheckoutFunctions.checkout({ amount: 199, items: [{ id: 1, quantity: 1 }] });
    window.PaystackPop.setup.mock.calls[0][0].onClose();

    expect(cartFunctions.showToast).toHaveBeenCalledWith("Checkout closed");
  });
});

describe("checkout (gateway mode)", () => {
  beforeEach(async () => {
    siteConfig({ GATEWAY_URL: `${GATEWAY}/` });
    // jsdom refuses real navigation, so replace location with a writable stand-in.
    delete window.location;
    window.location = { origin: "https://shop.example.com", pathname: "/shop.html", search: "", href: "" };
  });

  it("redirects to the gateway with the cart, email and return url", () => {
    stubPrompts(["fan@example.com"]);

    paystackCheckoutFunctions.checkout({
      amount: 1897,
      items: [{ id: 1, quantity: 2 }, { id: 7, quantity: 1 }],
      downloadItems: [{ title: "My Gee", downloadUrl: "https://cdn.test/my-gee.mp3" }]
    });

    const url = new URL(window.location.href);
    expect(url.origin + url.pathname).toBe(`${GATEWAY}/`);
    expect(url.searchParams.get("cart")).toBe("1:2,7:1");
    expect(url.searchParams.get("email")).toBe("fan@example.com");
    expect(url.searchParams.get("return")).toBe("https://shop.example.com/shop.html");
    expect(window.PaystackPop.setup).not.toHaveBeenCalled();
  });

  it("passes shipping details and the ticket type through as query params", () => {
    stubPrompts(["fan@example.com", "Jane Doe", "0712345678", "Nyali"]);

    paystackCheckoutFunctions.checkout({
      amount: 3000,
      items: [{ id: 202, quantity: 1 }],
      needsShipping: true,
      ticketType: "VIP",
      ticketPrice: 3000
    });

    const params = new URL(window.location.href).searchParams;
    expect(params.get("shipName")).toBe("Jane Doe");
    expect(params.get("shipPhone")).toBe("0712345678");
    expect(params.get("shipAddress")).toBe("Nyali");
    expect(params.get("ticketType")).toBe("VIP");
  });

  it("stores the pending order so it survives the redirect", () => {
    stubPrompts(["fan@example.com"]);

    paystackCheckoutFunctions.checkout({
      amount: 199,
      items: [{ id: 1, quantity: 1 }],
      downloadItems: [{ title: "My Gee", downloadUrl: "https://cdn.test/my-gee.mp3" }],
      isPhysical: false
    });

    expect(JSON.parse(sessionStorage.getItem("manlungPendingOrder"))).toMatchObject({
      isPhysical: false,
      downloadItems: [{ title: "My Gee", downloadUrl: "https://cdn.test/my-gee.mp3" }]
    });
  });

  it("falls back to the popup when there are no line items to price", () => {
    stubPrompts(["fan@example.com"]);

    paystackCheckoutFunctions.checkout({ amount: 199, items: [] });

    expect(window.PaystackPop.setup).toHaveBeenCalled();
  });

  it("does not redirect when the email prompt is cancelled", () => {
    stubPrompts([null]);

    paystackCheckoutFunctions.checkout({ amount: 199, items: [{ id: 1, quantity: 1 }] });

    expect(window.location.href).toBe("");
  });

  it("does not redirect when the shipping prompts are cancelled", () => {
    stubPrompts(["fan@example.com", null]);

    paystackCheckoutFunctions.checkout({ amount: 1499, items: [{ id: 7, quantity: 1 }], needsShipping: true });

    expect(window.location.href).toBe("");
  });
});

describe("checkGatewayReturn", () => {
  let replaceState;

  beforeEach(async () => {
    siteConfig({ GATEWAY_URL: GATEWAY });
    replaceState = vi.fn();
    delete window.location;
    window.location = { origin: "https://shop.example.com", pathname: "/shop.html", search: "", href: "" };
    window.history.replaceState = replaceState;
  });

  function withSearch(search) {
    window.location.search = search;
  }

  function mockVerify(body) {
    window.fetch = vi.fn(() => (body instanceof Error
      ? Promise.reject(body)
      : Promise.resolve({ ok: true, json: () => Promise.resolve(body) })));
    return window.fetch;
  }

  it("does nothing when the page was not reached from the gateway", () => {
    const fetchMock = mockVerify({});

    paystackCheckoutFunctions.checkGatewayReturn();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("cleans the url and warns when the payment was abandoned", () => {
    withSearch("?reference=ref_1&status=failed");
    const fetchMock = mockVerify({});

    paystackCheckoutFunctions.checkGatewayReturn();

    expect(replaceState).toHaveBeenCalledWith({}, document.title, "https://shop.example.com/shop.html");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(cartFunctions.showToast).toHaveBeenCalledWith("Payment was not completed.");
  });

  it("verifies the reference, shows the downloads and clears the cart", async () => {
    withSearch("?reference=ref_1&status=success");
    sessionStorage.setItem("manlungPendingOrder", JSON.stringify({
      downloadItems: [{ title: "My Gee", downloadUrl: "https://cdn.test/my-gee.mp3" }],
      isPhysical: false
    }));
    const fetchMock = mockVerify({ success: true, status: "success" });
    vi.spyOn(window.HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    paystackCheckoutFunctions.checkGatewayReturn();
    await vi.waitFor(() => expect(document.getElementById("downloadPanel")).not.toBeNull());

    expect(fetchMock).toHaveBeenCalledWith(`${GATEWAY}/api/paystack/verify/ref_1`);
    expect(cartFunctions.clearCart).toHaveBeenCalled();
    // The pending order is single-use
    expect(sessionStorage.getItem("manlungPendingOrder")).toBeNull();
  });

  it("hands a verified ticket purchase over to the tour system", async () => {
    withSearch("?reference=ref_2&status=success");
    sessionStorage.setItem("manlungPendingOrder", JSON.stringify({ ticketType: "VVIP", ticketPrice: 5000 }));
    mockVerify({ success: true, status: "success" });
    window.tourSystem = { showDetailsPanelAutomatically: vi.fn() };

    paystackCheckoutFunctions.checkGatewayReturn();
    await vi.waitFor(() => expect(window.tourSystem.showDetailsPanelAutomatically).toHaveBeenCalledWith("VVIP", 5000));

    expect(document.getElementById("downloadPanel")).toBeNull();
  });

  it("warns when the gateway cannot confirm the payment", async () => {
    withSearch("?reference=ref_3&status=success");
    mockVerify({ success: false });

    paystackCheckoutFunctions.checkGatewayReturn();
    await vi.waitFor(() => expect(cartFunctions.showToast).toHaveBeenCalledWith("Payment could not be confirmed."));

    expect(cartFunctions.clearCart).not.toHaveBeenCalled();
  });

  it("warns when the verification request itself fails", async () => {
    withSearch("?reference=ref_4&status=success");
    mockVerify(new Error("network down"));

    paystackCheckoutFunctions.checkGatewayReturn();
    await vi.waitFor(() => expect(cartFunctions.showToast).toHaveBeenCalledWith(expect.stringContaining("Couldn't confirm payment status")));
  });
});
