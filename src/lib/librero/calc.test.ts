import { expect, test } from "vitest";
import {
  LIBRERO,
  PLANTILLAS,
  aTexto,
  agregarItem,
  altoDe,
  cotizar as cotizarEn,
  deTexto,
  moverItem,
  normalizar,
  normalizarAnchos,
  precioDesdeLibrero,
  rangoItem,
  resumen,
  type Pieza,
} from "@/lib/librero/calc";

// Fecha fija para que estas pruebas no cambien cuando termine la promoción.
const cotizar = (m: Pieza[][], a: number[], l?: boolean, i?: boolean, p?: number) =>
  cotizarEn(m, a, l, i, p, new Date(2026, 10, 2));
const sinEncimar = (m: Pieza[]) => m.every((it, i) => !m[i + 1] || it.y + altoDe(it) + LIBRERO.separacionMin <= m[i + 1].y);

test("el paral intermedio se comparte: N módulos llevan N + 1 parales", () => {
  const r2 = resumen(normalizar(PLANTILLAS));
  expect(r2.parales).toBe(3);
  expect(r2.ancho).toBe(170.5);
  expect(r2.nichos).toBe(2);
  expect(r2.repisas).toBe(8);
  expect(resumen([[]]).parales).toBe(2);
  expect(resumen([[], [], [], []]).ancho).toBe(337.5);
});

test("cada módulo puede ser de 60, 80 o 100 y cuenta sus piezas por ancho", () => {
  const m = normalizar(PLANTILLAS);
  const r = resumen(m, [60, 100]);
  expect(r.ancho).toBe(170.5);
  expect(r.repisasPorAncho).toEqual([{ w: 60, cant: 4 }, { w: 100, cant: 4 }]);
  expect(r.nichosPorAncho).toEqual([{ w: 60, cant: 1 }, { w: 100, cant: 1 }]);
  expect(resumen(m, [100, 100]).ancho).toBe(210.5);
  expect(normalizarAnchos(["60", 70], 3)).toEqual([60, 80, 80]);
});

test("precio: parales, repisas y nichos por ancho, con 20% de descuento", () => {
  const m = normalizar(PLANTILLAS);
  const q = cotizar(m, [80, 80], true);
  expect(q.lista).toBe(13660);
  expect(q.ahorro).toBe(2732);
  expect(q.total).toBe(10928);
  expect(cotizar(m, [80, 80], false).lista).toBe(3 * 1200 + 8 * 390 + 2 * 1890);
  expect(cotizar(m, [60, 100], true).lista).toBe(3 * 1200 + 4 * 790 + 4 * 310 + 4 * 510 + 1230 + 2550);
  expect(cotizar([[]], [80], false).total).toBe(1920);
  const conI = cotizar(m, [80, 80], true, true);
  expect(conI.instalacion).toBe(1310);
  expect(conI.total).toBe(10928 + 1310);
  expect(conI.ahorro).toBe(2732);
  expect(q.instalacion).toBe(0);
  const p10 = cotizar(m, [80, 80], true, false, 10);
  expect(p10.ahorroPromo).toBe(1092.8);
  expect(p10.total).toBe(9835.2);
  expect(cotizar(m, [80, 80], true, false, 50).porcentajePromo).toBe(10);
  expect(cotizar(m, [80, 80], true, true, 10).instalacion).toBe(1310);
  // Precio de entrada: 1 módulo de 80 con LED, 4 repisas y 1 nicho.
  expect(cotizar([m[0]], [80], true).total).toBe(5944);
  // LED: $790 por tira, 2 tiras por módulo, antes del descuento.
  expect(q.lineas[1].precio).toBe(3160);
  expect(cotizar([m[0], m[1], m[0]], [80, 80, 80], true).lineas[1].precio).toBe(4740);
  // El descuento dura hasta el último minuto del 30 de noviembre.
  expect(cotizarEn(m, [80, 80], true, false, 0, new Date(2026, 10, 30, 23, 59)).total).toBe(10928);
  const vencido = cotizarEn(m, [80, 80], true, false, 0, new Date(2026, 11, 1));
  expect(vencido.descuento).toBe(0);
  expect(vencido.total).toBe(13660);
});

test("las plantillas respetan límites y separación", () => {
  for (const m of normalizar(PLANTILLAS)) {
    expect(sinEncimar(m)).toBe(true);
    expect(m[m.length - 1].y + altoDe(m[m.length - 1])).toBeLessThanOrEqual(LIBRERO.paral.alto);
  }
  expect(normalizar(PLANTILLAS)[0].length).toBe(5);
});

test("mover no permite encimar ni salir del paral", () => {
  const m = normalizar(PLANTILLAS)[0];
  const a = moverItem(m, 1, 999);
  expect(sinEncimar(a)).toBe(true);
  const b = moverItem(m, 0, -50);
  expect(b[0].y).toBe(5);
  const c = moverItem(m, 4, 999);
  expect(c[4].y).toBe(198);
  const [min, max] = rangoItem(m, 1);
  expect(min).toBeLessThanOrEqual(max);
});

test("agregar busca el hueco más amplio y avisa si no cabe", () => {
  let m: Pieza[] = [];
  m = agregarItem(m, "n")!;
  expect(m.length).toBe(1);
  for (let k = 0; k < 20; k++) {
    const n = agregarItem(m, "r");
    if (!n) break;
    m = n;
    expect(sinEncimar(m)).toBe(true);
  }
  expect(agregarItem(m, "r")).toBe(null);
});

test("sin hueco libre, reparte parejo sin encimar y conserva la repisa superior", () => {
  const m = normalizar(PLANTILLAS)[0];
  const n = agregarItem(m, "r")!;
  expect(n.length).toBe(m.length + 1);
  expect(sinEncimar(n)).toBe(true);
  expect(n[n.length - 1].y + altoDe(n[n.length - 1])).toBeLessThanOrEqual(LIBRERO.paral.alto);
  expect(n[n.length - 1].t).toBe("r");
});

test("datos raros de la liga no rompen el diseño", () => {
  expect(normalizar(deTexto("x9.rzz.n999_")).length).toBe(2);
  expect(normalizar(null).length).toBe(2);
  expect(normalizar(Array(9).fill([])).length).toBe(LIBRERO.modulos[1]);
  const m = normalizar(PLANTILLAS);
  expect(normalizar(deTexto(aTexto(m)))).toEqual(m);
});

test("precio inicial del librero con fecha fija", () => {
  expect(precioDesdeLibrero(new Date(2026, 10, 13))).toBe(5944);
  expect(precioDesdeLibrero(new Date(2026, 11, 1))).toBe(7430);
});
