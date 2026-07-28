import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadScript, resetStorage, setBody, siteConfig } from "./helpers/harness.js";

const MENU_DOM = `
  <button id="menuOpenBtn"></button>
  <div id="menuOverlay">
    <button id="closeMenuBtn"></button>
    <a href="#" data-policy="shipping">Shipping</a>
    <a href="#" data-policy="privacy">Privacy</a>
    <a href="#" data-policy="nope">Broken link</a>
    <a href="#" id="menuContactLink">Contact</a>
    <input id="menuNewsletterEmail">
    <button id="menuNewsletterBtn"></button>
  </div>
  <div id="policyModal">
    <h3 id="policyModalTitle"></h3>
    <div id="policyModalBody"></div>
    <button id="policyModalClose"></button>
  </div>
  <a href="#" data-nav="contact">Contact section</a>
  <div id="accountLoggedOut">
    <input id="accountEmail">
    <input id="accountPassword">
    <button id="accountLoginBtn"></button>
    <button id="accountCreateBtn"></button>
    <div id="accountError"></div>
  </div>
  <div id="accountLoggedIn" style="display:none">
    <span id="accountEmailDisplay"></span>
    <button id="accountLogoutBtn"></button>
  </div>
`;

let menuFunctions;
let cartFunctions;

function fillAccountForm(email, password) {
  document.getElementById("accountEmail").value = email;
  document.getElementById("accountPassword").value = password;
}

const el = id => document.getElementById(id);

beforeEach(async () => {
  resetStorage();
  setBody(MENU_DOM);
  siteConfig();
  cartFunctions = { showToast: vi.fn() };
  window.cartFunctions = cartFunctions;
  delete window.dataStore;
  await loadScript("js/menu.js");
  menuFunctions = window.menuFunctions;
});

describe("initMenuPanel", () => {
  it("opens and closes the slide-out menu", () => {
    menuFunctions.initMenuPanel();

    el("menuOpenBtn").click();
    expect(el("menuOverlay").classList.contains("open")).toBe(true);

    el("closeMenuBtn").click();
    expect(el("menuOverlay").classList.contains("open")).toBe(false);
  });

  it("opens a policy page and closes the menu behind it", () => {
    menuFunctions.initMenuPanel();
    el("menuOpenBtn").click();

    document.querySelector('[data-policy="privacy"]').click();

    expect(el("policyModalTitle").textContent).toBe("Privacy Policy");
    expect(el("policyModalBody").innerHTML).toContain("Paystack");
    expect(el("policyModal").classList.contains("open")).toBe(true);
    expect(el("menuOverlay").classList.contains("open")).toBe(false);
  });

  it("ignores a policy key that has no content", () => {
    menuFunctions.initMenuPanel();

    document.querySelector('[data-policy="nope"]').click();

    expect(el("policyModal").classList.contains("open")).toBe(false);
  });

  it("closes the policy modal", () => {
    menuFunctions.initMenuPanel();
    document.querySelector('[data-policy="shipping"]').click();

    el("policyModalClose").click();

    expect(el("policyModal").classList.contains("open")).toBe(false);
  });

  it("forwards the contact link to the contact nav item", () => {
    menuFunctions.initMenuPanel();
    const navClick = vi.fn();
    document.querySelector('[data-nav="contact"]').addEventListener("click", navClick);

    el("menuContactLink").click();

    expect(navClick).toHaveBeenCalled();
    expect(el("menuOverlay").classList.contains("open")).toBe(false);
  });

  it("accepts a valid newsletter email and clears the field", () => {
    menuFunctions.initMenuPanel();
    el("menuNewsletterEmail").value = "fan@example.com";

    el("menuNewsletterBtn").click();

    expect(cartFunctions.showToast).toHaveBeenCalledWith("Subscribed!");
    expect(el("menuNewsletterEmail").value).toBe("");
  });

  it("rejects an invalid newsletter email and keeps what was typed", () => {
    menuFunctions.initMenuPanel();
    el("menuNewsletterEmail").value = "not-an-email";

    el("menuNewsletterBtn").click();

    expect(cartFunctions.showToast).toHaveBeenCalledWith("Enter a valid email");
    expect(el("menuNewsletterEmail").value).toBe("not-an-email");
  });

  it("does nothing when the menu markup is absent", () => {
    setBody("");

    expect(() => menuFunctions.initMenuPanel()).not.toThrow();
  });
});

describe("account system (local fallback)", () => {
  it("creates an account, stores it and logs the visitor in", () => {
    menuFunctions.initAccountSystem();
    fillAccountForm("Fan@Example.com ", "hunter2secret");

    el("accountCreateBtn").click();

    expect(JSON.parse(localStorage.getItem("manlungAccounts"))).toEqual({ "fan@example.com": "hunter2secret" });
    expect(sessionStorage.getItem("manlungLoggedInEmail")).toBe("fan@example.com");
    expect(el("accountLoggedIn").style.display).toBe("block");
    expect(el("accountLoggedOut").style.display).toBe("none");
    expect(el("accountEmailDisplay").textContent).toBe("fan@example.com");
  });

  it.each([
    ["an invalid email", "bad-email", "hunter2secret", "Enter a valid email first"],
    ["a short password", "fan@example.com", "12345", "Password should be at least 6 characters"]
  ])("refuses to create an account with %s", (_label, email, password, message) => {
    menuFunctions.initAccountSystem();
    fillAccountForm(email, password);

    el("accountCreateBtn").click();

    expect(el("accountError").textContent).toBe(message);
    expect(localStorage.getItem("manlungAccounts")).toBeNull();
  });

  it("refuses to create a duplicate account", () => {
    localStorage.setItem("manlungAccounts", JSON.stringify({ "fan@example.com": "hunter2secret" }));
    menuFunctions.initAccountSystem();
    fillAccountForm("fan@example.com", "different1");

    el("accountCreateBtn").click();

    expect(el("accountError").textContent).toContain("already exists");
    expect(JSON.parse(localStorage.getItem("manlungAccounts"))["fan@example.com"]).toBe("hunter2secret");
  });

  it("logs in with the right password", () => {
    localStorage.setItem("manlungAccounts", JSON.stringify({ "fan@example.com": "hunter2secret" }));
    menuFunctions.initAccountSystem();
    fillAccountForm("FAN@example.com", "hunter2secret");

    el("accountLoginBtn").click();

    expect(sessionStorage.getItem("manlungLoggedInEmail")).toBe("fan@example.com");
    expect(cartFunctions.showToast).toHaveBeenCalledWith("Logged in!");
  });

  it.each([
    ["blank credentials", {}, "", "", "Enter your email and password"],
    ["an unknown email", {}, "ghost@example.com", "hunter2secret", "No account found with that email — create one below"],
    ["a wrong password", { "fan@example.com": "hunter2secret" }, "fan@example.com", "wrongpass", "Incorrect password"]
  ])("rejects a login with %s", (_label, accounts, email, password, message) => {
    localStorage.setItem("manlungAccounts", JSON.stringify(accounts));
    menuFunctions.initAccountSystem();
    fillAccountForm(email, password);

    el("accountLoginBtn").click();

    expect(el("accountError").textContent).toBe(message);
    expect(sessionStorage.getItem("manlungLoggedInEmail")).toBeNull();
  });

  it("restores the session on the next page load", () => {
    sessionStorage.setItem("manlungLoggedInEmail", "fan@example.com");

    menuFunctions.initAccountSystem();

    expect(el("accountEmailDisplay").textContent).toBe("fan@example.com");
    expect(el("accountLoggedIn").style.display).toBe("block");
  });

  it("logs out and returns to the signed-out view", () => {
    sessionStorage.setItem("manlungLoggedInEmail", "fan@example.com");
    menuFunctions.initAccountSystem();

    el("accountLogoutBtn").click();

    expect(sessionStorage.getItem("manlungLoggedInEmail")).toBeNull();
    expect(el("accountLoggedOut").style.display).toBe("block");
    expect(el("accountLoggedIn").style.display).toBe("none");
    expect(cartFunctions.showToast).toHaveBeenCalledWith("Logged out");
  });

  it("survives a corrupt accounts blob in localStorage", () => {
    localStorage.setItem("manlungAccounts", "{not json");
    menuFunctions.initAccountSystem();
    fillAccountForm("fan@example.com", "hunter2secret");

    el("accountCreateBtn").click();

    expect(sessionStorage.getItem("manlungLoggedInEmail")).toBe("fan@example.com");
  });

  it("does nothing when the account markup is absent", () => {
    setBody("");

    expect(() => menuFunctions.initAccountSystem()).not.toThrow();
  });
});

describe("account system (Supabase auth)", () => {
  let auth;

  beforeEach(async () => {
    siteConfig({ SUPABASE_CONFIG: { url: "https://project.supabase.co", anonKey: "anon" } });
    auth = {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(() => Promise.resolve({ error: null })),
      signUp: vi.fn(() => Promise.resolve({ error: null })),
      signOut: vi.fn(() => Promise.resolve({}))
    };
    window.dataStore = { getClient: () => ({ auth }) };
  });

  it("reflects an existing cloud session", async () => {
    auth.getSession = vi.fn(() => Promise.resolve({ data: { session: { user: { email: "fan@example.com" } } } }));

    menuFunctions.initAccountSystem();

    await vi.waitFor(() => expect(el("accountEmailDisplay").textContent).toBe("fan@example.com"));
    expect(auth.onAuthStateChange).toHaveBeenCalled();
  });

  it("shows the signed-out view when there is no cloud session", async () => {
    menuFunctions.initAccountSystem();

    await vi.waitFor(() => expect(el("accountLoggedOut").style.display).toBe("block"));
  });

  it("signs in through Supabase", async () => {
    menuFunctions.initAccountSystem();
    fillAccountForm("fan@example.com", "hunter2secret");

    el("accountLoginBtn").click();

    await vi.waitFor(() => expect(cartFunctions.showToast).toHaveBeenCalledWith("Logged in!"));
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "fan@example.com", password: "hunter2secret" });
    expect(localStorage.getItem("manlungAccounts")).toBeNull();
  });

  it("surfaces a Supabase sign-in error", async () => {
    auth.signInWithPassword = vi.fn(() => Promise.resolve({ error: { message: "Invalid login credentials" } }));
    menuFunctions.initAccountSystem();
    fillAccountForm("fan@example.com", "hunter2secret");

    el("accountLoginBtn").click();

    await vi.waitFor(() => expect(el("accountError").textContent).toBe("Invalid login credentials"));
  });

  it("signs up through Supabase and asks the visitor to confirm their email", async () => {
    menuFunctions.initAccountSystem();
    fillAccountForm("fan@example.com", "hunter2secret");

    el("accountCreateBtn").click();

    await vi.waitFor(() => expect(auth.signUp).toHaveBeenCalled());
    expect(cartFunctions.showToast).toHaveBeenCalledWith(expect.stringContaining("Check your email"));
  });

  it("requires both fields before calling Supabase sign-up", () => {
    menuFunctions.initAccountSystem();
    fillAccountForm("", "");

    el("accountCreateBtn").click();

    expect(auth.signUp).not.toHaveBeenCalled();
    expect(el("accountError").textContent).toContain("Enter an email and password first");
  });

  it("surfaces a Supabase sign-up error", async () => {
    auth.signUp = vi.fn(() => Promise.resolve({ error: { message: "User already registered" } }));
    menuFunctions.initAccountSystem();
    fillAccountForm("fan@example.com", "hunter2secret");

    el("accountCreateBtn").click();

    await vi.waitFor(() => expect(el("accountError").textContent).toBe("User already registered"));
  });

  it("signs out through Supabase", async () => {
    menuFunctions.initAccountSystem();

    el("accountLogoutBtn").click();

    await vi.waitFor(() => expect(auth.signOut).toHaveBeenCalled());
    expect(cartFunctions.showToast).toHaveBeenCalledWith("Logged out");
  });
});
