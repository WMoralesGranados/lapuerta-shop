import { describe, expect, test } from "vitest";
import { ESPACIOS, ESTILOS } from "@/lib/vestidor/calc";
import { aParametros, leerEstado } from "@/lib/vestidor/url";

const leer = (q: string) => leerEstado(new URLSearchParams(q));

describe("URL del vestidor", () => {
  test("una liga canónica se conserva al releerla, en todos los tipos y estilos", () => {
    for (const t of Object.keys(ESPACIOS)) {
      for (const e of Object.keys(ESTILOS)) {
        const canonica = aParametros(leer(`t=${t}&e=${e}`)).toString();
        const releido = leerEstado(new URLSearchParams(canonica));
        expect(aParametros(releido).toString()).toBe(canonica);
      }
    }
  });

  test("sin t abre en L; con t=lineal y e=colgar abre el lineal de 2.60 m", () => {
    expect(leer("e=colgar").tipo).toBe("L");
    const e = leer("t=lineal&e=colgar");
    expect(e.tipo).toBe("lineal");
    expect(e.med.A).toBe(260);
    expect(e.estilo).toBe("colgar");
    expect(e.led).toBe(true);
  });

  test("distingue d ausente de d vacío en una pared de un módulo", () => {
    expect(leer("t=lineal&a=70").diseno.paredes[0].mods[0].length).toBeGreaterThan(0);
    expect(leer("t=lineal&a=70&d=").diseno.paredes[0].mods).toEqual([[]]);
  });

  test("conserva una medida fuera de rango con su error y descarta la no numérica", () => {
    const fuera = leer("t=lineal&a=50");
    expect(fuera.med.A).toBe(50);
    expect(fuera.diseno.error).toMatch(/de 100 a 600/);
    expect(leer("t=lineal&a=abc").med.A).toBe(260);
  });

  test("conserva los módulos y piezas editados", () => {
    const e = leer("t=lineal&a=260&w=60.100&d=r10.t90_r20_r30");
    const p = e.diseno.paredes[0];
    expect(p.anchos.slice(0, 2)).toEqual([60, 100]);
    expect(p.mods[0]).toEqual([{ t: "r", y: 10 }, { t: "t", y: 90 }]);
  });

  test("valores desconocidos caen a los de por defecto", () => {
    const e = leer("t=constructor&e=constructor&c=constructor&j=constructor");
    expect([e.tipo, e.estilo, e.color, e.jal]).toEqual(["L", "equilibrado", "nogal", "dorado"]);
  });
});
