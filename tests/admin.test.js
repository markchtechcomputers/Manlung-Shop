import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installProductData, loadScript, resetStorage, setBody, siteConfig } from "./helpers/harness.js";

// Mirrors the structure admin.js expects from admin.html.
const ADMIN_DOM = `
  <div id="loginScreen">
    <form id="loginForm"><input type="password" id="adminPasswordInput"></form>
    <div id="loginError"></div>
  </div>
  <div id="dashboard" style="display:none">
    <span id="cloudStatusBadge"></span>
    <button id="exportBtn"></button>
    <button id="resetBtn"></button>
    <button id="logoutBtn"></button>
    <button class="admin-tab-btn active" data-tab="digital"></button>
    <button class="admin-tab-btn" data-tab="cds"></button>
    <button class="admin-tab-btn" data-tab="merch"></button>
    <div class="admin-tab-content" id="tab-digital" style="display:block">
      <div id="list-digital"></div>
      <button id="addDigitalBtn"></button>
      <button id="saveDigitalBtn"></button>
    </div>
    <div class="admin-tab-content" id="tab-cds">
      <div id="list-cds"></div>
      <button id="addCdBtn"></button>
      <button id="saveCdsBtn"></button>
    </div>
    <div class="admin-tab-content" id="tab-merch">
      <div id="list-merch"></div>
      <button id="addMerchBtn"></button>
      <button id="saveMerchBtn"></button>
    </div>
    <form id="changePasswordForm"><input type="password" id="newPasswordInput"></form>
    <div id="newHashBox" style="display:none">
      <input type="text" id="newHashOutput">
      <button id="copyHashBtn"></button>
    </div>
  </div>
  <div id="adminToast"></div>
`;

let dataStore;

const el = id => document.getElementById(id);
const field = (key, idx, name) => document.getElementById(`${key}-${idx}-${name}`);

// admin.js wires itself up on DOMContentLoaded, which jsdom has already fired.
// Capture that handler instead of registering it, so only this test's copy of
// the module gets wired to the freshly rendered DOM.
async function bootAdmin({ dataStoreOverrides } = {}) {
  dataStore = {
    saveToStorage: vi.fn(),
    resetToDefaults: vi.fn(),
    nextId: vi.fn(() => 500),
    isCloudConnected: vi.fn(() => false),
    getClient: vi.fn(() => null),
    ...dataStoreOverrides
  };
  window.dataStore = dataStore;

  let domReady;
  const addEventListener = document.addEventListener.bind(document);
  const spy = vi.spyOn(document, "addEventListener").mockImplementation((type, handler, options) => {
    if (type === "DOMContentLoaded") domReady = handler;
    else addEventListener(type, handler, options);
  });

  await loadScript("js/admin.js");

  spy.mockRestore();
  domReady();
}

// Re-render the admin tables from the current catalog without going through a
// save (a save would read the on-screen inputs back over the change).
function rerender() {
  window.onProductDataUpdated();
}

function login(password = "secret") {
  el("adminPasswordInput").value = password;
  el("loginForm").dispatchEvent(new window.Event("submit"));
}

beforeEach(() => {
  vi.useFakeTimers();
  resetStorage();
  setBody(ADMIN_DOM);
  siteConfig();
  installProductData();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("login", () => {
  it("shows the dashboard for the configured password", async () => {
    await bootAdmin();

    login("secret");

    expect(el("loginScreen").style.display).toBe("none");
    expect(el("dashboard").style.display).toBe("block");
    expect(sessionStorage.getItem("manlungAdminLoggedIn")).toBe("true");
  });

  it("rejects a wrong password and clears the field", async () => {
    await bootAdmin();

    login("guess");

    expect(el("loginError").textContent).toBe("Incorrect password");
    expect(el("adminPasswordInput").value).toBe("");
    expect(el("dashboard").style.display).toBe("none");
  });

  it("skips the login screen for an already authenticated session", async () => {
    sessionStorage.setItem("manlungAdminLoggedIn", "true");

    await bootAdmin();

    expect(el("dashboard").style.display).toBe("block");
  });

  it("labels the catalog as device-only when there is no cloud connection", async () => {
    await bootAdmin();

    login();

    expect(el("cloudStatusBadge").textContent).toContain("This device only");
  });

  it("labels the catalog as cloud synced when the store reports both backends", async () => {
    await bootAdmin({
      dataStoreOverrides: {
        isSupabaseConnected: () => true,
        isFirebaseConnected: () => true
      }
    });

    login();

    expect(el("cloudStatusBadge").textContent).toContain("Supabase + Firebase");
  });

  it("names the single connected backend", async () => {
    await bootAdmin({
      dataStoreOverrides: {
        isSupabaseConnected: () => true,
        isFirebaseConnected: () => false
      }
    });

    login();

    expect(el("cloudStatusBadge").textContent).toContain("Supabase only");
  });
});

describe("rendering the catalog", () => {
  beforeEach(async () => {
    await bootAdmin();
    login();
  });

  it("renders an editable card per item in each tab", () => {
    expect(el("list-digital").querySelectorAll(".admin-card")).toHaveLength(2);
    expect(el("list-cds").querySelectorAll(".admin-card")).toHaveLength(1);
    expect(el("list-merch").querySelectorAll(".admin-card")).toHaveLength(1);
    expect(el("list-digital").querySelector(".admin-card-header").textContent).toContain("#1 — My Gee");
  });

  it("renders each field with the input type it needs", () => {
    expect(field("digitalProducts", 0, "price").type).toBe("number");
    expect(field("digitalProducts", 0, "featured").type).toBe("checkbox");
    expect(field("digitalProducts", 0, "description").tagName).toBe("TEXTAREA");
    expect(field("merchItems", 0, "category").tagName).toBe("SELECT");
    expect(field("cdProducts", 0, "tracks").tagName).toBe("TEXTAREA");
  });

  it("flattens list-shaped fields into the editable text formats", () => {
    window.productData.cdProducts[0].images = ["https://cdn.test/a.jpg", "https://cdn.test/b.jpg"];
    window.productData.digitalProducts[0].features = ["Instant download", "MP3 320kbps"];
    rerender();

    expect(field("cdProducts", 0, "tracks").value).toBe("Track One | https://cdn.test/one.mp3\nTrack Two | https://cdn.test/two.mp3");
    expect(field("merchItems", 0, "colors").value).toBe("White | #fff\nBlack | #111");
    expect(field("merchItems", 0, "sizes").value).toBe("S, M");
    expect(field("digitalProducts", 0, "features").value).toBe("Instant download, MP3 320kbps");
    expect(field("cdProducts", 0, "images").value).toBe("https://cdn.test/a.jpg\nhttps://cdn.test/b.jpg");
  });

  it("escapes quotes so a title cannot break out of its input", () => {
    window.productData.digitalProducts[0].title = 'Say "Hello"';
    rerender();

    expect(field("digitalProducts", 0, "title").value).toBe('Say "Hello"');
  });

  it("shows an empty state for a category with no items", () => {
    window.productData.merchItems = [];
    rerender();

    expect(el("list-merch").querySelector(".admin-empty")).not.toBeNull();
  });

  it("re-renders when the catalog changes underneath it", () => {
    window.productData.digitalProducts.push({ id: 9, title: "Pushed In", price: 199 });

    window.onProductDataUpdated();

    expect(el("list-digital").querySelectorAll(".admin-card")).toHaveLength(3);
  });
});

describe("tabs", () => {
  it("shows one tab at a time and marks the active button", async () => {
    await bootAdmin();
    login();

    document.querySelector('.admin-tab-btn[data-tab="merch"]').click();

    expect(el("tab-merch").style.display).toBe("block");
    expect(el("tab-digital").style.display).toBe("none");
    expect(document.querySelector('.admin-tab-btn[data-tab="merch"]').classList.contains("active")).toBe(true);
    expect(document.querySelector('.admin-tab-btn[data-tab="digital"]').classList.contains("active")).toBe(false);
  });
});

describe("saving edits", () => {
  beforeEach(async () => {
    await bootAdmin();
    login();
  });

  it("reads text, number and checkbox fields back into the catalog", () => {
    field("digitalProducts", 0, "title").value = "My Gee (Remix)";
    field("digitalProducts", 0, "price").value = "250";
    field("digitalProducts", 0, "stock").value = "12";
    field("digitalProducts", 0, "featured").checked = true;
    field("digitalProducts", 0, "downloadUrl").value = "https://cdn.test/remix.mp3";

    el("saveDigitalBtn").click();

    expect(window.productData.digitalProducts[0]).toMatchObject({
      title: "My Gee (Remix)",
      price: 250,
      stock: 12,
      featured: true,
      downloadUrl: "https://cdn.test/remix.mp3"
    });
    expect(dataStore.saveToStorage).toHaveBeenCalled();
    expect(el("adminToast").textContent).toContain("Saved");
  });

  it("falls back to zero for a blank price", () => {
    field("digitalProducts", 0, "price").value = "";

    el("saveDigitalBtn").click();

    expect(window.productData.digitalProducts[0].price).toBe(0);
  });

  it("splits features and sizes on commas, dropping blanks", () => {
    field("digitalProducts", 0, "features").value = "Instant download, , MP3 320kbps ,";
    el("saveDigitalBtn").click();
    expect(window.productData.digitalProducts[0].features).toEqual(["Instant download", "MP3 320kbps"]);

    field("merchItems", 0, "sizes").value = "S, M , , XL";
    el("saveMerchBtn").click();
    expect(window.productData.merchItems[0].sizes).toEqual(["S", "M", "XL"]);
  });

  it("parses the tracklist into title/url pairs and skips malformed lines", () => {
    field("cdProducts", 0, "tracks").value = [
      "Intro | https://cdn.test/intro.mp3",
      "Missing url",
      "  Outro  |  https://cdn.test/outro.mp3  "
    ].join("\n");

    el("saveCdsBtn").click();

    expect(window.productData.cdProducts[0].tracks).toEqual([
      { title: "Intro", url: "https://cdn.test/intro.mp3" },
      { title: "Outro", url: "https://cdn.test/outro.mp3" }
    ]);
  });

  it("parses colours and gives white a border so it stays visible", () => {
    field("merchItems", 0, "colors").value = "White | #FFFFFF\nBlack | #111111\nbroken line";

    el("saveMerchBtn").click();

    expect(window.productData.merchItems[0].colors).toEqual([
      { name: "White", code: "#FFFFFF", border: "1px solid #ccc" },
      { name: "Black", code: "#111111", border: "none" }
    ]);
  });

  it("uses the first gallery image as the main image when none is set", () => {
    field("merchItems", 0, "images").value = "https://cdn.test/first.jpg\nhttps://cdn.test/second.jpg";
    field("merchItems", 0, "imgUrl").value = "";

    el("saveMerchBtn").click();

    expect(window.productData.merchItems[0].imgUrl).toBe("https://cdn.test/first.jpg");
  });

  it("fades the toast out again", () => {
    el("saveDigitalBtn").click();
    expect(el("adminToast").style.opacity).toBe("1");

    vi.advanceTimersByTime(1800);

    expect(el("adminToast").style.opacity).toBe("0");
  });
});

describe("adding and deleting items", () => {
  beforeEach(async () => {
    await bootAdmin();
    login();
  });

  it.each([
    ["addDigitalBtn", "digitalProducts", "New Track"],
    ["addCdBtn", "cdProducts", "New CD"],
    ["addMerchBtn", "merchItems", "New Merch Item"]
  ])("%s prepends a template item with the next free id", (button, key, title) => {
    const before = window.productData[key].length;

    el(button).click();

    expect(window.productData[key]).toHaveLength(before + 1);
    expect(window.productData[key][0]).toMatchObject({ id: 500, title });
  });

  it("deletes an item after confirmation", () => {
    window.confirm = vi.fn(() => true);

    el("list-digital").querySelector(".admin-delete-btn").click();

    expect(window.productData.digitalProducts.map(p => p.id)).toEqual([2]);
    expect(el("adminToast").textContent).toContain("Item removed");
  });

  it("keeps the item when the confirmation is dismissed", () => {
    window.confirm = vi.fn(() => false);

    el("list-digital").querySelector(".admin-delete-btn").click();

    expect(window.productData.digitalProducts).toHaveLength(2);
  });
});

describe("export, reset and logout", () => {
  beforeEach(async () => {
    await bootAdmin();
    login();
  });

  it("exports a products.js the site can be redeployed with", async () => {
    let blobText = "";
    let downloadName = "";
    window.URL.createObjectURL = vi.fn(blob => {
      blobText = blob.__text;
      return "blob:products";
    });
    window.URL.revokeObjectURL = vi.fn();
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(tag => {
      const node = realCreate(tag);
      if (tag === "a") {
        node.click = vi.fn(() => {
          downloadName = node.download;
        });
      }
      return node;
    });
    // Blob text is only readable asynchronously, so capture it on construction.
    const RealBlob = window.Blob;
    window.Blob = class extends RealBlob {
      constructor(parts, opts) {
        super(parts, opts);
        this.__text = parts.join("");
      }
    };

    el("exportBtn").click();

    expect(downloadName).toBe("products.js");
    expect(blobText).toContain("window.productData = {");
    expect(blobText).toContain('"title": "My Gee"');
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:products");
    window.Blob = RealBlob;
  });

  it("resets the catalog after confirmation", () => {
    window.confirm = vi.fn(() => true);

    el("resetBtn").click();

    expect(dataStore.resetToDefaults).toHaveBeenCalled();
    expect(el("adminToast").textContent).toContain("Reset to defaults");
  });

  it("leaves the catalog alone when the reset is dismissed", () => {
    window.confirm = vi.fn(() => false);

    el("resetBtn").click();

    expect(dataStore.resetToDefaults).not.toHaveBeenCalled();
  });

  it("logs out and reloads", () => {
    const reload = vi.fn();
    delete window.location;
    window.location = { reload };

    el("logoutBtn").click();

    expect(sessionStorage.getItem("manlungAdminLoggedIn")).toBeNull();
    expect(reload).toHaveBeenCalled();
  });
});

describe("changing the admin password", () => {
  beforeEach(async () => {
    await bootAdmin();
    login();
  });

  it("reveals the value to paste into config.js", () => {
    el("newPasswordInput").value = "  brand-new-pass  ";

    el("changePasswordForm").dispatchEvent(new window.Event("submit"));

    expect(el("newHashOutput").value).toBe("brand-new-pass");
    expect(el("newHashBox").style.display).toBe("block");
  });

  it("rejects a password shorter than six characters", () => {
    el("newPasswordInput").value = "short";

    el("changePasswordForm").dispatchEvent(new window.Event("submit"));

    expect(el("newHashBox").style.display).toBe("none");
    expect(el("adminToast").textContent).toContain("at least 6 characters");
  });

  it("copies the new password to the clipboard", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(window.navigator, "clipboard", { value: { writeText }, configurable: true });
    el("newPasswordInput").value = "brand-new-pass";
    el("changePasswordForm").dispatchEvent(new window.Event("submit"));

    el("copyHashBtn").click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith("brand-new-pass"));

    expect(el("adminToast").textContent).toContain("Copied");
  });

  it("falls back to execCommand when the clipboard API is unavailable", async () => {
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText: vi.fn(() => Promise.reject(new Error("denied"))) },
      configurable: true
    });
    document.execCommand = vi.fn();
    el("newHashOutput").select = vi.fn();
    el("newPasswordInput").value = "brand-new-pass";
    el("changePasswordForm").dispatchEvent(new window.Event("submit"));

    el("copyHashBtn").click();
    await vi.waitFor(() => expect(document.execCommand).toHaveBeenCalledWith("copy"));
  });
});
