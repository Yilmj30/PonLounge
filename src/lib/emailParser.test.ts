import { describe, expect, it } from "vitest";
import {
  parseReservationRequest,
  extractConfirmationCode,
} from "./emailParser";

describe("parseReservationRequest", () => {
  it("parses the exact Spanish template produced by the mailto button", () => {
    const text = [
      "Hola PON Lounge, quiero reservar una mesa:",
      "Nombre: Yilmar David Murillo Jordan",
      "Personas: 2",
      "Fecha: 2026-10-08",
      "Hora: 20:00",
    ].join("\n");

    expect(parseReservationRequest(text)).toEqual({
      lang: "es",
      name: "Yilmar David Murillo Jordan",
      partySize: 2,
      date: "2026-10-08",
      time: "20:00",
      notes: null,
      depositAmount: null,
      depositReference: null,
    });
  });

  it("parses the exact English template produced by the mailto button", () => {
    const text = [
      "Hi PON Lounge, I'd like to book a table:",
      "Name: Jane Doe",
      "Guests: 4",
      "Date: 2026-11-01",
      "Time: 19:30",
    ].join("\n");

    expect(parseReservationRequest(text)).toEqual({
      lang: "en",
      name: "Jane Doe",
      partySize: 4,
      date: "2026-11-01",
      time: "19:30",
      notes: null,
      depositAmount: null,
      depositReference: null,
    });
  });

  it("includes notes when present", () => {
    const text = [
      "Nombre: Ana",
      "Personas: 3",
      "Fecha: 2026-10-08",
      "Hora: 18:00",
      "Notas: Cumpleaños, mesa cerca de la ventana",
    ].join("\n");

    expect(parseReservationRequest(text)?.notes).toBe(
      "Cumpleaños, mesa cerca de la ventana",
    );
  });

  it("is tolerant of the customer's signature/extra text below the template", () => {
    const text = [
      "Nombre: Carlos",
      "Personas: 2",
      "Fecha: 2026-10-08",
      "Hora: 18:00",
      "",
      "Muchas gracias, nos vemos!",
      "Enviado desde mi iPhone",
    ].join("\n");

    const result = parseReservationRequest(text);
    expect(result?.name).toBe("Carlos");
    expect(result?.partySize).toBe(2);
  });

  it("strips '>' quoting added by some email clients", () => {
    const text = [
      "> Nombre: Carlos",
      "> Personas: 2",
      "> Fecha: 2026-10-08",
      "> Hora: 18:00",
    ].join("\n");

    expect(parseReservationRequest(text)?.name).toBe("Carlos");
  });

  it("is case-insensitive on field labels", () => {
    const text = [
      "NOMBRE: Carlos",
      "personas: 2",
      "Fecha: 2026-10-08",
      "HORA: 18:00",
    ].join("\n");

    expect(parseReservationRequest(text)?.time).toBe("18:00");
  });

  it("pads a single-digit hour to two digits", () => {
    const text = [
      "Nombre: Carlos",
      "Personas: 2",
      "Fecha: 2026-10-08",
      "Hora: 9:00",
    ].join("\n");

    expect(parseReservationRequest(text)?.time).toBe("09:00");
  });

  it("returns null when a required field is missing", () => {
    const text = ["Nombre: Carlos", "Personas: 2", "Fecha: 2026-10-08"].join(
      "\n",
    );
    expect(parseReservationRequest(text)).toBeNull();
  });

  it("returns null for a completely free-form email with no template", () => {
    const text = "hola quiero reservar para 4 el sabado a las 8 porfa";
    expect(parseReservationRequest(text)).toBeNull();
  });

  it("returns null for an invalid party size (zero, negative, or too large)", () => {
    const base = ["Nombre: Carlos", "Fecha: 2026-10-08", "Hora: 18:00"];
    expect(
      parseReservationRequest([...base, "Personas: 0"].join("\n")),
    ).toBeNull();
    expect(
      parseReservationRequest([...base, "Personas: 999"].join("\n")),
    ).toBeNull();
  });

  it("returns null for a malformed date or time", () => {
    expect(
      parseReservationRequest(
        [
          "Nombre: Carlos",
          "Personas: 2",
          "Fecha: 08/10/2026",
          "Hora: 18:00",
        ].join("\n"),
      ),
    ).toBeNull();
    expect(
      parseReservationRequest(
        [
          "Nombre: Carlos",
          "Personas: 2",
          "Fecha: 2026-10-08",
          "Hora: 6pm",
        ].join("\n"),
      ),
    ).toBeNull();
  });

  it("returns null for an empty name", () => {
    const text = [
      "Nombre:",
      "Personas: 2",
      "Fecha: 2026-10-08",
      "Hora: 18:00",
    ].join("\n");
    expect(parseReservationRequest(text)).toBeNull();
  });

  it("parses the deposit amount and reference when present (Spanish)", () => {
    const text = [
      "Nombre: Carlos",
      "Personas: 2",
      "Fecha: 2026-10-08",
      "Hora: 18:00",
      "Depósito transferido: 60000",
      "Referencia: DEP-A3F9K2",
    ].join("\n");
    const result = parseReservationRequest(text);
    expect(result?.depositAmount).toBe(60000);
    expect(result?.depositReference).toBe("DEP-A3F9K2");
  });

  it("parses the deposit amount and reference when present (English)", () => {
    const text = [
      "Name: Carlos",
      "Guests: 2",
      "Date: 2026-10-08",
      "Time: 18:00",
      "Deposit transferred: 60000",
      "Reference: DEP-A3F9K2",
    ].join("\n");
    const result = parseReservationRequest(text);
    expect(result?.depositAmount).toBe(60000);
    expect(result?.depositReference).toBe("DEP-A3F9K2");
  });

  it("strips thousand separators from the deposit amount", () => {
    const text = [
      "Nombre: Carlos",
      "Personas: 2",
      "Fecha: 2026-10-08",
      "Hora: 18:00",
      "Depósito transferido: $60.000",
    ].join("\n");
    expect(parseReservationRequest(text)?.depositAmount).toBe(60000);
  });

  it("leaves deposit fields null when absent", () => {
    const text = [
      "Nombre: Carlos",
      "Personas: 2",
      "Fecha: 2026-10-08",
      "Hora: 18:00",
    ].join("\n");
    const result = parseReservationRequest(text);
    expect(result?.depositAmount).toBeNull();
    expect(result?.depositReference).toBeNull();
  });
});

describe("extractConfirmationCode", () => {
  it("finds a code in the middle of free-form text", () => {
    expect(
      extractConfirmationCode(
        "Hola, quiero cancelar mi reserva PON-A3F9K2, gracias",
      ),
    ).toBe("PON-A3F9K2");
  });

  it("is case-insensitive and normalizes to uppercase", () => {
    expect(extractConfirmationCode("cancelar pon-a3f9k2")).toBe("PON-A3F9K2");
  });

  it("returns null when there's no code", () => {
    expect(
      extractConfirmationCode("quiero reservar para el sabado"),
    ).toBeNull();
  });

  it("does not match a malformed near-code", () => {
    expect(extractConfirmationCode("mi código es PON-12345")).toBeNull(); // only 5 chars
    expect(extractConfirmationCode("mi código es PON123456")).toBeNull(); // missing dash
  });
});
