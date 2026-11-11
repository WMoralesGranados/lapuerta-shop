import { expect, test } from "vitest";
import { WHATSAPP_NUMERO, whatsappUrl } from "@/config/site";

test("whatsappUrl codifica saltos, asteriscos, acentos, ×, & y la URL del diseño", () => {
  const mensaje = "*Diseño:* 240 × 250 cm\nañadir & más\n*Ver diseño:* https://x.mx/closets/a?w=240&h=250#z";
  const url = whatsappUrl(mensaje);
  const texto = url.split("?text=")[1];

  expect(url.startsWith(`https://wa.me/${WHATSAPP_NUMERO}?text=`)).toBe(true);
  expect(url.split("?")).toHaveLength(2);
  expect(texto).not.toMatch(/[\n &#=]/);
  expect(texto).toContain("%0A");
  expect(texto).toContain("%C3%97");
  expect(texto).toContain("Dise%C3%B1o");
  expect(texto).toContain("%26");
  expect(texto).toContain("*Ver");
  expect(decodeURIComponent(texto)).toBe(mensaje);
  expect(new URL(url).searchParams.get("text")).toBe(mensaje);
});
