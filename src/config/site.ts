export const WHATSAPP_NUMERO = "528132381889";

export const COBERTURA = "Área metropolitana de Monterrey y Saltillo";

export const MENSAJE_GENERAL = "Hola, me interesa información sobre sus muebles a medida.";

export function whatsappUrl(mensaje: string) {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

export const ENLACES_CATEGORIAS = [
  { etiqueta: "Closets", ruta: "/?categoria=closets" },
  { etiqueta: "Librero", ruta: "/?categoria=libreros" },
  { etiqueta: "Vestidores", ruta: "/?categoria=vestidores" },
];
