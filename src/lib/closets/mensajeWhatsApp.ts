import { ACABADOS, BISAGRAS, COLORES, CORREDERAS, MODELOS, TONOS, type ConfigCloset, type Costado, type Cotizacion } from "@/lib/closets/precios";
import { lineaMensaje as linea } from "@/lib/mensajeWhatsApp";
import { formatoPrecio } from "@/lib/utils";

const ESPACIOS: Record<Costado, string> = {
  ninguno: "Tengo dos muros",
  der: "Falta el muro derecho",
  izq: "Falta el muro izquierdo",
};

export function mensajeCloset(c: ConfigCloset, q: Cotizacion, url: string) {
  const m = MODELOS[c.modelo];
  const jaladera = c.modelo === "gola" ? "Perfil gola" : `${m.jaladeras[c.jaladera]}, acabado ${ACABADOS[c.acabado].toLowerCase()}`;

  const datos = [
    linea("Modelo", m.nombre),
    linea("Medidas", `Ancho ${c.W} cm, alto ${c.H} cm, fondo ${c.F} cm`),
    ...(c.cajonera ? [linea("Cajonera", `${c.cajonera} cm de ancho`)] : []),
    linea("Color", COLORES[c.color].nombre),
    ...(c.colorNicho ? [linea("Color de entrepañera", TONOS[c.colorNicho].nombre)] : []),
    linea("Jaladera", jaladera),
    linea("Correderas", CORREDERAS[c.corredera].nombre),
    linea("Bisagras", BISAGRAS[c.bisagra]),
    ...(m.fondoFijo ? [] : [linea("Espacio", ESPACIOS[c.costado])]),
  ];

  const precio = q.ok
    ? [
        "*Desglose:*",
        ...q.lineas.map((l) => `${l.concepto}: ${formatoPrecio(l.precio)}`),
        linea("Total estimado", `${formatoPrecio(q.total)}, IVA e instalación incluidos`),
      ]
    : [linea("Observación", q.error), linea("Total estimado", "Por confirmar con un asesor")];

  return ["Hola, quiero cotizar este closet:", "", ...datos, "", ...precio, linea("Ver diseño", url)].join("\n");
}
