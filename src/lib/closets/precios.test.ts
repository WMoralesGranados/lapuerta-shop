import { describe, expect, test } from "vitest";
import {
  EXTRA_CAJONERA_100,
  MODELOS,
  bariAlCentro,
  cajonerasBari,
  cantidadBisagras,
  cantidadJaladeras,
  contraventanas,
  cotizar,
  descripcion,
  entrepano,
  normalizar,
  precioDesdeCloset,
  type ConfigEntrada,
} from "@/lib/closets/precios";

function cotizado(c: ConfigEntrada) {
  const q = cotizar(c);
  if (!q.ok) throw new Error(q.error);
  return q;
}

describe("precios", () => {
  const base = { modelo: "classic", W: 240, H: 250, F: 60 };

  test("el ejemplo confirmado por el negocio da $19,949.75", () => {
    expect(cotizado({ ...base, H: 280, costado: "der" }).total).toBe(19949.75);
  });

  test("los anchos de lista dan su precio exacto", () => {
    expect(cotizado({ ...base, W: 160 }).total).toBe(11550);
    expect(cotizado({ ...base, W: 280 }).total).toBe(18990);
    expect(cotizado({ ...base, modelo: "premium", W: 200, H: 254 }).total).toBe(17100 + 1555.14);
  });

  test("los anchos intermedios son proporcionales", () => {
    expect(cotizado({ ...base, W: 210 }).total).toBe(14412.5);
    expect(cotizado({ ...base, modelo: "premium", W: 260, H: 254 }).total).toBe(21305 + 2096.5);
  });

  test("el maletero solo cobra arriba de 60 cm", () => {
    expect(cotizado({ ...base, F: 55 }).total).toBe(16700);
    expect(cotizado({ ...base, F: 75 }).total).toBe(16700 + 416.94);
  });

  test("el fijo aparece solo al pasar de puertas más contraventanas", () => {
    expect(cotizado({ ...base, H: 250 }).lineas.length).toBe(1);
    expect(cotizado({ ...base, H: 251 }).total).toBe(16700 + 1153.25);
    expect(cotizar({ ...base, H: 249 }).ok).toBe(false);
    const conFijo = (H: number) =>
      cotizado({ ...base, modelo: "premium", H }).lineas.some((l) => l.concepto.startsWith("Fijo"));
    expect(conFijo(254)).toBe(false);
    expect(conFijo(255)).toBe(true);
    expect(entrepano(40, 280)).toBe(1452.5);
  });

  test("el costado cambia a dos piezas arriba de 2.40 m", () => {
    expect(cotizado({ ...base, costado: "izq" }).total).toBe(16700 + 2096.5);
  });

  test("cambio de jaladera: Classic con 4 contraventanas suma $1,200 y con 6 suma $1,360", () => {
    expect(cantidadJaladeras("classic", 200)).toBe(15);
    expect(cotizado({ ...base, W: 200, jaladera: "mini" }).total).toBe(13650 + 1200);
    expect(cantidadJaladeras("classic", 240)).toBe(17);
    expect(cotizado({ ...base, jaladera: "mini" }).total).toBe(16700 + 1360);
    expect(cotizado({ ...base, modelo: "premium", jaladera: "barra", H: 254 }).config.jaladera).toBe("mini");
  });

  test("correderas: se cobran por cajón en Classic y Premium ya incluye cierre lento", () => {
    expect(cotizado({ ...base }).total).toBe(16700);
    expect(cotizado({ ...base, corredera: "reforzada" }).total).toBe(17300);
    expect(cotizado({ ...base, corredera: "cierre" }).total).toBe(17600);
    const p = cotizado({ ...base, modelo: "premium", H: 254, corredera: "ligera" });
    expect(p.config.corredera).toBe("cierre");
    expect(p.total).toBe(20160 + 1667.75);
  });

  test("bisagras con cierre lento: $120 por par en Classic, incluidas en Premium", () => {
    expect(cotizado({ ...base, W: 200, bisagra: "cierre" }).total).toBe(13650 + 1440);
    expect(cotizado({ ...base, bisagra: "cierre" }).total).toBe(16700 + 1680);
    expect(cotizado({ ...base, W: 160, bisagra: "cierre" }).total).toBe(11550 + 1080);
    expect(cotizado({ ...base, modelo: "premium", H: 254, bisagra: "oculta" }).total).toBe(20160 + 1667.75);
  });

  test("Florencia Gola: precios de Classic, sin jaladeras y fijo arriba de 2.46 m", () => {
    const g = { ...base, modelo: "gola", H: 250 };
    expect(cotizado(g).total).toBe(16700);
    expect(cotizado({ ...g, jaladera: "barra" }).config.jaladera).toBe("gola");
    expect(cotizado({ ...g, H: 251 }).total).toBe(16700 + 1153.25);
    expect(cotizado({ ...g, corredera: "cierre" }).total).toBe(16700 + 720);
    expect(cotizado({ ...g, bisagra: "cierre" }).total).toBe(16700 + 1680);
    expect(cotizado({ ...g, W: 200, bisagra: "cierre" }).total).toBe(13650 + 1440);
  });

  test("de 2.80 a 3.00 m sigue el aumento del último tramo y arriba de 2.20 m todos llevan 6 contraventanas", () => {
    expect(cotizado({ ...base, W: 300 }).total).toBe(20135);
    expect(cotizado({ ...base, modelo: "premium", W: 300, H: 254 }).total).toBe(23595 + 2096.5);
    expect(cotizar({ ...base, W: 301 }).ok).toBe(false);
    expect(contraventanas("classic", 220)).toBe(4);
    expect(contraventanas("classic", 221)).toBe(6);
    expect(contraventanas("gola", 221)).toBe(6);
    expect(contraventanas("premium", 220)).toBe(4);
  });

  test("base de Premium: fondo × ancho, combinando piezas de la lista", () => {
    const baseDe = (F: number) =>
      cotizado({ ...base, modelo: "premium", H: 254, F }).lineas.find((l) => l.concepto.startsWith("Base"))!.precio;
    expect(baseDe(55)).toBe(1667.75);
    expect(baseDe(60)).toBe(1667.75);
    expect(baseDe(70)).toBe(1153.25 + 903);
    expect(baseDe(75)).toBe(1153.25 * 2);
  });

  test("fuera de rango no inventa precio", () => {
    expect(cotizar({ ...base, W: 150 }).ok).toBe(false);
    expect(cotizar({ ...base, H: 300 }).ok).toBe(false);
    expect(cotizar({ ...base, F: 80 }).ok).toBe(false);
  });
});

describe("bari", () => {
  const entrada = (c: ConfigEntrada) => ({ modelo: "bari", H: 232, F: 60, ...c });
  const bari = (c: ConfigEntrada) => cotizado(entrada(c));

  test("Bari: precios de la ficha y 2.40 / 2.80 proporcionales", () => {
    expect(bari({ W: 160 }).total).toBe(14900);
    expect(bari({ W: 180, cajonera: 100 }).lineas[0].precio).toBe(16600);
    expect(bari({ W: 200 }).total).toBe(20250);
    expect(bari({ W: 240 }).total).toBe(24300);
    expect(bari({ W: 280, cajonera: 80 }).total).toBe(28350);
    expect(bari({ W: 300 }).lineas[0].precio).toBe(30375);
  });

  test("Bari: la cajonera no cambia, el par de puertas va de 60 a 100", () => {
    expect(cajonerasBari(160)).toEqual([80, 100]);
    expect(cajonerasBari(190)).toEqual([100]);
    expect(bariAlCentro(219)).toBe(false);
    expect(bariAlCentro(220)).toBe(true);
    // De 2.00 a 2.20 m va de lado con la de 100 y el par de hasta 120.
    expect(cajonerasBari(210)).toEqual([100]);
    expect(cajonerasBari(220)).toEqual([80, 100]);
    expect(cajonerasBari(250)).toEqual([80, 100]);
    expect(cajonerasBari(300)).toEqual([100]);
    for (let W = 160; W <= 300; W += 0.5) expect(cajonerasBari(W).length, `${W}`).toBeGreaterThan(0);
    // Si la elegida no cabe, se cambia a la que sí.
    expect(normalizar({ modelo: "bari", W: 190, cajonera: 80 }).cajonera).toBe(100);
    expect(normalizar({ modelo: "bari", W: 165 }).cajonera).toBe(80);
    expect(normalizar({ modelo: "classic" }).cajonera).toBe(null);
  });

  test("Bari: la cajonera de 100 suma lo proporcional de sus piezas", () => {
    const q = bari({ W: 170, cajonera: 100 });
    expect(q.lineas[1].concepto).toBe("Cajonera de 100 cm");
    expect(q.lineas[1].precio).toBe(1372.15);
    expect(Math.abs(EXTRA_CAJONERA_100 - 1372.15)).toBeLessThan(0.01);
    expect(bari({ W: 170, cajonera: 80 }).lineas.length).toBe(1);
    // Si solo cabe la de 100, va en el precio de lista.
    expect(bari({ W: 190, cajonera: 100 }).lineas.length).toBe(1);
    expect(bari({ W: 290 }).lineas.length).toBe(1);
  });

  test("Bari: fijo arriba de 2.32 m con la pieza de la lista que lo cubra", () => {
    expect(bari({ W: 160, H: 232 }).lineas.length).toBe(1);
    const f = (H: number) => bari({ W: 200, H }).lineas.find((l) => l.concepto.startsWith("Fijo"))!;
    expect(f(250).precio).toBe(Math.round(entrepano(30, 200) * 100) / 100);
    expect(f(270).precio).toBe(Math.round(entrepano(40, 200) * 100) / 100);
    expect(f(290).precio).toBe(Math.round(entrepano(60, 200) * 100) / 100);
    expect(f(300).precio).toBe(Math.round((entrepano(40, 200) + entrepano(30, 200)) * 100) / 100);
    expect(cotizar(entrada({ W: 200, H: 231 })).ok).toBe(false);
  });

  test("Bari: jaladeras, bisagras y correderas", () => {
    // De lado: 2 puertas altas + 2 cortas; al centro: 4 altas + 2 cortas. Más 3 cajones.
    expect(cantidadBisagras("bari", 180)).toBe(10);
    expect(cantidadBisagras("bari", 240)).toBe(16);
    expect(cantidadJaladeras("bari", 180)).toBe(7);
    expect(cantidadJaladeras("bari", 240)).toBe(9);
    expect(normalizar({ modelo: "bari" }).jaladera).toBe("mini");
    const barra = bari({ W: 240, jaladera: "barra" }).lineas.find((l) => l.concepto.includes("barra"))!;
    expect(barra.precio).toBe(9 * 80);
    const cl = bari({ W: 180, corredera: "cierre" }).lineas.find((l) => l.concepto.includes("Corredera"))!;
    expect(cl.precio).toBe(3 * 180);
  });
});

describe("aura", () => {
  test("Aura: misma regla de cajonera que Bari, fondo fijo y sin costado", () => {
    const c = normalizar({ modelo: "aura", W: 190, F: 70, cajonera: 80, costado: "der" });
    expect(c.cajonera).toBe(100);
    expect(c.F).toBe(60);
    expect(c.costado).toBe("ninguno");
    expect(c.jaladera).toBe("barra");
    expect(normalizar({ modelo: "aura", W: 250 }).cajonera).toBe(80);
  });

  test("Aura: alturas cuadradas con la cajonera de Bari y la entrepañera", () => {
    const m = MODELOS.aura;
    expect(m.zoclo! + m.cajones * m.altoCajon + m.entrepanera!).toBe(m.puerta);
    expect(m.H[0]).toBe(m.puerta);
  });

  test("Aura: puertas de los pares con 4 bisagras y jaladera por puerta y cajón", () => {
    expect(cantidadBisagras("aura", 180)).toBe(8);
    expect(cantidadBisagras("aura", 240)).toBe(16);
    expect(cantidadJaladeras("aura", 180)).toBe(5);
    expect(cantidadJaladeras("aura", 240)).toBe(7);
  });

  test("Aura: closet en madera y entrepañera LED en uno de los 3 tonos lisos, por separado", () => {
    const c = normalizar({ modelo: "aura", color: "nogal", colorNicho: "salvia" });
    expect(c.color).toBe("nogal");
    expect(c.colorNicho).toBe("salvia");
    expect(normalizar({ modelo: "aura", color: "salvia" }).color).toBe("colorado");
    expect(normalizar({ modelo: "aura" }).colorNicho).toBe("gris");
    expect(normalizar({ modelo: "classic", colorNicho: "taupe" }).colorNicho).toBe(null);
    expect(descripcion(normalizar({ modelo: "aura", color: "hickory", colorNicho: "taupe" }))).toMatch(
      /Hickory Frida · Entrepañera Taupe · Jaladera de barra/,
    );
  });

  test("Aura: lista del dueño y medidas proporcionales", () => {
    const base = (W: number, extra: ConfigEntrada = {}) => cotizado({ modelo: "aura", W, H: 234, ...extra });
    expect(base(200).total).toBe(23700);
    expect(base(240, { cajonera: 80 }).total).toBe(24900);
    expect(base(280, { cajonera: 80 }).total).toBe(27100);
    expect(base(160, { cajonera: 80 }).total).toBe(18960);
    expect(base(180, { cajonera: 80 }).total).toBe(21330);
    expect(base(300).total).toBe(28200); // sigue el último tramo: $55 por cm
    expect(base(220, { cajonera: 80 }).total).toBe(24300); // intermedio proporcional
    // La de 100 suma la cajonera (como en Bari) más la entrepañera que también crece 20 cm.
    const q = base(240, { cajonera: 100 });
    expect(q.lineas[1].concepto).toBe("Cajonera y entrepañera de 100 cm");
    expect(q.lineas[1].precio).toBe(2387.73);
    expect(cotizado({ modelo: "bari", W: 240, H: 232, cajonera: 100 }).lineas[1].precio).toBe(1372.15);
    // Fijo arriba de 2.34 m.
    expect(base(240, { cajonera: 80, H: 260 }).lineas.some((l) => l.concepto === "Fijo superior de 26 cm")).toBe(true);
  });
});

describe("precioDesdeCloset", () => {
  test.each([
    ["classic", 11550],
    ["gola", 11550],
    ["premium", 16132.25],
    ["bari", 14900],
    ["aura", 18960],
  ] as const)("%s", (modelo, esperado) => {
    expect(precioDesdeCloset(modelo)).toBe(esperado);
  });
});
