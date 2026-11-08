// Vestidores walk-in: misma estructura del librero, con paral de 30 y repisas de 60 de fondo. Medidas en cm.
// Réplica de mock/public/js/vestidor-calc.js. No simplificar fórmulas ni redondeos.
import { LIBRERO, PLANTILLAS, PROMO_MAX, agregarItem, descuentoVigente, type Pieza } from "@/lib/librero/calc";

export type TipoEspacio = "lineal" | "L" | "U" | "espejo";
export type ClaveMedida = "A" | "B" | "S";
export type Lado = "ini" | "fin";
export type EstiloVestidor = "colgar" | "cajones" | "repisas" | "equilibrado" | "nichos";
export type TipoPiezaV = "r" | "n" | "t" | "c";
export type PiezaV = { t: TipoPiezaV; y: number };
export type PiezaCrudaV = { t: string; y: number | string };
export type Medidas = Partial<Record<ClaveMedida, number>>;
export type MedidasEntrada = Partial<Record<ClaveMedida, number | string>> | null | undefined;
export type TramoPared = { id: string; nombre: string; largo: number; lado: Lado };
export type Pared = TramoPared & { anchos: number[]; ajuste: number; sobrante: number; mods: PiezaV[][] };
export type Diseno = {
  tipo: TipoEspacio;
  med: Medidas;
  estilo: EstiloVestidor;
  paredes: Pared[];
  pasillo: number | undefined;
  aviso: string | null;
  error: string | null;
};
export type LineaVestidor = { concepto: string; precio: number };

// 60, 80 y 100 son claros: a cada módulo se le suman sus parales de 25 mm.
export const VESTIDOR = {
  paralGrosor: 2.5,
  paralFondo: 30,
  repisaFondo: 60,
  pasilloMin: 60,     // por debajo no se puede caminar
  pasilloIdeal: 80,
};

// Lista original "Vestidores Modika LP", tal cual (precio de lista; el 20% da el precio al público).
// Paral = lateral individual; LED = diferencia con luz ($800 por lateral = $1,600 por módulo).
// El 75 de la lista se usa como 80; 60 y 100 siguen la línea de 75 a 110 cuando la lista no los trae.
// POR CONFIRMAR CON EL CLIENTE: todos los precios y los módulos de 60 y 100, cuya lista es derivada.
// POR CONFIRMAR CON EL CLIENTE: el descuento de 20 % y su fecha vienen de PRECIOS en src/lib/librero/calc.ts.
export const PRECIOS_V: {
  paral: number;
  tiraLed: number;
  repisa: Record<number, number>;
  nicho: Record<number, number>;
  tuboMetro: number;
  cajonera: Record<number, number>;
  cierreLento: number;
  instalacion: number;
} = {
  paral: 1500,
  tiraLed: 800,
  repisa: { 60: 400, 80: 500, 100: 670 },
  nicho: { 60: 2330, 80: 3600, 100: 4870 },
  tuboMetro: 280, // tubo ovalado, por metro lineal del claro; soportes incluidos
  // Cajonera de 2 cajones. 80 es la de la lista (75 → 80). La de 60 lleva 79% del tablero
  // (despiece de PolyBoard) y los mismos 2 pares de correderas: $3,400.
  // POR CONFIRMAR CON EL CLIENTE: precio de la cajonera de 60.
  cajonera: { 60: 3400, 80: 4200 },
  cierreLento: 400, // por cajonera: correderas CL en lugar de normales ($4,600 − $4,200)
  instalacion: 12,
};

export const ESPACIOS: Record<TipoEspacio, { nombre: string; desc: string; medidas: ClaveMedida[] }> = {
  lineal: { nombre: "Lineal", desc: "Una sola pared", medidas: ["A"] },
  L: { nombre: "En L", desc: "Fondo y una pared lateral", medidas: ["A", "B"] },
  U: { nombre: "En U", desc: "Fondo y las dos laterales", medidas: ["A", "B"] },
  espejo: { nombre: "Tipo espejo", desc: "Dos paredes frente a frente", medidas: ["A", "B", "S"] },
};

export const ETIQUETAS: Record<TipoEspacio, Partial<Record<ClaveMedida, string>>> = {
  lineal: { A: "Largo de la pared" },
  L: { A: "Pared del fondo", B: "Pared lateral" },
  U: { A: "Pared del fondo", B: "Paredes laterales" },
  espejo: { A: "Pared 1", B: "Pared 2", S: "Separación entre paredes" },
};

// POR CONFIRMAR CON EL CLIENTE: límites de medidas.
export const LIMITES: Record<ClaveMedida, [number, number]> = { A: [100, 600], B: [130, 500], S: [180, 400] };
export const MEDIDAS_INICIALES: Record<TipoEspacio, Medidas> = {
  lineal: { A: 260 }, L: { A: 260, B: 220 }, U: { A: 260, B: 220 }, espejo: { A: 260, B: 260, S: 220 },
};

const F = VESTIDOR.repisaFondo;
const P = VESTIDOR.paralGrosor;

// Módulo de ajuste: solo repisas (o tubo, más adelante); toma la medida que sobra en la pared.
// Las repisas de 16 mm no pasan de 100 cm de claro para que no se pandeen.
export const AJUSTE = { min: 50, max: 100, holgura: 2 };

// Equivale a `tabla[clave] ? ... : ...` del original, con la clave sin validar.
function existe<K extends string>(tabla: Record<K, unknown>, clave: string): clave is K {
  return Boolean((tabla as Record<string, unknown>)[clave]);
}

// Tramos de mueble por pared. En las esquinas, la lateral empieza donde termina el fondo del mueble de atrás.
// "lado" dice en qué orilla va el módulo de ajuste: del lado de la esquina, donde menos se nota.
export function tramos(tipo: string, medIn: Medidas): { paredes: TramoPared[]; pasillo?: number } {
  const med = medIn as Record<ClaveMedida, number>;
  const t = existe(ESPACIOS, tipo) ? tipo : "lineal";
  if (t === "lineal") return { paredes: [{ id: "fondo", nombre: "Pared", largo: med.A, lado: "fin" }] };
  if (t === "L") return { paredes: [{ id: "fondo", nombre: "Fondo", largo: med.A, lado: "ini" }, { id: "izq", nombre: "Lateral", largo: med.B - F, lado: "fin" }] };
  if (t === "U") {
    return {
      paredes: [{ id: "izq", nombre: "Izquierda", largo: med.B - F, lado: "fin" }, { id: "fondo", nombre: "Fondo", largo: med.A, lado: "ini" }, { id: "der", nombre: "Derecha", largo: med.B - F, lado: "ini" }],
      pasillo: med.A - 2 * F,
    };
  }
  return { paredes: [{ id: "a", nombre: "Pared 1", largo: med.A, lado: "fin" }, { id: "b", nombre: "Pared 2", largo: med.B, lado: "fin" }], pasillo: med.S - 2 * F };
}

type MejorAjuste = { costo?: number; c60: number; c80: number; c100: number; aj: number; n?: number };

// Módulos de 60, 80 y 100 más un módulo de ajuste que cierra la pared (menos la holgura de instalación).
// Gana la opción con el ajuste más cercano a 80 y con menos módulos de 60 y 100; luego la de menos módulos.
export function ajustar(largo: number, lado: Lado = "fin") {
  const libre = largo - AJUSTE.holgura;
  let mejor: MejorAjuste | null = null;
  for (let n = 0; libre - (n + 2) * P - n * 60 >= AJUSTE.min; n++) {
    for (let c100 = 0; c100 <= n; c100++) {
      for (let c80 = 0; c80 + c100 <= n; c80++) {
        const c60 = n - c80 - c100;
        const aj = Math.floor((libre - (n + 2) * P - 60 * c60 - 80 * c80 - 100 * c100) * 2) / 2;
        if (aj < AJUSTE.min || aj > AJUSTE.max) continue;
        const costo = Math.abs(aj - 80) + 10 * (c60 + c100) + 0.01 * n;
        if (!mejor || costo < (mejor.costo as number)) mejor = { costo, c60, c80, c100, aj, n };
      }
    }
  }
  // De 107 a 119 cm no se puede cerrar: ni un ajuste de 100 llega, ni caben 60 + 50. Va un módulo de 100.
  if (!mejor && libre - 2 * P > AJUSTE.max) mejor = { c60: 0, c80: 0, c100: 0, aj: AJUSTE.max };
  if (!mejor) return { anchos: [] as number[], ajuste: -1, sobrante: largo };
  // Los de 100 al centro y los de 60 en las orillas, para que se vea simétrico.
  const mitad = (n: number) => Math.ceil(n / 2);
  const fijos: number[] = [
    ...Array<number>(mitad(mejor.c60)).fill(60), ...Array<number>(mitad(mejor.c80)).fill(80), ...Array<number>(mejor.c100).fill(100),
    ...Array<number>(mejor.c80 - mitad(mejor.c80)).fill(80), ...Array<number>(mejor.c60 - mitad(mejor.c60)).fill(60),
  ];
  const anchos = lado === "ini" ? [mejor.aj, ...fijos] : [...fijos, mejor.aj];
  // Si el ajuste cae justo en una medida de lista, es un módulo normal.
  const ajuste = LIBRERO.anchos.includes(mejor.aj) ? -1 : lado === "ini" ? 0 : anchos.length - 1;
  const total = anchos.reduce((a, w) => a + w, 0) + (anchos.length + 1) * P;
  return { anchos, ajuste, sobrante: Math.round((largo - total) * 10) / 10 };
}

// ---------- Piezas: repisa, nicho, tubo ovalado y cajonera ----------
// El tubo mide 3 cm de alto. Abajo necesita espacio para colgar la ropa; arriba, solo el del gancho.
export const TUBO = { alto: 3, gancho: 4, colgarMin: 60 };
// Cajonera de 2 cajones: caja de 35 cm de alto y 50 de fondo, del ancho del claro; solo en 60 y 80 cm.
export const CAJONERA = { alto: 35, fondo: 50, cajones: 2, anchos: [60, 80] };
const REP = LIBRERO.repisa.grosor, NICHO = LIBRERO.nicho.alto + 2 * LIBRERO.nicho.tapa, TOPE = LIBRERO.paral.alto, PISO = 5;
const ALTOS: Record<string, number> = { r: REP, n: NICHO, t: TUBO.alto, c: CAJONERA.alto };
export const altoV = (it: { t: string }) => ALTOS[it.t] ?? REP;
export const cabeCajonera = (w: number) => CAJONERA.anchos.includes(w);
const sep = (abajo: PiezaV, arriba: PiezaV) => (arriba.t === "t" ? TUBO.colgarMin : abajo.t === "t" ? TUBO.gancho : LIBRERO.separacionMin);
const desde = (abajo: PiezaV | undefined, it: PiezaV) => (abajo ? abajo.y + altoV(abajo) + sep(abajo, it) : PISO + (it.t === "t" ? TUBO.colgarMin : 0));
const hasta = (it: PiezaV, arriba: PiezaV | null | undefined) => (arriba ? arriba.y - sep(it, arriba) : TOPE) - altoV(it);

// Asienta un módulo: ordena, respeta límites y separaciones; lo que no cabe se descarta.
export function limpiarV(items: PiezaCrudaV[]) {
  const res: PiezaV[] = [];
  const orden = [...items]
    .filter((i) => ALTOS[i.t] != null && Number.isFinite(Number(i.y)))
    .map((i): PiezaV => ({ t: i.t as TipoPiezaV, y: Math.round(Number(i.y)) }))
    .sort((a, b) => a.y - b.y);
  for (const it of orden) {
    const y = Math.max(it.y, Math.ceil(desde(res[res.length - 1], it)));
    if (y <= hasta(it, null)) res.push({ t: it.t, y });
  }
  return res;
}

export const rangoV = (items: PiezaV[], i: number): [number, number] => [desde(items[i - 1], items[i]), hasta(items[i], items[i + 1])];

export function moverV(items: PiezaV[], i: number, y: number) {
  const [min, max] = rangoV(items, i);
  const n = items.map((x) => ({ ...x }));
  n[i].y = Math.min(Math.floor(max), Math.max(Math.ceil(min), Math.round(y)));
  return n;
}

// Con solo repisas y nichos se agrega como en el librero; si hay tubo o cajonera, en el hueco más amplio.
// Devuelve null si no cabe.
export function agregarV(items: PiezaV[], t: TipoPiezaV): PiezaV[] | null {
  const comoLibrero = (x: TipoPiezaV) => x === "r" || x === "n";
  if (comoLibrero(t) && items.every((i) => comoLibrero(i.t))) return agregarItem(items as Pieza[], t as Pieza["t"]);
  const nuevo: PiezaV = { t, y: 0 };
  let mejor: { k: number; ini: number; fin: number } | null = null;
  for (let k = 0; k <= items.length; k++) {
    const ini = desde(items[k - 1], nuevo), fin = hasta(nuevo, items[k]);
    if (fin >= ini && (!mejor || fin - ini > mejor.fin - mejor.ini)) mejor = { k, ini, fin };
  }
  if (!mejor && t === "t" && items.length) {
    // Sin hueco: el tubo va bajo la pieza de hasta arriba y se quitan las repisas que estorben (nunca un nicho).
    const arriba = items[items.length - 1];
    const y = Math.floor(hasta(nuevo, arriba));
    const abajo = items.slice(0, -1);
    while (abajo.length && desde(abajo[abajo.length - 1], nuevo) > y) {
      if (abajo[abajo.length - 1].t !== "r") return null;
      abajo.pop();
    }
    return desde(abajo[abajo.length - 1], nuevo) > y ? null : [...abajo, { t, y }, arriba];
  }
  if (!mejor) return null;
  // El tubo va hasta arriba del hueco, pegado a la repisa; la cajonera abajo; lo demás, al centro.
  const y = t === "t" ? Math.floor(mejor.fin) : t === "c" ? Math.ceil(mejor.ini) : Math.floor((mejor.ini + mejor.fin) / 2);
  return [...items.slice(0, mejor.k), { t, y }, ...items.slice(mejor.k)];
}

const SOLO_REPISAS = [12, 46, 80, 114, 148, 197].map((y): PiezaV => ({ t: "r", y }));
const DOS_NICHOS: PiezaV[] = [{ t: "r", y: 12 }, { t: "n", y: 46 }, { t: "r", y: 106 }, { t: "n", y: 128 }, { t: "r", y: 197 }];
// Ropa larga: zapatera abajo y tubo bajo la repisa. Doble colgado: camisas arriba y pantalones abajo.
const ROPA_LARGA: PiezaV[] = [{ t: "r", y: 12 }, { t: "t", y: 150 }, { t: "r", y: 157 }, { t: "r", y: 197 }];
const DOBLE_COLGADO: PiezaV[] = [{ t: "t", y: 95 }, { t: "r", y: 102 }, { t: "t", y: 190 }, { t: "r", y: 197 }];
// Cajonera a media altura con ropa corta arriba, o cajonera baja con repisas.
const CAJ_COLGAR: PiezaV[] = [{ t: "r", y: 12 }, { t: "c", y: 50 }, { t: "t", y: 150 }, { t: "r", y: 157 }, { t: "r", y: 197 }];
const CAJ_REPISAS: PiezaV[] = [{ t: "r", y: 12 }, { t: "c", y: 40 }, { t: "r", y: 95 }, { t: "r", y: 130 }, { t: "r", y: 165 }, { t: "r", y: 197 }];

export const ESTILOS: Record<EstiloVestidor, { nombre: string; desc: string }> = {
  colgar: { nombre: "Más para colgar", desc: "Ropa larga y doble colgado" },
  cajones: { nombre: "Más cajones", desc: "Cajoneras con ropa corta y repisas" },
  repisas: { nombre: "Más repisas", desc: "Para doblar ropa, bolsas y zapatos" },
  equilibrado: { nombre: "Equilibrado", desc: "Repisas con un nicho por módulo" },
  nichos: { nombre: "Más nichos", desc: "Para exhibir y guardar a la vista" },
};

function plantillaDe(estilo: string, i: number, w: number): PiezaV[] {
  // La cajonera solo viene en 60 y 80; en un módulo de 100 va un módulo para colgar.
  if (estilo === "cajones") return !cabeCajonera(w) ? ROPA_LARGA : i % 2 === 0 ? CAJ_COLGAR : CAJ_REPISAS;
  if (estilo === "colgar") return i % 3 === 2 ? PLANTILLAS[0] : i % 3 === 1 ? ROPA_LARGA : DOBLE_COLGADO;
  if (estilo === "repisas") return i % 3 === 1 ? PLANTILLAS[0] : SOLO_REPISAS;
  if (estilo === "nichos") return i % 2 === 0 ? DOS_NICHOS : PLANTILLAS[1];
  return PLANTILLAS[i % 2];
}
export const moduloNuevo = (estilo: string, i: number, w: number) => limpiarV(plantillaDe(estilo, i, w));
export const moduloAjuste = () => limpiarV(SOLO_REPISAS);

// Módulos de 60, 80 y 100 que eligió el cliente, sin el de ajuste.
export const fijosDe = (p: { anchos: number[]; ajuste: number }) => p.anchos.filter((_, i) => i !== p.ajuste);

// Rearma una pared con esos módulos; el de ajuste toma lo que quede, hasta 100 cm.
// Si sobra menos de 50 cm, la pared va sin ajuste. Devuelve null si los módulos no caben.
export function armarPared(p: { largo: number; lado: Lado }, fijos: number[]) {
  const n = fijos.length;
  const suma = fijos.reduce((a, w) => a + w, 0);
  const libre = p.largo - AJUSTE.holgura;
  const resto = Math.floor((libre - (n + 2) * P - suma) * 2) / 2;
  let anchos = [...fijos], ajuste = -1;
  if (resto >= AJUSTE.min) {
    const aj = Math.min(resto, AJUSTE.max);
    anchos = p.lado === "ini" ? [aj, ...fijos] : [...fijos, aj];
    ajuste = p.lado === "ini" ? 0 : n;
  } else if (!n || suma + (n + 1) * P > libre) return null;
  const total = anchos.reduce((a, w) => a + w, 0) + (anchos.length + 1) * P;
  return { anchos, ajuste, sobrante: Math.round((p.largo - total) * 10) / 10 };
}

export function disenar(tipo: string, medIn?: MedidasEntrada, estilo: string = "equilibrado"): Diseno {
  const t = existe(ESPACIOS, tipo) ? tipo : "lineal";
  const med: Medidas = {};
  for (const k of ESPACIOS[t].medidas) {
    const v = Number(medIn?.[k]);
    med[k] = Number.isFinite(v) ? Math.round(v * 10) / 10 : MEDIDAS_INICIALES[t][k];
  }
  const e = existe(ESTILOS, estilo) ? estilo : "equilibrado";
  const errores: string[] = [];
  for (const k of ESPACIOS[t].medidas) {
    const [a, b] = LIMITES[k];
    if ((med[k] as number) < a || (med[k] as number) > b) errores.push(`${ETIQUETAS[t][k]}: de ${a} a ${b} cm.`);
  }
  const tr = tramos(t, med);
  let aviso: string | null = null;
  if (tr.pasillo != null) {
    if (tr.pasillo < VESTIDOR.pasilloMin) errores.push(`Queda un pasillo de ${tr.pasillo} cm; se necesitan al menos ${VESTIDOR.pasilloMin} cm para caminar.`);
    else if (tr.pasillo < VESTIDOR.pasilloIdeal) aviso = `El pasillo queda en ${tr.pasillo} cm. Funciona, pero lo ideal son ${VESTIDOR.pasilloIdeal} cm o más.`;
  }
  let k = 0;
  const minimo = AJUSTE.min + 2 * P + AJUSTE.holgura;
  const paredes = tr.paredes.map((p): Pared => {
    const { anchos, ajuste, sobrante } = ajustar(p.largo, p.lado);
    if (!anchos.length) errores.push(`${p.nombre}: no cabe ni un módulo; necesita al menos ${minimo} cm libres.`);
    const mods = anchos.map((_, i) => limpiarV(i === ajuste ? SOLO_REPISAS : plantillaDe(e, k++, anchos[i])));
    return { ...p, anchos, ajuste, sobrante, mods };
  });
  return { tipo: t, med, estilo: e, paredes, pasillo: tr.pasillo, aviso, error: errores[0] || null };
}

const pesos2 = (n: number) => Math.round(n * 100) / 100;

// Precio por centímetro entre las medidas de la lista; abajo de 60 se cobra como 60.
function proporcional(tabla: Record<number, number>, w: number) {
  const xs = LIBRERO.anchos;
  if (w <= xs[0]) return tabla[xs[0]];
  for (let i = 1; i < xs.length; i++) {
    if (w <= xs[i]) return Math.round(tabla[xs[i - 1]] + ((tabla[xs[i]] - tabla[xs[i - 1]]) * (w - xs[i - 1])) / (xs[i] - xs[i - 1]));
  }
  return tabla[xs[xs.length - 1]];
}
export const precioRepisa = (w: number) => proporcional(PRECIOS_V.repisa, w);
export const precioTubo = (w: number) => Math.round((PRECIOS_V.tuboMetro * w) / 100);
// Una cajonera fuera de 60 u 80 (no debería pasar) se cobra como la de 80.
export const precioCajonera = (w: number, cierreLento = false) => (PRECIOS_V.cajonera[w] ?? PRECIOS_V.cajonera[80]) + (cierreLento ? PRECIOS_V.cierreLento : 0);
export const cajonerasDe = (paredes: { mods: PiezaV[][] }[]) => paredes.reduce((a, p) => a + p.mods.flat().filter((it) => it.t === "c").length, 0);

export function cotizarV(paredes: { mods: PiezaV[][]; anchos: number[] }[], led = true, conInstalacion = false, promo: unknown = 0, hoy = new Date(), cierreLento = false) {
  let parales = 0, modulos = 0;
  const cuentas: Record<string, Record<number, number>> = { r: {}, n: {}, t: {}, c: {} };
  for (const p of paredes) {
    if (!p.mods.length) continue;
    parales += p.mods.length + 1; // el intermedio se comparte; las esquinas no
    modulos += p.mods.length;
    p.mods.forEach((m, i) => {
      for (const it of m) {
        const cuenta = cuentas[it.t];
        if (cuenta) cuenta[p.anchos[i]] = (cuenta[p.anchos[i]] || 0) + 1;
      }
    });
  }
  const { r: rep, n: nic, t: tub, c: caj } = cuentas;
  const lineas: LineaVestidor[] = [{ concepto: `${parales} parales de 30 cm`, precio: parales * PRECIOS_V.paral }];
  if (led) lineas.push({ concepto: `${modulos * 2} tiras LED`, precio: modulos * 2 * PRECIOS_V.tiraLed });
  const medida = (w: number) => (LIBRERO.anchos.includes(w) ? `${w} cm` : `${w} cm a la medida`);
  for (const w of Object.keys(rep).map(Number).sort((a, b) => a - b)) lineas.push({ concepto: `${rep[w]} ${rep[w] === 1 ? "repisa" : "repisas"} de ${medida(w)}`, precio: rep[w] * precioRepisa(w) });
  for (const w of Object.keys(nic).map(Number).sort((a, b) => a - b)) lineas.push({ concepto: `${nic[w]} ${nic[w] === 1 ? "nicho" : "nichos"} de ${medida(w)}`, precio: nic[w] * proporcional(PRECIOS_V.nicho, w) });
  for (const w of Object.keys(tub).map(Number).sort((a, b) => a - b)) lineas.push({ concepto: `${tub[w]} ${tub[w] === 1 ? "tubo" : "tubos"} de ${medida(w)}`, precio: tub[w] * precioTubo(w) });
  for (const w of Object.keys(caj).map(Number).sort((a, b) => a - b)) {
    lineas.push({ concepto: `${caj[w]} ${caj[w] === 1 ? "cajonera" : "cajoneras"} de ${w} cm (2 cajones${cierreLento ? ", cierre lento" : ""})`, precio: caj[w] * precioCajonera(w, cierreLento) });
  }
  const lista = lineas.reduce((a, l) => a + l.precio, 0);
  const descuento = descuentoVigente(hoy);
  const subtotal = Math.round((lista * (100 - descuento)) / 100);
  const ahorro = lista - subtotal;
  const costoInstalacion = Math.round((subtotal * PRECIOS_V.instalacion) / 100 / 10) * 10;
  const instalacion = conInstalacion ? costoInstalacion : 0;
  const porcentajePromo = Math.min(PROMO_MAX, Math.max(0, Number(promo) || 0));
  const ahorroPromo = pesos2((subtotal * porcentajePromo) / 100);
  return { lineas, lista, descuento, ahorro, subtotal, porcentajePromo, ahorroPromo, costoInstalacion, instalacion, modulos, parales, total: pesos2(subtotal - ahorroPromo + instalacion) };
}

// Precio inicial: vestidor lineal de 260 cm, estilo colgar, con LED, sin instalación y sin cierre lento.
export function precioDesdeVestidor(hoy = new Date()) {
  return cotizarV(disenar("lineal", { A: 260 }, "colgar").paredes, true, false, 0, hoy, false).total;
}
