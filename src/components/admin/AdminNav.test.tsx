import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import AdminNav from "./AdminNav";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  usePathname: () => "/admin/depositos",
}));

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => Response.json({ status: "ok" }));
  vi.stubGlobal("fetch", fetchMock);
  push.mockClear();
  refresh.mockClear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AdminNav", () => {
  it("shows owners both sections", () => {
    render(<AdminNav role="owner" />);
    expect(screen.getByRole("link", { name: "Depósitos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Carta" })).toBeInTheDocument();
    expect(screen.getByText("Dueños")).toBeInTheDocument();
  });

  it("hides the menu editor from employees", () => {
    render(<AdminNav role="staff" />);
    expect(screen.getByRole("link", { name: "Depósitos" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Carta" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Equipo")).toBeInTheDocument();
  });

  it("logs out and returns to the login page", async () => {
    render(<AdminNav role="staff" />);
    fireEvent.click(screen.getByRole("button", { name: "Salir" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin"));
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/logout", {
      method: "POST",
    });
  });
});
