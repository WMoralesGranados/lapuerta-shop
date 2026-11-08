import { expect, test } from "vitest";
import {
  AJUSTE,
  ESPACIOS,
  ESTILOS,
  TUBO,
  VESTIDOR,
  agregarV,
  ajustar,
  armarPared,
  cabeCajonera,
  cajonerasDe,
  cotizarV,
  disenar,
  limpiarV,
  moverV,
  precioCajonera,
  precioDesdeVestidor,
  precioRepisa,
  precioTubo,
  tramos,
  type Lado,
  type PiezaV,
} from "@/lib/vestidor/calc";

const HOY = new Date(2026, 10, 3);
const P = VESTIDOR.paralGrosor;
const ocupa = (anchos: number[]) => anchos.reduce((a, w) => a + w, 0) + (anchos.length + 1) * P;

test("ajustar cierra la pared con un módulo de ajuste de 50 a 100 cm", () => {
  for (let largo = 59; largo <= 600; largo += 1.7) {
    const { anchos, ajuste, sobrante } = ajustar(largo);
    expect(anchos.length, `${largo}`).toBeGreaterThan(0);
    expect(ocupa(anchos)).toBeLessThanOrEqual(largo - AJUSTE.holgura + 1e-9);
    const hueco = largo > 107 && largo < 119.5; // solo cabe un módulo de 100
    expect(sobrante, `${largo}: sobra ${sobrante}`).toBeGreaterThanOrEqual(AJUSTE.holgura);
    expect(sobrante, `${largo}: sobra ${sobrante}`).toBeLessThan(hueco ? 16 : AJUSTE.holgura + 0.6);
    anchos.forEach((w, i) => {
      if (i === ajuste) expect(w >= 50 && w <= 100 && ![60, 80, 100].includes(w)).toBe(true);
      else expect([60, 80, 100].includes(w), `${largo}: ${anchos}`).toBe(true);
    });
  }
  expect(ajustar(260).anchos).toEqual([80, 80, 88]);
  expect(ajustar(160, "ini")).toEqual({ anchos: [70.5, 80], ajuste: 0, sobrante: 2 });
  expect(ajustar(56).anchos).toEqual([]);
});

test("el módulo de ajuste solo lleva repisas y se cobra proporcional", () => {
  for (const tipo of Object.keys(ESPACIOS)) {
    for (const estilo of ["repisas", "equilibrado", "nichos"]) {
      for (const p of disenar(tipo, {}, estilo).paredes) {
        if (p.ajuste >= 0) expect(p.mods[p.ajuste].every((it) => it.t === "r")).toBe(true);
      }
    }
  }
  expect(precioRepisa(50)).toBe(400);
  expect(precioRepisa(70.5)).toBe(453);
  expect(precioRepisa(90)).toBe(585);
  expect(precioRepisa(100)).toBe(670);
  const d = disenar("L", { A: 260, B: 220 });
  const q = cotizarV(d.paredes, false, false, 0, HOY);
  expect(q.lineas.some((l) => l.concepto === "6 repisas de 70.5 cm a la medida" && l.precio === 6 * 453)).toBe(true);
});

test("armarPared: el cliente elige módulos y el ajuste toma lo que queda", () => {
  const p = { largo: 260, lado: "fin" as Lado };
  expect(armarPared(p, [80, 80])).toEqual({ anchos: [80, 80, 88], ajuste: 2, sobrante: 2 });
  expect(armarPared(p, [100, 100])).toEqual({ anchos: [100, 100], ajuste: -1, sobrante: 52.5 });
  expect(armarPared({ ...p, lado: "ini" }, [100, 60])).toEqual({ anchos: [88, 100, 60], ajuste: 0, sobrante: 2 });
  const solo = armarPared(p, [80])!; // sobran más de 100: el ajuste se queda en 100
  expect(solo.anchos[1]).toBe(100);
  expect(solo.sobrante).toBe(72.5);
  expect(armarPared(p, [100, 100, 60])).toBe(null);
  expect(armarPared({ largo: 80, lado: "fin" }, [])).toEqual({ anchos: [73], ajuste: 0, sobrante: 2 });
  expect(armarPared({ largo: 40, lado: "fin" }, [])).toBe(null);
});

test("tubo ovalado: deja espacio para colgar abajo y se cobra por metro", () => {
  const m = limpiarV([{ t: "r", y: 12 }, { t: "t", y: 40 }, { t: "r", y: 197 }]);
  expect(m[1].y).toBe(12 + 1.6 + TUBO.colgarMin > 40 ? Math.ceil(12 + 1.6 + TUBO.colgarMin) : 40);
  expect(moverV(m, 1, 199)[1].y).toBe(197 - TUBO.gancho - TUBO.alto);
  const base: PiezaV[] = [{ t: "r", y: 12 }, { t: "r", y: 197 }];
  const con = agregarV(base, "t")!;
  expect(con[1]).toEqual({ t: "t", y: 190 });
  expect(limpiarV(con)).toEqual(con);
  // Con poco espacio arriba, se va debajo de la repisa de 100 y la ropa cuelga hasta el piso.
  expect(agregarV([{ t: "r", y: 100 }, { t: "r", y: 130 }], "t")![0]).toEqual({ t: "t", y: 93 });
  // Sin hueco quita las repisas que estorban, pero nunca un nicho.
  expect(agregarV([{ t: "r", y: 12 }, { t: "r", y: 80 }, { t: "r", y: 140 }], "t")).toEqual([{ t: "r", y: 12 }, { t: "t", y: 133 }, { t: "r", y: 140 }]);
  expect(agregarV([{ t: "r", y: 12 }, { t: "n", y: 46 }, { t: "r", y: 140 }], "t")).toBe(null);
  expect(precioTubo(80)).toBe(224);
  const d = disenar("lineal", { A: 260 }, "colgar");
  const q = cotizarV(d.paredes, false, false, 0, HOY);
  const tubos = d.paredes[0].mods.flat().filter((it) => it.t === "t").length;
  expect(tubos).toBeGreaterThanOrEqual(2);
  expect(q.lineas.some((l) => /tubos? de 80 cm/.test(l.concepto))).toBe(true);
});

test("cajonera de 60 u 80, con correderas normales o de cierre lento", () => {
  expect(precioCajonera(80)).toBe(4200);
  expect(precioCajonera(80, true)).toBe(4600);
  expect(precioCajonera(60)).toBe(3400);
  const d = disenar("lineal", { A: 260 }, "cajones");
  const p = d.paredes[0];
  p.mods.forEach((m, i) => expect(m.some((it) => it.t === "c")).toBe(cabeCajonera(p.anchos[i]) && i !== p.ajuste));
  const n = cajonerasDe(d.paredes);
  expect(n).toBeGreaterThanOrEqual(1);
  const normal = cotizarV(d.paredes, false, false, 0, HOY);
  const cl = cotizarV(d.paredes, false, false, 0, HOY, true);
  expect(cl.lista - normal.lista).toBe(n * 400);
  expect(cl.lineas.some((l) => /cajoneras? de 80 cm \(2 cajones, cierre lento\)/.test(l.concepto))).toBe(true);
  // La cajonera va abajo del hueco y deja libre lo de arriba.
  expect(agregarV([{ t: "r", y: 12 }, { t: "r", y: 197 }], "c")![1]).toEqual({ t: "c", y: 34 });
});

test("las esquinas descuentan el fondo del mueble de atrás", () => {
  const L = tramos("L", { A: 260, B: 220 });
  expect(L.paredes[1].largo).toBe(160);
  const U = tramos("U", { A: 260, B: 220 });
  expect(U.pasillo).toBe(140);
  expect(U.paredes.length).toBe(3);
  expect(tramos("espejo", { A: 250, B: 200, S: 220 }).pasillo).toBe(100);
});

test("cada tipo de espacio arma un diseño válido con los tres estilos", () => {
  for (const tipo of Object.keys(ESPACIOS)) {
    for (const estilo of Object.keys(ESTILOS)) {
      const d = disenar(tipo, {}, estilo);
      expect(d.error, `${tipo} ${estilo}: ${d.error}`).toBe(null);
      for (const p of d.paredes) {
        expect(p.mods.length).toBe(p.anchos.length);
        for (const m of p.mods) {
          expect(m.length).toBeGreaterThan(0);
          expect(limpiarV(m), `${tipo} ${estilo}: plantilla que no respeta separaciones`).toEqual(m);
        }
      }
    }
  }
});

test("avisa cuando el pasillo no alcanza", () => {
  expect(disenar("U", { A: 170, B: 220 }).error).toMatch(/pasillo/);
  expect(disenar("espejo", { A: 250, B: 250, S: 190 }).aviso).toMatch(/pasillo/);
  expect(disenar("lineal", { A: 50 }).error).toMatch(/de 100 a 600/);
});

test("precio: suma todas las paredes, sin compartir paral en las esquinas", () => {
  const d = disenar("L", { A: 260, B: 220 }, "equilibrado");
  const q = cotizarV(d.paredes, true, false, 0, HOY);
  const mods = d.paredes.reduce((a, p) => a + p.anchos.length, 0);
  const parales = d.paredes.reduce((a, p) => a + p.anchos.length + 1, 0);
  expect(q.modulos).toBe(mods);
  expect(q.parales).toBe(parales);
  expect(q.lineas[0].precio).toBe(parales * 1500);
  expect(q.lineas[1].precio).toBe(mods * 2 * 800);
  expect(q.total).toBe(Math.round(q.lista * 0.8));
  expect(cotizarV(d.paredes, false, false, 0, HOY).total).toBeLessThan(q.total);
  expect(cotizarV(d.paredes, true, true, 0, HOY).instalacion).toBe(Math.round(q.subtotal * 0.012) * 10);
});

test("precio inicial del vestidor con fechas fijas", () => {
  expect(precioDesdeVestidor(new Date(2026, 10, 13))).toBe(13904);
  expect(precioDesdeVestidor(new Date(2026, 11, 1))).toBe(17380);
});
