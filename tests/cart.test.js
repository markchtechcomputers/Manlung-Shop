import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  installProductData,
  loadScript,
  resetStorage,
  setBody,
  stubCurrencyFunctions,
  stubPaystackFunctions
} from "./helpers/harness.js";

const CART_DOM = `
  <span id="cartCountBadge"></span>
  <div id="toastMsg"></div>
  <div id="cartItemsContainer"></div>
  <div id="cartFooter"></div>
  <div id="cartTotalPrice"></div>
  <div id="cartSidebar" class="open"></div>
`;

let cartFunctions;
let paystack;

function digital() {
  return window.productData.digitalProducts[0];
}
function cd() {
  return window.productData.cdProducts[0];
}

beforeEach(async () => {
  vi.useFakeTimers();
  resetStorage();
  setBody(CART_DOM);
  installProductData();
  stubCurrencyFunctions();
  paystack = stubPaystackFunctions();
  await loadScript("js/cart.js");
  cartFunctions = window.cartFunctions;
  cartFunctions.clearCart();
});

describe("addToCart", () => {
  it("adds a new line item and persists it to localStorage", () => {
    cartFunctions.addToCart(digital(), 2);

    const stored = JSON.parse(localStorage.getItem("manlungCart"));
    expect(stored).toEqual([expect.objectContaining({ id: 1, title: "My Gee", quantity: 2 })]);
    expect(document.getElementById("cartCountBadge").innerText).toBe(2);
  });

  it("increments the quantity of an existing line item instead of duplicating it", () => {
    cartFunctions.addToCart(digital(), 1);
    cartFunctions.addToCart(digital(), 3);

    const stored = JSON.parse(localStorage.getItem("manlungCart"));
    expect(stored).toHaveLength(1);
    expect(stored[0].quantity).toBe(4);
  });

  it.each([
    ["zero", 0],
    ["negative", -5],
    ["non-numeric", "abc"],
    ["undefined", undefined]
  ])("clamps a %s quantity to 1", (_label, qty) => {
    cartFunctions.addToCart(digital(), qty);

    expect(JSON.parse(localStorage.getItem("manlungCart"))[0].quantity).toBe(1);
  });

  it("truncates a fractional quantity to a whole number", () => {
    cartFunctions.addToCart(digital(), "2.9");

    expect(JSON.parse(localStorage.getItem("manlungCart"))[0].quantity).toBe(2);
  });
});

describe("loadCart", () => {
  it("restores a cart saved by a previous visit", () => {
    localStorage.setItem("manlungCart", JSON.stringify([{ id: 1, title: "My Gee", price: 199, quantity: 3 }]));

    cartFunctions.loadCart();

    expect(document.getElementById("cartCountBadge").innerText).toBe(3);
    expect(document.getElementById("cartItemsContainer").innerHTML).toContain("My Gee");
  });

  it("starts empty when nothing was saved", () => {
    cartFunctions.loadCart();

    expect(document.getElementById("cartCountBadge").innerText).toBe(0);
    expect(document.getElementById("cartItemsContainer").innerHTML).toContain("Your cart is empty");
  });
});

describe("updateQty / removeItem", () => {
  it("applies a delta to the matching item", () => {
    cartFunctions.addToCart(digital(), 2);

    cartFunctions.updateQty(1, 1);

    expect(JSON.parse(localStorage.getItem("manlungCart"))[0].quantity).toBe(3);
  });

  it("drops the item once its quantity reaches zero", () => {
    cartFunctions.addToCart(digital(), 1);

    cartFunctions.updateQty(1, -1);

    expect(JSON.parse(localStorage.getItem("manlungCart"))).toEqual([]);
  });

  it("ignores a delta for an id that is not in the cart", () => {
    cartFunctions.addToCart(digital(), 1);

    cartFunctions.updateQty(999, 5);

    expect(JSON.parse(localStorage.getItem("manlungCart"))[0].quantity).toBe(1);
  });

  it("removes only the requested item", () => {
    cartFunctions.addToCart(digital(), 1);
    cartFunctions.addToCart(cd(), 1);

    cartFunctions.removeItem(1);

    const stored = JSON.parse(localStorage.getItem("manlungCart"));
    expect(stored.map(i => i.id)).toEqual([7]);
  });
});

describe("renderCartUI", () => {
  it("renders a row per item, hides the footer when empty, and shows the total", () => {
    expect(document.getElementById("cartFooter").style.display).toBe("none");

    cartFunctions.addToCart(digital(), 2); // 199 x 2
    cartFunctions.addToCart(cd(), 1); // 1499

    expect(document.querySelectorAll(".cart-item")).toHaveLength(2);
    expect(document.getElementById("cartFooter").style.display).toBe("block");
    expect(document.getElementById("cartTotalPrice").innerText).toBe("KSh 1897");
  });

  it("wires the quantity and remove buttons of each rendered row", () => {
    cartFunctions.addToCart(digital(), 1);

    document.querySelector('.cart-qty-btn[data-delta="1"]').click();
    expect(JSON.parse(localStorage.getItem("manlungCart"))[0].quantity).toBe(2);

    document.querySelector(".remove-item").click();
    expect(JSON.parse(localStorage.getItem("manlungCart"))).toEqual([]);
  });
});

describe("showToast", () => {
  it("shows the message then fades it out", () => {
    cartFunctions.showToast("Hello");

    const toast = document.getElementById("toastMsg");
    expect(toast.innerText).toBe("Hello");
    expect(toast.style.opacity).toBe("1");

    vi.advanceTimersByTime(1600);
    expect(toast.style.opacity).toBe("0");
  });
});

describe("directCheckout", () => {
  it("checks out a digital single as a non-shippable item with its own download url", () => {
    cartFunctions.directCheckout(digital(), 2);

    const order = paystack.checkout.mock.calls[0][0];
    expect(order).toMatchObject({
      amount: 398,
      items: [{ id: 1, quantity: 2 }],
      label: "My Gee",
      needsShipping: false,
      isPhysical: false,
      downloadItems: [{ title: "My Gee", downloadUrl: "https://cdn.test/my-gee.mp3" }]
    });
    expect(order.metadata.custom_fields).toEqual([
      { display_name: "Product", variable_name: "product", value: "My Gee" },
      { display_name: "Product ID", variable_name: "product_id", value: 1 },
      { display_name: "Quantity", variable_name: "quantity", value: 2 }
    ]);
  });

  it("marks a CD as physical and expands its tracklist into download items", () => {
    cartFunctions.directCheckout(cd(), 1);

    expect(paystack.checkout.mock.calls[0][0]).toMatchObject({
      amount: 1499,
      needsShipping: true,
      isPhysical: true,
      downloadItems: [
        { title: "Track One", downloadUrl: "https://cdn.test/one.mp3" },
        { title: "Track Two", downloadUrl: "https://cdn.test/two.mp3" }
      ]
    });
  });

  it("toasts instead of checking out when the product is missing", () => {
    cartFunctions.directCheckout(null, 1);

    expect(paystack.checkout).not.toHaveBeenCalled();
    expect(document.getElementById("toastMsg").innerText).toBe("Product unavailable");
  });
});

describe("processCheckout", () => {
  it("refuses to check out an empty cart", () => {
    cartFunctions.processCheckout();

    expect(paystack.checkout).not.toHaveBeenCalled();
    expect(document.getElementById("toastMsg").innerText).toBe("Cart empty");
  });

  it("sums the cart, flags shipping for the physical item and merges every download", () => {
    cartFunctions.addToCart(digital(), 2); // 398
    cartFunctions.addToCart(cd(), 1); // 1499

    cartFunctions.processCheckout();

    const order = paystack.checkout.mock.calls[0][0];
    expect(order).toMatchObject({
      amount: 1897,
      items: [{ id: 1, quantity: 2 }, { id: 7, quantity: 1 }],
      needsShipping: true,
      isPhysical: true
    });
    expect(order.downloadItems).toEqual([
      { title: "My Gee", downloadUrl: "https://cdn.test/my-gee.mp3" },
      { title: "Track One", downloadUrl: "https://cdn.test/one.mp3" },
      { title: "Track Two", downloadUrl: "https://cdn.test/two.mp3" }
    ]);
    expect(order.metadata.custom_fields[0].value).toBe("My Gee x2, MANLUNG CD (Signed) x1");
  });

  it("does not request shipping for a digital-only cart", () => {
    cartFunctions.addToCart(digital(), 1);

    cartFunctions.processCheckout();

    expect(paystack.checkout.mock.calls[0][0]).toMatchObject({ needsShipping: false, isPhysical: false });
  });

  it("clears the cart and closes the sidebar once payment succeeds", () => {
    cartFunctions.addToCart(digital(), 1);
    cartFunctions.processCheckout();

    paystack.checkout.mock.calls[0][0].onSuccess({ reference: "ref_1" });

    expect(JSON.parse(localStorage.getItem("manlungCart"))).toEqual([]);
    expect(document.getElementById("cartSidebar").classList.contains("open")).toBe(false);
  });
});
