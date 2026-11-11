import { MOSTRAR_PROMOCION } from "@/config/site";
import { COLORES, type ColorId } from "@/lib/closets/precios";
import { resumen, type cotizar, type Pieza } from "@/lib/librero/calc";
import { lineaMensaje as linea, textoPorAncho } from "@/lib/mensajeWhatsApp";
import { formatoPrecio } from "@/lib/utils";

export type DisenoLibrero = { mods: Pieza[][]; anchos: number[]; color: ColorId; led: boolean; instalar: boolean };

export function mensajeLibrero(
  { mods, anchos, color, led, instalar }: DisenoLibrero,
  q: ReturnType<typeof cotizar>,
  url: string,
  mostrarPromocion = MOSTRAR_PROMOCION,
) {
  const r = resumen(mods, anchos);
  const etiquetaPrecio = mostrarPromocion && q.descuento > 0 ? "Precio con descuento e IVA" : "Precio con IVA";

  const datos = [
    linea("Módulos", `${r.modulos} (${anchos.map((w) => `${w} cm`).join(", ")})`),
    linea("Medida total", `${r.ancho} × ${r.alto} cm`),
    ...(r.repisasPorAncho.length ? [linea("Repisas", textoPorAncho(r.repisasPorAncho))] : []),
    ...(r.nichosPorAncho.length ? [linea("Nichos", textoPorAncho(r.nichosPorAncho))] : []),
    linea("Iluminación", led ? "Con LED" : "Sin LED"),
    linea("Color", COLORES[color].nombre),
    linea("Instalación", instalar ? `Incluida en el total, ${formatoPrecio(q.instalacion)} aprox.` : "Sin instalación"),
  ];

  return [
    "Hola, quiero cotizar este librero Julieta:",
    "",
    ...datos,
    "",
    linea("Total estimado", `${formatoPrecio(q.total)}. ${etiquetaPrecio}`),
    linea("Ver diseño", url),
  ].join("\n");
}
