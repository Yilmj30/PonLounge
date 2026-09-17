import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import SpotsPanel from "./SpotsPanel";
import { DEFAULT_SPOTS, type VenueSpot } from "@/lib/spots";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

function spots(
  overrides: Record<string, Partial<VenueSpot>> = {},
): VenueSpot[] {
  return DEFAULT_SPOTS.map((s) => ({
    ...s,
    blocked: false,
    blockedReason: null,
    ...overrides[s.id],
  }));
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => Response.json({ status: "ok" }));
  vi.stubGlobal("fetch", fetchMock);
  refresh.mockClear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function lastRequest() {
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  return { url, method: init?.method, body: JSON.parse(init.body) };
}

describe("SpotsPanel", () => {
  it("lists the 6 tables and 4 bar stools with what's left tonight", () => {
    render(<SpotsPanel spots={spots()} reservedToday={2} />);

    expect(screen.getByText("Mesa 1")).toBeInTheDocument();
    expect(screen.getByText("Barra 4")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Bloquear" })).toHaveLength(
      10,
    );
    // 10 spots - 2 reservations = 8 free.
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("blocks a table with an optional reason", async () => {
    render(<SpotsPanel spots={spots()} reservedToday={0} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Bloquear" })[2]!);

    fireEvent.change(screen.getByLabelText("Motivo (opcional)"), {
      target: { value: "ocupada sin reserva" },
    });
    // The dialog's submit button is the last "Bloquear" on screen.
    fireEvent.click(
      screen.getAllByRole("button", { name: "Bloquear" }).at(-1)!,
    );

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(lastRequest()).toEqual({
      url: "/api/admin/spots/mesa-3",
      method: "PATCH",
      body: { blocked: true, reason: "ocupada sin reserva" },
    });
  });

  it("unblocks in one click, without asking for anything", async () => {
    render(
      <SpotsPanel
        spots={spots({ "barra-1": { blocked: true, blockedReason: "llena" } })}
        reservedToday={0}
      />,
    );
    expect(screen.getByText(/Bloqueada · llena/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Desbloquear" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(lastRequest()).toEqual({
      url: "/api/admin/spots/barra-1",
      method: "PATCH",
      body: { blocked: false, reason: null },
    });
  });

  it("shows the reason when the server rejects the change", async () => {
    fetchMock.mockImplementation(async () =>
      Response.json({ error: "unauthorized" }, { status: 401 }),
    );
    render(<SpotsPanel spots={spots()} reservedToday={0} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Bloquear" })[0]!);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Bloquear" }).at(-1)!,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Tu sesión expiró/,
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
