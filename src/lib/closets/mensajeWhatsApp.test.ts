import { describe, expect, test } from "vitest";
import { mensajeCloset } from "@/lib/closets/mensajeWhatsApp";
import { MODELOS, cotizar, normalizar, type ConfigEntrada, type ModeloId } from "@/lib/closets/precios";

const URL_DISENO = "https://lapuerta.mx/closets/x?w=240&c=colorado";
const armar = (e: ConfigEntrada) => {
  const c = normalizar(e);
  return mensajeCloset(c, cotizar(c), URL_DISENO);
};
const base = (modelo: ModeloId): ConfigEntrada => ({ modelo, W: 240, H: MODELOS[modelo].H[0], F: 60 });
const CLAVES = /\*[^*]+\* (classic|gola|premium|bari|aura|barra|mini|plata|negro|dorado|ligera|reforzada|cierre|oculta|ninguno|izq|der|nogal|colorado|hickory|gris|salvia|taupe)\b/;

function sinRarezas(mensaje: string) {
  expect(mensaje).not.toMatch(/undefined|null|NaN/);
  expect(mensaje.split("\n").slice(0, -1).join("\n")).not.toMatch(CLAVES);
}

describe("mensaje de closets", () => {
  test.each(Object.keys(MODELOS) as ModeloId[])("%s trae los datos completos y en orden", (modelo) => {
    const m = armar(base(modelo));
    sinRarezas(m);
    const lineas = m.split("\n");
    expect(lineas[0]).toBe("Hola, quiero cotizar este closet:");
    expect(lineas[2]).toBe(`*Modelo:* ${MODELOS[modelo].nombre}`);
    expect(m).toContain(`*Medidas:* Ancho 240 cm, alto ${MODELOS[modelo].H[0]} cm, fondo 60 cm`);
    expect(m).toContain("*Desglose:*");
    expect(m).toMatch(/\*Total estimado:\* \$[\d,.]+, IVA e instalación incluidos/);
    expect(lineas[lineas.length - 1]).toBe(`*Ver diseño:* ${URL_DISENO}`);
    expect(m.indexOf("*Correderas:*")).toBeLessThan(m.indexOf("*Bisagras:*"));
  });

  test("una cotización con varios extras detalla cada concepto", () => {
    const m = armar({ modelo: "classic", W: 240, H: 280, F: 75, jaladera: "mini", acabado: "negro", corredera: "cierre", bisagra: "cierre", costado: "der", color: "hickory" });
    sinRarezas(m);
    expect(m).toContain("*Color:* Hickory Frida");
    expect(m).toContain("*Jaladera:* Mini, acabado negro");
    expect(m).toContain("*Correderas:* Cierre lento");
    expect(m).toContain("*Bisagras:* Oculta con cierre lento");
    expect(m).toContain("*Espacio:* Falta el muro derecho");
    for (const concepto of ["Fijo superior", "Maletero a 75", "Costado derecho", "Cambio a jaladera mini", "Corredera cierre lento", "Bisagras con cierre lento"]) {
      expect(m).toMatch(new RegExp(`${concepto}.*: \\$`));
    }
  });

  test("Aura incluye entrepañera y no Espacio", () => {
    const m = armar({ ...base("aura"), colorNicho: "salvia" });
    expect(m).toContain("*Color de entrepañera:* Verde Salvia");
    expect(m).not.toContain("*Espacio:*");
  });

  test("Bari y Aura incluyen cajonera; Florencia no", () => {
    expect(armar(base("bari"))).toContain("*Cajonera:* 80 cm de ancho");
    expect(armar(base("aura"))).toContain("*Cajonera:*");
    for (const m of ["classic", "gola", "premium"] as ModeloId[]) expect(armar(base(m))).not.toContain("*Cajonera:*");
  });

  test("Gola muestra Perfil gola y solo Aura lleva entrepañera", () => {
    expect(armar(base("gola"))).toContain("*Jaladera:* Perfil gola");
    expect(armar(base("bari"))).not.toContain("entrepañera");
  });

  test("con medidas inválidas conserva la selección y pide un asesor", () => {
    const m = armar({ ...base("bari"), W: 400 });
    sinRarezas(m);
    expect(m).toContain("*Modelo:* Closet Bari");
    expect(m).toContain("*Observación:* Cotizamos anchos de 160 a 300 cm");
    expect(m).toContain("*Total estimado:* Por confirmar con un asesor");
    expect(m).not.toContain("*Desglose:*");
    expect(m).toContain(`*Ver diseño:* ${URL_DISENO}`);
  });
});
