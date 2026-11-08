import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const opcionesPrecio = { style: "currency", currency: "MXN" } as const;
const precioEntero = new Intl.NumberFormat("es-MX", { ...opcionesPrecio, maximumFractionDigits: 0 });
const precioCentavos = new Intl.NumberFormat("es-MX", { ...opcionesPrecio, minimumFractionDigits: 2 });

export function formatoPrecio(valor: number) {
  return (Number.isInteger(valor) ? precioEntero : precioCentavos).format(valor);
}
