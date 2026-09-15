import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import MenuEditor from "./MenuEditor";
import type { AdminMenuCategory } from "@/lib/menu";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const categories: AdminMenuCategory[] = [
  {
    id: "casa",
    nameEs: "Cócteles de la Casa",
    nameEn: null,
    sortOrder: 0,
    items: [
      {
        id: "item-1",
        categoryId: "casa",
        nameEs: "Dama de P.O.N",
        nameEn: null,
        descEs: "Licor de almendras",
        descEn: null,
        price: 52000,
        image: null,
        subcategoryEs: null,
        subcategoryEn: null,
        available: true,
        sortOrder: 0,
      },
      {
        id: "item-2",
        categoryId: "casa",
        nameEs: "Pacífico Sour",
        nameEn: null,
        descEs: "Viche",
        descEn: null,
        price: null,
        image: null,
        subcategoryEs: null,
        subcategoryEn: null,
        available: false,
        sortOrder: 1,
      },
    ],
  },
  { id: "cafe", nameEs: "Café", nameEn: null, sortOrder: 1, items: [] },
];

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => Response.json({ status: "ok" }));
  vi.stubGlobal("fetch", fetchMock);
  refresh.mockClear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function lastRequest() {
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  return {
    url,
    method: init?.method,
    body: init?.body ? JSON.parse(init.body) : undefined,
  };
}

describe("MenuEditor", () => {
  it("lists categories with item counts, collapsed until opened", () => {
    render(<MenuEditor categories={categories} />);
    expect(screen.getByText("Cócteles de la Casa")).toBeInTheDocument();
    expect(screen.getByText(/2 productos · 1 ocultos/)).toBeInTheDocument();
    expect(screen.queryByText("Dama de P.O.N")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Cócteles de la Casa"));
    expect(screen.getByText("Dama de P.O.N")).toBeInTheDocument();
    expect(screen.getByText("(oculto)")).toBeInTheDocument();
  });

  it("search matches without accents and expands the results", () => {
    render(<MenuEditor categories={categories} />);
    fireEvent.change(screen.getByLabelText("Buscar producto"), {
      target: { value: "pacifico" },
    });
    expect(screen.getByText("Pacífico Sour")).toBeInTheDocument();
    expect(screen.queryByText("Dama de P.O.N")).not.toBeInTheDocument();
    expect(screen.queryByText("Café")).not.toBeInTheDocument();
  });

  it("toggles visibility with the full item payload", async () => {
    render(<MenuEditor categories={categories} />);
    fireEvent.click(screen.getByText("Cócteles de la Casa"));
    fireEvent.click(screen.getByRole("button", { name: "Mostrar" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(lastRequest()).toEqual({
      url: "/api/admin/menu/items/item-2",
      method: "PATCH",
      body: expect.objectContaining({
        nameEs: "Pacífico Sour",
        categoryId: "casa",
        available: true,
      }),
    });
  });

  it("edits a price from the dialog", async () => {
    render(<MenuEditor categories={categories} />);
    fireEvent.click(screen.getByText("Cócteles de la Casa"));
    fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]!);

    const price = screen.getByLabelText("Precio (COP)");
    fireEvent.change(price, { target: { value: "58.000" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(lastRequest()).toMatchObject({
      url: "/api/admin/menu/items/item-1",
      method: "PATCH",
      body: { price: 58000, nameEs: "Dama de P.O.N" },
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("creates a product in the chosen category", async () => {
    render(<MenuEditor categories={categories} />);
    fireEvent.click(screen.getByText("Café"));
    fireEvent.click(screen.getByRole("button", { name: "+ Agregar producto" }));

    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Cold Brew" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(lastRequest()).toMatchObject({
      url: "/api/admin/menu/items",
      method: "POST",
      body: { categoryId: "cafe", nameEs: "Cold Brew", price: null },
    });
  });

  it("shows the server's reason when a save fails and keeps the dialog open", async () => {
    fetchMock.mockImplementation(async () =>
      Response.json({ error: "unauthorized" }, { status: 401 }),
    );
    render(<MenuEditor categories={categories} />);
    fireEvent.click(screen.getByText("Cócteles de la Casa"));
    fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText(/Tu sesión expiró/)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("won't delete a category that still has products", () => {
    render(<MenuEditor categories={categories} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Eliminar" })[0]!);
    expect(screen.getByRole("alert")).toHaveTextContent(
      /todavía tiene productos/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deletes a product only after confirmation", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    render(<MenuEditor categories={categories} />);
    fireEvent.click(screen.getByText("Cócteles de la Casa"));

    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar Dama de P.O.N" }),
    );
    expect(fetchMock).not.toHaveBeenCalled();

    confirm.mockReturnValueOnce(true);
    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar Dama de P.O.N" }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(lastRequest()).toMatchObject({
      url: "/api/admin/menu/items/item-1",
      method: "DELETE",
    });
  });
});
