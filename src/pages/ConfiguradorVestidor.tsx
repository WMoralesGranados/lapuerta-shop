import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import EscenarioVestidor, { type VistaVestidor } from "@/components/vestidor/EscenarioVestidor";
import PanelVestidor from "@/components/vestidor/PanelVestidor";
import type { SeleccionItem } from "@/components/vestidor/ParedVestidor";
import WhatsAppLink from "@/components/WhatsAppLink";
import { MOSTRAR_PROMOCION } from "@/config/site";
import { ACABADOS, COLORES } from "@/lib/closets/precios";
import { useTituloPagina } from "@/lib/useTituloPagina";
import { cn, focusRing, formatoPrecio } from "@/lib/utils";
import {
  AJUSTE,
  ESPACIOS,
  ESTILOS,
  ETIQUETAS,
  MEDIDAS_INICIALES,
  TUBO,
  agregarV,
  armarPared,
  cabeCajonera,
  cajonerasDe,
  cotizarV,
  disenar,
  fijosDe,
  moduloAjuste,
  moduloNuevo,
  moverV,
  type EstiloVestidor,
  type Medidas,
  type Pared,
  type PiezaV,
  type TipoEspacio,
  type TipoPiezaV,
} from "@/lib/vestidor/calc";
import { aParametros, leerEstado, type EstadoVestidor } from "@/lib/vestidor/url";
import type { SeleccionPiezaV } from "@/lib/vestidor/visor3d";

const SIN_SCROLL = { replace: true, state: { keepScroll: true } };
const identidad = (n: number): (number | null)[] => Array.from({ length: n }, (_, i) => i);

// Al abrir una pared se elige un módulo normal, porque el de ajuste no cambia de ancho.
const primerFijo = (p: Pared | undefined) => (p && p.ajuste === 0 && p.anchos.length > 1 ? 1 : 0);
const textoModulos = (n: number) => `${n} ${n === 1 ? "módulo" : "módulos"}`;

export default function ConfiguradorVestidor() {
  useTituloPagina("Vestidores a tu medida | La Puerta");
  const [params, setParams] = useSearchParams();
  const estado = useMemo(() => leerEstado(params), [params]);
  const [vistaElegida, setVista] = useState<VistaVestidor>("planta");
  const [paredElegida, setPared] = useState(0);
  const [modElegido, setModSel] = useState(() => primerFijo(estado.diseno.paredes[0]));
  const [seleccion, setSeleccion] = useState<SeleccionItem | null>(null);
  const [mensaje, setMensaje] = useState("");

  const { tipo, med, estilo, color, led, instalar, cl, jal, diseno } = estado;
  const paredSel = Math.min(paredElegida, diseno.paredes.length - 1);
  const p = diseno.paredes[paredSel];
  const modSel = Math.min(modElegido, Math.max(p.anchos.length - 1, 0));
  const vista = vistaElegida === "pared" && !p.anchos.length ? "planta" : vistaElegida;

  const seleccion3d = useMemo<SeleccionPiezaV | null>(
    () => (seleccion ? { w: paredSel, ...seleccion } : null),
    [seleccion, paredSel],
  );

  useEffect(() => {
    const canonica = aParametros(estado);
    if (canonica.toString() !== params.toString()) setParams(canonica, SIN_SCROLL);
  }, [estado, params, setParams]);

  const escribir = (cambio: Partial<EstadoVestidor>) => setParams(aParametros({ ...estado, ...cambio }), SIN_SCROLL);

  const conPared = (nueva: Pared) =>
    escribir({ diseno: { ...diseno, paredes: diseno.paredes.map((x, k) => (k === paredSel ? nueva : x)) } });
  const conMods = (mods: PiezaV[][]) => conPared({ ...p, mods });
  const conModulo = (m: number, items: PiezaV[]) => conMods(p.mods.map((actual, k) => (k === m ? items : actual)));

  function rehacer(nuevoTipo: TipoEspacio, nuevaMed: Medidas, nuevoEstilo: EstiloVestidor) {
    const d = disenar(nuevoTipo, nuevaMed, nuevoEstilo);
    const w = Math.min(paredElegida, d.paredes.length - 1);
    escribir({ tipo: nuevoTipo, med: nuevaMed, estilo: nuevoEstilo, diseno: d });
    setPared(w);
    setModSel(primerFijo(d.paredes[w]));
    setSeleccion(null);
  }

  function elegirPared(w: number) {
    setPared(w);
    setModSel(primerFijo(diseno.paredes[w]));
    setSeleccion(null);
  }

  // Índice del módulo elegido entre los de 60/80/100 (null si es el de ajuste).
  function fijoSel() {
    if (modSel === p.ajuste) return null;
    return p.ajuste === 0 ? modSel - 1 : modSel;
  }

  // Rearma la pared; "orden" dice de qué módulo de antes sale cada uno (null = módulo nuevo).
  function rearmar(fijos: number[], orden: (number | null)[], elegido: number | null) {
    const r = armarPared(p, fijos);
    if (!r) return false;
    const viejos = p.mods.filter((_, i) => i !== p.ajuste);
    const mods = orden.map((k, j) => (k == null ? moduloNuevo(estilo, j, fijos[j]) : viejos[k]));
    if (r.ajuste >= 0) mods.splice(r.ajuste, 0, p.ajuste >= 0 ? p.mods[p.ajuste] : moduloAjuste());
    conPared({ ...p, ...r, mods });
    setModSel(elegido == null ? (r.ajuste >= 0 ? r.ajuste : 0) : elegido + (r.ajuste === 0 ? 1 : 0));
    setSeleccion(null);
    setMensaje(r.sobrante > AJUSTE.holgura + 1 ? `Quedan ${r.sobrante} cm libres en ${p.nombre}. Agrega un módulo o hazlos más anchos.` : "");
    return true;
  }

  function cambiarAncho(w: number) {
    const k = fijoSel();
    if (k == null || !p.anchos.length) return;
    if (p.mods[modSel].some((it) => it.t === "c") && !cabeCajonera(w)) {
      setMensaje("Este módulo tiene cajonera, y la cajonera solo viene en 60 u 80 cm.");
      return;
    }
    const fijos = fijosDe(p);
    fijos[k] = w;
    if (!rearmar(fijos, identidad(fijos.length), k)) setMensaje(`No cabe un módulo de ${w} cm en ${p.nombre}.`);
  }

  function masModulo() {
    const fijos = fijosDe(p);
    const k = fijoSel();
    const pos = k == null ? (p.ajuste === 0 ? 0 : fijos.length) : k + 1;
    const orden = identidad(fijos.length);
    orden.splice(pos, 0, null);
    for (const w of [80, 60]) {
      const nuevos = [...fijos];
      nuevos.splice(pos, 0, w);
      if (rearmar(nuevos, orden, pos)) return;
    }
    setMensaje(`Ya no cabe otro módulo en ${p.nombre}.`);
  }

  function menosModulo() {
    const fijos = fijosDe(p);
    if (!fijos.length) return;
    const k = fijoSel() ?? (p.ajuste === 0 ? 0 : fijos.length - 1);
    fijos.splice(k, 1);
    const orden = identidad(fijos.length + 1);
    orden.splice(k, 1);
    if (!rearmar(fijos, orden, fijos.length ? Math.min(k, fijos.length - 1) : null)) setMensaje(`${p.nombre} necesita al menos un módulo.`);
  }

  function agregar(t: TipoPiezaV) {
    if (!p.anchos.length) return;
    if ((t === "n" || t === "c") && modSel === p.ajuste) {
      setMensaje(`El módulo de ajuste solo lleva repisas y tubo. ${t === "n" ? "Los nichos van en los módulos de 60, 80 o 100 cm." : "Las cajoneras van en los módulos de 60 u 80 cm."}`);
      return;
    }
    if (t === "c" && !cabeCajonera(p.anchos[modSel])) {
      setMensaje(`La cajonera viene en 60 u 80 cm y este módulo mide ${p.anchos[modSel]}. Cámbialo de ancho o elige otro módulo.`);
      return;
    }
    const nuevo = agregarV(p.mods[modSel], t);
    if (!nuevo) {
      setMensaje(t === "t" ? `No cabe un tubo en el módulo ${modSel + 1}: abajo necesita ${TUBO.colgarMin} cm libres para colgar y otra pieza lo impide. Muévela o quítala.` : `Ya no cabe ${t === "n" ? "otro nicho" : t === "c" ? "otra cajonera" : "otra repisa"} en el módulo ${modSel + 1}.`);
      return;
    }
    const quitadas = p.mods[modSel].length + 1 - nuevo.length;
    conModulo(modSel, nuevo);
    setSeleccion(null);
    setMensaje(quitadas > 0 ? `Para colgar quité ${quitadas} ${quitadas === 1 ? "repisa" : "repisas"} del módulo ${modSel + 1}.` : "");
  }

  function moverTeclado(m: number, i: number, delta: number) {
    conModulo(m, moverV(p.mods[m], i, p.mods[m][i].y + delta));
  }

  function mover(delta: number) {
    if (!seleccion) {
      setMensaje("Primero toca una pieza.");
      return;
    }
    moverTeclado(seleccion.m, seleccion.i, delta);
  }

  function borrar() {
    if (!seleccion) {
      setMensaje("Primero toca en el dibujo la pieza que quieres borrar.");
      return;
    }
    conModulo(seleccion.m, p.mods[seleccion.m].filter((_, k) => k !== seleccion.i));
    setSeleccion(null);
    setMensaje("");
  }

  const elegir3d = useCallback((dato: SeleccionPiezaV | null) => {
    if (dato) {
      setPared(dato.w);
      setModSel(dato.m);
      setSeleccion({ m: dato.m, i: dato.i });
    } else {
      setSeleccion(null);
    }
  }, []);

  const q = cotizarV(diseno.paredes, led, instalar, 0, undefined, cl);
  const nCaj = cajonerasDe(diseno.paredes);
  const conError = Boolean(diseno.error);
  const total = conError ? "Con un asesor" : formatoPrecio(q.total);
  const medTxt = ESPACIOS[tipo].medidas.map((k) => `${(ETIQUETAS[tipo][k] as string).toLowerCase()} ${med[k]} cm`).join(", ");
  const nombreTipo = ESPACIOS[tipo].nombre.toLowerCase();
  const liga = `${window.location.origin}/vestidores?${aParametros(estado)}`;
  const etiquetaPrecio = MOSTRAR_PROMOCION ? "Precio con descuento e IVA" : "Precio con IVA";
  const texto = conError
    ? `Hola, quiero cotizar un vestidor ${nombreTipo} (${medTxt}). Diseño: ${liga}`
    : `Hola, quiero cotizar un vestidor ${nombreTipo} (${medTxt}), estilo ${ESTILOS[estilo].nombre.toLowerCase()}, ${textoModulos(q.modulos)}, ${COLORES[color].nombre}, ${led ? "con" : "sin"} LED, ${instalar ? "con instalación" : "sin instalación"}${nCaj ? `, cajones con correderas ${cl ? "de cierre lento" : "normales"} y jaladera mini ${ACABADOS[jal].toLowerCase()}` : ""}. ${etiquetaPrecio}: ${total}. Diseño: ${liga}`;

  return (
    <Layout showWhatsAppFloat={false} stickyHeader={false}>
      <div className="min-[900px]:grid min-[900px]:h-[calc(100dvh-93px)] min-[900px]:grid-cols-[minmax(0,1fr)_400px] min-[900px]:grid-rows-[minmax(0,1fr)] lg:h-[calc(100dvh-109px)]">
        <EscenarioVestidor
          diseno={diseno}
          color={color}
          led={led}
          jal={jal}
          chip={`${ESPACIOS[tipo].nombre} · ${textoModulos(q.modulos)}`}
          vista={vista}
          paredSel={paredSel}
          modSel={modSel}
          seleccion={seleccion}
          seleccion3d={seleccion3d}
          onVista={setVista}
          onElegirPared={(w) => {
            elegirPared(w);
            setVista("pared");
          }}
          onElegirModulo={(m) => {
            setModSel(m);
            setSeleccion(null);
          }}
          onSeleccionar={(sel) => {
            setModSel(sel.m);
            setSeleccion(sel);
          }}
          onElegir3d={elegir3d}
          onSoltar={conMods}
          onMoverTeclado={moverTeclado}
          onBorrar={borrar}
        />

        <aside className="flex flex-col min-[900px]:min-h-0 min-[900px]:border-l">
          <div className="px-4 min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:overflow-y-auto">
            <PanelVestidor
              estado={estado}
              paredSel={paredSel}
              modSel={modSel}
              seleccion={seleccion}
              mensaje={mensaje}
              onTipo={(t) => {
                rehacer(t, { ...MEDIDAS_INICIALES[t] }, estilo);
                setVista("planta");
                setMensaje("");
              }}
              onMedida={(k, valor) => rehacer(tipo, { ...med, [k]: valor }, estilo)}
              onEstilo={(e) => {
                rehacer(tipo, med, e);
                setMensaje("");
              }}
              onPared={(w) => {
                elegirPared(w);
                if (vista === "planta") setVista("pared");
                setMensaje("");
              }}
              onMasModulo={masModulo}
              onMenosModulo={menosModulo}
              onModulo={(m) => {
                setModSel(m);
                setSeleccion(null);
                setMensaje("");
              }}
              onAncho={cambiarAncho}
              onAgregar={agregar}
              onMover={mover}
              onBorrar={borrar}
              onCambio={(cambio) => {
                escribir(cambio);
                setMensaje("");
              }}
            />
          </div>

          <div className="sticky bottom-0 z-20 shrink-0 border-t bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {MOSTRAR_PROMOCION && !conError && q.ahorro > 0 && (
                    <span>
                      Antes <s>{formatoPrecio(q.lista + q.instalacion)}</s> ·{" "}
                    </span>
                  )}
                  {instalar ? "Total estimado con IVA e instalación" : "Total estimado con IVA"}
                </p>
                <p className="text-xl font-semibold text-primary">{total}</p>
              </div>
              <WhatsAppLink
                mensaje={texto}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90",
                  focusRing,
                )}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {conError ? "Hablar con un asesor" : "Cotizar por WhatsApp"}
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
