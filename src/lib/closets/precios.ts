// Precios al público de la interfaz de venta. Medidas en cm. Lo usan el navegador y el servidor.
// Réplica de mock/public/js/precios.js. No simplificar fórmulas ni redondeos.
export type ModeloId = "classic" | "gola" | "premium" | "bari" | "aura";
export type ColorId = "nogal" | "colorado" | "hickory";
export type TonoId = "gris" | "salvia" | "taupe";
export type AcabadoId = "plata" | "negro" | "dorado";
export type CorrederaId = "ligera" | "reforzada" | "cierre";
export type BisagraId = "oculta" | "cierre";
export type Costado = "izq" | "der" | "ninguno";

export type ModeloCloset = {
  nombre: string;
  lema: string;
  precios?: number[];
  H: [number, number];
  puerta: number;
  contra: number;
  cajones: number;
  altoCajon: number;
  video: string | null;
  gola?: boolean;
  base?: number;
  cajonAbajo?: number;
  zoclo?: number;
  columna?: boolean;
  entrepanera?: number;
  fondoFijo?: number;
  tonos?: boolean;
  jaladeras: Record<string, string>;
  jalIncluida: string;
  interiorColor: boolean;
  incluye: string[];
};

export type ConfigCloset = {
  modelo: ModeloId;
  W: number;
  H: number;
  F: number;
  cajonera: number | null;
  color: ColorId;
  colorNicho: TonoId | null;
  jaladera: string;
  acabado: AcabadoId;
  corredera: CorrederaId;
  bisagra: BisagraId;
  costado: Costado;
};

// Entrada sin validar: normalizar acepta cualquier valor y cae a los valores por defecto.
export type ConfigEntrada = {
  modelo?: string;
  W?: number | string | null;
  H?: number | string | null;
  F?: number | string | null;
  cajonera?: number | string | null;
  color?: string;
  colorNicho?: string | null;
  jaladera?: string;
  acabado?: string;
  corredera?: string;
  bisagra?: string;
  costado?: string;
};

export type LineaCotizacion = { concepto: string; precio: number };

export type Cotizacion =
  | { ok: true; config: ConfigCloset; lineas: LineaCotizacion[]; total: number }
  | { ok: false; error: string; config: ConfigCloset };

export const LARGOS = [60, 80, 120, 160, 185, 194, 240];

export const ENTREPANOS: Record<number, number[]> = {
  30: [234.5, 323.75, 460.25, 617.75, 698.25, 831.25, 903],
  40: [299.25, 409.5, 581, 780.5, 896, 1065.75, 1153.25],
  60: [428.75, 581, 847, 1132.25, 1293.25, 1538.25, 1667.75],
};

export const CORREDERAS: Record<CorrederaId, { nombre: string; precio: number }> = {
  ligera: { nombre: "Extensión ligera", precio: 0 },
  reforzada: { nombre: "Extensión reforzada", precio: 120 },
  cierre: { nombre: "Cierre lento", precio: 180 },
};
export const BISAGRAS: Record<BisagraId, string> = { oculta: "Oculta", cierre: "Oculta con cierre lento" };
export const PRECIO_PAR_BISAGRA = 120;
export const ANCHOS = [160, 180, 200, 240, 280];
// POR CONFIRMAR CON EL CLIENTE: rangos de fondo y ancho.
export const LIM: { F: [number, number]; W: [number, number] } = { F: [55, 75], W: [160, 300] };
const ALTO_MINIMO = 250;
export const COSTO_JALADERA = 80;
const FONDO_INCLUIDO = 60;

export const MODELOS: Record<ModeloId, ModeloCloset> = {
  classic: {
    nombre: "Florencia Classic",
    lema: "Cajonera con secreter y puertas lisas",
    precios: [11550, 12450, 13650, 16700, 18990],
    // POR CONFIRMAR CON EL CLIENTE: rango de alto.
    H: [ALTO_MINIMO, 290],
    puerta: 185,
    contra: 60,
    cajones: 5,
    altoCajon: 20,
    video: "classic",
    jaladeras: { barra: "De barra", mini: "Mini" },
    jalIncluida: "barra",
    interiorColor: false,
    incluye: [
      "Cajonera de 5 cajones, 60 cm de ancho",
      "Maletero a 60 cm de profundidad",
      "4 tubos ovalados",
      "Bisagras ocultas de 110° y correderas de extensión ligera",
      "Interior y cajones en blanco",
    ],
  },
  gola: {
    nombre: "Florencia Gola",
    lema: "Sin jaladeras: el perfil gola es la jaladera",
    precios: [11550, 12450, 13650, 16700, 18990],
    // POR CONFIRMAR CON EL CLIENTE: rango de alto.
    H: [ALTO_MINIMO, 290],
    puerta: 185,
    contra: 61,
    cajones: 4,
    altoCajon: 22,
    video: null,
    gola: true,
    jaladeras: { gola: "Perfil gola" },
    jalIncluida: "gola",
    interiorColor: false,
    incluye: [
      "Cajonera de 4 cajones con perfil gola, 60 cm de ancho",
      "Maletero a 60 cm de profundidad",
      "4 tubos ovalados",
      "Bisagras ocultas de 110° y correderas de extensión ligera",
      "Interior y cajones en blanco",
    ],
  },
  premium: {
    nombre: "Florencia Premium",
    lema: "Nicho abierto y cajones con perfil gola",
    precios: [15000, 15910, 17100, 20160, 22450],
    // POR CONFIRMAR CON EL CLIENTE: rango de alto.
    H: [ALTO_MINIMO, 300],
    puerta: 194,
    contra: 60,
    cajones: 4,
    altoCajon: 22,
    video: "premium",
    gola: true,
    base: 12,
    cajonAbajo: 25,
    jaladeras: { mini: "Mini" },
    jalIncluida: "mini",
    interiorColor: true,
    incluye: [
      "Cajonera de 4 cajones con perfil gola",
      "Nicho abierto con repisas",
      "Base de 12 cm",
      "Maletero a 60 cm de profundidad",
      "4 tubos ovalados",
      "Bisagras y correderas con cierre lento",
    ],
  },
  // Lista de la ficha hasta 2.00 m; 2.40 y 2.80 proporcionales al precio por cm de 2.00 ($101.25).
  bari: {
    nombre: "Closet Bari",
    lema: "Cajonera de 3 cajones y puertas a 2.32 m",
    // POR CONFIRMAR CON EL CLIENTE: precios proporcionales de 2.40 y 2.80 m (24300 y 28350).
    precios: [14900, 16600, 20250, 24300, 28350],
    // POR CONFIRMAR CON EL CLIENTE: rango de alto.
    H: [232, 300],
    puerta: 232,
    contra: 0,
    cajones: 3,
    altoCajon: 20,
    zoclo: 12,
    video: null,
    columna: true,
    jaladeras: { mini: "Mini", barra: "De barra" },
    jalIncluida: "mini",
    interiorColor: true,
    incluye: [
      "Cajonera de 3 cajones de 80 o 100 cm de ancho; cajones por dentro en MDF blanco de 15 mm",
      "Maletero a 60 cm de profundidad",
      "3 tubos ovalados",
      "Entrepañera de 3 entrepaños, 40 cm de ancho y 40 de fondo",
      "Base de 12 cm; toda la estructura, por dentro y por fuera, del color que elijas",
      "Bisagras ocultas y correderas de extensión ligera",
    ],
  },
  // Aura: la cajonera de Bari (zoclo 12 + 3 cajones de 20 = 72) con una entrepañera abierta de 1.62 m
  // (50 de fondo, repisas de 40 pegadas al fondo y LED vertical); los módulos de puertas se ajustan a esa altura: 2.34 m.
  // Cada par de puertas es un módulo con sus 2 parales, por eso el fondo es fijo de 60.
  // Lista del dueño con cajonera de 80: 2.00, 2.40 y 2.80 m. 1.60 y 1.80 proporcionales al precio
  // por cm de 2.00 ($118.50), igual que se sacaron las medidas faltantes de Bari.
  aura: {
    nombre: "Closet Aura",
    lema: "Entrepañera abierta con luz LED sobre la cajonera",
    // POR CONFIRMAR CON EL CLIENTE: precios proporcionales de 1.60 y 1.80 m (18960 y 21330).
    precios: [18960, 21330, 23700, 24900, 27100],
    // POR CONFIRMAR CON EL CLIENTE: rango de alto.
    H: [234, 300],
    puerta: 234,
    contra: 0,
    cajones: 3,
    altoCajon: 20,
    zoclo: 12,
    video: null,
    columna: true,
    entrepanera: 162,
    fondoFijo: 60,
    tonos: true,
    jaladeras: { barra: "De barra", mini: "Mini" },
    jalIncluida: "barra",
    interiorColor: true,
    incluye: [
      "Cajonera de 3 cajones de 80 o 100 cm de ancho; cajones por dentro en MDF blanco de 15 mm",
      "Entrepañera abierta de 1.62 m y 50 cm de fondo, con 3 entrepaños de 40 y luz LED vertical",
      "Módulos de 2 puertas con sus propios parales, maletero y tubos",
      "Base de 12 cm",
      "Bisagras ocultas y correderas de extensión ligera",
    ],
  },
};

// Bari: la cajonera (80 o 100 cm) no cambia; lo que se ajusta es el par de puertas de junto, de 60 a 100 cm.
// Hasta 2.20 m va de lado con un par de puertas; desde 2.20 m, al centro con un par en cada lado.
// Puertas: 1.60 m arriba de la cajonera (zoclo 12 + 3 cajones de 20) y 2.20 m sobre el zoclo; todas terminan a 2.32 m.
export const BARI = { cajoneras: [80, 100], par: [60, 100], centroDesde: 220 };
export const bariAlCentro = (W: number) => W >= BARI.centroDesde;
export const paresBari = (W: number) => (bariAlCentro(W) ? 2 : 1);
export function cajonerasBari(W: number): number[] {
  const caben = BARI.cajoneras.filter((cw) => {
    const par = (W - cw) / paresBari(W);
    return par >= BARI.par[0] && par <= BARI.par[1];
  });
  // De 2.00 a 2.20 m, de lado, ninguna deja el par en 100 o menos: va la de 100 con el par de hasta 120.
  return caben.length ? caben : [100];
}
// La lista trae la cajonera de 80. La de 100 suma lo proporcional de las piezas que crecen 20 cm:
// techo, piso y 3 fondos de cajón (pieza de 60) y 3 frentes, 3 contrafrentes y 3 traseras (pieza de 30).
export const EXTRA_CAJONERA_100 = (20 * (5 * ENTREPANOS[60][6] + 9 * ENTREPANOS[30][6])) / 240;
// Aura: además crece 20 cm el mueble de la entrepañera con LED (despiece "entrepañera luz led"):
// techo y piso (pieza de 60), 3 repisas (pieza de 40), trasera de 1.59 m (60 + 60 + 40) y refuerzo (30).
export const EXTRA_ENTREPANERA_100 =
  (20 * (4 * ENTREPANOS[60][6] + 4 * ENTREPANOS[40][6] + ENTREPANOS[30][6])) / 240;
export const extraCajonera100 = (modelo: ModeloId) =>
  EXTRA_CAJONERA_100 + (modelo === "aura" ? EXTRA_ENTREPANERA_100 : 0);

export const COLORES: Record<ColorId, { nombre: string; img: string }> = {
  nogal: { nombre: "Nogal Valentina", img: "image3.png" },
  colorado: { nombre: "Roble Colorado", img: "roble-colorado.jpg" },
  hickory: { nombre: "Hickory Frida", img: "image2.png" },
};
// Tonos lisos (sin veta) para la entrepañera con LED del Aura; el resto del closet va en los de madera.
// Nombres provisionales: confirmar con el dueño los de su proveedor.
// POR CONFIRMAR CON EL CLIENTE: nombres provisionales de TONOS.
export const TONOS: Record<TonoId, { nombre: string; hex: string }> = {
  gris: { nombre: "Gris Perla", hex: "#c4bfbb" },
  salvia: { nombre: "Verde Salvia", hex: "#8b9682" },
  taupe: { nombre: "Taupe", hex: "#97897c" },
};
export const ACABADOS: Record<AcabadoId, string> = { plata: "Plata", negro: "Negro", dorado: "Dorado" };

const dinero = (n: number) => Math.round(n * 100) / 100;

// Equivale a `tabla[clave] ? ... : ...` del original, con la clave sin validar.
function existe<K extends string>(tabla: Record<K, unknown>, clave: unknown): clave is K {
  return Boolean((tabla as Record<string, unknown>)[String(clave)]);
}

function interpola(xs: number[], ys: number[], x: number) {
  if (x <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) return ys[i - 1] + ((ys[i] - ys[i - 1]) * (x - xs[i - 1])) / (xs[i] - xs[i - 1]);
  }
  return ys[ys.length - 1];
}

// De 2.80 a 3.00 m la lista no tiene precio: sigue el mismo aumento por cm del último tramo.
// POR CONFIRMAR CON EL CLIENTE: extrapolación de más de 2.80 m.
function precioAncho(precios: number[], W: number) {
  const n = ANCHOS.length - 1;
  if (W <= ANCHOS[n]) return interpola(ANCHOS, precios, W);
  return precios[n] + ((precios[n] - precios[n - 1]) * (W - ANCHOS[n])) / (ANCHOS[n] - ANCHOS[n - 1]);
}

// Una pieza más larga que 240 se cobra como 240 + 60.
export function entrepano(prof: number, largo: number) {
  const fila = ENTREPANOS[prof];
  if (largo > 240) return fila[6] + fila[0];
  return interpola(LARGOS, fila, largo);
}

// Para cubrir un fondo se combinan piezas de la lista: la más barata que lo alcance (70 = 40 + 30).
export function piezaPorFondo(F: number, largo: number) {
  const combos = [[60], [40, 30], [40, 40], [60, 30], [60, 40]];
  const precios = combos
    .filter((p) => p.reduce((a, b) => a + b, 0) >= F)
    .map((p) => p.reduce((a, prof) => a + entrepano(prof, largo), 0));
  return Math.min(...precios);
}

// Fijo de Bari: la pieza de la lista que cubra la altura sobre las puertas (30, 40, 60 o combinadas).
export function fijoPorAlto(alto: number, largo: number) {
  const combos = [[30], [40], [60], [40, 30], [40, 40], [60, 30], [60, 40], [60, 60]];
  const precios = combos
    .filter((p) => p.reduce((a, b) => a + b, 0) >= alto)
    .map((p) => p.reduce((a, prof) => a + entrepano(prof, largo), 0));
  return Math.min(...precios);
}

export function puertasPorLado(W: number) {
  return W < 170 ? 1 : 2;
}
export function contraventanas(_modelo: ModeloId, W: number) {
  return W > 220 ? 6 : 4;
}

// Bari: 2 puertas altas por par, más las 2 de arriba de la cajonera. Aura: solo las de los pares.
const puertasBari = (W: number) => paresBari(W) * 2 + 2;
const puertasAura = (W: number) => paresBari(W) * 2;

export function cantidadJaladeras(modelo: ModeloId, W: number) {
  if (modelo === "bari") return puertasBari(W) + MODELOS.bari.cajones;
  if (modelo === "aura") return puertasAura(W) + MODELOS.aura.cajones;
  const puertas = puertasPorLado(W) * 2;
  const contra = contraventanas(modelo, W);
  return modelo === "classic" ? puertas + contra + 2 + 5 : puertas + contra;
}

// Puerta grande: 3 bisagras. Contraventana y secreter: 2.
export function cantidadBisagras(modelo: ModeloId, W: number) {
  // Bari: 3 en cada puerta alta y 2 en las de arriba de la cajonera.
  if (modelo === "bari") return paresBari(W) * 2 * 3 + 2 * 2;
  // Aura: puertas de 2.22 m, con 4 bisagras cada una como en su despiece.
  if (modelo === "aura") return puertasAura(W) * 4;
  const secreter = modelo === "premium" ? 0 : 2;
  return puertasPorLado(W) * 2 * 3 + (contraventanas(modelo, W) + secreter) * 2;
}

export function normalizar(c: ConfigEntrada = {}): ConfigCloset {
  const modelo: ModeloId = existe(MODELOS, c.modelo) ? c.modelo : "classic";
  const m = MODELOS[modelo];
  const num = (v: unknown, d: number) =>
    v !== "" && v != null && Number.isFinite(Number(v)) ? Math.round(Number(v) * 10) / 10 : d;
  const W = num(c.W, 240);
  // Bari y Aura: la cajonera elegida si cabe en el ancho; si no, la que sí cabe (primero la de 80, que es la de lista).
  const caben = cajonerasBari(W);
  const cajonera = !m.columna ? null : caben.includes(Number(c.cajonera)) ? Number(c.cajonera) : caben[0] || 80;
  return {
    modelo,
    // Aura no cambia de fondo: cada par de puertas lleva sus 2 parales.
    W,
    H: num(c.H, ALTO_MINIMO),
    F: m.fondoFijo || num(c.F, 60),
    cajonera,
    color: existe(COLORES, c.color) ? c.color : "colorado",
    // Aura: la entrepañera con LED lleva su propio tono liso, independiente del closet.
    colorNicho: !m.tonos ? null : existe(TONOS, c.colorNicho) ? c.colorNicho : "gris",
    jaladera: existe(m.jaladeras, c.jaladera) ? c.jaladera : m.jalIncluida,
    acabado: existe(ACABADOS, c.acabado) ? c.acabado : "plata",
    // Premium ya trae cierre lento; no se cobra ni se puede bajar.
    corredera: modelo === "premium" ? "cierre" : existe(CORREDERAS, c.corredera) ? c.corredera : "ligera",
    bisagra: modelo === "premium" ? "cierre" : existe(BISAGRAS, c.bisagra) ? c.bisagra : "oculta",
    // Aura lleva sus propios parales en cada módulo: no necesita costado.
    costado: !m.fondoFijo && (c.costado === "izq" || c.costado === "der") ? c.costado : "ninguno",
  };
}

export function validar(c: ConfigCloset): string | null {
  const [hMin, hMax] = MODELOS[c.modelo].H;
  if (c.W < LIM.W[0] || c.W > LIM.W[1])
    return `Cotizamos anchos de ${LIM.W[0]} a ${LIM.W[1]} cm. Para otra medida, habla con un asesor.`;
  if (c.H < hMin || c.H > hMax)
    return `Este modelo va de ${hMin} a ${hMax} cm de alto. Para otra medida, habla con un asesor.`;
  if (c.F < LIM.F[0] || c.F > LIM.F[1]) return `El fondo va de ${LIM.F[0]} a ${LIM.F[1]} cm.`;
  return null;
}

export function cotizar(cIn: ConfigEntrada): Cotizacion {
  const c = normalizar(cIn);
  const error = validar(c);
  if (error) return { ok: false, error, config: c };
  const m = MODELOS[c.modelo];
  if (!m.precios)
    return { ok: false, error: `El precio del ${m.nombre} está por publicarse. Pide tu cotización a un asesor.`, config: c };
  const lineas: LineaCotizacion[] = [{ concepto: `${m.nombre} de ${c.W} cm`, precio: precioAncho(m.precios, c.W) }];
  // La base se cobra como pieza de fondo × ancho.
  if (m.base) lineas.push({ concepto: `Base de ${m.base} cm`, precio: piezaPorFondo(c.F, c.W) });
  if (m.columna) {
    // La de 100 se cobra solo si el cliente la elige pudiendo llevar la de 80; si es la única que cabe, va en el precio de lista.
    if (c.cajonera === 100 && cajonerasBari(c.W).includes(80))
      lineas.push({
        concepto: m.entrepanera ? "Cajonera y entrepañera de 100 cm" : "Cajonera de 100 cm",
        precio: extraCajonera100(c.modelo),
      });
    // Arriba de las puertas (2.32 m en Bari, 2.34 en Aura) cierra un fijo hasta el techo.
    if (c.H > m.puerta)
      lineas.push({
        concepto: `Fijo superior de ${Math.round((c.H - m.puerta) * 10) / 10} cm`,
        precio: fijoPorAlto(c.H - m.puerta, c.W),
      });
    // El alto mínimo de 2.50 m va incluido; el fijo se cobra solo arriba de esa medida o de la suma de piezas.
  } else if (c.H > Math.max(ALTO_MINIMO, m.puerta + m.contra))
    lineas.push({ concepto: "Fijo superior hasta el techo", precio: entrepano(40, c.W) });
  if (c.F > FONDO_INCLUIDO)
    lineas.push({
      concepto: `Maletero a ${c.F} cm de fondo`,
      precio: (entrepano(60, c.W) / 60) * (c.F - FONDO_INCLUIDO),
    });
  if (c.costado !== "ninguno") {
    lineas.push({
      concepto: `Costado ${c.costado === "der" ? "derecho" : "izquierdo"}`,
      precio: ENTREPANOS[60][6] + (c.H > 240 ? ENTREPANOS[60][0] : 0),
    });
  }
  if (c.jaladera !== m.jalIncluida) {
    const n = cantidadJaladeras(c.modelo, c.W);
    lineas.push({ concepto: `Cambio a jaladera ${m.jaladeras[c.jaladera].toLowerCase()}`, precio: n * COSTO_JALADERA });
  }
  if (c.modelo !== "premium" && CORREDERAS[c.corredera].precio) {
    lineas.push({
      concepto: `Corredera ${CORREDERAS[c.corredera].nombre.toLowerCase()} (${m.cajones} cajones)`,
      precio: CORREDERAS[c.corredera].precio * m.cajones,
    });
  }
  if (c.modelo !== "premium" && c.bisagra === "cierre") {
    const n = cantidadBisagras(c.modelo, c.W);
    lineas.push({ concepto: `Bisagras con cierre lento (${n} piezas)`, precio: (n / 2) * PRECIO_PAR_BISAGRA });
  }
  const limpias = lineas.map((l) => ({ ...l, precio: dinero(l.precio) }));
  return { ok: true, config: c, lineas: limpias, total: dinero(limpias.reduce((a, l) => a + l.precio, 0)) };
}

export function descripcion(c: ConfigCloset) {
  const m = MODELOS[c.modelo];
  return `${m.nombre} · ${c.W} × ${c.H} × ${c.F} cm${c.cajonera ? ` · Cajonera de ${c.cajonera} cm` : ""} · ${COLORES[c.color].nombre}${c.colorNicho ? ` · Entrepañera ${TONOS[c.colorNicho].nombre}` : ""} · ${c.modelo === "gola" ? "Perfil gola" : `Jaladera ${m.jaladeras[c.jaladera].toLowerCase()} ${ACABADOS[c.acabado].toLowerCase()}`} · Corredera ${CORREDERAS[c.corredera].nombre.toLowerCase()} · Bisagra ${BISAGRAS[c.bisagra].toLowerCase()}${c.costado === "ninguno" ? " · Con preparación" : ` · Costado ${c.costado === "der" ? "derecho" : "izquierdo"}`}`;
}

// Precio inicial de un closet: ancho mínimo vigente, alto mínimo del modelo y fondo de 60.
export function precioDesdeCloset(modelo: ModeloId) {
  const q = cotizar({ modelo, W: LIM.W[0], H: MODELOS[modelo].H[0], F: 60 });
  if (!q.ok) throw new Error(q.error);
  return q.total;
}
