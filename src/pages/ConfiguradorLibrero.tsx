import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import EscenarioLibrero from "@/components/librero/EscenarioLibrero";
import PanelLibrero from "@/components/librero/PanelLibrero";
import WhatsAppLink from "@/components/WhatsAppLink";
import { MOSTRAR_PROMOCION } from "@/config/site";
import { COLORES, type ColorId } from "@/lib/closets/precios";
import {
  PLANTILLAS,
  aTexto,
  agregarItem,
  cotizar,
  deTexto,
  moverItem,
  normalizar,
  normalizarAnchos,
  resumen,
  type Pieza,
  type TipoPieza,
} from "@/lib/librero/calc";
import type { SeleccionPieza } from "@/lib/librero/visor3d";
import { useTituloPagina } from "@/lib/useTituloPagina";
import { cn, focusRing, formatoPrecio } from "@/lib/utils";

const SIN_SCROLL = { replace: true, state: { keepScroll: true } };

type Diseno = { mods: Pieza[][]; anchos: number[]; color: ColorId; led: boolean; instalar: boolean };

function aParametros({ mods, anchos, color, led, instalar }: Diseno) {
  return new URLSearchParams({
    d: aTexto(mods),
    a: anchos.join("_"),
    c: color,
    l: led ? "1" : "0",
    i: instalar ? "1" : "0",
  });
}

const detalle = (lista: { w: number; cant: number }[]) =>
  lista.length ? lista.map((x) => `${x.cant} de ${x.w} cm`).join(", ") : "0";

export default function ConfiguradorLibrero() {
  useTituloPagina("Librero Julieta | La Puerta");
  const [params, setParams] = useSearchParams();
  const [modElegido, setModElegido] = useState(0);
  const [seleccion, setSeleccion] = useState<SeleccionPieza | null>(null);
  const [aviso, setAviso] = useState("");

  const diseno = useMemo<Diseno>(() => {
    const d = params.get("d");
    // aTexto de un solo módulo vacío da "", que deTexto leería como "sin diseño".
    const mods = normalizar(d === "" ? [[]] : deTexto(d));
    const anchos = normalizarAnchos((params.get("a") || "").split("_"), mods.length);
    const c = params.get("c");
    const color = c && Object.keys(COLORES).includes(c) ? (c as ColorId) : "nogal";
    return { mods, anchos, color, led: params.get("l") !== "0", instalar: params.get("i") === "1" };
  }, [params]);

  const { mods, anchos, color, led, instalar } = diseno;
  const modSel = Math.min(modElegido, mods.length - 1);

  useEffect(() => {
    const canonica = aParametros(diseno);
    if (canonica.toString() !== params.toString()) setParams(canonica, SIN_SCROLL);
  }, [diseno, params, setParams]);

  const guardar = useCallback(
    (cambio: Partial<Diseno>) => setParams(aParametros({ ...diseno, ...cambio }), SIN_SCROLL),
    [diseno, setParams],
  );

  const seleccionar = useCallback((sel: SeleccionPieza | null) => {
    setSeleccion(sel);
    if (sel) setModElegido(sel.m);
    setAviso("");
  }, []);

  const conModulo = (m: number, items: Pieza[]) => mods.map((actual, k) => (k === m ? items : actual));

  function borrar() {
    if (!seleccion) {
      setAviso("Primero toca en el dibujo la pieza que quieres borrar.");
      return;
    }
    guardar({ mods: conModulo(seleccion.m, mods[seleccion.m].filter((_, k) => k !== seleccion.i)) });
    setSeleccion(null);
    setAviso("");
  }

  function moverTeclado(m: number, i: number, delta: number) {
    guardar({ mods: conModulo(m, moverItem(mods[m], i, mods[m][i].y + delta)) });
  }

  function moverSeleccion(delta: number) {
    if (seleccion) moverTeclado(seleccion.m, seleccion.i, delta);
  }

  function agregar(t: TipoPieza) {
    const nuevo = agregarItem(mods[modSel], t);
    if (!nuevo) {
      setAviso(`Ya no cabe otr${t === "n" ? "o nicho" : "a repisa"} en el módulo ${modSel + 1}. Mueve o quita algo.`);
      return;
    }
    setAviso("");
    guardar({ mods: conModulo(modSel, nuevo) });
    setSeleccion(null);
  }

  function masModulo() {
    guardar({ mods: [...mods, normalizar([PLANTILLAS[mods.length % 2]])[0]], anchos: [...anchos, 80] });
    setModElegido(mods.length);
    setSeleccion(null);
  }

  function menosModulo() {
    guardar({ mods: mods.slice(0, -1), anchos: anchos.slice(0, -1) });
    setSeleccion(null);
  }

  const r = resumen(mods, anchos);
  const q = cotizar(mods, anchos, led, instalar);
  const total = formatoPrecio(q.total);
  const liga = `${window.location.origin}/librero-julieta?${aParametros(diseno)}`;
  const etiquetaPrecio = MOSTRAR_PROMOCION ? "Precio con descuento e IVA" : "Precio con IVA";
  const mensaje = `Hola, quiero cotizar un librero Julieta: ${r.modulos} ${r.modulos === 1 ? "módulo" : "módulos"} de ${anchos.join(", ")} cm, repisas: ${detalle(r.repisasPorAncho)}, nichos: ${detalle(r.nichosPorAncho)}, ${COLORES[color].nombre}, ${r.ancho} × ${r.alto} cm ${led ? "con" : "sin"} LED. ${instalar ? "Con instalación en área metropolitana de Monterrey o Saltillo" : "Sin instalación"}. ${etiquetaPrecio}: ${total}. Diseño: ${liga}`;

  return (
    <Layout showWhatsAppFloat={false} stickyHeader={false}>
      <div className="min-[900px]:grid min-[900px]:h-[calc(100dvh-93px)] min-[900px]:grid-cols-[minmax(0,1fr)_400px] min-[900px]:grid-rows-[minmax(0,1fr)] lg:h-[calc(100dvh-109px)]">
        <EscenarioLibrero
          mods={mods}
          anchos={anchos}
          color={color}
          led={led}
          seleccion={seleccion}
          ancho={r.ancho}
          alto={r.alto}
          onSeleccionar={seleccionar}
          onSoltar={(nuevos) => guardar({ mods: nuevos })}
          onMoverTeclado={moverTeclado}
          onBorrar={borrar}
        />

        <aside className="flex flex-col min-[900px]:min-h-0 min-[900px]:border-l">
          <div className="px-4 min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:overflow-y-auto">
            <PanelLibrero
              mods={mods}
              anchos={anchos}
              color={color}
              led={led}
              instalar={instalar}
              modSel={modSel}
              seleccion={seleccion}
              aviso={aviso}
              onDesde={() => {
                setModElegido(0);
                setSeleccion(null);
                setAviso("");
              }}
              onMasModulo={masModulo}
              onMenosModulo={menosModulo}
              onElegirModulo={(m) => {
                setModElegido(m);
                setAviso("");
              }}
              onAncho={(w) => guardar({ anchos: anchos.map((actual, k) => (k === modSel ? w : actual)) })}
              onAgregar={agregar}
              onMoverSeleccion={moverSeleccion}
              onBorrar={borrar}
              onLed={(si) => guardar({ led: si })}
              onColor={(id) => guardar({ color: id })}
              onInstalar={(si) => guardar({ instalar: si })}
            />
          </div>

          <div className="sticky bottom-0 z-20 shrink-0 border-t bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {MOSTRAR_PROMOCION && q.ahorro > 0 && (
                    <span>
                      Antes <s>{formatoPrecio(q.lista + q.instalacion)}</s> ·{" "}
                    </span>
                  )}
                  {instalar ? "Total estimado con IVA e instalación" : "Total estimado con IVA"}
                </p>
                <p className="text-xl font-semibold text-primary">{total}</p>
              </div>
              <WhatsAppLink
                mensaje={mensaje}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90",
                  focusRing,
                )}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Cotizar por WhatsApp
              </WhatsAppLink>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Precio estimado. Un asesor confirma tus medidas antes de fabricar.
            </p>
          </div>
        </aside>
      </div>
    </Layout>
  );
}
