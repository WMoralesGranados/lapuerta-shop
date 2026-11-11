import { describe, expect, test } from "vitest";
import { PLANTILLAS, cotizar, normalizar, type Pieza } from "@/lib/librero/calc";
import { mensajeLibrero, type DisenoLibrero } from "@/lib/librero/mensajeWhatsApp";

const URL_DISENO = "https://lapuerta.mx/librero-julieta?d=r12&a=80";
const PROMO = new Date(2026, 10, 13);
const VENCIDO = new Date(2026, 11, 1);

function armar(cambio: Partial<DisenoLibrero>, promo = false, hoy = PROMO) {
  const d: DisenoLibrero = { mods: [PLANTILLAS[0]], anchos: [80], color: "nogal", led: true, instalar: false, ...cambio };
  return mensajeLibrero(d, cotizar(d.mods, d.anchos, d.led, d.instalar, 0, hoy), URL_DISENO, promo);
}

function sinRarezas(m: string) {
  expect(m).not.toMatch(/undefined|null|NaN/);
  expect(m.split("\n").slice(0, -1).join("\n")).not.toMatch(/\*[^*]+\* (nogal|colorado|hickory)\b/);
}

describe("mensaje del librero", () => {
  test("1 módulo", () => {
    const m = armar({});
    sinRarezas(m);
    expect(m.split("\n")[0]).toBe("Hola, quiero cotizar este librero Julieta:");
    expect(m).toContain("*Módulos:* 1 (80 cm)");
    expect(m).toContain("*Medida total:* 87 × 200 cm");
    expect(m).toContain("*Repisas:* 4 de 80 cm");
    expect(m).toContain("*Nichos:* 1 de 80 cm");
    expect(m).toContain("*Iluminación:* Con LED");
    expect(m).toContain("*Color:* Nogal Valentina");
    expect(m).toContain("*Instalación:* Sin instalación");
    expect(m).toContain("*Total estimado:* $5,944. Precio con IVA");
    expect(m.split("\n").pop()).toBe(`*Ver diseño:* ${URL_DISENO}`);
  });

  test("4 módulos con anchos distintos e instalación", () => {
    const mods = normalizar([PLANTILLAS[0], PLANTILLAS[1], PLANTILLAS[0], PLANTILLAS[1]]);
    const m = armar({ mods, anchos: [60, 80, 100, 80], led: false, instalar: true, color: "hickory" });
    sinRarezas(m);
    expect(m).toContain("*Módulos:* 4 (60 cm, 80 cm, 100 cm, 80 cm)");
    expect(m).toContain("*Repisas:* 4 de 60 cm, 8 de 80 cm, 4 de 100 cm");
    expect(m).toContain("*Iluminación:* Sin LED");
    expect(m).toMatch(/\*Instalación:\* Incluida en el total, \$[\d,]+ aprox\./);
  });

  test("omite repisas y nichos en cero", () => {
    const m = armar({ mods: [[] as Pieza[]] });
    sinRarezas(m);
    expect(m).not.toContain("*Repisas:*");
    expect(m).not.toContain("*Nichos:*");
  });

  test("con la promoción oculta no aparecen precios por pieza ni descuento", () => {
    const m = armar({});
    expect(m).not.toMatch(/descuento|Antes|Precio de lista|\$1,200|\$1,580/i);
    expect(m.match(/\$/g)).toHaveLength(1);
  });

  test("con la promoción visible usa el texto equivalente mientras esté vigente", () => {
    expect(armar({}, true)).toContain("Precio con descuento e IVA");
    expect(armar({}, true, VENCIDO)).toContain("$7,430. Precio con IVA");
  });
});
