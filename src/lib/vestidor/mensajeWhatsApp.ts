import { MOSTRAR_PROMOCION } from "@/config/site";
import { ACABADOS, COLORES } from "@/lib/closets/precios";
import { lineaMensaje as linea, textoPorAncho } from "@/lib/mensajeWhatsApp";
import { formatoPrecio } from "@/lib/utils";
import { ESPACIOS, ESTILOS, ETIQUETAS, type cotizarV, type Pared, type TipoPiezaV } from "@/lib/vestidor/calc";
import type { EstadoVestidor } from "@/lib/vestidor/url";

function lineaPiezas(etiqueta: string, paredes: Pared[], tipo: TipoPiezaV) {
  const cuentas = new Map<number, number>();
  for (const p of paredes) {
    p.mods.forEach((m, i) => {
      const cant = m.filter((it) => it.t === tipo).length;
      if (cant) cuentas.set(p.anchos[i], (cuentas.get(p.anchos[i]) ?? 0) + cant);
    });
  }
  if (!cuentas.size) return [];
  const lista = [...cuentas].sort((a, b) => a[0] - b[0]).map(([w, cant]) => ({ w, cant }));
  const total = lista.reduce((a, x) => a + x.cant, 0);
  return [linea(etiqueta, `${total} (${textoPorAncho(lista)})`)];
}

const modulosDe = (p: Pared) =>
  `${p.nombre}: ${p.anchos.length ? p.anchos.map((w, i) => (i === p.ajuste ? `ajuste de ${w} cm` : `${w} cm`)).join(", ") : "sin módulos"}`;

export function mensajeVestidor(
  { tipo, estilo, color, led, instalar, cl, jal, diseno: d }: EstadoVestidor,
  q: ReturnType<typeof cotizarV>,
  url: string,
  mostrarPromocion = MOSTRAR_PROMOCION,
) {
  const hayCajoneras = d.paredes.some((p) => p.mods.flat().some((it) => it.t === "c"));
  const etiquetaPrecio = mostrarPromocion && q.descuento > 0 ? "Precio con descuento e IVA" : "Precio con IVA";
  const instalacion = !instalar ? "Sin instalación" : d.error ? "Solicitada" : `Incluida en el total, ${formatoPrecio(q.instalacion)} aprox.`;

  const datos = [
    linea("Tipo", ESPACIOS[tipo].nombre),
    linea("Medidas", ESPACIOS[tipo].medidas.map((k) => `${ETIQUETAS[tipo][k]} ${d.med[k]} cm`).join(", ")),
    ...(d.pasillo != null ? [linea("Pasillo", `${d.pasillo} cm`)] : []),
    linea("Estilo", ESTILOS[estilo].nombre),
    linea("Módulos", d.paredes.map(modulosDe).join("; ")),
    ...lineaPiezas("Repisas", d.paredes, "r"),
    ...lineaPiezas("Nichos", d.paredes, "n"),
    ...lineaPiezas("Tubos", d.paredes, "t"),
    ...lineaPiezas("Cajoneras", d.paredes, "c"),
    ...(hayCajoneras ? [linea("Correderas", `${cl ? "Cierre lento" : "Normales"}. Jaladera mini ${ACABADOS[jal].toLowerCase()}`)] : []),
    linea("Iluminación", led ? "Con LED" : "Sin LED"),
    linea("Color", COLORES[color].nombre),
    linea("Instalación", instalacion),
  ];

  const precio = d.error
    ? [linea("Observación", d.error), linea("Total estimado", "Por confirmar con un asesor")]
    : [linea("Total estimado", `${formatoPrecio(q.total)}. ${etiquetaPrecio}`)];

  return ["Hola, quiero cotizar este vestidor:", "", ...datos, "", ...precio, linea("Ver diseño", url)].join("\n");
}
