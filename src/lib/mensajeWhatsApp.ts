export const lineaMensaje = (etiqueta: string, valor: string) => `*${etiqueta}:* ${valor}`;

export const textoPorAncho = (lista: { w: number; cant: number }[]) =>
  lista.map((x) => `${x.cant} de ${x.w} cm`).join(", ");
