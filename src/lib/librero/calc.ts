// Reglas del librero Julieta. Medidas en cm. Sin DOM, para poder probarlas.
// Réplica de mock/public/js/librero-calc.js. No simplificar fórmulas ni redondeos.
export type TipoPieza = "r" | "n";
export type Pieza = { t: TipoPieza; y: number };
// Pieza sin validar, como llega de la liga.
export type PiezaCruda = { t: string; y: number | string };

export type LineaLibrero = { concepto: string; precio: number };

// POR CONFIRMAR CON EL CLIENTE: medidas de paral, repisa y nicho, separación mínima, módulos y anchos.
export const LIBRERO = {
  paral: { grosor: 3.5, fondo: 20, alto: 200 },
  repisa: { ancho: 80, fondo: 40, grosor: 1.6 },
  nicho: { alto: 35, tapa: 1.6 },
  separacionMin: 20,
  modulos: [1, 4],
  anchos: [60, 80, 100], // claro del módulo; repisas y nichos toman este ancho
};

// Paral: lateral individual sin luz de "Vestidores Modika LP.xlsx" × 20/25.
// Repisa y nicho: lista reacomodada por el negocio para acercar el nicho a su costo real.
// POR CONFIRMAR CON EL CLIENTE: todos los precios, el descuento de 20 % y su fecha límite.
export const PRECIOS: {
  paral: number;
  tiraLed: number;
  repisa: Record<number, number>;
  nicho: Record<number, number>;
  descuento: number;
  descuentoHasta: string;
  instalacion: number;
} = {
  paral: 1200,
  tiraLed: 790, // $400 el metro, 2 m: $800, dejado en $790. Cada módulo lleva 2 tiras; el paral compartido lleva 2
  repisa: { 60: 310, 80: 390, 100: 510 },
  nicho: { 60: 1230, 80: 1890, 100: 2550 },
  descuento: 20,
  descuentoHasta: "2026-11-30", // último día; después el precio de lista vuelve solo
  instalacion: 12, // % sobre el precio con descuento; el descuento no aplica a este servicio
};

const pesos2 = (n: number) => Math.round(n * 100) / 100;

export const PROMO_MAX = 10;

export function descuentoVigente(hoy = new Date()) {
  const [a, m, d] = PRECIOS.descuentoHasta.split("-").map(Number);
  return hoy < new Date(a, m - 1, d + 1) ? PRECIOS.descuento : 0;
}

export function cotizar(mods: Pieza[][], anchos: number[], led = true, conInstalacion = false, promo: unknown = 0, hoy = new Date()) {
  const r = resumen(mods, anchos);
  const lineas: LineaLibrero[] = [{ concepto: `${r.parales} parales`, precio: r.parales * PRECIOS.paral }];
  if (led) lineas.push({ concepto: `${r.modulos * 2} tiras LED`, precio: r.modulos * 2 * PRECIOS.tiraLed });
  for (const x of r.repisasPorAncho) lineas.push({ concepto: `${x.cant} ${x.cant === 1 ? "repisa" : "repisas"} de ${x.w} cm`, precio: x.cant * PRECIOS.repisa[x.w] });
  for (const x of r.nichosPorAncho) lineas.push({ concepto: `${x.cant} ${x.cant === 1 ? "nicho" : "nichos"} de ${x.w} cm`, precio: x.cant * PRECIOS.nicho[x.w] });
  const lista = lineas.reduce((a, l) => a + l.precio, 0);
  const descuento = descuentoVigente(hoy);
  // El precio con descuento va a pesos enteros.
  const subtotal = Math.round((lista * (100 - descuento)) / 100);
  const ahorro = lista - subtotal;
  // Redondeada a $10, porque el 12% es un precio aproximado del servicio.
  const costoInstalacion = Math.round((subtotal * PRECIOS.instalacion) / 100 / 10) * 10;
  const instalacion = conInstalacion ? costoInstalacion : 0;
  // El código se acumula: se aplica sobre el precio con descuento y no toca la instalación.
  const porcentajePromo = Math.min(PROMO_MAX, Math.max(0, Number(promo) || 0));
  const ahorroPromo = pesos2((subtotal * porcentajePromo) / 100);
  return { lineas, lista, descuento, ahorro, subtotal, porcentajePromo, ahorroPromo, costoInstalacion, instalacion, total: pesos2(subtotal - ahorroPromo + instalacion) };
}

export function normalizarAnchos(a: unknown, n: number) {
  const lista = Array.isArray(a) ? a.map(Number) : [];
  return Array.from({ length: n }, (_, i) => (LIBRERO.anchos.includes(lista[i]) ? lista[i] : 80));
}

const REP = LIBRERO.repisa.grosor;
const NICHO = LIBRERO.nicho.alto + 2 * LIBRERO.nicho.tapa;
const TOPE = LIBRERO.paral.alto;
const PISO = 5;

export const altoDe = (it: { t: string }) => (it.t === "n" ? NICHO : REP);

export const PLANTILLAS: Pieza[][] = [
  [{ t: "r", y: 12 }, { t: "r", y: 46 }, { t: "r", y: 80 }, { t: "n", y: 112 }, { t: "r", y: 197 }],
  [{ t: "r", y: 8 }, { t: "r", y: 42 }, { t: "r", y: 76 }, { t: "n", y: 130 }, { t: "r", y: 197 }],
];

const esPieza = (i: PiezaCruda): i is Pieza | (PiezaCruda & { t: TipoPieza }) => i.t === "r" || i.t === "n";

// Asienta un módulo: ordena, respeta límites y separación; lo que no cabe se descarta.
export function limpiarModulo(items: PiezaCruda[]) {
  const res: Pieza[] = [];
  const orden = [...items]
    .filter(esPieza)
    .filter((i) => Number.isFinite(Number(i.y)))
    .map((i): Pieza => ({ t: i.t, y: Math.round(Number(i.y)) }))
    .sort((a, b) => a.y - b.y);
  for (const it of orden) {
    const min = res.length ? res[res.length - 1].y + altoDe(res[res.length - 1]) + LIBRERO.separacionMin : PISO;
    const y = Math.max(it.y, min);
    if (y + altoDe(it) <= TOPE) res.push({ t: it.t, y });
  }
  return res;
}

export function normalizar(mods: unknown) {
  const lista: unknown[] = Array.isArray(mods) && mods.length ? mods.slice(0, LIBRERO.modulos[1]) : PLANTILLAS;
  return lista.map((m) => limpiarModulo(Array.isArray(m) ? (m as PiezaCruda[]) : []));
}

// Límites para mover un elemento sin encimarlo con sus vecinos.
export function rangoItem(items: Pieza[], i: number): [number, number] {
  const it = items[i];
  const prev = items[i - 1], sig = items[i + 1];
  const min = prev ? prev.y + altoDe(prev) + LIBRERO.separacionMin : PISO;
  const max = (sig ? sig.y - LIBRERO.separacionMin : TOPE) - altoDe(it);
  return [min, max];
}

export function moverItem(items: Pieza[], i: number, y: number) {
  const [min, max] = rangoItem(items, i);
  const n = items.map((x) => ({ ...x }));
  n[i].y = Math.round(Math.min(max, Math.max(min, y)));
  return n;
}

// Agrega en el hueco más amplio donde quepa. Devuelve null si no hay espacio.
export function agregarItem(items: Pieza[], t: TipoPieza): Pieza[] | null {
  const h = altoDe({ t });
  const sep = LIBRERO.separacionMin;
  const puntos = [{ ini: PISO, fin: TOPE }];
  if (items.length) {
    puntos.length = 0;
    puntos.push({ ini: PISO, fin: items[0].y - sep });
    items.forEach((it, k) => {
      const sig = items[k + 1];
      puntos.push({ ini: it.y + altoDe(it) + sep, fin: sig ? sig.y - sep : TOPE });
    });
  }
  const hueco = puntos.filter((p) => p.fin - p.ini >= h).sort((a, b) => b.fin - b.ini - (a.fin - a.ini))[0];
  if (!hueco) {
    // Sin hueco libre: reparte todo parejo, dejando la repisa de hasta arriba en su lugar.
    const nuevos: Pieza[] = [...items.slice(0, -1), { t, y: 0 }, ...items.slice(-1)];
    const totalAlto = nuevos.reduce((a, it) => a + altoDe(it), 0);
    const hueco2 = (TOPE - PISO - totalAlto) / (nuevos.length - 1);
    if (hueco2 < sep) return null;
    let y = PISO;
    return nuevos.map((it) => {
      const r = { t: it.t, y: Math.round(y) };
      y += altoDe(it) + hueco2;
      return r;
    });
  }
  const y = Math.round(hueco.ini + (hueco.fin - hueco.ini - h) / 2);
  return [...items, { t, y }].sort((a, b) => a.y - b.y);
}

export function resumen(mods: Pieza[][], anchos: number[] = mods.map(() => 80)) {
  const n = mods.length;
  const contar = (t: TipoPieza) => mods.reduce((a, m) => a + m.filter((i) => i.t === t).length, 0);
  // Cantidades por ancho, porque cada medida tendrá su propio precio.
  const porAncho = (t: TipoPieza) => LIBRERO.anchos
    .map((w) => ({ w, cant: mods.reduce((a, m, i) => a + (anchos[i] === w ? m.filter((x) => x.t === t).length : 0), 0) }))
    .filter((x) => x.cant);
  return {
    modulos: n,
    parales: n + 1, // el intermedio se comparte entre dos módulos
    repisas: contar("r"),
    nichos: contar("n"),
    repisasPorAncho: porAncho("r"),
    nichosPorAncho: porAncho("n"),
    ancho: Math.round((anchos.slice(0, n).reduce((a, b) => a + b, 0) + (n + 1) * LIBRERO.paral.grosor) * 10) / 10,
    alto: LIBRERO.paral.alto,
  };
}

export const aTexto = (mods: Pieza[][]) => mods.map((m) => m.map((i) => `${i.t}${i.y}`).join(".")).join("_");
export function deTexto(s: string | null | undefined): PiezaCruda[][] | null {
  if (!s) return null;
  return String(s).split("_").map((m) => (m ? m.split(".").map((p) => ({ t: p[0], y: Number(p.slice(1)) })) : []));
}

// Precio inicial: la primera plantilla, un módulo de 80 con LED y sin instalación.
export function precioDesdeLibrero(hoy = new Date()) {
  return cotizar([PLANTILLAS[0]], [80], true, false, 0, hoy).total;
}
