// Estado compartible del vestidor en la URL, con los mismos parámetros del original.
import { ACABADOS, COLORES, type AcabadoId, type ColorId } from "@/lib/closets/precios";
import { LIBRERO, aTexto, deTexto, type Pieza } from "@/lib/librero/calc";
import {
  ESPACIOS,
  ESTILOS,
  MEDIDAS_INICIALES,
  armarPared,
  cabeCajonera,
  disenar,
  fijosDe,
  limpiarV,
  moduloAjuste,
  moduloNuevo,
  type Diseno,
  type EstiloVestidor,
  type Medidas,
  type TipoEspacio,
} from "@/lib/vestidor/calc";

export type EstadoVestidor = {
  tipo: TipoEspacio;
  med: Medidas;
  estilo: EstiloVestidor;
  color: ColorId;
  led: boolean;
  instalar: boolean;
  cl: boolean;
  jal: AcabadoId;
  diseno: Diseno;
};

const esClave = <K extends string>(tabla: Record<K, unknown>, valor: string | null): valor is K =>
  valor !== null && Object.keys(tabla).includes(valor);

export function leerEstado(q: URLSearchParams): EstadoVestidor {
  const t = q.get("t");
  const tipo: TipoEspacio = esClave(ESPACIOS, t) ? t : "L";
  const med: Medidas = { ...MEDIDAS_INICIALES[tipo] };
  for (const k of ESPACIOS[tipo].medidas) {
    const valor = q.get(k.toLowerCase());
    if (valor && Number.isFinite(Number(valor))) med[k] = Number(valor);
  }
  const e = q.get("e");
  const estilo: EstiloVestidor = esClave(ESTILOS, e) ? e : "equilibrado";
  const c = q.get("c");
  const j = q.get("j");
  const diseno = disenar(tipo, med, estilo);

  // Respeta los módulos y el diseño editado que vienen en la liga, si coinciden con las paredes.
  const anchosGuardados = q.get("w");
  if (anchosGuardados != null) {
    const partes = anchosGuardados.split("~");
    if (partes.length === diseno.paredes.length) {
      partes.forEach((txt, w) => {
        const p = diseno.paredes[w];
        const fijos = txt ? txt.split(".").map(Number) : [];
        const r = fijos.every((a) => LIBRERO.anchos.includes(a)) && armarPared(p, fijos);
        if (r) Object.assign(p, r, { mods: r.anchos.map((_, i) => (i === r.ajuste ? moduloAjuste() : moduloNuevo(estilo, i, r.anchos[i]))) });
      });
    }
  }
  const guardado = q.get("d");
  if (guardado !== null) {
    const partes = guardado.split("~");
    if (partes.length === diseno.paredes.length) {
      partes.forEach((txt, w) => {
        const p = diseno.paredes[w];
        // aTexto de un solo módulo vacío da "", que deTexto leería como "sin diseño".
        const filas = txt === "" && p.anchos.length === 1 ? [[]] : deTexto(txt) || [];
        const mods = filas.map((m, i) =>
          limpiarV(i === p.ajuste ? m.filter((it) => it.t !== "n" && it.t !== "c") : cabeCajonera(p.anchos[i]) ? m : m.filter((it) => it.t !== "c")),
        );
        if (mods.length === p.anchos.length) p.mods = mods;
      });
    }
  }

  return {
    tipo,
    med,
    estilo,
    color: esClave(COLORES, c) ? c : "nogal",
    led: q.get("l") !== "0",
    instalar: q.get("i") === "1",
    cl: q.get("k") === "1",
    jal: esClave(ACABADOS, j) ? j : "dorado",
    diseno,
  };
}

export function aParametros(e: EstadoVestidor) {
  const url = new URLSearchParams({
    t: e.tipo,
    e: e.estilo,
    c: e.color,
    l: e.led ? "1" : "0",
    i: e.instalar ? "1" : "0",
    k: e.cl ? "1" : "0",
    j: e.jal,
    w: e.diseno.paredes.map((x) => fijosDe(x).join(".")).join("~"),
    d: e.diseno.paredes.map((x) => aTexto(x.mods as Pieza[][])).join("~"),
  });
  for (const k of ESPACIOS[e.tipo].medidas) url.set(k.toLowerCase(), String(e.med[k]));
  return url;
}
