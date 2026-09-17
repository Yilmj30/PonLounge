import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./config", () => ({
  ADMIN_PASSWORD: "clave-duenos",
  STAFF_PASSWORD: "clave-equipo",
}));

// Stands in for the session cookie the browser would send.
const session: { value: string | undefined } = { value: undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (session.value ? { value: session.value } : undefined),
  }),
}));

import {
  getAdminRole,
  isAdminAuthenticated,
  isOwnerAuthenticated,
  roleForPassword,
} from "./adminAuth";

beforeEach(() => {
  session.value = undefined;
});

describe("roleForPassword", () => {
  it("maps each password to its level and rejects anything else", () => {
    expect(roleForPassword("clave-duenos")).toBe("owner");
    expect(roleForPassword("clave-equipo")).toBe("staff");
    expect(roleForPassword("otra")).toBeNull();
    expect(roleForPassword("")).toBeNull();
  });
});

describe("session role", () => {
  it("has no role without a session cookie", async () => {
    expect(await getAdminRole()).toBeNull();
    expect(await isAdminAuthenticated()).toBe(false);
    expect(await isOwnerAuthenticated()).toBe(false);
  });

  it("gives owners the full panel", async () => {
    session.value = "clave-duenos";
    expect(await getAdminRole()).toBe("owner");
    expect(await isAdminAuthenticated()).toBe(true);
    expect(await isOwnerAuthenticated()).toBe(true);
  });

  it("lets employees in but not into the menu editor", async () => {
    session.value = "clave-equipo";
    expect(await getAdminRole()).toBe("staff");
    expect(await isAdminAuthenticated()).toBe(true);
    expect(await isOwnerAuthenticated()).toBe(false);
  });

  it("ignores a cookie that isn't one of the passwords", async () => {
    // The cookie holds the password itself, so writing "owner" into it by
    // hand grants nothing.
    session.value = "owner";
    expect(await getAdminRole()).toBeNull();
    expect(await isAdminAuthenticated()).toBe(false);
  });
});
