import { describe, expect, test } from "vitest";
import { ESPACIOS, cotizarV, type TipoEspacio } from "@/lib/vestidor/calc";
import { mensajeVestidor } from "@/lib/vestidor/mensajeWhatsApp";
import { leerEstado } from "@/lib/vestidor/url";

const URL_DISENO = "https://lapuerta.mx/vestidores?t=U&e=colgar";
const PROMO = new Date(2026, 10, 13);

function armar(q: string, promo = false) {
  const e = leerEstado(new URLSearchParams(q));
  return mensajeVestidor(e, cotizarV(e.diseno.paredes, e.led, e.instalar, 0, PROMO, e.cl), URL_DISENO, promo);
}

function sinRarezas(m: string) {
  expect(m).not.toMatch(/undefined|null|NaN/);
  expect(m.split("\n").slice(0, -1).join("\n")).not.toMatch(/\*[^*]+\* (lineal|L|U|espejo|colgar|cajones|repisas|equilibrado|nichos|nogal|colorado|hickory|negro|plata|dorado)\b/);
}

describe("mensaje del vestidor", () => {
  test.each(Object.keys(ESPACIOS) as TipoEspacio[])("tipo %s", (t) => {
    const m = armar(`t=${t}&e=cajones`);
    sinRarezas(m);
    const lineas = m.split("\n");
    expect(lineas[0]).toBe("Hola, quiero cotizar este vestidor:");
    expect(lineas[2]).toBe(`*Tipo:* ${ESPACIOS[t].nombre}`);
    expect(m).toContain("*Estilo:* Más cajones");
    expect(m).toMatch(/\*Módulos:\* .*: /);
    expect(m).toMatch(/\*Total estimado:\* \$[\d,]+\. Precio con IVA/);
    expect(lineas[lineas.length - 1]).toBe(`*Ver diseño:* ${URL_DISENO}`);
    expect(m.includes("*Pasillo:*")).toBe(t === "U" || t === "espejo");
  });

  test("medidas con el nombre de cada pared, separación y pasillo", () => {
    const m = armar("t=espejo");
    expect(m).toContain("*Medidas:* Pared 1 260 cm, Pared 2 260 cm, Separación entre paredes 220 cm");
    expect(m).toContain("*Pasillo:* 100 cm");
  });

  test("módulos por pared indicando el ajuste", () => {
    expect(armar("t=L")).toContain("*Módulos:* Fondo: ajuste de 88 cm, 80 cm, 80 cm; Lateral: 80 cm, ajuste de 70.5 cm");
  });

  test("piezas con total y por ancho, omitiendo las que están en cero", () => {
    const m = armar("t=lineal&a=260&e=colgar");
    expect(m).toMatch(/\*Repisas:\* \d+ \(.* de 80 cm/);
    expect(m).toMatch(/\*Tubos:\* 3 \(3 de 80 cm\)/);
    expect(m).not.toContain("*Cajoneras:*");
    expect(m).not.toContain("*Correderas:*");
  });

  test("correderas y jaladera solo con cajoneras", () => {
    const m = armar("t=lineal&e=cajones&k=1&j=negro");
    expect(m).toMatch(/\*Cajoneras:\* \d+ \(/);
    expect(m).toContain("*Correderas:* Cierre lento. Jaladera mini negro");
  });

  test("instalación con su costo", () => {
    expect(armar("t=L&i=1")).toMatch(/\*Instalación:\* Incluida en el total, \$[\d,]+ aprox\./);
    expect(armar("t=L")).toContain("*Instalación:* Sin instalación");
  });

  test("con la promoción oculta no aparecen precios por pieza ni descuento", () => {
    const m = armar("t=L&e=cajones&i=1");
    expect(m).not.toMatch(/descuento|Antes|Precio de lista/i);
    expect(m.match(/\$/g)).toHaveLength(2);
    expect(armar("t=L", true)).toContain("Precio con descuento e IVA");
  });

  test("con diseño inválido conserva la selección y pide un asesor", () => {
    const m = armar("t=lineal&a=50&i=1");
    sinRarezas(m);
    expect(m).toContain("*Medidas:* Largo de la pared 50 cm");
    expect(m).toContain("*Módulos:* Pared: sin módulos");
    expect(m).toContain("*Observación:* Largo de la pared: de 100 a 600 cm.");
    expect(m).toContain("*Instalación:* Solicitada");
    expect(m).toContain("*Total estimado:* Por confirmar con un asesor");
    expect(m).not.toContain("Precio con IVA");
  });

  test("pasillo insuficiente es inválido", () => {
    expect(armar("t=U&a=170")).toContain("*Observación:* Queda un pasillo de 50 cm");
  });
});
